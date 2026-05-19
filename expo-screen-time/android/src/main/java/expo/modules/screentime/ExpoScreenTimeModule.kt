package expo.modules.screentime

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.os.Process
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class ExpoScreenTimeModule : Module() {
  private val usageStatsManager: UsageStatsManager?
    get() = appContext.reactContext?.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager

  private val appOpsManager: AppOpsManager?
    get() = appContext.reactContext?.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager

  override fun definition() = ModuleDefinition {
    Name("ExpoScreenTime")

    // Check if PACKAGE_USAGE_STATS permission is granted
    Function("checkPermission") {
      checkUsageStatsPermission()
    }

    // Open Android Settings to request permission
    Function("requestPermission") {
      val context = requireNotNull(appContext.currentActivity)
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      context.startActivity(intent)
    }

    // Get usage stats for specified apps since a given timestamp
    AsyncFunction("getUsageForApps") { packageNames: List<String>, sinceTimestamp: Long, promise: Promise ->
      try {
        val hasPermission = checkUsageStatsPermission()

        if (!hasPermission) {
          promise.reject(
            "PERMISSION_DENIED",
            "PACKAGE_USAGE_STATS permission not granted. Call requestPermission() first."
          )
          return@AsyncFunction
        }

        val usageStats = getUsageStatsForApps(packageNames, sinceTimestamp)

        if (usageStats == null) {
          promise.reject(
            "USAGE_STATS_UNAVAILABLE",
            "UsageStatsManager is not available on this device"
          )
          return@AsyncFunction
        }

        promise.resolve(usageStats)
      } catch (e: Exception) {
        promise.reject(
          "USAGE_STATS_ERROR",
          "Failed to retrieve usage stats: ${e.message}",
          e
        )
      }
    }
  }

  /**
   * Check if the app has permission to access usage stats
   */
  private fun checkUsageStatsPermission(): Boolean {
    val context = appContext.reactContext ?: return false
    val appOps = appOpsManager ?: return false

    val mode = appOps.checkOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      Process.myUid(),
      context.packageName
    )

    return mode == AppOpsManager.MODE_ALLOWED
  }

  /**
   * Get usage stats for specified package names since a given timestamp
   * Returns a map of package name to total time in milliseconds
   */
  private fun getUsageStatsForApps(
    packageNames: List<String>,
    sinceTimestamp: Long
  ): Map<String, Double>? {
    val manager = usageStatsManager ?: return null
    val endTime = System.currentTimeMillis()
    val packageNameSet = packageNames.toSet()

    // Query usage stats
    val usageStats = manager.queryUsageStats(
      UsageStatsManager.INTERVAL_DAILY,
      sinceTimestamp,
      endTime
    )

    if (usageStats.isNullOrEmpty()) {
      // Return empty map with all packages as keys
      return packageNames.associateWith { 0.0 }
    }

    // Aggregate usage time by package name
    val result = mutableMapOf<String, Double>()

    for (packageName in packageNameSet) {
      val totalTime = usageStats
        .filter { it.packageName == packageName }
        .sumOf { it.totalTimeInForeground.toDouble() }

      result[packageName] = totalTime
    }

    return result
  }
}
