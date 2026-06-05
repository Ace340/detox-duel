package expo.modules.appblocker

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Path
import android.content.pm.ServiceInfo
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.IOException

/**
 * AccessibilityService that detects when banned apps are opened
 * and launches a blocking overlay.
 *
 * This service runs as a foreground service with a persistent notification
 * to prevent Android from killing it on tablets with aggressive battery
 * optimization (Xiaomi, Huawei, etc.).
 *
 * Lifecycle:
 * 1. User enables the service in Accessibility Settings → onServiceConnected()
 * 2. onServiceConnected() posts a foreground notification and writes a flag file
 * 3. While blocking is active (SharedPreferences flag), monitors window changes
 * 4. When a banned app is detected → launches BlockOverlayActivity + Supabase update
 * 5. onDestroy() → removes notification and flag file
 */
class AppBlockerAccessibilityService : AccessibilityService() {

  companion object {
    private const val TAG = "AppBlockerService"
    private const val PREF_BLOCKED_PACKAGES = "blocked_packages"
    private const val PREF_DUEL_ID = "duel_id"
    private const val PREF_DUEL_TYPE = "duel_type"
    private const val PREF_IS_BLOCKING = "is_blocking"
    private const val PREF_IS_QUICK_DUEL = "is_quick_duel"

    // SharedPreferences keys for Supabase configuration
    private const val PREF_SUPABASE_URL = "supabase_url"
    private const val PREF_SUPABASE_KEY = "supabase_key"
    private const val PREF_USER_ID = "user_id"

    // Package name of the main app (must match app.json → android.package)
    private const val MAIN_APP_PACKAGE = "com.detoxduel.app"

    // Timeout for Supabase requests (in seconds)
    private const val NETWORK_TIMEOUT = 10L

    // Track if we're already showing an overlay to avoid duplicate launches
    private var isOverlayShowing = false
    private var lastBlockedPackage: String? = null

    // Coroutine scope for async operations
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    /** Name of the flag file written when the service is connected. */
    const val SERVICE_FLAG_FILENAME = "accessibility_service_running"

    // Notification constants
    private const val NOTIFICATION_CHANNEL_ID = "detox_duel_blocking"
    private const val NOTIFICATION_CHANNEL_NAME = "App Blocking"
    private const val FOREGROUND_NOTIFICATION_ID = 1001
  }

  // OkHttp client for Supabase requests
  private val httpClient = OkHttpClient.Builder()
    .connectTimeout(NETWORK_TIMEOUT, java.util.concurrent.TimeUnit.SECONDS)
    .readTimeout(NETWORK_TIMEOUT, java.util.concurrent.TimeUnit.SECONDS)
    .writeTimeout(NETWORK_TIMEOUT, java.util.concurrent.TimeUnit.SECONDS)
    .build()

  override fun onAccessibilityEvent(event: AccessibilityEvent) {
    // Only process window state changes
    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
      return
    }

    val packageName = event.packageName?.toString() ?: return

    // Skip if this is our own app or the system UI
    if (packageName == MAIN_APP_PACKAGE ||
        packageName == "com.android.systemui" ||
        packageName.contains("launcher", ignoreCase = true)) {
      return
    }

    Log.d(TAG, "Window state changed: $packageName")

    // Check if blocking is active
    if (!isBlockingActive()) {
      Log.d(TAG, "Blocking is not active")
      return
    }

