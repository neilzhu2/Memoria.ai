# Apple Developer Account Setup Guide

**Last Updated**: January 18, 2026
**Status**: Ready for execution
**Next Action**: User will try Option 1 (app-specific password + bundle ID change)

## Overview

This guide documents how to deploy the Memoria.ai iOS app using a paid Apple Developer account when working with an **Individual** (not Organization) account that belongs to someone else (wife's account in this case).

## Background Context

### Account Types
- **Free Apple ID**: 7-day certificates, limited to personal devices, apps expire after 7 days
- **Individual Apple Developer** ($99/year): 1-year certificates, TestFlight, App Store publishing
- **Organization Apple Developer** ($99/year): Same as Individual, but can delegate certificate access to team members

### Critical Limitation: Individual Accounts
**Individual Apple Developer accounts CANNOT share certificate access**, even with users who have Admin role in App Store Connect.

### Current Situation
- **User's Free Account**: Bundle ID `com.anonymous.memoriaai` is registered here
- **Wife's Paid Account**: Individual Apple Developer account ($99/year)
- **Challenge**: User needs to build app without knowing wife's Apple ID password
- **Solution**: App-specific passwords + bundle identifier change

## Option 1: App-Specific Password + Bundle ID Change (RECOMMENDED)

**This is the secure, recommended approach.** User will try this option first.

### Security Benefits
- User never sees or knows the main Apple ID password
- App-specific password only works for Xcode and development tools
- Cannot access iCloud, email, or any personal data
- Can be revoked instantly at any time
- Two-factor authentication ensures account security

---

## Step-by-Step Instructions

### Part A: Account Holder (Wife) Generates App-Specific Password

**Prerequisites**: Two-Factor Authentication must be enabled on the Apple ID

#### Step 1: Enable Two-Factor Authentication (if not already enabled)
1. Go to https://appleid.apple.com
2. Sign in with Apple ID
3. Navigate to **Sign-In and Security** section
4. Click **Two-Factor Authentication**
5. Follow the prompts to enable it (requires a trusted device)

#### Step 2: Generate App-Specific Password
1. Go to https://appleid.apple.com
2. Sign in with Apple ID
3. Navigate to **Sign-In and Security** section
4. Click **App-Specific Passwords**
5. Click the **+** button or **Generate an app-specific password**
6. Enter a label: `Xcode - Memoria Development` (or similar descriptive name)
7. Click **Create**
8. **Copy the generated password** (format: `xxxx-xxxx-xxxx-xxxx`)
   - ⚠️ **IMPORTANT**: This password is shown only once. Copy it immediately.
9. Securely share this password with the developer (user)
   - Recommended: Use a password manager, encrypted message, or in-person transfer
   - Do NOT email it in plain text

#### Step 3: Note for Future Management
- To revoke access later: Return to **App-Specific Passwords** → Click **Revoke** next to the password
- You can see when it was last used
- You can generate multiple passwords for different purposes

---

### Part B: Developer (User) Adds Account to Xcode

#### Step 1: Open Xcode Settings
1. Open Xcode (version 14 or later recommended)
2. Go to **Xcode** → **Settings** (or **Preferences** in older Xcode versions)
3. Click the **Accounts** tab

#### Step 2: Add Apple ID Account
1. Click the **+** button at the bottom left
2. Select **Apple ID**
3. Enter:
   - **Apple ID**: Wife's Apple ID email address
   - **Password**: The app-specific password from Part A (format: `xxxx-xxxx-xxxx-xxxx`)
4. Click **Next** or **Sign In**

#### Step 3: Verify Account Added Successfully
1. The Apple ID should now appear in the left sidebar
2. Click on the Apple ID to see details
3. You should see:
   - **Team Name**: Wife's name or company name
   - **Role**: (varies, but account holder is typically "Agent")
   - No red error icons (✓ green checkmarks indicate success)

---

### Part C: Change Bundle Identifier in Xcode

**Why This Is Needed**: The bundle ID `com.anonymous.memoriaai` is already registered to the user's free Apple ID team. Each bundle identifier can only exist once per team.

#### Step 1: Open Xcode Project
1. Navigate to the iOS directory:
   ```bash
   cd /Users/lihanzhu/Desktop/Memoria/Memoria.ai/ios
   ```
2. Open the workspace:
   ```bash
   open Memoriaai.xcworkspace
   ```

#### Step 2: Change Bundle Identifier
1. In Xcode's Project Navigator (left sidebar), click on **Memoriaai** (the blue project icon at the top)
2. Ensure **Memoriaai** target is selected (under TARGETS, not PROJECTS)
3. Click the **General** tab
4. Under **Identity** section, find **Bundle Identifier**
5. Change from: `com.anonymous.memoriaai`
6. Change to: One of these options:
   - **Option A**: Use wife's team prefix: `com.[wifes-team-name].memoriaai`
   - **Option B**: Use a unique identifier: `com.memoriaai.app`
   - **Option C**: Use reverse domain: `ai.memoria.app`

   **Recommendation**: Use Option B or C for clarity and uniqueness.

#### Step 3: Verify Bundle ID Is Unique
1. After changing, look at the **Status** section below
2. If you see an error like "The app identifier cannot be registered to your development team":
   - Try a different bundle identifier
   - Or manually register it in Apple Developer portal first (see Part D)
3. A ✓ green checkmark means the bundle ID is available

#### Step 4: Update Signing & Capabilities
1. Click the **Signing & Capabilities** tab
2. Ensure:
   - **Automatically manage signing** is checked
   - **Team** dropdown shows wife's team name
   - **Signing Certificate** shows a valid certificate (usually "Apple Development")
   - **Provisioning Profile** shows a valid profile (usually "Xcode Managed Profile")

---

### Part D: (Optional) Manually Register Bundle ID in Developer Portal

If you prefer to register the bundle ID explicitly before Xcode tries to use it:

#### Step 1: Access Apple Developer Portal
1. Go to https://developer.apple.com
2. Sign in with wife's Apple ID
   - **Important**: This step requires the main password, not app-specific password
   - Only the account holder (wife) can do this part
   - Or skip this part and let Xcode auto-register the bundle ID

#### Step 2: Register Bundle Identifier
1. Navigate to **Certificates, Identifiers & Profiles**
2. Click **Identifiers** in the sidebar
3. Click the **+** button
4. Select **App IDs** → Click **Continue**
5. Select **App** → Click **Continue**
6. Fill in:
   - **Description**: Memoria - Voice Journaling App
   - **Bundle ID**: Select **Explicit** and enter your chosen bundle ID (e.g., `com.memoriaai.app`)
7. Select capabilities if needed (usually defaults are fine)
8. Click **Continue** → Click **Register**

---

### Part E: Build and Deploy to Device

#### Step 1: Connect iPhone
1. Connect iPhone to Mac via USB cable
2. Unlock the iPhone
3. If prompted "Trust This Computer?", tap **Trust**
4. Enter iPhone passcode

#### Step 2: Select Device in Xcode
1. In Xcode, find the device selector at the top (next to Run/Stop buttons)
2. Click it and select your connected iPhone from the list
3. It should show the device name and iOS version

#### Step 3: Build and Run
1. Click the **Run** button (▶️ play icon) or press **⌘R**
2. Xcode will:
   - Build the app
   - Generate signing certificate (1-year validity)
   - Install provisioning profile
   - Deploy app to iPhone
3. First time: May ask to "Register Device" in Developer Portal
   - This happens automatically, but account holder needs to approve
   - Xcode will show progress/prompts

#### Step 4: Trust Developer on iPhone
1. On iPhone, go to **Settings** → **General** → **VPN & Device Management**
2. Under **Developer App**, tap on the developer profile (wife's name)
3. Tap **Trust "[Developer Name]"**
4. Tap **Trust** again in the confirmation dialog
5. Return to home screen and launch the app

---

## Option 2: Change Bundle Identifier Only (Less Secure)

If the user decides to keep using their own Apple ID (free account), they can simply:

1. Change bundle identifier in Xcode (see Part C above)
2. Use their own Apple ID in Xcode
3. Continue with 7-day certificate limitations

**Disadvantages**:
- Apps expire after 7 days (must rebuild frequently)
- Cannot use TestFlight
- Cannot publish to App Store
- Not suitable for production deployment

---

## Workflow Summary

### For Building/Development
1. **Developer (User)**: Uses Xcode with wife's Apple ID (via app-specific password)
2. **Certificate Generation**: Automatically handled by Xcode using wife's account
3. **Device Registration**: Automatically handled when connecting new devices
4. **Code Signing**: All builds are signed with wife's team certificates

### For App Store Connect
1. **Account Holder (Wife)**: Adds user as Admin in App Store Connect
   - Go to https://appstoreconnect.apple.com
   - Users and Access → Click **+** → Add user with Admin role
2. **Developer (User)**: Can perform these tasks:
   - Upload builds to App Store Connect
   - Manage TestFlight beta testing
   - Edit app metadata, screenshots, descriptions
   - Submit app for review
   - View analytics and sales reports

### What Developer CANNOT Do
- Access **Certificates, Identifiers & Profiles** section (Individual account limitation)
- Generate new certificates manually
- Revoke certificates
- Register new bundle identifiers manually
- These tasks must be done by account holder or via Xcode's automatic management

---

## Troubleshooting

### "Authentication Failed" in Xcode
- **Cause**: App-specific password was typed incorrectly or has been revoked
- **Fix**:
  1. Verify the password was copied correctly (no extra spaces)
  2. Check if password still exists in appleid.apple.com
  3. Generate a new app-specific password if needed

### "Bundle Identifier Already Registered"
- **Cause**: Bundle ID exists in a different team (like the old free account)
- **Fix**: Change to a completely different bundle identifier

### "No Signing Certificate Found"
- **Cause**: Xcode cannot access certificates (expected for Individual accounts when using someone else's account)
- **Fix**: Ensure "Automatically manage signing" is enabled - Xcode will generate certificates automatically

### App Expires After 7 Days (Still Happening)
- **Cause**: Still using free Apple ID instead of paid account
- **Fix**: Verify that the correct team (paid account) is selected in Signing & Capabilities tab

### "Your account does not have permission to access Certificates"
- **Cause**: This is expected behavior for Individual accounts
- **Fix**: This is not actually an error - you can still build and deploy. The message appears because Admin role doesn't grant certificate access on Individual accounts. Use Xcode's automatic signing.

---

## Security Best Practices

### App-Specific Passwords
✅ **Do**:
- Generate unique passwords for each tool/purpose
- Use descriptive labels ("Xcode - Memoria", "Xcode - Other Project")
- Revoke passwords when no longer needed
- Store passwords in a password manager

❌ **Don't**:
- Share app-specific passwords publicly
- Reuse the same password across multiple apps/tools
- Store in plain text files
- Email app-specific passwords unencrypted

### Apple ID Security
✅ **Do**:
- Keep two-factor authentication enabled always
- Use a strong, unique password for Apple ID
- Regularly review authorized devices at appleid.apple.com
- Monitor App-Specific Password usage

❌ **Don't**:
- Disable two-factor authentication (breaks app-specific passwords)
- Share the main Apple ID password
- Log into appleid.apple.com on untrusted devices

---

## Next Steps After Successful Build

### 1. Test on Physical Device
- Install app on iPhone
- Verify all features work correctly
- Test recording, playback, memory management
- Check permissions (microphone, storage)

### 2. Prepare for TestFlight
- Build will be valid for 1 year (no more 7-day expiration)
- Can now archive and upload to TestFlight
- See iOS build troubleshooting doc for TestFlight deployment steps

### 3. Update Bundle Identifier in Other Files (if needed)
After changing bundle ID, check these files for references:
- `app.json` or `app.config.js` - Expo configuration
- `package.json` - May have bundle ID references
- Backend configurations - If backend validates bundle ID
- Deep linking configurations - URL schemes may use bundle ID

### 4. Update Documentation
- Update this guide with any issues encountered
- Document the chosen bundle identifier in project README
- Note any platform-specific configurations needed

---

## Reference Links

- **Apple ID Account Management**: https://appleid.apple.com
- **Apple Developer Portal**: https://developer.apple.com
- **App Store Connect**: https://appstoreconnect.apple.com
- **App-Specific Passwords Guide**: https://support.apple.com/en-us/HT204397
- **Two-Factor Authentication**: https://support.apple.com/en-us/HT204915

---

## Notes

- This guide assumes Xcode 14+ and iOS deployment target 15.1+
- Individual account limitations are an Apple policy, not a technical issue
- Organization accounts ($99/year) allow certificate delegation if this becomes a long-term need
- All certificate operations can be handled by Xcode's automatic signing - manual certificate management is rarely needed

**Last Verified**: January 18, 2026 with Xcode 15 and iOS 17 deployment
