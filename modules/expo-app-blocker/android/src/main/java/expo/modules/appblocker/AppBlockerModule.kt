package expo.modules.appblocker

import android.content.Context
import android.content.SharedPreferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException

/**
 * AppBlockerModule - Expo native module for managing app blocking state.
 *
 * This module manages the blocking state for banned apps during duels.
 * It uses SharedPreferences with MODE_MULTI_PROCESS to enable communication
 * between this module and the AccessibilityService which runs in a separate process.
 */
class ExpoAppBlockerModule : Module() {

  companion object {
    // SharedPreferences file name for storing blocking state
    private const val PREFS_NAME = "app_blocker_prefs"

    // Key for storing the list of blocked package names
    private const val KEY_BLOCKED_PACKAGES = "blocked_packages"

    // Key for storing the active duel ID
    private const val KEY_DUEL_ID = "duel_id"

    // Key for storing whether blocking is active
    private const val KEY_IS_BLOCKING = "is_blocking"
  }

  /**
   * Get SharedPreferences instance with MODE_MULTI_PROCESS for inter-process communication.
   * This allows the AccessibilityService (running in a separate process) to access the same data.
   */
  private fun getSharedPrefs(): SharedPreferences {
    val context = requireNotNull(appContext.reactContext) {
      "React context is not available"
    }
    return context.getSharedPreferences(
      PREFS_NAME,
      Context.MODE_MULTI_PROCESS
    )
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAppBlocker")

    /**
     * Start blocking for specified package names in a duel.
     *
     * This method stores the blocked package names and duel ID in SharedPreferences,
     * making them accessible to the AccessibilityService for monitoring.
     *
     * @param packageNames List of Android package names to block (e.g., "com.instagram.android")
     * @param duelId The ID of the active duel
     * @param promise Promise to resolve/reject the async operation
     */
    AsyncFunction("startBlocking") { packageNames: List<String>, duelId: String, promise: Promise ->
      try {
        // Validate input
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

        // Store blocked package names as a comma-separated string
        val packagesString = packageNames.joinToString(",")
        editor.putString(KEY_BLOCKED_PACKAGES, packagesString)

        // Store the duel ID
        editor.putString(KEY_DUEL_ID, duelId)

        // Mark blocking as active
        editor.putBoolean(KEY_IS_BLOCKING, true)

        // Apply changes asynchronously (better performance than commit())
        editor.apply()

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
        editor.putBoolean(KEY_IS_BLOCKING, false)

        // Apply changes asynchronously
        editor.apply()

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
      val packagesString = prefs.getString(KEY_BLOCKED_PACKAGES, "")

      return if (packagesString.isNullOrEmpty()) {
        emptyList()
      } else {
        packagesString.split(",").filter { it.isNotBlank() }
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
  }
}