    // Check if this package is blocked
    val blockedPackages = getBlockedPackages()
    if (blockedPackages.contains(packageName)) {
      Log.d(TAG, "Blocked app detected: $packageName")

      // Check if we just blocked this app (avoid duplicate launches)
      if (lastBlockedPackage == packageName && isOverlayShowing) {
        Log.d(TAG, "Overlay already showing for this package")
        return
      }

      // Handle the blocked app
      handleBlockedApp(packageName)
    }
  }

  override fun onInterrupt() {
    // Service interrupted - clean up
    Log.d(TAG, "AccessibilityService interrupted")
    serviceScope.cancel()
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    Log.d(TAG, "AccessibilityService connected")
    isOverlayShowing = false
    lastBlockedPackage = null

    // Write flag file so the module can detect this service is running
    writeServiceFlag()

    // Start as foreground service with a persistent notification.
    // This prevents Android from killing the service, which is critical
    // on tablets with aggressive battery optimization (Xiaomi, Huawei, etc.)
    startForegroundNotification()
  }

  override fun onDestroy() {
    super.onDestroy()
    Log.d(TAG, "AccessibilityService destroyed")
    serviceScope.cancel()
    isOverlayShowing = false
    lastBlockedPackage = null

    // Remove flag file
    deleteServiceFlag()
  }

  // ---------------------------------------------------------------
  // Foreground notification
  // ---------------------------------------------------------------

  /**
   * Create the notification channel (required Android 8+) and start
   * this service as a foreground service with a persistent notification.
   */
  private fun startForegroundNotification() {
    try {
      createNotificationChannel()

      val notification = buildForegroundNotification(
        "Detox Duel is protecting your focus"
      )

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        // Android 14+ REQUIRES the 3-parameter overload with foregroundServiceType.
        // The 2-parameter overload throws ForegroundServiceStartNotAllowedException.
        startForeground(
          FOREGROUND_NOTIFICATION_ID,
          notification,
          ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
        )
      } else {
        startForeground(FOREGROUND_NOTIFICATION_ID, notification)
      }

      Log.d(TAG, "Foreground service notification started")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to start foreground notification", e)
      // Non-fatal — the service still works, just more vulnerable to being killed
    }
  }

  /**
   * Create the notification channel for Android 8.0+ (API 26+).
   * Uses IMPORTANCE_LOW so the notification is visible but doesn't make sound.
   */
  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        NOTIFICATION_CHANNEL_ID,
        NOTIFICATION_CHANNEL_NAME,
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Shows when Detox Duel is monitoring for banned apps"
        setShowBadge(false)
        lockscreenVisibility = Notification.VISIBILITY_PRIVATE
      }

      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(channel)
    }
  }

  /**
   * Build the foreground service notification.
   *
   * This notification is persistent while the accessibility service runs.
   * Tapping it opens the main app.
   */
  private fun buildForegroundNotification(contentText: String): Notification {
    // PendingIntent to open the main app when the notification is tapped
    val launchIntent = packageManager.getLaunchIntentForPackage(MAIN_APP_PACKAGE)
    val pendingIntent = launchIntent?.let {
      PendingIntent.getActivity(
        this,
        0,
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    }

    return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
      .setContentTitle("Detox Duel")
      .setContentText(contentText)
      .setSmallIcon(android.R.drawable.ic_lock_lock)
      .setOngoing(true)
      .setSilent(true)
      .setContentIntent(pendingIntent)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .build()
  }

  // ---------------------------------------------------------------
  // Blocking state helpers
  // ---------------------------------------------------------------

  /**
   * Check if blocking is currently active
   */
  private fun isBlockingActive(): Boolean {
    val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
    return prefs.getBoolean(PREF_IS_BLOCKING, false)
  }

  /**
   * Get the list of blocked package names
   */
  private fun getBlockedPackages(): List<String> {
    val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
    val packagesJson = prefs.getString(PREF_BLOCKED_PACKAGES, "[]") ?: "[]"

    try {
      val jsonArray = JSONArray(packagesJson)
      val packages = mutableListOf<String>()
      for (i in 0 until jsonArray.length()) {
        packages.add(jsonArray.getString(i))
      }
      return packages
    } catch (e: Exception) {
      Log.e(TAG, "Failed to parse blocked packages", e)
      return emptyList()
    }
  }

  /**
   * Get the current duel ID
   */
  private fun getDuelId(): String? {
    val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
    return prefs.getString(PREF_DUEL_ID, null)
  }

  /**
   * Get the duel type
   */
  private fun getDuelType(): String? {
    val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
    return prefs.getString(PREF_DUEL_TYPE, null)
  }

  /**
   * Check if this is a Quick Duel
   */
  private fun isQuickDuel(): Boolean {
    val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
    return prefs.getBoolean(PREF_IS_QUICK_DUEL, false)
  }

  /**
   * Get the Supabase URL
   */
  private fun getSupabaseUrl(): String? {
    val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
    return prefs.getString(PREF_SUPABASE_URL, null)
  }

  /**
   * Get the Supabase key
   */
  private fun getSupabaseKey(): String? {
    val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
    return prefs.getString(PREF_SUPABASE_KEY, null)
  }

  /**
   * Get the user ID
   */
  private fun getUserId(): String? {
    val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
    return prefs.getString(PREF_USER_ID, null)
  }

  // ---------------------------------------------------------------
  // Blocked app handling
  // ---------------------------------------------------------------

  /**
   * Handle when a blocked app is detected
   */
  private fun handleBlockedApp(packageName: String) {
    // Update state to avoid duplicate launches
    lastBlockedPackage = packageName
    isOverlayShowing = true

    val duelId = getDuelId()
    val duelType = getDuelType()
    val isQuick = isQuickDuel()

    // Get app name from package name (simplified version)
    val appName = getAppNameFromPackage(packageName)

    Log.d(TAG, "Handling blocked app: $packageName (duel: $duelId, type: $duelType, quick: $isQuick)")

    // Update the foreground notification to show which app was blocked
    updateForegroundNotification("Blocked: $appName — stay focused!")

    // Launch the blocking overlay
    launchBlockOverlay(packageName, appName, duelId ?: "", duelType ?: "", isQuick)

    // Send Supabase update to mark that the user opened a banned app
    duelId?.let { sendSupabaseUpdate(it, packageName) }
  }

  /**
   * Update the foreground notification text without recreating it.
   */
  private fun updateForegroundNotification(text: String) {
    try {
      val notification = buildForegroundNotification(text)
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.notify(FOREGROUND_NOTIFICATION_ID, notification)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to update foreground notification", e)
    }
  }

  /**
   * Launch the BlockOverlayActivity
   */
  private fun launchBlockOverlay(
    packageName: String,
    appName: String,
    duelId: String,
    duelType: String,
    isQuickDuel: Boolean
  ) {
    try {
      val intent = Intent(this, BlockOverlayActivity::class.java).apply {
        putExtra(BlockOverlayActivity.EXTRA_PACKAGE_NAME, packageName)
        putExtra(BlockOverlayActivity.EXTRA_APP_NAME, appName)
        putExtra(BlockOverlayActivity.EXTRA_DUEL_ID, duelId)
        putExtra(BlockOverlayActivity.EXTRA_DUEL_TYPE, duelType)
        putExtra(BlockOverlayActivity.EXTRA_IS_QUICK_DUEL, isQuickDuel)

        // Clear task and start fresh to prevent back navigation to blocked app
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
      }

      startActivity(intent)
      Log.d(TAG, "Launched BlockOverlayActivity")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to launch BlockOverlayActivity", e)
    }
  }

  /**
   * Send a Supabase update to mark that the user opened a banned app
   * For Quick Duels, this results in instant loss
   */
  private fun sendSupabaseUpdate(duelId: String, packageName: String) {
    val supabaseUrl = getSupabaseUrl()
    val supabaseKey = getSupabaseKey()
    val userId = getUserId()

    if (supabaseUrl == null || supabaseKey == null || userId == null) {
      Log.e(TAG, "Missing Supabase configuration - cannot send update")
      return
    }

    // Check if this is a Quick Duel - mark user as loser
    val isQuick = isQuickDuel()

    serviceScope.launch {
      try {
        val url = "$supabaseUrl/rest/v1/duel_participants"
        val contentType = "application/json".toMediaType()

        // Build update data
        val updateData = JSONObject()
        updateData.put("banned_app_opened", true)
        updateData.put("banned_app_package", packageName)
        updateData.put("banned_app_opened_at", System.currentTimeMillis())

        if (isQuick) {
          // For Quick Duels, mark user as loser (instant loss)
          updateData.put("is_loser", true)
          Log.d(TAG, "Quick Duel: marking user as loser")
        }

        // PATCH request to update duel_participants
        val requestBody = updateData.toString().toRequestBody(contentType)

        val request = Request.Builder()
          .url("$url?duel_id=eq.$duelId&user_id=eq.$userId")
          .patch(requestBody)
          .addHeader("apikey", supabaseKey)
          .addHeader("Authorization", "Bearer $supabaseKey")
          .addHeader("Content-Type", "application/json")
          .build()

        val response = httpClient.newCall(request).execute()

        if (response.isSuccessful) {
          Log.d(TAG, "Successfully updated duel_participants for banned app")
          if (isQuick) {
            Log.d(TAG, "Quick Duel instant loss recorded")
          }
        } else {
          Log.e(TAG, "Failed to update duel_participants: ${response.code}")
        }
      } catch (e: IOException) {
        Log.e(TAG, "Network error sending Supabase update", e)
      } catch (e: Exception) {
        Log.e(TAG, "Error sending Supabase update", e)
      }
    }
  }

  /**
   * Get a simplified app name from package name
   * In a production app, you would query the PackageManager for the actual app name
   */
  private fun getAppNameFromPackage(packageName: String): String {
    // Common app names mapping
    return when {
      packageName.contains("instagram") -> "Instagram"
      packageName.contains("twitter") -> "Twitter"
      packageName.contains("facebook") -> "Facebook"
      packageName.contains("tiktok") -> "TikTok"
      packageName.contains("youtube") -> "YouTube"
      packageName.contains("netflix") -> "Netflix"
      packageName.contains("snapchat") -> "Snapchat"
      packageName.contains("whatsapp") -> "WhatsApp"
      packageName.contains("telegram") -> "Telegram"
      packageName.contains("reddit") -> "Reddit"
      packageName.contains("pinterest") -> "Pinterest"
      packageName.contains("tinder") -> "Tinder"
      else -> {
        // Fallback: use the last part of the package name
        packageName.split(".").lastOrNull()?.replaceFirstChar { it.uppercase() } ?: "Unknown App"
      }
    }
  }

  /**
   * Go back to home screen
   */
  private fun goToHomeScreen() {
    try {
      val homeIntent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_HOME)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      startActivity(homeIntent)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to go to home screen", e)
    }
  }

  // ---------------------------------------------------------------
  // Flag file management
  // ---------------------------------------------------------------

  /**
   * Write a flag file to signal that this accessibility service is running.
   * The native module checks for this file to determine permission status.
   */
  private fun writeServiceFlag() {
    try {
      val flagFile = File(filesDir, SERVICE_FLAG_FILENAME)
      flagFile.writeText("running")
      Log.d(TAG, "Service flag file written: ${flagFile.absolutePath}")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to write service flag file", e)
    }
  }

  /**
   * Delete the flag file when the service is destroyed.
   */
  private fun deleteServiceFlag() {
    try {
      val flagFile = File(filesDir, SERVICE_FLAG_FILENAME)
      if (flagFile.exists()) {
        flagFile.delete()
        Log.d(TAG, "Service flag file deleted")
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to delete service flag file", e)
    }
  }

  /**
   * Reset overlay showing state (called by BlockOverlayActivity when dismissed)
   */
  fun resetOverlayState() {
    isOverlayShowing = false
    lastBlockedPackage = null
  }
}
