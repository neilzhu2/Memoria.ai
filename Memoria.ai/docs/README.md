# Memoria Documentation

## 📁 Structure

```
Memoria.ai/
├── WORKLOG.md              # Current work and critical open issues
├── LEARNINGS.md            # Technical best practices and solutions
├── ROADMAP.md              # Future features and development phases
└── docs/
    ├── README.md           # This file
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

**Last Updated**: November 9, 2025
