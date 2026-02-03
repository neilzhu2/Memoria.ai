# Claude Code Project Instructions - Memoria.ai

**READ `AI_ASSISTANT_CONTEXT.md` FOR ALL PROJECT CONTEXT AND INSTRUCTIONS.**

That file is the single source of truth for all AI assistants (Claude, Gemini, Codex, etc.).

## Quick Reference (detailed info in AI_ASSISTANT_CONTEXT.md)

### iOS Development - ALWAYS READ FIRST
Before any iOS build, Metro, or device connection work:
→ Read `docs/IOS_BUILD_TROUBLESHOOTING.md` (11+ documented issues)

### Key Commands
```bash
# Start Metro for dev builds
npx expo start --dev-client

# If phone can't connect (network isolation)
npx expo start --dev-client --tunnel

# Fresh rebuild after node_modules issues
rm -rf node_modules package-lock.json && npm install
cd ios && pod install
```

### Project Navigation
- `WORKLOG.md` - Recent work & next steps
- `ROADMAP.md` - Feature priorities
- `docs/IOS_BUILD_TROUBLESHOOTING.md` - iOS/Metro issues
- `AI_ASSISTANT_CONTEXT.md` - Full project context
