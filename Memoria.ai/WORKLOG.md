# Memoria.ai Development Worklog

## November 2, 2025 - Supabase Connection Debugging Session

### Issues Encountered

#### 1. Supabase Operations Timing Out (CRITICAL)
- **Problem**: All Supabase operations (auth.getSession(), SELECT, INSERT) were hanging indefinitely or timing out after 30+ seconds
- **Symptoms**:
  - Recordings showed "saving..." for 5+ minutes
  - Memories not being saved to or loaded from database
  - Auth operations hanging forever
  - Intermittent behavior - sometimes worked, sometimes didn't

#### 2. Splash Screen Logo Not Showing
- **Problem**: Logo not visible in Expo Go
- **Resolution**: Explained this is expected behavior - logo only appears in production builds, not in Expo Go development

#### 3. Auto-start Recording Feature
- **Problem**: Recording should start automatically when user enters recording screen
- **Status**: Completed in previous session (commit c41f460)

### Debugging Steps Taken

#### Step 1: Created Diagnostic Test Screen
- Created `/app/test-supabase.tsx` to isolate and test Supabase connection
- Added "Test Connection" button to welcome screen (`/app/welcome.tsx`)
- Implemented tests for:
  - Raw network fetch to Supabase
  - Auth session retrieval
  - Simple SELECT query
  - INSERT operation

#### Step 2: Initial Diagnosis
- Raw fetch test: ✅ Passed (1080ms, then 214ms)
- Auth session test: ❌ Hung indefinitely
- SELECT test: ❌ Hung indefinitely
- **Key Finding**: Network connectivity was fine, but Supabase client operations were hanging

#### Step 3: First Fix Attempt - expo-secure-store to AsyncStorage
- **Hypothesis**: expo-secure-store's `getItemAsync()` was blocking indefinitely with Supabase
- **Action**: Replaced expo-secure-store with @react-native-async-storage/async-storage
- **Implementation**: Created custom `AsyncStorageAdapter` with logging and platform checks
- **Result**: ✅ Tests passed initially (214ms network, instant auth, 83ms SELECT)
- **Problem**: Connection became unstable again - worked intermittently

#### Step 4: Multiple Cache Clear Attempts
Implemented "force-implement protocol" multiple times:
- Killed all node, expo, and metro processes
- Cleared `.expo` directory
- Cleared `node_modules/.cache` directory
- Restarted Metro with `--reset-cache` flag
- **Result**: Did not resolve instability

#### Step 5: Research and Root Cause Identification
- Searched official Supabase React Native documentation (2025)
- **Key Discovery**: Official docs recommend passing AsyncStorage **directly** to Supabase, not through a custom wrapper
- **Root Cause**: Custom `AsyncStorageAdapter` wrapper was introducing timing issues and race conditions

#### Step 6: Final Fix Implementation
- Removed custom `AsyncStorageAdapter` wrapper from `/lib/supabase.ts`
- Changed from `storage: AsyncStorageAdapter` to `storage: AsyncStorage` (direct pass-through)
- This is the official recommended stable configuration from Supabase docs
- **Status**: Fix implemented, awaiting testing

### Code Changes Made

#### `/lib/supabase.ts`
**Before (unstable custom wrapper)**:
```typescript
const AsyncStorageAdapter = {
  getItem: async (key: string) => {
    console.log('🔑 Storage GET:', key);
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    const value = await AsyncStorage.getItem(key);
    console.log('🔑 Storage GET result:', value ? 'Found' : 'Not found');
    return value;
  },
  // ... more wrapper methods
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorageAdapter,  // Custom wrapper
    // ...
  },
});
```

**After (official stable configuration)**:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,  // Direct pass-through
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

#### `/app/welcome.tsx`
- Added `handleTestConnection` function
- Added "Test Connection" button to UI
- Button navigates to `/test-supabase` diagnostic screen

#### `/app/test-supabase.tsx`
- Created comprehensive diagnostic screen
- Tests: network connectivity, auth session, SELECT query, INSERT operation
- Clear ✅/❌ indicators for each test result
- Shows timing information for each operation

#### `/contexts/AuthContext.tsx`
- Removed unused `import * as SecureStore from 'expo-secure-store'`

### Technical Learnings

1. **Supabase Storage Configuration**: Always use AsyncStorage directly with Supabase - custom wrappers can introduce race conditions
2. **Debugging Strategy**: Isolate problems with diagnostic tests before implementing fixes
3. **Cache Issues**: Metro bundler can serve stale code - need aggressive cache clearing (kill processes + clear directories + restart with --reset-cache)
4. **Official Documentation**: Trust official library docs over custom implementations - they're battle-tested

### Files Modified
- `/lib/supabase.ts` - Replaced custom storage adapter with direct AsyncStorage
- `/app/welcome.tsx` - Added Test Connection button
- `/app/test-supabase.tsx` - Created (new diagnostic screen)
- `/contexts/AuthContext.tsx` - Removed unused SecureStore import

### Current Status
- **Fix Status**: Implemented, not yet confirmed working
- **Next Steps**:
  1. User to reload app and test connection
  2. If still broken, investigate Supabase server-side configuration
  3. Check if Supabase RLS policies are blocking operations
  4. Verify environment variables are correctly set

### Commits Needed
- Document AsyncStorage fix and diagnostic tools
- Remove expo-secure-store from dependencies
- Add comprehensive logging for production debugging
