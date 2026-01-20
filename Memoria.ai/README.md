# Memoria.ai

> Voice journaling app for elderly users (65+) to preserve life stories and memories

**Status**: Pre-launch | Preparing for TestFlight Beta
**Version**: 1.2.4
**Last Updated**: January 18, 2026

## Overview

Memoria.ai is a mobile voice journaling application designed specifically for elderly users to easily record and preserve their life stories, memories, and wisdom. The app uses voice-first interaction with elderly-optimized UX (large fonts, generous touch targets, gentle animations).

### Key Features
- 50 curated conversation prompts (with smart 30-day rotation)
- Voice recording with transcription
- Memory organization and search
- Topics system with 10 categories (Childhood, Family, Career, etc.)
- Elderly-friendly design (WCAG AAA accessibility)

## Tech Stack

- **Mobile**: React Native 0.81.5 (Legacy Architecture)
- **Framework**: Expo SDK 54
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Language**: TypeScript
- **Platform**: iOS (primary), Android (future)
- **Development**: Currently using Expo Go, transitioning to dev build

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Xcode 14+ (for iOS development)
- Apple Developer account (for device builds)
- Supabase account credentials

### Installation

1. **Clone and install dependencies**
   ```bash
   cd Memoria.ai
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Create .env.local with your Supabase credentials
   # (See .env.example for required variables)
   ```

3. **Install iOS dependencies**
   ```bash
   cd ios
   pod install
   cd ..
   ```

### Running the App

**Current development mode** (Expo Go):
```bash
npm start
# Scan QR code with Expo Go app on iOS device
```

**Type checking**:
```bash
npm run type-check
```

**Run tests**:
```bash
npm test
```

## Documentation

This project has comprehensive documentation organized by audience:

### For Developers (Human)
- **[README.md](README.md)** (this file) - Project overview and quick start
- **[WORKLOG.md](WORKLOG.md)** - **Check here first!** Recent work + immediate next steps (tactical, updated every session)
- **[ROADMAP.md](ROADMAP.md)** - Feature priorities and long-term plan (strategic, maintained proactively)

### For AI Assistants
- **[AI_ASSISTANT_CONTEXT.md](AI_ASSISTANT_CONTEXT.md)** - Navigation map for AI assistants (Claude, Gemini, Codex)

### Specialized Guides
- **[docs/ios-build-troubleshooting.md](docs/ios-build-troubleshooting.md)** - 8 documented iOS build issues & solutions
- **[docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md](docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md)** - Paid Apple Developer account setup (app-specific passwords, bundle ID)
- **[docs/accessibility-guidelines.md](docs/accessibility-guidelines.md)** - Elderly-friendly design principles
- **[docs/web-app-research/](docs/web-app-research/)** - PWA feasibility research (deferred to post-launch)

## iOS Development

### Apple Developer Account Setup
This project uses an Individual Apple Developer account. See the complete setup guide:
- **Guide**: [docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md](docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md)
- **Current Bundle ID**: `com.anonymous.memoriaai` (will change - see WORKLOG.md for updates)
- **Security**: Uses app-specific passwords (never share main Apple ID password)

### Working with Xcode
```bash
cd ios
open Memoriaai.xcworkspace  # Important: Use .xcworkspace NOT .xcodeproj
```

**iOS Working Directory**: `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/ios`

### Common iOS Issues
If you encounter iOS build issues, check:
1. **[docs/ios-build-troubleshooting.md](docs/ios-build-troubleshooting.md)** - 8 documented issues
2. **Pod dependencies**: `cd ios && pod install`
3. **Clean build**: `rm -rf ios/Pods ios/Podfile.lock && cd ios && pod install`

## Project Structure

