# AI Assistant Context - Memoria.ai Project

**Last Updated**: January 18, 2026
**Purpose**: Master reference document for ALL AI assistants (Claude, Gemini, Codex, etc.)

## Project Overview

**Memoria.ai** is a voice journaling application for elderly users, built with React Native and Expo SDK 54.

### Core Technologies
- **Mobile**: React Native 0.81.5 (Legacy Architecture), Expo SDK 54
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Language**: TypeScript
- **Primary Platform**: iOS (actively deploying to App Store)
- **Web Platform**: Research phase (documented but not yet implemented)

### Project Structure
```
Memoria.ai/
├── app/                      # Expo Router application code
├── components/               # React components
├── contexts/                 # React Context providers
├── services/                 # Business logic and API clients
├── ios/                      # iOS native project (Xcode workspace)
├── docs/                     # Comprehensive documentation
├── .claude/                  # Claude Code CLI configuration
│   ├── agents/              # Specialized agent definitions
│   └── settings.local.json  # Claude CLI settings
└── AI_ASSISTANT_CONTEXT.md  # This file
```

## Critical Documentation Index

### iOS Development & Deployment
- **[docs/ios-build-troubleshooting.md](docs/ios-build-troubleshooting.md)** - Comprehensive iOS build issue resolution guide (8 documented issues)
- **[docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md](docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md)** - Step-by-step Apple Developer account configuration
- **Working Directory**: `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/ios`

### Web Platform Research
- **[docs/web-app-research/](docs/web-app-research/)** - PWA implementation research and requirements
  - `pwa-requirements.md` - PWA offline capabilities and architecture
  - `web-compatibility-analysis.md` - React Native Web compatibility findings
  - `technical-architecture.md` - Proposed web app architecture

### Application Features & Context
- **[docs/product-context.md](docs/product-context.md)** - Product vision and user experience goals
- **[docs/memory-types.md](docs/memory-types.md)** - Memory classification system
- **[docs/recording-flow.md](docs/recording-flow.md)** - Voice recording UX and implementation

### Accessibility & UX
- **[docs/accessibility-guidelines.md](docs/accessibility-guidelines.md)** - Elderly-friendly design principles
- **[docs/ux-research/](docs/ux-research/)** - User research findings and insights

## Current Project Status

### Active Work: iOS Deployment & MVP Completion

**Current Focus**: Preparing for TestFlight Beta Launch

**Immediate Next Steps** (In Order):
1. ✅ **Bundle ID Setup** (DONE TODAY - Jan 18, 2026)
   - Documentation created: `docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md`
   - User will coordinate with wife for app-specific password
   - Will change bundle identifier to enable dev build with paid account

2. **Dev Build to Physical Device** (NEXT)
   - Build app to iPhone using wife's paid Apple Developer account
   - Test on physical device (currently testing via Expo Go)

3. **API Integration - Recording & Transcription** (PRIORITY)
   - Implement recording functionality (expo-speech-recognition or cloud service)
   - Add transcription API integration
   - Enable core voice journaling features

4. **UX Refinement** (PRE-LAUNCH)
   - Polish recording UX flow
   - Refine record reviewing/playback UX
   - Final UI tweaks for elderly users

5. **TestFlight Beta Launch**
   - Deploy to TestFlight for beta testing
   - Test via Userbrain and other channels
   - Gather feedback before App Store submission

### What's Already Complete
- ✅ Profile image upload feature (completed Nov 2025)
- ✅ Date of birth picker in profile settings
- ✅ Home page UX improvements (auto-dismiss, filter bar)
- ✅ iOS build system stabilization (8 issues documented and resolved)
- ✅ Topics system with 50 curated prompts and smart rotation
- ✅ Core CRUD operations (create, read, update, delete memories)
- ✅ Authentication and user data isolation
- ✅ Supabase backend integration
- ✅ Design system with elderly-optimized UI

### What's NOT Prioritized (Deferred Post-Launch)
- ❌ Internationalization (i18n) - will revisit after MVP validation
- ❌ Web app development - deferred to Q3 2026 pending mobile validation
- ❌ Family sharing features - post-launch enhancement
- ❌ Advanced analytics - basic tracking sufficient for MVP

## Apple Developer Account Context

