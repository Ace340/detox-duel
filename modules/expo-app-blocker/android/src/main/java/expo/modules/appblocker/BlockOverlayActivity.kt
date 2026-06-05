package expo.modules.appblocker

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.DisplayMetrics
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

class BlockOverlayActivity : Activity() {

  companion object {
    const val EXTRA_PACKAGE_NAME = "package_name"
    const val EXTRA_APP_NAME = "app_name"
    const val EXTRA_DUEL_ID = "duel_id"
    const val EXTRA_DUEL_TYPE = "duel_type"
    const val EXTRA_IS_QUICK_DUEL = "is_quick_duel"
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Set up window for system overlay
    window.setFlags(
      WindowManager.LayoutParams.FLAG_FULLSCREEN,
      WindowManager.LayoutParams.FLAG_FULLSCREEN
    )
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
    )

    // Create dark-themed UI
    val layout = createDarkThemedLayout()
    setContentView(layout)
  }

  private fun createDarkThemedLayout(): ScrollView {
    val scrollView = ScrollView(this)
    scrollView.setBackgroundColor(Color.parseColor("#0A0A0A"))
    scrollView.isFillViewport = true

    // Responsive padding and text sizes for tablets
    val metrics = DisplayMetrics()
    windowManager.defaultDisplay.getMetrics(metrics)
    val screenWidthDp = metrics.widthPixels / metrics.density
    val isTablet = screenWidthDp >= 600
    val padding = if (isTablet) 80 else 48
    val titleSize = if (isTablet) 36f else 28f
    val iconSize = if (isTablet) 96f else 72f
    val subtitleSize = if (isTablet) 22f else 18f
    val appNameSize = if (isTablet) 26f else 20f
    val buttonPaddingH = if (isTablet) 48 else 32
    val buttonPaddingV = if (isTablet) 32 else 24

    val mainLayout = LinearLayout(this)
    mainLayout.orientation = LinearLayout.VERTICAL
    mainLayout.setBackgroundColor(Color.parseColor("#0A0A0A"))
    mainLayout.setPadding(padding, padding, padding, padding)
    val mainParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    mainLayout.layoutParams = mainParams

    // Get data from intent
    val appName = intent.getStringExtra(EXTRA_APP_NAME) ?: "Unknown App"
    val duelId = intent.getStringExtra(EXTRA_DUEL_ID) ?: "Unknown Duel"
    val duelType = intent.getStringExtra(EXTRA_DUEL_TYPE) ?: "Detox Duel"

    // Banned emoji icon
    val bannedIcon = TextView(this)
    bannedIcon.text = "🚫"
    bannedIcon.textSize = iconSize
    bannedIcon.textAlignment = View.TEXT_ALIGNMENT_CENTER
    val iconParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    iconParams.setMargins(0, 0, 0, 48)
    bannedIcon.layoutParams = iconParams
    mainLayout.addView(bannedIcon)

    // Banned message title
    val bannedTitle = TextView(this)
    bannedTitle.text = "This app is banned!"
    bannedTitle.textSize = titleSize
    bannedTitle.setTextColor(Color.parseColor("#FFFFFF"))
    bannedTitle.textAlignment = View.TEXT_ALIGNMENT_CENTER
    bannedTitle.setTypeface(null, android.graphics.Typeface.BOLD)
    val titleParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    titleParams.setMargins(0, 0, 0, 16)
    bannedTitle.layoutParams = titleParams
    mainLayout.addView(bannedTitle)

    // Subtitle message
    val subtitle = TextView(this)
    subtitle.text = "Back to your duel!"
    subtitle.textSize = subtitleSize
    subtitle.setTextColor(Color.parseColor("#9CA3AF"))
    subtitle.textAlignment = View.TEXT_ALIGNMENT_CENTER
    val subtitleParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    subtitleParams.setMargins(0, 0, 0, 64)
    subtitle.layoutParams = subtitleParams
    mainLayout.addView(subtitle)

    // Divider line
    val divider = View(this)
    divider.setBackgroundColor(Color.parseColor("#374151"))
    val dividerParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      2
    )
    dividerParams.setMargins(0, 0, 0, 48)
    divider.layoutParams = dividerParams
    mainLayout.addView(divider)

    // Blocked app info
    val appInfoLabel = TextView(this)
    appInfoLabel.text = "BLOCKED APP"
    appInfoLabel.textSize = 12f
    appInfoLabel.setTextColor(Color.parseColor("#6B7280"))
    appInfoLabel.textAlignment = View.TEXT_ALIGNMENT_CENTER
    appInfoLabel.letterSpacing = 0.1f
    val appInfoLabelParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    appInfoLabelParams.setMargins(0, 0, 0, 8)
    appInfoLabel.layoutParams = appInfoLabelParams
    mainLayout.addView(appInfoLabel)

    val appNameView = TextView(this)
    appNameView.text = appName
    appNameView.textSize = appNameSize
    appNameView.setTextColor(Color.parseColor("#EF4444"))
    appNameView.textAlignment = View.TEXT_ALIGNMENT_CENTER
    appNameView.setTypeface(null, android.graphics.Typeface.BOLD)
    val appNameParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    appNameParams.setMargins(0, 0, 0, 32)
    appNameView.layoutParams = appNameParams
    mainLayout.addView(appNameView)

    // Duel info
    val duelInfoLabel = TextView(this)
    duelInfoLabel.text = "ACTIVE DUEL"
    duelInfoLabel.textSize = 12f
    duelInfoLabel.setTextColor(Color.parseColor("#6B7280"))
    duelInfoLabel.textAlignment = View.TEXT_ALIGNMENT_CENTER
    duelInfoLabel.letterSpacing = 0.1f
    val duelInfoLabelParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    duelInfoLabelParams.setMargins(0, 0, 0, 8)
    duelInfoLabel.layoutParams = duelInfoLabelParams
    mainLayout.addView(duelInfoLabel)

    val duelIdView = TextView(this)
    duelIdView.text = duelType
    duelIdView.textSize = 18f
    duelIdView.setTextColor(Color.parseColor("#10B981"))
    duelIdView.textAlignment = View.TEXT_ALIGNMENT_CENTER
    duelIdView.setTypeface(null, android.graphics.Typeface.BOLD)
    val duelIdParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    duelIdParams.setMargins(0, 0, 0, 8)
    duelIdView.layoutParams = duelIdParams
    mainLayout.addView(duelIdView)

    val duelIdCodeView = TextView(this)
    duelIdCodeView.text = "ID: $duelId"
    duelIdCodeView.textSize = 14f
    duelIdCodeView.setTextColor(Color.parseColor("#6B7280"))
    duelIdCodeView.textAlignment = View.TEXT_ALIGNMENT_CENTER
    val duelIdCodeParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    duelIdCodeParams.setMargins(0, 0, 0, 64)
    duelIdCodeView.layoutParams = duelIdCodeParams
    mainLayout.addView(duelIdCodeView)

    // Spacer to push button to bottom
    val spacer = View(this)
    spacer.minimumHeight = 48
    val spacerParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    spacerParams.weight = 1f
    spacer.layoutParams = spacerParams
    mainLayout.addView(spacer)

    // Return button
    val returnButton = Button(this)
    returnButton.text = "Return to Home"
    returnButton.textSize = if (isTablet) 20f else 16f
    returnButton.setTextColor(Color.parseColor("#FFFFFF"))
    returnButton.setBackgroundColor(Color.parseColor("#10B981"))
    returnButton.setPadding(buttonPaddingH, buttonPaddingV, buttonPaddingH, buttonPaddingV)
    returnButton.elevation = 4f
    returnButton.setOnClickListener {
      returnToHome()
    }
    val buttonParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    buttonParams.setMargins(0, 0, 0, 24)
    returnButton.layoutParams = buttonParams
    mainLayout.addView(returnButton)

    // Branding footer
    val branding = TextView(this)
    branding.text = "⚡ Detox Duel"
    branding.textSize = 14f
    branding.setTextColor(Color.parseColor("#6B7280"))
    branding.textAlignment = View.TEXT_ALIGNMENT_CENTER
    val brandingParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    brandingParams.setMargins(0, 0, 0, 24)
    branding.layoutParams = brandingParams
    mainLayout.addView(branding)

    scrollView.addView(mainLayout)
    return scrollView
  }

  private fun returnToHome() {
    val homeIntent = Intent(Intent.ACTION_MAIN)
    homeIntent.addCategory(Intent.CATEGORY_HOME)
    homeIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    startActivity(homeIntent)
    finish()
  }

  override fun onBackPressed() {
    // Do nothing - block back button
    // User can only dismiss by clicking Return button
  }

  override fun onUserLeaveHint() {
    // Called when user presses home button
    // Finish the activity to return to home screen
    super.onUserLeaveHint()
    finish()
  }
}
