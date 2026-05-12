# 🧪 Screen Time Testing Checklist

## Pre-Test Preparation ✅

- [ ] Android device connected to same Wi-Fi as computer
- [ ] Expo Go installed from Google Play Store
- [ ] Development server running (`npm start`)
- [ ] Expo Go connected to development server
- [ ] App loaded successfully in Expo Go

## Quick Start 🚀

1. **Open Profile Tab**
   - [ ] Navigate to Profile tab in bottom navigation
   - [ ] Scroll down to "Development Tools 🧪" section
   - [ ] Tap "Test Screen Time Tracking"

2. **Initial Permission Check**
   - [ ] Tap "Check Permission"
   - [ ] Confirm shows "❌ Denied" (expected initially)
   - [ ] Note any error messages in terminal

## Permission Flow Tests 🔐

### Test 1: Request Permission
- [ ] Tap "Request Permission"
- [ ] Android Settings opens automatically
- [ ] Settings screen shows "Usage access" permissions
- [ ] Find your app in the list
- [ ] Tap on your app
- [ ] Enable "Allow usage access" toggle
- [ ] Go back to app using back button (not app switcher)

### Test 2: Verify Permission
- [ ] Tap "Check Permission" again
- [ ] Should now show "✅ Granted" in green
- [ ] Note: If still denied, see Troubleshooting Guide

## Usage Tracking Tests 📊

### Test 3: Get Usage (Empty State)
- [ ] Tap "Get Usage (24h)"
- [ ] Wait for loading indicator to finish
- [ ] Check if usage data appears
- [ ] If 0m for all apps, this is normal if you haven't used them recently

### Test 4: Generate Test Data
- [ ] Open one of these apps on your phone:
  - Instagram (`com.instagram.android`)
  - Twitter (`com.twitter.android`)
  - Facebook (`com.facebook.katana`)
  - YouTube (`com.google.android.youtube`)
- [ ] Use the app for 1-2 minutes
- [ ] Close the app and return to test screen
- [ ] Tap "Get Usage (24h)" again
- [ ] Should now show usage time for that app

### Test 5: Check Total Usage
- [ ] Look at "Total Usage (24h)" section
- [ ] Verify total matches sum of per-app usage
- [ ] Check format (e.g., "1h 30m" or "45m")

### Test 6: Per-App Breakdown
- [ ] Check "Per-App Usage" list
- [ ] Each app shows package name and time
- [ ] Verify times look reasonable
- [ ] Note: Apps with 0m won't appear in list

## Limit Detection Tests ⏱️

### Test 7: Check Limit (Below)
- [ ] Tap "Check 30m Limit"
- [ ] If total usage < 30 minutes:
  - [ ] Should show "✅ Within 30 minute limit"
  - [ ] Alert box appears with success message

### Test 8: Check Limit (Exceeded)
- [ ] If total usage > 30 minutes:
  - [ ] Should show "⚠️ Exceeded 30 minute limit!"
  - [ ] Alert box appears with warning message
  - [ ] Note: This is simulated based on your actual usage

## Error Handling Tests ❌

### Test 9: Permission Denied Error
- [ ] Temporarily revoke permission in Settings
- [ ] Tap "Get Usage (24h)"
- [ ] Should show error message or prevent action
- [ ] Re-grant permission to continue

### Test 10: Network Issues (if applicable)
- [ ] Disconnect Wi-Fi
- [ ] Try operations (should still work - local only)
- [ ] Reconnect Wi-Fi
- [ ] Verify operations still work

## Platform Tests 📱

### Test 11: Android Verification
- [ ] Platform detected correctly
- [ ] All features work as expected
- [ ] No "Not supported on web" messages

### Test 12: iOS Verification (if available)
- [ ] Opens test screen
- [ ] Shows mock data with random values
- [ ] Shows warning about Family Controls entitlement

### Test 13: Web Verification (if testing web)
- [ ] Opens test screen
- [ ] Shows "Screen time tracking is not supported on web"
- [ ] All operations return empty data with warnings

## Integration Tests 🔗

### Test 14: Navigation
- [ ] Navigate away from test screen
- [ ] Return to test screen
- [ ] All previous state preserved (permission status, etc.)

### Test 15: App Restart
- [ ] Close app completely (swipe away)
- [ ] Reopen app
- [ ] Navigate to test screen
- [ ] Permission status correctly remembered

### Test 16: Multiple Sessions
- [ ] Use tracked apps multiple times
- [ ] Check usage after each session
- [ ] Total usage should accumulate

## Performance Tests ⚡

### Test 17: Response Time
- [ ] Tap "Check Permission" - should respond instantly
- [ ] Tap "Get Usage" - should complete in < 2 seconds
- [ ] Tap "Check Limit" - should complete in < 2 seconds

### Test 18: Memory Usage
- [ ] Use test screen for 5-10 minutes
- [ ] No noticeable lag or slowdown
- [ ] No app crashes

## Data Accuracy Tests 🎯

### Test 19: Time Format
- [ ] Times display correctly (e.g., "1h 30m", "45m")
- [ ] Zero times show as "0m" or don't appear
- [ ] Large times (hours) format correctly

### Test 20: Package Names
- [ ] Package names display correctly
- [ ] No truncated or malformed names
- [ ] Matches expected package names

## Terminal Log Checks 💻

### Test 21: Check Terminal for Errors
- [ ] Open terminal where `npm start` is running
- [ ] Look for red error messages during tests
- [ ] Note any warnings (yellow text)
- [ ] All operations should complete without errors

### Test 22: Debug Output
- [ ] Check for console.log messages
- [ ] Verify data structures look correct
- [ ] Timestamps are valid
- [ ] Permission status logged correctly

## Final Verification ✅

- [ ] All tests passed successfully
- [ ] No crashes or errors encountered
- [ ] Usage data appears accurate
- [ ] Permission flow works smoothly
- [ ] All UI elements display correctly
- [ ] Alert messages appear at appropriate times
- [ ] Terminal logs look clean

## Known Issues to Note 📝

Record any issues encountered:

1. Issue: _______________________________
   Solution: _______________________________

2. Issue: _______________________________
   Solution: _______________________________

3. Issue: _______________________________
   Solution: _______________________________

## Test Environment Information 🖥️

- **Device**: _____________________ (e.g., Samsung Galaxy S21)
- **Android Version**: _____________________ (e.g., Android 13)
- **Expo Go Version**: _____________________ (check in app)
- **Date Tested**: _____________________
- **Tester**: _____________________

## Overall Result

- [ ] **PASS** - All tests completed successfully
- [ ] **PASS WITH MINOR ISSUES** - Minor issues noted but not critical
- [ ] **FAIL** - Critical issues prevent functionality
- [ ] **PARTIAL** - Some tests not completed

## Next Steps After Testing

If all tests pass:
1. ✅ Ready to integrate with duel flow
2. ✅ Add to actual duel creation/monitoring
3. ✅ Consider adding UI for permission requests
4. ✅ Plan for iOS implementation (when entitlements available)

If tests fail:
1. ⚠️ Review Troubleshooting Guide
2. ⚠️ Check terminal logs for errors
3. ⚠️ Try common solutions
4. ⚠️ Consider EAS build for standalone testing

## Success Indicators 🎉

✅ Permission granted and remembered
✅ Usage data matches actual app usage
✅ Limit detection works correctly
✅ No crashes or errors
✅ Smooth user experience
✅ Clean terminal logs
✅ UI displays correctly
✅ Response times are fast

---

**Testing Complete!** 🎊

The screen time tracking module is ready for integration with your duel system.
