# Supabase Setup Guide for Memoria.ai

This guide walks you through setting up the Supabase backend for Memoria.ai.

## Prerequisites

- Supabase project created (already done ✅)
- Project URL: `https://tnjwogrzvnzxdvlqmqsq.supabase.co`
- Environment variables configured in `.env.local`

## Step 1: Set Up Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/tnjwogrzvnzxdvlqmqsq
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase-setup.sql` into the editor
5. Click **Run** to execute the SQL

This will create:
- `user_profiles` table - User profile data and settings
- `memories` table - All user memories with metadata
- Row-Level Security (RLS) policies - Ensures users can only access their own data
- Indexes for performance
- Full-text search capability
- Auto-updating timestamp triggers

## Step 2: Create Storage Bucket for Audio Files

1. In Supabase Dashboard, navigate to **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Name it: `audio-recordings`
4. Set **Public bucket**: OFF (keep it private)
5. Click **Create bucket**

## Step 3: Set Up Storage RLS Policies

1. Click on the `audio-recordings` bucket
2. Go to **Policies** tab
3. Create the following policies:

### Policy 1: Users can upload own audio
- **Name**: Users can upload own audio
- **Allowed operations**: INSERT
- **Policy definition**:
  ```sql
  bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

### Policy 2: Users can view own audio
- **Name**: Users can view own audio
- **Allowed operations**: SELECT
- **Policy definition**:
  ```sql
  bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

### Policy 3: Users can update own audio
- **Name**: Users can update own audio
- **Allowed operations**: UPDATE
- **Policy definition**:
  ```sql
  bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

### Policy 4: Users can delete own audio
- **Name**: Users can delete own audio
- **Allowed operations**: DELETE
- **Policy definition**:
  ```sql
  bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

## Step 4: Configure Authentication

1. Navigate to **Authentication** > **Providers** in Supabase Dashboard
2. Enable **Email** provider (should already be enabled)
3. Configure email settings:
   - **Enable email confirmations**: ON (recommended for production)
   - **Enable email change confirmations**: ON
   - **Secure email change**: ON

### Email Templates (Optional)

You can customize the email templates in **Authentication** > **Email Templates**:
- Confirmation email
- Magic link
- Change email
- Reset password

## Step 5: Verify Setup

Run this query in SQL Editor to verify everything is set up correctly:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'memories');

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'memories');

-- Check policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('user_profiles', 'memories');
```

Expected output:
- 2 tables: `user_profiles`, `memories`
- RLS enabled (rowsecurity = true) for both tables
- Multiple policies for each table

## Step 6: Test the Setup

### Option 1: Test via Supabase Dashboard

1. Go to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Enter test email and password
4. Go to **Table Editor** > **user_profiles**
5. You should see the new user's profile created automatically

### Option 2: Test via the App

1. Run the app: `npm start`
2. Navigate to Sign Up screen
3. Create a test account
4. Verify you can sign in
5. Check Supabase Dashboard > **Authentication** > **Users** to see the new user

## Troubleshooting

### Issue: "relation does not exist" error
- **Solution**: Make sure you ran the entire `supabase-setup.sql` file in SQL Editor

### Issue: "permission denied" errors
- **Solution**: Check that RLS policies are properly configured. Run the verification query above.

### Issue: Cannot upload audio files
- **Solution**: Verify the `audio-recordings` bucket exists and has proper RLS policies

### Issue: Email confirmation not working
- **Solution**: Check **Authentication** > **Email Templates** settings. For development, you can disable email confirmation temporarily.

## Security Notes

⚠️ **Important Security Information**:

1. **Never commit `.env.local`** - It contains sensitive credentials
2. **Database password** is stored in WORKLOG_OCT23_2025.md - keep it secure
3. **RLS policies** protect user data - don't disable them
4. **Audio files** are stored in user-specific folders (`{user_id}/{filename}`)
5. **Anon key** is safe to expose in client-side code (it's designed for that)
6. **Service role key** should NEVER be used in client-side code

## File Structure

```
Memoria.ai/
├── .env.local                  # Supabase credentials (not committed)
├── supabase-setup.sql          # Database schema SQL
├── SUPABASE_SETUP.md          # This file
├── lib/
│   └── supabase.ts            # Supabase client configuration
├── contexts/
│   └── AuthContext.tsx        # Authentication context
└── app/
    └── (auth)/
        ├── login.tsx          # Login screen
        ├── signup.tsx         # Sign up screen
        └── reset-password.tsx # Password reset screen
```

## Next Steps

After completing setup:

1. ✅ Database schema created
2. ✅ Storage bucket configured
3. ✅ RLS policies in place
4. ⏳ Add cloud sync to RecordingContext
5. ⏳ Test end-to-end auth flow
6. ⏳ Test memory creation and sync

## Support

- Supabase Documentation: https://supabase.com/docs
- Memoria.ai WORKLOG: See `WORKLOG_OCT23_2025.md` for implementation details
