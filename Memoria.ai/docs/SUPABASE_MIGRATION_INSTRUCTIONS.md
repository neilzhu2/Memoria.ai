# Supabase Migration Instructions - Family Sharing Tables

**Created**: November 9, 2025
**Migration**: `001_family_sharing_tables.sql`
**Estimated Time**: 5 minutes

---

## 🎯 What This Does

Creates 4 new tables for family sharing (Phase 5):
- ✅ `families` - Family groups
- ✅ `family_members` - Who belongs to which family
- ✅ `topic_requests` - Topics family members request
- ✅ `memory_shares` - Which memories shared with families

**⚠️ Important**: This does NOT change any existing tables. Your app will continue working exactly as before!

---

## 📋 Step-by-Step Instructions

### Step 1: Log into Supabase Dashboard

1. Go to **https://supabase.com**
2. Click **"Sign In"**
3. Find your **Memoria.ai** project
4. Click to open the project

---

### Step 2: Open SQL Editor

1. In the left sidebar, click **"SQL Editor"** (icon looks like `</>`)
2. You'll see the SQL query interface

**Screenshot reference**:
```
Left Sidebar:
├── Home
├── Table Editor
├── SQL Editor  ← CLICK HERE
├── Database
└── ...
```

---

### Step 3: Create New Query

1. Click the **"New query"** button (top left)
2. A blank SQL editor will appear
3. You can name it: `001_family_sharing_tables` (optional)

---

### Step 4: Copy the Migration Script

1. Open the file: `supabase-migrations/001_family_sharing_tables.sql`
2. **Select ALL** content (Cmd+A / Ctrl+A)
3. **Copy** (Cmd+C / Ctrl+C)

**OR** just copy from below:

```sql
[The migration script content will be in the file]
```

---

### Step 5: Paste into SQL Editor

1. Click in the SQL Editor text area
2. **Paste** the entire migration script (Cmd+V / Ctrl+V)
3. You should see ~300+ lines of SQL

---

### Step 6: Run the Migration

1. Click the **"Run"** button (or press `Cmd+Enter` / `Ctrl+Enter`)
2. Wait 2-5 seconds for execution
3. Look at the **bottom panel** for results

**Expected output**:
```
Success. No rows returned
```

**Why "No rows returned"?**
- This is CORRECT! ✅
- We're creating tables, not querying data
- Tables are created but empty

---

### Step 7: Verify Tables Were Created

#### Option A: Check in Table Editor (Recommended)

1. Click **"Table Editor"** in left sidebar
2. You should now see these NEW tables in the list:
   - ✅ `families`
   - ✅ `family_members`
   - ✅ `memory_shares`
   - ✅ `topic_requests`
3. Click on each table to see the columns (they'll be empty - that's correct!)

#### Option B: Check in Database view

1. Click **"Database"** in left sidebar
2. Click **"Tables"**
3. Look for the 4 new tables

---

### Step 8: Verify RLS Policies

1. In **Table Editor**, click on one of the new tables (e.g., `families`)
2. Look for a **shield icon** or **"RLS Enabled"** badge
3. Click on the table → **"Policies"** tab
4. You should see multiple policies listed

**Example for `families` table**:
- ✅ "Users can view their families"
- ✅ "Users can create families"
- ✅ "Users can update their own families"
- ✅ "Users can delete their own families"

---

### Step 9: Save Query (Optional)

If you want to keep the migration for reference:

1. Click **"Save"** button (top right)
2. Give it a name: `001_family_sharing_tables`
3. It will appear in your **"Saved queries"** list

---

## ✅ Verification Checklist

Run through this checklist to confirm everything worked:

- [ ] **4 new tables created**:
  - [ ] `families` (visible in Table Editor)
  - [ ] `family_members` (visible in Table Editor)
  - [ ] `topic_requests` (visible in Table Editor)
  - [ ] `memory_shares` (visible in Table Editor)

