# AI Assistant Context - Memoria.ai Project

**Last Updated**: January 18, 2026
**Purpose**: Navigation map for ALL AI assistants (Claude, Gemini, Codex, etc.)

## How to Use This File

This document tells you **WHERE** to find current information, not what that information is. Always read the source files for up-to-date details.

### Quick Start
1. **What was just done + immediate next steps**: Read `WORKLOG.md` (tactical, session-by-session)
2. **Long-term priorities & feature roadmap**: Read `ROADMAP.md` (strategic, maintained proactively)
3. **iOS issues**: Read `docs/ios-build-troubleshooting.md`
4. **Project setup**: Read `package.json` and `app.json`

### Document Purposes
- ✅ **`WORKLOG.md`** - Tactical: Recent work, immediate next actions (updated after each session)
- ✅ **`ROADMAP.md`** - Strategic: Feature priorities, long-term phases (maintained proactively)
- ⚠️ **`docs/archive/`** - Historical only, reference but don't use for current status

## Project Quick Facts

- **Type**: Voice journaling app for elderly users
- **Stack**: React Native 0.81.5 + Expo SDK 54 + Supabase
- **Platform**: iOS (primary), Android (future)
- **Stage**: Pre-launch (preparing for TestFlight beta)
- **Location**: `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/`

## Where to Find What

### Current Status & Priorities
- **`WORKLOG.md`** - **READ THIS FIRST** - Always current, updated after each session
  - Latest session summary (what was done today)
  - Next action items (what to do next)
  - Recent work history

### iOS Development
- **`docs/ios-build-troubleshooting.md`** - 8 documented iOS build issues & solutions
- **`docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md`** - Paid account setup (app-specific passwords)
- **`ios/Podfile`** - iOS dependencies and build fixes (heavily commented)
- **`ios/` directory** - Xcode workspace (working directory for iOS builds)

### Code Architecture
- **`app/`** - Expo Router application code (file-based routing)
- **`components/`** - React components
- **`contexts/`** - React Context providers (RecordingContext, AuthContext, etc.)
- **`services/`** - Business logic (topics.ts, analytics.ts, supabase.ts)
- **`constants/`** - Design tokens (Colors.ts, DesignTokens.ts)

### Configuration
- **`package.json`** - Dependencies and scripts
- **`app.json`** - Expo configuration (bundle ID, version, etc.)
- **`eas.json`** - EAS Build configuration
- **`.env.local`** - Supabase credentials (not in git)

### Documentation (May Be Outdated)
- ⚠️ **`ROADMAP.md`** - Long-term plans (may not reflect current priorities - check `WORKLOG.md` instead)
- ⚠️ **`docs/archive/`** - Historical sessions (reference only, not current status)
- ℹ️ **`docs/accessibility-guidelines.md`** - Elderly-friendly design principles (stable)
- ℹ️ **`docs/web-app-research/`** - PWA research (deferred, but accurate for research phase)

## Key Facts to Know

### Apple Developer Account
- **Setup**: Individual account (wife's), user builds via app-specific password
- **Details**: See `docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md`
- **Bundle ID**: `com.anonymous.memoriaai` (will change - see WORKLOG.md for latest)

### Architecture Decisions
- **Why Legacy Architecture**: Expo SDK 54 default, New Architecture has module compatibility issues
- **Why Supabase**: PostgreSQL + auth + storage in one platform, open-source
- **Why React Native Web deferred**: Feasibility researched (see `docs/web-app-research/`), implementation post-MVP

## Common Commands Reference

See `package.json` for all available scripts. Most common:
- **`npm start`** - Start Expo dev server (currently using Expo Go)
- **`npm run type-check`** - TypeScript type checking
- **`npm test`** - Run test suite
- **iOS**: Open `ios/Memoriaai.xcworkspace` in Xcode (NOT .xcodeproj)
- **Pod install**: `cd ios && pod install` (after adding iOS dependencies)

## AI Assistant Quick Rules

1. **Check `WORKLOG.md` FIRST** for recent work and immediate next steps (tactical)
2. **Check `ROADMAP.md`** for feature priorities and long-term plan (strategic)
3. **iOS issues**: Start with `docs/ios-build-troubleshooting.md`
4. **iOS working directory**: `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/ios`
5. **UX changes**: Follow `docs/accessibility-guidelines.md` (elderly-friendly: large fonts, generous touch targets)
6. **Security**: Never commit `.env.local`, use app-specific passwords for Apple ID

### Document Maintenance
- **WORKLOG.md** - Update after EVERY session with what was done + next actions
- **ROADMAP.md** - Update proactively when priorities or features change

## Claude Code CLI Info

- **Agent directory**: `.claude/agents/` (e.g., `ios-react-native-expert.md`)
- **Settings**: `.claude/settings.local.json`
- **Why no `claude.md`?**: Claude CLI uses directory structure, not a single file
- **This file**: Works for ALL AI assistants (Claude, Gemini, Codex, etc.)

---

**For AI Assistants**: This is a **navigation map**, not a source of truth. Always read the actual files mentioned above for current information. When unsure about current priorities, check `WORKLOG.md` first, then ask the user.
