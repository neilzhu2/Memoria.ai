# Archived Features - Memoria.ai

**Archived**: November 9, 2025
**Reason**: Complexity not aligned with product vision

---

## 🗄️ What's Here

This directory contains features that were explored but deemed **too complex** for Memoria's vision of simplicity and ease-of-use for elderly users.

### Features Archived:

1. **Advanced Chinese Family Hierarchy**
   - Elder/Parent/Child role system (长辈/父母/子女)
   - Cultural respect levels
   - Elder approval workflows
   - Generation-specific sharing

2. **Cultural Context Features**
   - Cultural occasions (Spring Festival, Mid-Autumn)
   - Cultural calendar integration
   - Respect level requirements
   - Traditional family protocols

---

## ❓ Why Archived?

**Product Vision**: Keep Memoria **dead-simple** for elderly users

**Problems with these features**:
- Too many decisions for users to make
- Cultural assumptions may not fit all families
- Added complexity without clear user demand
- Better to start simple and add IF users request

**Philosophy**: "Less is more" - especially for elderly UX

---

## 📊 What Was Kept (Simplified Version)

**Simple Family Sharing** (Phase 5):
- Create family groups ✅
- Invite family members ✅
- Request topics ✅
- Share memories ✅
- **Everyone equal** - no hierarchy, no roles

**Why this works**:
- Familiar mental model (like WhatsApp groups)
- No cultural assumptions
- Minimal decisions
- Easy to understand

---

## 🔮 Could This Come Back?

**Maybe** - but only if:
1. User research shows clear demand
2. Can be added as **optional** feature
3. Default behavior stays simple
4. Doesn't confuse elderly users

**For now**: Keep it archived, focus on MVP

---

## 📝 Reference Files

If you want to review the archived code:

**Components**: `future-features/components/MemorySharing/FamilyMemorySharing.tsx`
- Lines 58-74: Respect levels
- Lines 76-84: Cultural occasions
- Lines 31-56: Sharing scopes (elder-only, generation-specific)

**Types**: `future-features/types/family.ts`
- Lines 7-13: ChineseFamilyRole
- Lines 15-20: FamilyPermissionLevel
- Lines 22-39: ChineseRelationship

**Note**: These files are still in `future-features/` but the specific features within them are considered archived/deprecated.

---

**Archived on**: November 9, 2025  
**Decision by**: Product owner (simplicity-first approach)
