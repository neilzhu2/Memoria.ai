# iOS Build Troubleshooting Guide

## Overview

This document captures the complete troubleshooting journey and solutions for building the Memoria.ai React Native Expo app to iOS devices, particularly when encountering New Architecture vs Legacy Architecture compatibility issues.

## Quick Reference: Common Errors

| Error | Quick Fix | Details |
|-------|-----------|---------|
| 151+ Fabric/New Architecture build errors | Disable New Architecture: `"newArchEnabled": "false"` | [Issue 1](#issue-1-initial-new-architecture-build-errors) |
| CocoaPods fast_float conflict | `cd ios && rm -rf Pods Podfile.lock && pod install` | [Issue 2](#issue-2-cocoapods-dependency-conflicts) |
| Reanimated v4 incompatibility | `npm install react-native-reanimated@3.16.1` | [Issue 3](#issue-3-react-native-reanimated-v4-incompatibility) |
| CocoaPods hanging at c++20 | Clear caches: `rm -rf ~/Library/Caches/CocoaPods` | [Issue 4](#issue-4-cocoapods-installation-hanging) |
| RNCSlider missing headers (151 errors) | Patch slider podspec to exclude Fabric files | [Issue 5](#issue-5-rncslider-missing-headers) |
| Xcode PIF transfer session error | `pod deintegrate && pod install` + clear Derived Data | [Issue 6](#issue-6-xcode-pif-transfer-session-error) |
| RNReanimated folly/coro/Coroutine.h not found | Add stub header via Podfile post_install hook | [Issue 7](#issue-7-rnreanimated-folly-coroutine-headers-missing) |
| Paid Apple Developer account certificate sharing | Use app-specific password + change bundle ID | [Issue 8](#issue-8-deploying-with-paid-apple-developer-account) |

## Project Context

- **Expo SDK**: 54
- **React Native**: 0.81.5
- **Architecture**: Legacy Architecture (New Architecture disabled)
- **Build Target**: Physical iOS device with free Apple ID

## Problem Summary

After running `npx expo prebuild --platform ios` and attempting to build in Xcode, the project encountered **151 build errors** related to missing React Native Fabric (New Architecture) headers, specifically:

```
'react/renderer/components/RNCSlider/RNCSliderComponentDescriptor.h' file not found
```

## Root Cause

The issue stemmed from **@react-native-community/slider version 4.5.3**, which had a podspec configuration that unconditionally included ALL `.mm` files, including New Architecture-specific files (`RNCSliderComponentView.mm`).

Even though this file contained `#ifdef RCT_NEW_ARCH_ENABLED` preprocessor guards, Xcode's compiler attempted to resolve the imports **before** evaluating these conditionals, causing build failures when looking for New Architecture headers that don't exist in Legacy Architecture builds.

## Complete Solution

### Step 1: Disable New Architecture

Ensure New Architecture is disabled in your project:

**File**: `ios/Podfile.properties.json`

```json
{
  "newArchEnabled": "false"
}
```

### Step 2: Downgrade react-native-reanimated (if using v4)

React Native Reanimated v4 requires New Architecture. If you have it installed, downgrade to v3:

```bash
npm uninstall react-native-reanimated react-native-worklets
npm install react-native-reanimated@3.16.1
```

### Step 3: Update @react-native-community/slider

```bash
npm install @react-native-community/slider@4.5.7
```

### Step 4: Patch the slider podspec

**File**: `node_modules/@react-native-community/slider/react-native-slider.podspec`

Find line 19 (the `s.source_files` line) and replace:

```ruby
s.source_files = "ios/**/*.{h,m,mm}"
```

With:

```ruby
# Conditionally include source files based on architecture
if new_arch_enabled
  s.source_files = "ios/**/*.{h,m,mm}"
else
  # Exclude Fabric component view files for legacy architecture
  s.source_files = "ios/**/*.{h,m}"
  s.exclude_files = "ios/RNCSliderComponentView.{h,mm}"
end
```

### Step 5: Clean and Reinstall Pods

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

### Step 6: Clean Xcode Build

In Xcode:
1. Product → Clean Build Folder (Shift + Command + K)
2. Build the project

## Making the Fix Permanent

Since the podspec modification is in `node_modules`, it will be lost when you run `npm install`. Use **patch-package** to make it permanent:

### Install patch-package

```bash
npm install --save-dev patch-package postinstall-postinstall
```

### Create the patch

```bash
npx patch-package @react-native-community/slider
```

This creates a patch file in `patches/@react-native-community+slider+4.5.7.patch`

### Add postinstall script

Add to your `package.json`:

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

Now the patch will automatically apply after every `npm install`.

## Complete Troubleshooting Timeline

### Issue 1: Initial New Architecture Build Errors

**Error**: 151+ errors about missing ScrollViewProps, React Fabric components
**Solution**: Disabled New Architecture in `ios/Podfile.properties.json`

### Issue 2: CocoaPods Dependency Conflicts

**Error**:
```
[!] CocoaPods could not find compatible versions for pod "fast_float"
```

**Solution**:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

### Issue 3: react-native-reanimated v4 Incompatibility

**Error**: Reanimated v4 requires New Architecture
**Solution**: Downgraded to v3.16.1

```bash
npm uninstall react-native-reanimated react-native-worklets
npm install react-native-reanimated@3.16.1
```

### Issue 4: CocoaPods Installation Hanging

**Error**: `pod install` hanging at "Setting CLANG_CXX_LANGUAGE_STANDARD to c++20"

**Solution**:
```bash
cd ios
rm -rf Pods Podfile.lock
rm -rf ~/Library/Caches/CocoaPods
pod install
```

If still hanging, manually run in Terminal (not through automation).

### Issue 5: RNCSlider Missing Headers

**Error**: 151 errors - `'react/renderer/components/RNCSlider/RNCSliderComponentDescriptor.h' file not found`
**Solution**: Applied the podspec patch (see Step 4 above)

### Issue 6: Xcode PIF Transfer Session Error

**Error**: After successful command-line build, opening Xcode shows:
```
Could not compute dependency graph:
MsgHandlingError(message: "unable to initiate PIF transfer session (operation in progress?)")
```

**Root Cause**: Xcode's PIF (Project Interchange Format) cache became stale or corrupted, preventing Xcode from loading the project structure properly. This can happen after multiple rebuild attempts, pod installations, or when Xcode processes are interrupted.

**Solution**: Complete workspace cleanup and regeneration:

```bash
# 1. Kill all Xcode processes
killall Xcode 2>/dev/null || true
killall com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true

# 2. Clear Xcode Derived Data for this project
rm -rf ~/Library/Developer/Xcode/DerivedData/Memoriaai-*

# 3. Remove local build artifacts
cd /Users/lihanzhu/Desktop/Memoria/Memoria.ai/ios
rm -rf build

# 4. Clear workspace user data (contains stale PIF cache)
rm -rf Memoriaai.xcworkspace/xcuserdata

# 5. Deintegrate and reinstall CocoaPods
pod deintegrate
rm -rf Pods Podfile.lock
pod install
```

After cleanup, reopen Xcode:
```bash
open Memoriaai.xcworkspace
```

Wait for indexing to complete before building.

### Issue 7: RNReanimated Folly Coroutine Headers Missing

**Error**: After fixing PIF error and reopening Xcode, build fails with:
```
'folly/coro/Coroutine.h' file not found
```

**Root Cause**: RCT-Folly version 2024.11.18.00 includes `Optional.h` and `Expected.h` files that conditionally include `<folly/coro/Coroutine.h>` when `FOLLY_HAS_COROUTINES` is defined. However, the RCT-Folly podspec doesn't include the `folly/coro/` directory. Even though coroutines are disabled via `FOLLY_CFG_NO_COROUTINES=1`, the preprocessor still needs the header file to exist during compilation because the `#include` statement is evaluated before the conditional compilation directives.

**Solution**: Add a post_install hook to the Podfile that creates a stub `folly/coro/Coroutine.h` header file with minimal coroutine type definitions:

**File**: `ios/Podfile`

Add this code inside the `post_install do |installer|` block (after the existing post_install code):

```ruby
# Fix for RCT-Folly coroutine header issue with RNReanimated
# RCT-Folly 2024.11.18.00 has Optional.h/Expected.h that conditionally include
# folly/coro/Coroutine.h, but the podspec doesn't include the coro directory.
# We create a stub header to satisfy the #include with minimal type definitions.
folly_coro_dir = File.join(installer.sandbox.pod_dir('RCT-Folly'), 'folly', 'coro')
folly_coro_header = File.join(folly_coro_dir, 'Coroutine.h')

unless File.exist?(folly_coro_header)
  FileUtils.mkdir_p(folly_coro_dir)
  File.write(folly_coro_header, <<~HEADER)
    #pragma once
    // Stub header for RCT-Folly - provides minimal coroutine types for compilation
    #if __has_include(<coroutine>)
    #include <coroutine>
    namespace folly { namespace coro {
      using std::coroutine_handle; using std::suspend_never; using std::suspend_always;
      inline constexpr bool detect_promise_return_object_eager_conversion() { return false; }
    }}
    #elif __has_include(<experimental/coroutine>)
    #include <experimental/coroutine>
    namespace folly { namespace coro {
      using std::experimental::coroutine_handle; using std::experimental::suspend_never; using std::experimental::suspend_always;
      inline constexpr bool detect_promise_return_object_eager_conversion() { return false; }
    }}
    #else
    namespace folly { namespace coro {
      template <typename T = void> struct coroutine_handle { constexpr coroutine_handle() noexcept = default; };
      struct suspend_never {}; struct suspend_always {};
      inline constexpr bool detect_promise_return_object_eager_conversion() { return false; }
    }}
    #endif
  HEADER
end
```

After adding this to the Podfile, run:
```bash
cd ios
pod install
```

The stub header will be automatically created during pod install. The fix persists across `pod install` runs because the Podfile includes the logic to recreate it if missing.

## Verification

After applying all fixes, verify the build:

```bash
cd ios
xcodebuild -workspace Memoriaai.xcworkspace \
  -scheme Memoriaai \
  -configuration Debug \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  clean build \
  CODE_SIGNING_ALLOWED=NO
```

Should complete with `** BUILD SUCCEEDED **` and exit code 0.

## Building to Physical Device

### Using Free Apple ID

1. Open Xcode workspace:
   ```bash
   open ios/Memoriaai.xcworkspace
   ```

2. Select your physical iPhone from the device dropdown

3. Configure signing:
   - Project settings → "Signing & Capabilities"
   - Select your Apple ID team
   - Xcode handles provisioning automatically

4. Click Play button to build and run

**Limitations with Free Apple ID**:
- Certificates expire every 7 days (need to rebuild)
- No TestFlight distribution
- Limited to 3 devices

### Using Paid Apple Developer Account

For TestFlight and App Store distribution, use a paid account:
- 1-year certificates
- TestFlight beta testing
- Unlimited devices
- App Store submission

## Common Issues and Solutions

### Xcode PIF Error: "unable to initiate PIF transfer session"

**Symptom**: Xcode shows error in Issues navigator even though command-line build succeeds.

**Cause**: Stale or corrupted Xcode cache (PIF = Project Interchange Format)

**Solution**:
```bash
# Kill Xcode and clear all caches
killall Xcode 2>/dev/null || true
rm -rf ~/Library/Developer/Xcode/DerivedData/Memoriaai-*
cd ios
rm -rf build Memoriaai.xcworkspace/xcuserdata
pod deintegrate
pod install

# Reopen Xcode
open Memoriaai.xcworkspace
```

### RNReanimated folly/coro/Coroutine.h Not Found

**Symptom**: Build fails with `'folly/coro/Coroutine.h' file not found` error

**Cause**: RCT-Folly podspec doesn't include the coro directory, but Optional.h/Expected.h try to include it

**Solution**: Add post_install hook to Podfile (see [Issue 7](#issue-7-rnreanimated-folly-coroutine-headers-missing) for complete code)

### Xcode Indexing Taking Too Long

Wait for indexing to complete before building. You'll see "Indexing | Processing files" in the status bar.

### Build Errors After npm install

Reapply patches:
```bash
npm run postinstall
# or manually
npx patch-package
```

Then reinstall pods:
```bash
cd ios && pod install
```

### Metro Bundler Not Starting

Kill existing Metro processes:
```bash
lsof -ti:8081 | xargs kill -9 2>/dev/null
```

Then start fresh:
```bash
npm start
```

## Key Learnings

1. **Expo SDK 54 + RN 0.81.5** has incomplete/buggy New Architecture support
2. **Legacy Architecture** is more stable for production apps currently
3. **Podspec configurations** in third-party libraries may not properly handle architecture conditionals
4. **Xcode's compiler** resolves imports before preprocessor conditionals are evaluated
5. **patch-package** is essential for maintaining node_modules modifications
6. **CocoaPods caching** can cause issues - clear caches when troubleshooting
7. **Free Apple ID** works for development but has significant limitations
8. **Xcode PIF cache** can become corrupted after multiple build attempts - requires complete workspace cleanup
9. **Command-line builds may succeed** when Xcode GUI fails - indicates workspace/cache issues rather than code issues
10. **pod deintegrate** is crucial when Xcode-specific issues occur - it regenerates workspace files with fresh PIF data
11. **Preprocessor evaluates #include before conditional compilation** - header files must exist even if wrapped in `#ifdef` guards
12. **Podfile post_install hooks** are essential for fixing missing headers or pod configuration issues that persist across installations
13. **RCT-Folly version 2024.11.18.00 has incomplete coro directory** - requires stub headers for coroutine types

## File Modifications Summary

| File | Change | Reason |
|------|--------|--------|
| `ios/Podfile.properties.json` | `"newArchEnabled": "false"` | Disable New Architecture |
| `package.json` (dependencies) | `@react-native-community/slider@4.5.7`<br>`react-native-reanimated@3.16.1` | Version compatibility |
| `package.json` (scripts) | `"postinstall": "patch-package"` | Auto-apply patches |
| `node_modules/@react-native-community/slider/react-native-slider.podspec` | Conditional file inclusion | Exclude New Arch files |
| `patches/` directory | Created patch file | Persist modifications |
| `ios/Podfile` | Added post_install hook for folly/coro stub | Fix RNReanimated coroutine headers |

## Additional Resources

- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)
- [React Native New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page)
- [patch-package GitHub](https://github.com/ds300/patch-package)
- [CocoaPods Troubleshooting](https://guides.cocoapods.org/using/troubleshooting)
- [Xcode Build System and PIF](https://developer.apple.com/documentation/xcode/build-system)
- [Cleaning Xcode Derived Data](https://developer.apple.com/documentation/xcode/customizing-the-build-schemes-for-a-project)

## Future Considerations

### Upgrading to New Architecture

When Expo SDK and React Native have more stable New Architecture support:

1. Update to compatible versions of all dependencies
2. Change `ios/Podfile.properties.json` to `"newArchEnabled": "true"`
3. Upgrade react-native-reanimated to v4+
4. Remove the slider podspec patch (should work natively)
5. Clean and rebuild:
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   ```

### Maintaining Compatibility

- Always test builds after dependency updates
- Keep patch-package in devDependencies
- Document any additional patches needed
- Consider contributing fixes upstream to library maintainers

---

### Issue 8: Deploying with Paid Apple Developer Account

**Context**: After successfully building with free Apple ID but encountering 7-day certificate expiry and trust issues, transitioned to wife's paid Individual Apple Developer account.

**Challenges Encountered**:

1. **Individual Account Limitations**
   - Individual Apple Developer accounts cannot share certificate access with team members
   - Admin role in App Store Connect does NOT grant access to Certificates, Identifiers & Profiles
   - Only Account Holder can generate code signing certificates on Individual accounts

2. **Bundle Identifier Conflict**
   - Bundle ID `com.anonymous.memoriaai` already registered to free Apple ID team
   - Cannot use same bundle ID across different teams
   - Error: "The app identifier cannot be registered to your development team because it is not available"

**Solutions**:

**Option 1: Use App-Specific Password (Recommended)**

1. **Account Holder enables Two-Factor Authentication**:
   ```
   Go to https://appleid.apple.com
   Sign in → Security → Enable Two-Factor Authentication
   ```

2. **Generate App-Specific Password**:
   ```
   Go to https://appleid.apple.com
   Sign in → Sign-In and Security → App-Specific Passwords
   Click "+" → Name it "Xcode - [Developer Name]"
   Copy the generated password (format: xxxx-xxxx-xxxx-xxxx)
   ```

3. **Add to Xcode**:
   ```
   Xcode → Settings → Accounts → "+" → Add Account
   Enter Account Holder's Apple ID email
   Use app-specific password (NOT real password)
   ```

**Option 2: Change Bundle Identifier**

In Xcode:
```
Select project → Select target → General tab
Change Bundle Identifier to unique value:
- com.[teamname].memoriaai
- com.memoria.app
- Any unique identifier not already registered
```

**Workflow with Individual Account**:

1. **For Building**:
   - Must use Account Holder's Apple ID in Xcode (via app-specific password)
   - Build using their team's certificates
   - Certificates valid for 1 year (vs 7 days with free account)

2. **For App Store Connect Management**:
   - Team members with Admin role can:
     - Upload builds to App Store Connect
     - Manage TestFlight beta testing
     - Edit app metadata, pricing, screenshots
     - Respond to reviews
     - Submit apps for review
   - Team members with Admin role CANNOT:
     - Access Certificates, Identifiers & Profiles
     - Generate signing certificates
     - Build apps with paid certificates

**Security Considerations**:

- ✅ App-specific password only works for Xcode/development tools
- ✅ Can be revoked anytime without changing main password
- ✅ Does NOT grant access to iCloud, email, or personal data
- ❌ Should not share actual Apple ID password

**Key Learnings**:

14. **Individual vs Organization accounts have different permission models** - Individual accounts cannot delegate certificate access
15. **App-specific passwords are the secure solution** for sharing Xcode access without sharing the main password
16. **Bundle identifiers are globally unique per team** - need to change when switching teams
17. **Admin role in App Store Connect ≠ Certificate access** - these are separate permission systems

---

**Last Updated**: January 5, 2026
**Tested Configuration**: Expo SDK 54, React Native 0.81.5, Legacy Architecture, RCT-Folly 2024.11.18.00
