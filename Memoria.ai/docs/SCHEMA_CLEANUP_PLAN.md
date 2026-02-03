# Schema Cleanup Plan - Memoria.ai

**Created**: November 9, 2025
**Status**: REVISED - Minimal Cleanup Approach
**Last Updated**: November 9, 2025

---

## 🎯 REVISED Goals (Nov 9, 2025)

**Decision**: Keep future feature code and database columns for planned features

**New minimal cleanup approach**:
1. ✅ Delete duplicate folders only (COMPLETED)
2. ✅ Preserve `src/` as `future-features/` (COMPLETED)
3. ⏳ Keep database columns for future use (is_shared, settings JSONB)
4. ⏳ Verify RLS policies are correct
5. ⏳ Remove test/dummy data from Supabase only

**Rationale**:
- Future features are in roadmap (Family Sharing, Cloud Backup)
- Code represents significant development investment (~10,000 LOC)
- Database column overhead is minimal
- Deleting would require months to rebuild

---

## 📊 Current Schema Analysis

### Database Tables (Supabase)

#### ✅ `user_profiles` table
```sql
- id UUID (PK, references auth.users)
- display_name TEXT
- avatar_url TEXT                   ✅ KEEP (for profile image feature)
- settings JSONB                    ⚠️ NEEDS CLEANUP (see below)
- created_at TIMESTAMP
- updated_at TIMESTAMP
```

**Settings JSONB fields**:
- ❌ `autoBackupEnabled` - Backup modal removed, unused
- ❌ `lastBackupDate` - Backup modal removed, unused
- ✅ `theme` - Used by SettingsContext (Light/Dark/Auto)

#### ✅ `memories` table
```sql
- id UUID (PK)
- user_id UUID (FK to auth.users)   ✅ KEEP (user isolation)
- title TEXT
- description TEXT
- transcription TEXT
- audio_url TEXT
- duration INTEGER
- date TIMESTAMP
- theme TEXT                         ✅ KEEP (recording themes)
- is_shared BOOLEAN                  ❌ UNUSED (Family Sharing removed)
- created_at TIMESTAMP
- updated_at TIMESTAMP
```

---

## ✅ Code Cleanup COMPLETED (Nov 9, 2025)

### 1. Deleted Duplicate Folders (14 folders)
**What was deleted**:
- `__tests__ 2/`, `__tests__ 3/` - Old test backups
- `app 2/`, `app 3/` - Old app backups
- `components 2/`, `components 3/` - Old component backups
- `assets 2/`, `assets 3/` - Old asset backups
- `accessibility-tests 2/`, `accessibility-tests 3/` - Test backups
- `services 2/`, `services 3/` - Service backups
- `src 2/`, `src 3/` - Old src backups

**Result**: ~1.2MB of duplicate code removed

### 2. Renamed `src/` → `future-features/` (PRESERVED)
**Reason**: Contains production-ready future features in roadmap

**Contains**:
- `future-features/components/CloudBackup/` - Cloud backup (Phase 6)
- `future-features/components/FamilyInvitation/` - Family invite flow (Phase 5)
- `future-features/components/FamilySetup/` - Family setup wizard (Phase 5)
- `future-features/components/MemorySharing/` - Cultural memory sharing (Phase 7)
- `future-features/stores/familyStore.ts` - Family state management
- `future-features/types/family.ts` - Chinese family types (culturally-aware)
- `future-features/types/cloudBackup.ts` - Backup types
- `future-features/services/` - 21 service modules

**Action**: ✅ Preserved and documented in `future-features/README.md`

---

### 2. Legacy Test Directories

**Directories to review**:
- `__tests__ 2/` - Duplicate test folder?
- `__tests__ 3/` - Duplicate test folder?
- `app 2/` - Duplicate app folder?
- `app 3/` - Duplicate app folder?
- `components 2/` - Duplicate components folder?
- `components 3/` - Duplicate components folder?
- `accessibility-tests 2/` - Duplicate?
- `accessibility-tests 3/` - Duplicate?
- `assets 2/` - Duplicate?
- `assets 3/` - Duplicate?

**Action**: Verify if these are backups, then delete if unused

---

## 🔧 Database Schema - KEEP AS IS (Nov 9, 2025)

### ✅ REVISED Decision: Keep All Columns

**Columns to KEEP** (for future features):
- ✅ `memories.is_shared` - Needed for Family Sharing (Phase 5-7)
- ✅ `user_profiles.settings.autoBackupEnabled` - For Cloud Backup (Phase 6)
- ✅ `user_profiles.settings.lastBackupDate` - For Cloud Backup (Phase 6)
- ✅ `user_profiles.avatar_url` - For Profile Images (Phase 1 - next week!)

**Rationale**:
- All columns are in active roadmap
- Storage overhead is minimal (<1KB per user)
- No migration needed when activating features
- Easier to add features incrementally