### Current Setup
- **Free Account**: User's personal Apple ID (com.anonymous.memoriaai bundle ID registered here)
- **Paid Account**: Wife's Individual Apple Developer account ($99/year)
- **Limitation**: Individual accounts CANNOT delegate certificate access to other users

### Secure Deployment Workflow
1. **Building**: Wife generates app-specific password → User adds to Xcode
2. **App Store Connect**: User has Admin role (can upload builds, manage TestFlight, edit metadata)
3. **Certificates**: Only wife can access Certificates, Identifiers & Profiles section

## Key Technical Decisions

### Why Legacy Architecture (Not New Architecture)
- Expo SDK 54 defaults to Legacy Architecture
- New Architecture has compatibility issues with some Expo modules
- Decision documented in git history and troubleshooting docs

### Why Supabase
- Provides PostgreSQL database, authentication, and file storage in one platform
- Open-source alternative to Firebase
- Self-hostable if needed in future

### Why React Native Web Research (Not Immediate Implementation)
- User wants to understand feasibility first
- Detailed research completed, implementation deferred
- All findings documented in `docs/web-app-research/`

## Common Commands

### Development
```bash
# Start Expo development server
npm start

# Run iOS app in simulator
npm run ios

# Type checking
npm run type-check

# Run tests
npm test
```

### iOS Building
```bash
# Open Xcode workspace (from ios/ directory)
open Memoriaai.xcworkspace

# Install CocoaPods dependencies
pod install

# Clean build (if issues occur)
rm -rf Pods/ Podfile.lock && pod install
```

## AI Assistant Guidelines

### When Working on iOS Issues
1. **Always check** `docs/ios-build-troubleshooting.md` first
2. **Working directory** must be `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/ios` for Xcode commands
3. **Podfile modifications** are documented with detailed comments explaining each fix
4. **Bundle identifier** is currently `com.anonymous.memoriaai` (may change soon)

### When Researching Web Implementation
1. **Reference** existing research in `docs/web-app-research/`
2. **Do not implement** without explicit user request (research only so far)
3. **PWA requirements** are well-documented, use them as baseline

### When Making UX Changes
1. **Consult** `docs/accessibility-guidelines.md` for elderly-friendly principles
2. **Font sizes** must be large and readable
3. **Touch targets** must be generous (minimum 60pt)
4. **Animations** should be gentle and purposeful

### Documentation Standards
- **Update dates** when modifying any documentation
- **Add examples** for complex concepts
- **Cross-reference** related documents
- **Keep troubleshooting docs** up-to-date with new issues encountered

## Security Considerations

### Apple ID Security
- **Never share** main Apple ID password
- **Use app-specific passwords** for Xcode/development tools
- **Revoke immediately** if compromised
- **Two-factor authentication** required for password generation

### Supabase Credentials
- **Environment variables** for API keys (not committed to git)
- **Row Level Security (RLS)** enabled on all tables
- **Service role key** only used server-side (never in mobile app)

## Claude Code CLI Specific

### Agent Definitions
- **Location**: `.claude/agents/`
- **ios-react-native-expert.md**: Specialized agent for iOS/React Native/Xcode tasks
- **Settings**: `.claude/settings.local.json`

### Why No `claude.md`?
Claude Code CLI doesn't use a single `claude.md` file. Instead:
- Settings are in `.claude/settings.local.json`
- Agent definitions are in `.claude/agents/` directory
- This `AI_ASSISTANT_CONTEXT.md` serves as the project-wide context for ALL AI assistants

## Quick Navigation

| Need to... | Go to... |
|------------|----------|
| Fix iOS build error | `docs/ios-build-troubleshooting.md` |
| Set up Apple Developer account | `docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md` |
| Understand product vision | `docs/product-context.md` |
| Research web implementation | `docs/web-app-research/` |
| Learn accessibility guidelines | `docs/accessibility-guidelines.md` |
| Understand memory types | `docs/memory-types.md` |
| Review recording flow | `docs/recording-flow.md` |

## Contact & Support

- **Primary Developer**: lihanzhu
- **Project Location**: `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/`
- **Issue Tracking**: Document issues in relevant docs (e.g., new iOS issues in ios-build-troubleshooting.md)

---

**For AI Assistants**: This document provides the essential context to understand the Memoria.ai project. Always consult the specific documentation linked above for detailed information on particular topics. When in doubt, ask the user rather than making assumptions about implementation details.
