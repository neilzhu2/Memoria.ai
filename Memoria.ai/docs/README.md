# Memoria Documentation

## 📁 Structure

```
Memoria.ai/
├── WORKLOG.md              # Current work and critical open issues
├── LEARNINGS.md            # Technical best practices and solutions
├── ROADMAP.md              # Future features and development phases
└── docs/
    ├── README.md           # This file
    ├── WEB_APP_INDEX.md    # Web app strategy navigation (START HERE)
    ├── WEB_APP_DECISION_SUMMARY.md         # 6-page executive summary
    ├── WEB_APP_STRATEGIC_ANALYSIS.md       # 60-page comprehensive analysis
    ├── WEB_APP_ROADMAP_VISUAL.md           # 15-page timeline roadmap
    ├── WEB_APP_IMPLEMENTATION_CHECKLIST.md # 25-page step-by-step guide
    └── archive/
        └── 2025-10-OCT.md  # October session logs (features, UI plan)
```

---

## 📖 How to Use

### WORKLOG.md
**Purpose**: Track current critical issues and recent work

**What it contains**:
- 🔴 Critical open issues (MUST FIX)
- ✅ Recent fixes (last 2 weeks)
- 📊 Current project status
- 🎯 Next steps

**Update frequency**: After each session

**Keep it**: < 200 lines, < 5000 tokens

---

### LEARNINGS.md
**Purpose**: Technical insights and best practices

**What it contains**:
- Core development principles
- Known issues and solutions
- Performance best practices
- Quick reference checklists

**Update frequency**: When discovering new patterns/solutions

**Keep it**: < 400 lines, actionable principles only

---

### docs/archive/
**Purpose**: Detailed historical session logs

**What goes here**:
- Detailed debugging sessions
- Implementation details with code samples
- Complete feature development logs
- Month-by-month archives

**Naming convention**: `YYYY-MM-MMM.md` (e.g., `2025-10-OCT.md`)

---

## 🧹 Maintenance Guidelines

### When WORKLOG.md exceeds 200 lines:
1. Archive old session details to `docs/archive/YYYY-MM-MMM.md`
2. Keep only critical open issues and recent work
3. Update "Next Steps" section

### When LEARNINGS.md exceeds 400 lines:
1. Remove duplicate/redundant sections
2. Consolidate similar patterns
3. Keep only actionable principles
4. Move detailed examples to archive

### Monthly Archive Process:
1. Create new archive file: `docs/archive/YYYY-MM-MMM.md`
2. Move completed work from WORKLOG.md
3. Update WORKLOG.md with condensed summary
4. Keep archive files for reference (don't delete)

---

## 🌐 Web App Strategy Documentation (New: Nov 28, 2025)

### Quick Start
**Want to know about adding a web app?** → Read [`WEB_APP_INDEX.md`](WEB_APP_INDEX.md)

**Key Documents**:
1. **WEB_APP_INDEX.md** - Navigation hub, start here
2. **WEB_APP_DECISION_SUMMARY.md** - 5-min executive summary (6 pages)
3. **WEB_APP_STRATEGIC_ANALYSIS.md** - Full analysis (60 pages)
4. **WEB_APP_ROADMAP_VISUAL.md** - Timeline roadmap (15 pages)
5. **WEB_APP_IMPLEMENTATION_CHECKLIST.md** - Step-by-step guide (25 pages)

**TL;DR**: Build web app, but NOT NOW. Defer to Month 7-10 post-launch (Q3 2026).

**Decision Triggers** (build web when 2 of 3 met):
- 30%+ of mobile users request web access
- 100+ MAU with 40%+ retention on mobile
- $100K+ funding OR second developer hired

**Next Review**: Q2 2026 (April-June)

---

## 🎯 Documentation Philosophy

**WORKLOG**: "What's happening now?"
- Focus on current critical issues
- Recent fixes (last 2 weeks max)
- Clear next steps

**LEARNINGS**: "What do I need to remember?"
- Core principles, not history
- Actionable patterns, not stories
- Quick reference, not tutorials

**ARCHIVE**: "What happened before?"
- Detailed session logs
- Complete implementation details
- Historical reference

---

---

## 📚 Additional Resources

### Strategic Planning
- **Web App Strategy**: See `WEB_APP_INDEX.md` for comprehensive web expansion analysis
- **Product Roadmap**: See `/ROADMAP.md` for 8-phase mobile development plan
- **Competitive Analysis**: See `WEB_APP_STRATEGIC_ANALYSIS.md` Appendix A (Duolingo case study)

### Technical Reference
- **Design System**: `/constants/DesignTokens.ts` and `/constants/Colors.ts`
- **Architecture**: React Native (Expo), TypeScript, Supabase backend
- **Platform Files**: Use `.native.tsx` (mobile) and `.web.tsx` (web) conventions

---

**Last Updated**: November 28, 2025