```
Memoria.ai/
├── app/                      # Expo Router application (file-based routing)
│   ├── (auth)/              # Authentication screens (login, signup)
│   └── (tabs)/              # Main tab navigation (home, memories, profile)
├── components/              # React components
├── contexts/                # React Context providers (RecordingContext, AuthContext)
├── services/                # Business logic (topics.ts, analytics.ts, supabase.ts)
├── constants/               # Design tokens (Colors.ts, DesignTokens.ts)
├── ios/                     # iOS native project (Xcode workspace)
├── docs/                    # Comprehensive documentation
├── .claude/                 # Claude Code CLI configuration & agents
├── future-features/         # Deferred implementations (not in active use)
├── WORKLOG.md              # Tactical: Recent work + next steps
├── ROADMAP.md              # Strategic: Feature priorities + phases
└── AI_ASSISTANT_CONTEXT.md # Navigation map for AI assistants
```

## Available Scripts

From `package.json`:

- **`npm start`** - Start Expo development server (Expo Go)
- **`npm run ios`** - Run iOS app (requires dev build, not yet configured)
- **`npm run type-check`** - TypeScript type checking
- **`npm test`** - Run Jest test suite
- **`npm run test:recording`** - Run recording-specific tests

## Key Design Decisions

### Why Legacy Architecture?
- Expo SDK 54 defaults to Legacy Architecture
- New Architecture has compatibility issues with some Expo modules
- Decision to stay on Legacy until better module support

### Why Supabase?
- PostgreSQL database + authentication + storage in one platform
- Open-source alternative to Firebase
- Self-hostable if needed in future
- Row Level Security (RLS) for data isolation

### Why Elderly-Focused UX?
- Target audience: 65+ years old
- **Font sizes**: 18-28pt (larger than standard)
- **Touch targets**: 56pt minimum, 64pt preferred
- **Animations**: Gentle and purposeful
- **Colors**: Warm terracotta + sage green + honey gold
- See [docs/accessibility-guidelines.md](docs/accessibility-guidelines.md) for complete principles

### Why React Native Web Research (Not Implementation)?
- User wanted to understand web feasibility before MVP
- Detailed research completed in [docs/web-app-research/](docs/web-app-research/)
- Implementation deferred to Q3 2026 pending mobile validation

## Development Workflow

### Current Stage
We are in **pre-launch phase** preparing for TestFlight beta testing.

**Immediate next steps** (see [WORKLOG.md](WORKLOG.md) for current status):
1. Bundle ID setup with paid Apple Developer account
2. Dev build to physical device
3. API integration (recording & transcription)
4. UX refinement
5. TestFlight beta launch

### Git Workflow
- **Main branch**: `main` (production-ready code)
- Commit messages use conventional commits format
- All commits co-authored with Claude Code CLI

## Security Considerations

### Environment Variables
- **`.env.local`** - Supabase credentials (NEVER commit to git)
- All API keys and secrets use environment variables
- `.gitignore` configured to exclude sensitive files

### Apple ID Security
- Use **app-specific passwords** for Xcode (not main password)
- Enable Two-Factor Authentication
- Never commit Apple ID credentials
- See [docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md](docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md)

### Supabase Security
- Row Level Security (RLS) enabled on all tables
- Service role key only used server-side (never in mobile app)
- User data completely isolated by `user_id`

## Contributing

### Code Standards
- TypeScript strict mode enabled
- Follow existing code style (see `.prettierrc` if available)
- Large touch targets (56pt minimum)
- WCAG AAA contrast ratios (7:1 minimum)
- Update WORKLOG.md after each session

### Testing
- Write tests for new features
- Ensure accessibility compliance
- Test on physical iOS devices when possible

### Documentation
- Update **WORKLOG.md** after every session (tactical changes)
- Update **ROADMAP.md** when priorities change (strategic changes)
- Add iOS issues to [docs/ios-build-troubleshooting.md](docs/ios-build-troubleshooting.md)

## Contact & Resources

- **Developer**: lihanzhu
- **Project Location**: `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/`
- **GitHub**: [neilzhu2/Memoria.ai](https://github.com/neilzhu2/Memoria.ai)

### Useful Links
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)

---

**For AI Assistants**: Please refer to [AI_ASSISTANT_CONTEXT.md](AI_ASSISTANT_CONTEXT.md) for navigation guidance. Always check [WORKLOG.md](WORKLOG.md) first for current status.