- [ ] **All tables show RLS enabled** (shield icon)

- [ ] **Existing tables unchanged**:
  - [ ] `memories` - still has all your data
  - [ ] `user_profiles` - still has all your data
  - [ ] No errors when opening existing tables

- [ ] **App still works**:
  - [ ] Open your Expo app
  - [ ] Login works
  - [ ] Can view existing memories
  - [ ] Can create new memories
  - [ ] No errors in console

---

## 🚨 If Something Goes Wrong

### Error: "relation already exists"

**Meaning**: Tables already created previously

**Solution**:
1. This is OK! Skip this migration
2. OR delete the tables first:
   ```sql
   DROP TABLE IF EXISTS memory_shares CASCADE;
   DROP TABLE IF EXISTS topic_requests CASCADE;
   DROP TABLE IF EXISTS family_members CASCADE;
   DROP TABLE IF EXISTS families CASCADE;
   ```
3. Then run the migration again

---

### Error: "function update_updated_at_column does not exist"

**Meaning**: The function from original schema wasn't created

**Solution**:
1. First, create the function:
   ```sql
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```
2. Then run the migration again

---

### Error: "permission denied"

**Meaning**: Your Supabase user doesn't have admin privileges

**Solution**:
1. Make sure you're logged in as the project owner
2. Check project settings → Database → Connection info
3. Contact Supabase support if needed

---

### App stops working after migration

**This should NOT happen** (migration doesn't touch existing tables)

**If it does**:
1. Check browser console for errors
2. Check Supabase logs (Dashboard → Logs)
3. Rollback by dropping the 4 new tables:
   ```sql
   DROP TABLE IF EXISTS memory_shares CASCADE;
   DROP TABLE IF EXISTS topic_requests CASCADE;
   DROP TABLE IF EXISTS family_members CASCADE;
   DROP TABLE IF EXISTS families CASCADE;
   ```
4. Report the issue so we can debug

---

## 📊 What You Should See After Migration

### In Supabase Table Editor:

**Before Migration**:
```
Tables:
├── memories (existing)
└── user_profiles (existing)
```

**After Migration**:
```
Tables:
├── families (NEW - empty)
├── family_members (NEW - empty)
├── memories (existing - unchanged)
├── memory_shares (NEW - empty)
├── topic_requests (NEW - empty)
└── user_profiles (existing - unchanged)
```

---

## 🎯 Next Steps After Migration

1. ✅ Confirm tables created
2. ✅ Verify app still works
3. ✅ Document completion in WORKLOG.md
4. 🎉 Tables are ready for Phase 5 (Feb-Mar 2026)!

**You don't need to do anything else** - these tables will sit empty until you're ready to implement family sharing features.

---

## 💡 Understanding What Was Created

### Table Relationships:

```
users (auth.users)
  ↓
families (created_by)
  ↓
family_members (family_id, user_id)
  ↓
topic_requests (family_id, requested_by, requested_for)
  ↓
memories (existing table)
  ↓
memory_shares (memory_id, family_id)
```

### Example Flow (Future Phase 5):

1. **User A creates family** → Insert into `families`
2. **User B joins family** → Insert into `family_members`
3. **User B requests topic** → Insert into `topic_requests`
4. **User A records memory** → Insert into `memories` (existing flow)
5. **User A shares memory** → Insert into `memory_shares`
6. **User B sees memory** → Query via `user_family_memories` view

---

## 📞 Need Help?

**If stuck**:
1. Take a screenshot of the error
2. Note which step you're on
3. Check the error messages in bottom panel
4. Document in WORKLOG.md

**Common issues**:
- ✅ "No rows returned" = SUCCESS (not an error!)
- ❌ Red error text = actual error (read the message)
- ⚠️ Yellow warning = usually OK to ignore

---

**Ready to run the migration!** 🚀

Just follow steps 1-9 above, one at a time. Take your time - it's very straightforward.
