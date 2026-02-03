# Database Migration Instructions

## Problem
The home page is showing an error because the database schema is missing required tables and columns for the topics system.

**Error**: `Could not find a relationship between 'memories' and 'topic_id' in the schema cache`

## Solution
You need to apply the database migrations that were created but not yet executed on your Supabase database.

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

Go to your Supabase SQL Editor:
```
https://tnjwogrzvnzxdvlqmqsq.supabase.co/project/_/sql
```

### 2. Copy the Migration SQL

Open the file `APPLY_MIGRATIONS.sql` in this directory and copy the ENTIRE contents.

You can do this by running:
```bash
cat APPLY_MIGRATIONS.sql | pbcopy
```

Or manually open the file and copy all the SQL.

### 3. Paste and Run

1. Paste the SQL into the Supabase SQL Editor
2. Click the green "Run" button (or press Cmd+Enter)
3. Wait for all migrations to complete (should take 5-10 seconds)
4. Check for any error messages in the output

### 4. Verify Success

You should see output indicating:
- ✅ 3 new tables created: `topic_categories`, `recording_topics`, `user_topic_history`
- ✅ 10 categories inserted
- ✅ 50 topics inserted
- ✅ `topic_id` column added to `memories` table
- ✅ Indexes and RLS policies created
- ✅ Helper function created

### 5. Restart Your App

After the migrations complete successfully:

1. Stop your Expo dev server (Ctrl+C in the terminal)
2. Clear the cache and restart:
   ```bash
   npm start -- --clear
   ```
3. Reload your app (shake device or press 'r' in terminal)

### 6. Test the Home Page

The home page should now:
- ✅ Show category filter tabs at the top (Childhood, Family, Career, etc.)
- ✅ Display a modern toggle switch for "Show only unrecorded topics"
- ✅ Load topics without errors
- ✅ Show category badges on topic cards

## What These Migrations Do

### Migration 1: Create Topics System
- Creates `topic_categories` table with 10 categories
- Creates `recording_topics` table with 50 curated prompts
- Creates `user_topic_history` table to track which topics users have seen
- Sets up Row Level Security (RLS) policies
- Inserts seed data (categories and topics)
- Creates helper function for smart topic rotation

### Migration 2: Add topic_id to memories
- Adds `topic_id` column to `memories` table
- Creates foreign key relationship to `recording_topics`
- Adds index for better query performance
- Backfills existing memories with topic_id if available

## Troubleshooting

### If you see errors during migration:

1. **"relation already exists"** - This is OK! It means part of the migration was already applied
2. **"permission denied"** - Make sure you're logged into Supabase Dashboard with admin access
3. **"syntax error"** - Make sure you copied the ENTIRE SQL file without truncating

### If the app still shows errors after migration:

1. Check that all tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('topic_categories', 'recording_topics', 'user_topic_history');
   ```

2. Check that topic_id column exists in memories table:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'memories' AND column_name = 'topic_id';
   ```

3. Verify RLS policies are enabled:
   ```sql
   SELECT tablename, policyname FROM pg_policies
   WHERE tablename IN ('topic_categories', 'recording_topics', 'user_topic_history');
   ```

## Need Help?

If you encounter any issues:
1. Check the Supabase SQL Editor output for specific error messages
2. Verify your Supabase project URL matches: `tnjwogrzvnzxdvlqmqsq.supabase.co`
3. Ensure you have admin/owner access to the Supabase project
4. Try running each migration separately if needed (files in `supabase/migrations/`)

---

**Created**: December 4, 2025
**Related Files**:
- `APPLY_MIGRATIONS.sql` - Combined migration SQL
- `supabase/migrations/create_topics_system.sql` - Original migration 1
- `supabase/migrations/add_topic_to_memories.sql` - Original migration 2
