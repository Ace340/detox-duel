package expo.modules.appblocker

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import org.json.JSONArray
import java.io.File

/**
 * AppBlockerModule - Expo native module for managing app blocking state.
 *
 * This module manages the blocking state for banned apps during duels.
 * It uses SharedPreferences to share state with AppBlockerAccessibilityService.
 * Both components read/write the same "AppBlockerPrefs" file with JSON arrays.
 */
class ExpoAppBlockerModule : Module() {

  companion object {
    private const val TAG = "ExpoAppBlocker"

    // SharedPreferences file name – must match AppBlockerAccessibilityService
    const val PREFS_NAME = "AppBlockerPrefs"

    // Keys – kept in sync with AppBlockerAccessibilityService companion object
    const val KEY_BLOCKED_PACKAGES = "blocked_packages"
    const val KEY_DUEL_ID = "duel_id"
    const val KEY_DUEL_TYPE = "duel_type"
    const val KEY_IS_BLOCKING = "is_blocking"
    const val KEY_IS_QUICK_DUEL = "is_quick_duel"
    const val KEY_SUPABASE_URL = "supabase_url"
    const val KEY_SUPABASE_KEY = "supabase_key"
    const val KEY_USER_ID = "user_id"
  }

  /**
   * Get SharedPreferences instance.
   * Must use the same file name and mode as AppBlockerAccessibilityService.
   */
  private fun getSharedPrefs(): SharedPreferences {
    val context = requireNotNull(appContext.reactContext) {
      "React context is not available"
    }
    return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAppBlocker")

    /**
     * Start blocking for specified package names in a duel.
     *
     * Stores all blocking state in SharedPreferences so the
     * AccessibilityService can read it without the JS runtime.
     *
     * @param packageNames List of Android package names to block
     * @param duelId The ID of the active duel
     * @param config  Map with supabaseUrl, supabaseKey, userId, duelType?, isQuickDuel?
     * @param promise Promise to resolve/reject
     */
    AsyncFunction("startBlocking") { packageNames: List<String>, duelId: String, config: Map<String, Any?>, promise: Promise ->
      try {
        if (packageNames.isEmpty()) {
          promise.reject("INVALID_INPUT", "Blocked package names list cannot be empty", null)
          return@AsyncFunction
        }

        if (duelId.isBlank()) {
          promise.reject("INVALID_INPUT", "Duel ID cannot be empty", null)
          return@AsyncFunction
        }

        val prefs = getSharedPrefs()
        val editor = prefs.edit()

        // Blocked package names as JSON array
        val packagesJson = JSONArray(packageNames).toString()
        editor.putString(KEY_BLOCKED_PACKAGES, packagesJson)
        editor.putString(KEY_DUEL_ID, duelId)
        editor.putBoolean(KEY_IS_BLOCKING, true)

        // Supabase credentials – needed by the service for violation reporting
        config["supabaseUrl"]?.let { editor.putString(KEY_SUPABASE_URL, it.toString()) }
        config["supabaseKey"]?.let { editor.putString(KEY_SUPABASE_KEY, it.toString()) }
        config["userId"]?.let { editor.putString(KEY_USER_ID, it.toString()) }

        // Optional duel metadata
        config["duelType"]?.let { editor.putString(KEY_DUEL_TYPE, it.toString()) }
        config["isQuickDuel"]?.let { editor.putBoolean(KEY_IS_QUICK_DUEL, it as? Boolean ?: false) }

        editor.apply()

        Log.d(TAG, "Blocking started for duel $duelId with ${packageNames.size} apps")
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("BLOCKING_ERROR", "Failed to start blocking: ${e.message}", e)
      }
    }

    /**
     * Stop all blocking and clear the blocking state.
     *
     * This method clears all blocking state from SharedPreferences,
     * effectively stopping the AccessibilityService from monitoring.
     *
     * @param promise Promise to resolve/reject the async operation
     */
    AsyncFunction("stopBlocking") { promise: Promise ->
      try {
        val prefs = getSharedPrefs()
        val editor = prefs.edit()

        // Clear all blocking-related state
        editor.remove(KEY_BLOCKED_PACKAGES)
        editor.remove(KEY_DUEL_ID)
        editor.remove(KEY_DUEL_TYPE)
        editor.remove(KEY_SUPABASE_URL)
        editor.remove(KEY_SUPABASE_KEY)
        editor.remove(KEY_USER_ID)
        editor.putBoolean(KEY_IS_BLOCKING, false)
        editor.putBoolean(KEY_IS_QUICK_DUEL, false)

        // Apply changes asynchronously
        editor.apply()

        Log.d(TAG, "Blocking stopped, all state cleared")
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("BLOCKING_ERROR", "Failed to stop blocking: ${e.message}", e)
      }
    }

    /**
     * Check if blocking is currently active.
     *
     * This method checks the SharedPreferences to determine if blocking is active.
     *
     * @param promise Promise to resolve/reject the async operation with a boolean value
     */
    AsyncFunction("isBlockingActive") { promise: Promise ->
      try {
        val prefs = getSharedPrefs()
        val isActive = prefs.getBoolean(KEY_IS_BLOCKING, false)

        promise.resolve(isActive)
      } catch (e: Exception) {
        promise.reject("BLOCKING_ERROR", "Failed to check blocking state: ${e.message}", e)
      }
    }

    /**
     * Get the list of currently blocked package names.
     *
     * This is a helper method for the AccessibilityService to retrieve
     * the list of blocked packages from SharedPreferences.
     *
     * @return List of blocked package names, or empty list if not blocking
     */
    fun getBlockedPackages(): List<String> {
      val prefs = getSharedPrefs()
      val packagesJson = prefs.getString(KEY_BLOCKED_PACKAGES, "[]") ?: "[]"

      return try {
        val jsonArray = JSONArray(packagesJson)
        (0 until jsonArray.length()).map { jsonArray.getString(it) }
      } catch (e: Exception) {
        Log.e(TAG, "Failed to parse blocked packages", e)
        emptyList()
      }
    }

    /**
     * Get the current duel ID.
     *
     * This is a helper method for the AccessibilityService to retrieve
     * the active duel ID from SharedPreferences.
     *
     * @return The duel ID, or null if not blocking
     */
    fun getDuelId(): String? {
      val prefs = getSharedPrefs()
      return prefs.getString(KEY_DUEL_ID, null)
    }

    /**
     * Check if the app's Accessibility Service is enabled.
     *
     * Iterates through all running accessibility services to find
     * our AppBlockerAccessibilityService.
     *
     * @param promise Resolves with true if the service is enabled
     */
    AsyncFunction("hasPermission") { promise: Promise ->
      try {
        val enabled = isAccessibilityServiceEnabled()
        promise.resolve(enabled)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to check accessibility permission", e)
        promise.resolve(false)
      }
    }

    /**
     * Check if SYSTEM_ALERT_WINDOW (overlay) permission is granted.
     *
     * Uses Settings.canDrawOverlays() because SYSTEM_ALERT_WINDOW is an
     * AppOps-level permission — React Native's PermissionsAndroid cannot
     * check it (it only handles standard runtime permissions).
     *
     * @param promise Resolves with true if the overlay permission is granted
     */
    AsyncFunction("hasOverlayPermission") { promise: Promise ->
      try {
        val context = appContext.reactContext
        val canDraw = context != null && Settings.canDrawOverlays(context)
        Log.d(TAG, "Overlay permission check: canDrawOverlays=$canDraw")
        promise.resolve(canDraw)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to check overlay permission", e)
        promise.resolve(false)
      }
    }

    /**
     * Open the Android Accessibility Settings page so the user can enable
     * our service.  This is a manual step – we cannot enable it programmatically.
     */
    AsyncFunction("requestPermission") { promise: Promise ->
      try {
        val context = appContext.reactContext
        if (context != null) {
          val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(intent)
        }
        promise.resolve(null)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to open accessibility settings", e)
        promise.reject("PERMISSION_ERROR", "Failed to open accessibility settings: ${e.message}", e)
      }
    }

    /**
     * Get the current blocking state as a structured record.
     *
     * Returns isActive, duelId, and blockedApps matching the
     * TypeScript BlockingState interface.
     *
     * @param promise Resolves with a map containing the blocking state
     */
    AsyncFunction("getBlockingState") { promise: Promise ->
      try {
        val prefs = getSharedPrefs()
        val isActive = prefs.getBoolean(KEY_IS_BLOCKING, false)
        val duelId = prefs.getString(KEY_DUEL_ID, null)
        val packagesJson = prefs.getString(KEY_BLOCKED_PACKAGES, "[]") ?: "[]"

        val blockedApps: List<String> = try {
          val jsonArray = JSONArray(packagesJson)
          (0 until jsonArray.length()).map { jsonArray.getString(it) }
        } catch (e: Exception) {
          emptyList()
        }

        val result = mapOf(
          "isActive" to isActive,
          "duelId" to duelId,
          "blockedApps" to blockedApps
        )
        promise.resolve(result)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to get blocking state", e)
        promise.resolve(mapOf(
          "isActive" to false,
          "duelId" to null,
          "blockedApps" to emptyList<String>()
        ))
      }
    }
  }