**No database schema changes needed at this time**

---

### Phase 2: Clean settings JSONB

#### Update user_profiles default settings

**Current**:
```json
{
  "autoBackupEnabled": false,
  "lastBackupDate": null,
  "theme": "auto"
}
```

**Proposed**:
```json
{
  "theme": "auto"
}
```

**Migration SQL**:
```sql
-- Update existing user profiles to remove backup settings
UPDATE user_profiles
SET settings = jsonb_build_object('theme', COALESCE(settings->>'theme', 'auto'))
WHERE settings ? 'autoBackupEnabled' OR settings ? 'lastBackupDate';

-- Update the default for new users
ALTER TABLE user_profiles
ALTER COLUMN settings SET DEFAULT '{"theme": "auto"}'::jsonb;

-- Update handle_new_user() function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url, settings)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    NULL,
    '{"theme": "auto"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🧹 TypeScript Types - KEEP AS IS (Nov 9, 2025)

### ✅ REVISED Decision: Keep Future Feature Types

**Types to KEEP** (for future features):

**`types/memory.ts`**:
```typescript
export interface MemoryItem {
  // ...
  isShared: boolean;          // ✅ KEEP - For Family Sharing (Phase 5-7)
  familyMembers: string[];    // ✅ KEEP - For Family Sharing (Phase 5-7)
  // ...
}

export interface SmartExportConfig {
  // ...
  familySharing: boolean;     // ✅ KEEP - For Export (Phase 9+)
}
```

**Rationale**:
- These types map to database columns we're keeping
- Needed for future features in roadmap
- TypeScript handles unused properties gracefully (no runtime cost)
- When activating features, types are already defined

**No TypeScript type changes needed at this time**

---

## ✅ REVISED Execution Checklist (Nov 9, 2025)

### Step 1: Backup Current State
- [x] ~~Create Supabase database backup~~ (Manual, if needed)
- [x] Commit current code to git
- [x] Tag current version: `git tag -a v0.1-pre-cleanup -m "Before cleanup"` (if needed)

### Step 2: Code Cleanup
- [x] ✅ **COMPLETED**: Delete duplicate folders (`app 2/`, `components 3/`, etc.) - 14 folders removed
- [x] ✅ **COMPLETED**: Rename `src/` → `future-features/`
- [x] ✅ **COMPLETED**: Create README in `future-features/`
- [x] ✅ **COMPLETED**: Commit changes

### Step 3: TypeScript Types
- [x] ✅ **DECISION**: Keep all types as-is for future features
- [ ] No changes needed

### Step 4: Database Schema
- [x] ✅ **DECISION**: Keep all columns for future features
- [ ] No database changes needed

### Step 5: Remove Test/Dummy Data (NEXT)
- [ ] Log into Supabase Dashboard
- [ ] Review memories table for test data
- [ ] Delete test memories if any
- [ ] Review user_profiles for test accounts
- [ ] Document any data removed

### Step 6: Verify RLS Policies (NEXT)
- [ ] Check RLS policies in Supabase Dashboard
- [ ] Verify user_profiles policies (SELECT, UPDATE, INSERT)
- [ ] Verify memories policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] Test with two different users
- [ ] Document RLS policy verification

### Step 7: Final Verification
- [ ] Run app and test basic flows
- [ ] Test user isolation (User A logout → User B login)
- [ ] Verify no TypeScript errors
- [x] ✅ Update WORKLOG.md with cleanup results
- [x] ✅ Create ROADMAP.md

---

## 📈 Expected Improvements

**Code reduction**:
- Delete ~91 files from `src/` directory
- Delete duplicate test/component folders
- Cleaner TypeScript types

**Database improvements**:
- Smaller schema (remove is_shared column)
- Cleaner settings JSONB
- No unused/confusing fields

**Maintenance benefits**:
- Less code to maintain
- Clearer what features are active
- Easier onboarding for new developers

---

## ⚠️ Risks & Mitigation

**Risk**: Accidentally delete needed code
**Mitigation**:
- Create git tag before cleanup
- Review each folder before deletion
- Keep database backup

**Risk**: Break existing user data
**Mitigation**:
- Test migrations on local database first
- Keep database backup
- Migrations are additive (remove columns only)

**Risk**: TypeScript errors after type changes
**Mitigation**:
- Run `npm run type-check` after each change
- Fix errors incrementally
- Test app after each step

---

## 📝 Post-Cleanup Tasks

After cleanup:
1. Update WORKLOG.md with results
2. Document new clean schema in this file
3. Update Phase 1 checklist in WORKLOG
4. Proceed to profile image feature implementation

---

**Status**: Code cleanup COMPLETED (Nov 9, 2025)
**Next**: Remove test data from Supabase + Verify RLS policies
**Approach**: Minimal cleanup - preserve future feature code and database columns
