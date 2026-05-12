# Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Permission Denied" Even After Granting

**Symptoms:**
- You've granted "Usage access" in settings
- But `checkPermission()` still returns `false`

**Solutions:**

1. **Restart the app**:
   - Close the app completely (swipe away from recent apps)
   - Reopen Expo Go
   - Navigate to test screen and check permission again

2. **Clear app data**:
   - Go to Settings → Apps → Expo Go (or detox-duel)
   - Storage → Clear data
   - Restart the app

3. **Check all settings screens**:
   - Some Android skins (Samsung, Xiaomi) have multiple permission screens
   - Check: Settings → Privacy → Permission manager → Special access → Usage access
   - Also check: Settings → Apps → Special app access → Usage access

4. **Verify app is listed**:
   - In Usage access settings, ensure you see your app
   - If not, the app might not have requested permission correctly

### Issue: No Usage Data Returned

**Symptoms:**
- Permission is granted
- But `getUsageForApps()` returns `0m` for all apps

**Causes and Solutions:**

1. **No actual usage**:
   - If you haven't used the tracked apps recently, it will show 0m
   - **Test**: Open a tracked app, use it for 30 seconds, check again

2. **Time range too short**:
   - Test defaults to 24 hours (86400000ms)
   - If you used the app 25 hours ago, it won't show
   - **Test**: Increase the time range or use an app recently

3. **Android delay in UsageStatsManager**:
   - Some devices update usage stats with a delay (5-15 minutes)
   - **Solution**: Wait and try again

4. **System app restrictions**:
   - Some Android skins (Samsung, Xiaomi) restrict usage data
   - **Solution**: Check if other apps show data in Settings → Digital Wellbeing

### Issue: App Crashes When Getting Usage

**Symptoms:**
- App crashes when tapping "Get Usage"
- Error messages in terminal

**Solutions:**

1. **Check terminal logs**:
   - Look at the Metro bundler output for error details
   - Common errors: permission denied, null pointer

2. **Verify Expo module is installed**:
   ```bash
   cd detox-duel
   npm list expo-screen-time
   ```
   Should show the module and version

3. **Clear Expo Go cache**:
   - Long-press Expo Go app icon
   - App info → Storage → Clear cache
   - Restart and reload

4. **Reinstall app**:
   - Uninstall Expo Go
   - Reinstall from Play Store
   - Reconnect to development server

### Issue: "Usage access" Settings Not Opening

**Symptoms:**
- Tapping "Request Permission" doesn't open settings
- Nothing happens

**Solutions:**

1. **Check for console errors**:
   - Look at your terminal for error messages
   - Note any error codes

2. **Manual workaround**:
   - Open Settings manually
   - Search for "Usage access"
   - Navigate to the permission screen
   - Find your app and enable permission

3. **Check Android version**:
   - Android 5.0+ required for UsageStatsManager
   - Some older Android versions don't have this permission

### Issue: Expo Go Can't Connect

**Symptoms:**
- QR code scan fails
- Manual URL doesn't work
- "Connection refused" error

**Solutions:**

1. **Check Wi-Fi connection**:
   - Ensure device and computer on same network
   - Disable VPN on both device and computer

2. **Use tunnel mode**:
   - In terminal, press 't' for tunnel mode
   - This creates a public URL accessible from anywhere

3. **Check firewall**:
   - Windows Firewall might block port 8081
   - Temporarily disable firewall for testing

4. **Try different connection method**:
   - Press 'a' for Android (ADB) if you have Android SDK
   - Use tunnel mode ('t')

### Issue: Module Not Found Errors

**Symptoms:**
- `Unable to resolve module expo-screen-time`
- TypeScript errors about missing types

**Solutions:**

1. **Reinstall dependencies**:
   ```bash
   cd detox-duel
   rm -rf node_modules
   npm install
   ```

2. **Clear Metro cache**:
   ```bash
   npx expo start --clear
   ```

3. **Check file structure**:
   - Verify `expo-screen-time` folder exists at correct level
   - Check `package.json` has correct dependency path

### Issue: iOS Testing Shows Mock Data

**Symptoms:**
- Testing on iOS shows random usage numbers
- Numbers don't match actual usage

**Explanation:**
- This is **expected behavior**
- iOS requires Apple's Family Controls entitlement
- Need Apple approval for real screen time tracking
- See `TODO` comments in `ExpoScreenTimeModule.swift`

### Issue: Web Shows "Not Supported"

**Symptoms:**
- Testing on web shows warning messages
- No usage data available

**Explanation:**
- **Expected behavior** - web doesn't support screen time tracking
- Browsers don't have access to app usage data
- Only works on Android (and iOS with mock data)

## Getting Help

### Check Terminal Logs

Always check your terminal for error messages:
- Red text = errors
- Yellow text = warnings
- Blue text = info

### Enable Debugging

Add console logs to debug:

```typescript
const usage = await ScreenTimeTracker.getUsageForApps(
  packageNames,
  sinceTimestamp
);

console.log('DEBUG: Raw usage data:', usage);
console.log('DEBUG: Package names:', packageNames);
console.log('DEBUG: Time range:', {
  since: new Date(sinceTimestamp).toISOString(),
  until: new Date(Date.now()).toISOString()
});
```

### Check Android Logs

If you have Android SDK:

```bash
adb logcat | grep expo
```

This shows real-time logs from the app.

## Quick Reference

### Permission Not Granted?
→ Settings → Usage access → Find app → Enable

### No Usage Data?
→ Use a tracked app for 1-2 minutes → Check again

### App Crashes?
→ Check terminal logs → Clear cache → Reinstall

### Expo Go Won't Connect?
→ Same Wi-Fi → Try tunnel mode ('t' key) → Check firewall

### Module Not Found?
→ Reinstall npm packages → Clear Metro cache → Restart

## Success Indicators

✅ **Permission Granted**: "✅ Granted" in green
✅ **Usage Data**: Shows actual usage for apps you've used
✅ **Limit Check**: Correctly detects if limit exceeded
✅ **No Errors**: Clean terminal without red error messages

## Contact

If you encounter issues not covered here:
1. Check terminal logs first
2. Try the solutions above
3. Check Expo documentation: https://docs.expo.dev/
4. Check Android documentation: https://developer.android.com/