  /**
   * Check if our AppBlockerAccessibilityService is currently enabled.
   *
   * Three-tier check, in order of reliability:
   *  1. Flag file written by onServiceConnected()  (fastest, but cleared on service kill)
   *  2. AccessibilityManager.getEnabledAccessibilityServiceList() (queries live running services)
   *  3. Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES (persists across service restarts)
   */
  private fun isAccessibilityServiceEnabled(): Boolean {
    val context = appContext.reactContext ?: return false

    // --- Tier 1: flag file written by onServiceConnected() ---
    val flagFile = File(context.filesDir, AppBlockerAccessibilityService.SERVICE_FLAG_FILENAME)
    if (flagFile.exists()) {
      Log.d(TAG, "Service flag file found – service is running")
      return true
    }

    // --- Tier 2: AccessibilityManager live service list ---
    try {
      val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
      if (am != null) {
        val services = am.getEnabledAccessibilityServiceList(
          AccessibilityServiceInfo.FEEDBACK_ALL_MASK
        )
        for (info in services) {
          // info.id is like "ComponentInfo{com.detoxduel.app/expo.modules.appblocker.AppBlockerAccessibilityService}"
          val serviceId = info.id ?: continue
          if (serviceId.contains("AppBlockerAccessibilityService")) {
            Log.d(TAG, "AccessibilityManager check: found our service in live list – $serviceId")
            return true
          }
        }
        Log.d(TAG, "AccessibilityManager check: our service not in live list (${services.size} services total)")
      }
    } catch (e: Exception) {
      Log.e(TAG, "AccessibilityManager check failed", e)
    }

    // --- Tier 3: Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES ---
    return try {
      val enabledServices = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
      ) ?: return false

      // enabledServices is colon-separated on most devices, but some tablet
      // ROMs (Xiaomi/Huawei/Amazon Fire) use semicolons or mixed delimiters.
      //   Standard:  "pkg/svc:pkg/svc2"
      //   Xiaomi:    "pkg/svc;pkg/svc2"
      //   Some ROMs: "pkg/svc pkg/svc2"
      val ourPackage = context.packageName
      val serviceName = "AppBlockerAccessibilityService"

      val entries = enabledServices
        .split("[:;]\\s*".toRegex())
        .filter { it.isNotBlank() }

      val found = entries.any { entry ->
        entry.equals("$ourPackage/.$serviceName", ignoreCase = true) ||
          entry.equals("$ourPackage/${AppBlockerAccessibilityService::class.java.canonicalName}", ignoreCase = true) ||
          (entry.startsWith(ourPackage, ignoreCase = true) && entry.contains(serviceName, ignoreCase = true))
      }

      Log.d(TAG, "Settings.Secure check: found=$found  entries=$entries  raw=$enabledServices")
      found
    } catch (e: Exception) {
      Log.e(TAG, "Settings.Secure check failed", e)
      false
    }
  }
}
