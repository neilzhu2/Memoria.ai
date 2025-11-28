# Technical Learnings - Memoria Development

**Purpose**: Key technical insights and best practices to remember for future development.

---

## 🔑 Core Principles

### 1. Trust Official Documentation
**Lesson**: When integrating third-party services, use their official recommended configuration.

**Why**: Custom wrappers/implementations can introduce race conditions and timing issues.

**Example**: Supabase + AsyncStorage
```typescript
// ❌ WRONG - Custom wrapper causes race conditions
const AsyncStorageAdapter = { getItem: async (key) => { ... } };
export const supabase = createClient(url, key, {
  auth: { storage: AsyncStorageAdapter }
});

// ✅ CORRECT - Direct pass-through (official recommendation)
import AsyncStorage from '@react-native-async-storage/async-storage';
export const supabase = createClient(url, key, {
  auth: { storage: AsyncStorage }
});
```

### 2. Diagnostic-First Debugging
**Lesson**: Create isolated diagnostic tests before implementing fixes.

**Approach**:
1. Create test screen isolated from main app
2. Test individual components (network, auth, database)
3. Include timing information
4. Show clear ✅/❌ results

**Benefits**: Quickly identifies root cause, rules out unrelated issues.

### 3. Test Complete User Flows
**Lesson**: Don't just test happy path - test full cycles.

**Examples**:
- Login → Logout → Login (catches AsyncStorage corruption)
- User A creates data → Logout → User B logs in (catches isolation bugs)
- Update profile → Logout → Login (catches state corruption)

---

## 🐛 Known Issues & Solutions

### Supabase + AsyncStorage Corruption on Logout

**Problem**: After `signOut()`, Supabase leaves corrupted keys in AsyncStorage, causing next auth operation to hang.

**Solution**: Manually clear Supabase keys after signOut
```typescript
const signOut = async () => {
  // 1. Clear local state
  setUser(null);

  // 2. Call Supabase signOut
  await supabase.auth.signOut();

  // 3. CRITICAL: Clear AsyncStorage keys
  const keys = await AsyncStorage.getAllKeys();
  const supabaseKeys = keys.filter(key =>
    key.includes('supabase') ||
    key.includes('@supabase') ||
    key.includes('sb-') ||
    key.startsWith('supabase.auth.token')
  );

  if (supabaseKeys.length > 0) {
    await AsyncStorage.multiRemove(supabaseKeys);
  }
};
```

**Key patterns to filter**: `supabase`, `@supabase`, `sb-*`, `supabase.auth.token`

---

## ⚡ Performance Best Practices

### List Rendering
**Rule**: Use FlatList for lists > 20 items, NOT ScrollView + map()

```typescript
// ❌ BAD - Renders ALL items at once
{memories.map(item => <MemoryCard {...item} />)}

// ✅ GOOD - Only renders visible items
<FlatList
  data={memories}
  renderItem={({ item }) => <MemoryCard {...item} />}
  keyExtractor={item => item.id}
  initialNumToRender={10}
  windowSize={5}
/>
```

### Component Optimization
**Rules**:
1. Wrap pure components with `React.memo()`
2. Move constant arrays/objects outside component
3. Use `useCallback` for functions passed to memoized children
4. Use `useMemo` for expensive calculations

```typescript
// ❌ BAD - Array recreated every render
const MyComponent = () => {
  const options = [{ key: 'a', label: 'A' }, ...];
  return <Picker options={options} />;
};

// ✅ GOOD - Array created once
const OPTIONS = [{ key: 'a', label: 'A' }, ...];
const MyComponent = React.memo(() => {
  return <Picker options={OPTIONS} />;
});
```

### Animation Performance
**Rule**: Always use `useNativeDriver: true` for animations

```typescript
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 500,
  useNativeDriver: true,  // ✅ Runs on native thread
}).start();
```

**When it works**: opacity, transform (translate, rotate, scale)
**When it doesn't**: layout properties (width, height, padding)

### Styles
**Rule**: Define styles with `StyleSheet.create()` outside components

```typescript
// ❌ BAD - New object every render
<View style={{ flex: 1, padding: 16 }} />

// ✅ GOOD - Created once
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 }
});
<View style={styles.container} />
```

---

## 🔧 Metro Bundler Cache Protocol

**When to use**: After changing dependencies, deleting files, or experiencing stale code.

**Force clear protocol**:
```bash
# Kill all processes
killall -9 node 2>/dev/null
pkill -9 -f expo 2>/dev/null
pkill -9 -f metro 2>/dev/null

# Clear cache directories
rm -rf .expo node_modules/.cache

# Restart with clean cache
npm start -- --reset-cache
```

**⚠️ Important**: ALWAYS clear cache after deleting files - Metro caches dependency graph!

---

## 📦 Supabase Client Configuration

**Recommended setup for Expo/React Native**:

```typescript
import 'react-native-url-polyfill/auto';  // Required!
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,           // Direct, no wrapper
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,       // Not needed in mobile
    }
  }
);
```

**Key elements**:
1. URL polyfill (required for React Native)
2. AsyncStorage direct pass-through
3. Auto token refresh enabled
4. Session persistence enabled

---

## 🎨 Product Design Principles

### "Less is More" - Settings Philosophy
**Rule**: Only add settings when there's real user value.

**Questions to ask**:
- Should this just be "always on" by default?
- Do users actually need to configure this?
- Can we make a smart default instead?

**Example**: Removed "Recording Settings" because all settings should be default ON:
- Auto-transcribe → Should always be ON
- Sound effects → Should always be ON
- Language → Should auto-detect

**Result**: Simpler UX, fewer decisions for elderly users.

---

## 🚀 Development Environment Strategy

### Expo Go vs Development Builds

**Current**: Using Expo Go (sandbox with fixed native libraries)

**CRITICAL**: If `expo-dev-client` is installed but no development build exists yet:
```bash
# ❌ WRONG - Will fail with "No development build installed"
npx expo start --tunnel
npx expo start --ios

# ✅ CORRECT - Force Expo Go mode with --go flag
npx expo start --go --tunnel
npx expo start --go
```

**Why**: When `expo-dev-client` package is installed, Expo CLI defaults to looking for a development build. Without the `--go` flag, the app will appear in Expo Go as `memoria-ai://expo-development-client` (untappable) instead of a regular Expo Go project.

**Symptom**: Expo Go shows project in "Development servers" but it's not tappable, or shows "Could not connect to server" error.

**When to migrate to Development Build**:
1. Need native library not included in Expo Go
2. Need custom native modules
3. Ready to push to production
4. Need to customize app metadata

**Migration resources**: https://docs.expo.dev/develop/development-builds/expo-go-to-dev-build/

---

## 📚 Quick Reference Resources

### Supabase
- [React Native Setup](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)
- [AsyncStorage Integration](https://supabase.com/docs)

### Expo/React Native
- [Performance Best Practices](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps)
- [Metro Bundler Caching](https://facebook.github.io/metro/docs/configuration)
- [React Native Directory](https://reactnative.directory) - Library quality check

### Performance
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Expo Atlas](https://docs.expo.dev/guides/analyzing-bundles/) - Bundle size analysis

---

## 🔍 Troubleshooting Checklist

**When Supabase operations hang**:
- [ ] Check storage adapter - is it AsyncStorage directly?
- [ ] Verify `react-native-url-polyfill/auto` is imported
- [ ] Kill processes and clear Metro cache
- [ ] Check environment variables are set
- [ ] Test network with raw fetch
- [ ] Create isolated diagnostic test
- [ ] Check Supabase RLS policies
- [ ] Verify auth token storage/retrieval

**When Metro serves stale code**:
- [ ] Kill all node/expo/metro processes
- [ ] Clear `.expo` and `node_modules/.cache`
- [ ] Restart with `--reset-cache`
- [ ] Force close Expo Go app (not just reload)

**When users report data issues**:
- [ ] Check user_id filtering in queries
- [ ] Verify RLS policies
- [ ] Test logout → login cycle
- [ ] Check AsyncStorage for corruption
- [ ] Review auth state listeners

---

## 🎯 Performance Audit Checklist

**High Priority**:
- [ ] Convert memory list to FlatList (when > 20 items)
- [ ] Wrap list item components with React.memo()
- [ ] Audit TouchableOpacity handlers for inline functions
- [ ] Run `npx expo-atlas` to check bundle size

**Medium Priority**:
- [ ] Convert images to WebP format
- [ ] Implement image preloading
- [ ] Replace Image with expo-image
- [ ] Add getItemLayout to FlatList

**Low Priority**:
- [ ] Implement pagination (load 50 at a time)
- [ ] Profile with React DevTools Profiler
- [ ] Consider react-native-reanimated for animations

---

## 🎨 UI Updates Not Applying - Style Overwriting

### Duplicate Style Keys in StyleSheet
**Problem**: UI changes don't appear despite editing the correct style.

**Root Cause**: In JavaScript objects (including StyleSheet.create()), duplicate keys silently fail - the last definition wins.

**Example** (EditProfileModal bug):
```typescript
const styles = StyleSheet.create({
  saveButton: {                    // Line 732 - YOUR EDIT HERE
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ... 100+ lines later ...
  saveButton: {                    // Line 840 - OVERWRITES YOUR EDIT!
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 16,
  },
});
```

**Symptoms**:
- You edit a style property but the UI doesn't change
- The style looks correct when you read the file
- No errors or warnings

**Debugging Steps**:
1. Search for duplicate keys: `Ctrl+F` the style name in the file
2. Check if there are multiple definitions in StyleSheet.create()
3. Look for spread operators that might override: `{...baseStyle, ...override}`
4. Check inline styles on the component: `style={[styles.foo, { override: true }]}`

**Prevention**:
- Use ESLint rule `no-dupe-keys` (catches this at compile time)
- Keep StyleSheet declarations organized and near the components that use them
- When copying styles, immediately rename the key

---

## 📦 Safe Library Removal Strategy

### When Removing Integrated Dependencies

**Context**: On Nov 6, 2025, we attempted to remove Tamagui, which immediately broke the app and required an emergency revert.

**What Went Wrong**:
```bash
# ❌ DANGEROUS - Breaks app immediately
1. Remove packages from package.json
2. npm install
3. App breaks (components still imported but undefined)
4. Emergency revert needed
```

**Why It Failed**:
- `app/_layout.tsx` still had `TamaguiProvider`, `Theme`, `YStack` components
- All imports became `undefined` after package removal
- No replacement code was ready
- Removed packages BEFORE updating code that depended on them

**Safe Removal Protocol**:
```bash
# ✅ SAFE - Build replacements first, remove packages last
1. Create git branch (easy rollback: git checkout main)
2. BUILD replacement code (while library still installed)
3. UPDATE all files to use new code (library still available as fallback)
4. TEST app works completely with new code
5. VERIFY old library is no longer imported anywhere
6. ONLY THEN: Remove packages from package.json
7. Clear Metro cache: npm start -- --reset-cache
8. Final testing
9. If anything breaks: git checkout main && npm install (instant rollback)
```

**Key Principle**: **Replacements first, removal last**

**Example - Tamagui Removal**:
```typescript
// Step 2-3: Build and integrate replacement FIRST
// contexts/ThemeContext.tsx created
// app/_layout.tsx updated to use ThemeContext
// App tested and working

// Step 6: ONLY NOW remove packages
// Remove from package.json:
// - tamagui
// - @tamagui/core
// - @tamagui/themes
// etc.

// Step 7: Clear cache
npm start -- --reset-cache
```

**Additional Safety Measures**:
- Work on a branch (never directly on main)
- Incremental testing after each file change
- Keep Metro bundler output visible to catch import errors immediately
- Test theme switching, all main screens, and core functionality
- Document what you're replacing and why

**When to Remove vs Keep a Library**:

**Remove when**:
- Minimal usage (< 5% of library's features used)
- Causing significant performance penalty (50%+ build time increase)
- Can be replaced with simple custom code
- Not planning to expand usage in future

**Keep when**:
- Heavily integrated throughout app
- Provides complex functionality hard to replicate
- Planning to use more features soon
- Removal would require rewriting significant code

### Choosing UI Libraries for New Projects

**Use Tamagui When**:
- Building complex apps with 50+ unique UI components
- Need extensive animation capabilities
- Want built-in responsive design for web + mobile
- Team familiar with styled-system/theme-ui patterns
- Rapid prototyping where speed matters more than bundle size

**Use Custom Design System When**:
- Simpler apps with < 30 unique components
- Performance and build speed are critical
- Team prefers standard React Native patterns
- Only need basic theming (light/dark mode)
- Want full control over styling architecture

**Memoria Example**:
- Started with Tamagui (possibly from template)
- Only used 3 components + 1 token
- Causing 50-70% slower builds
- Already have custom design system (DesignTokens.ts + Colors.ts)
- Decision: Remove and use custom system

**Recommendation**: For most mobile apps, start with a simple custom design system. Only add a UI library when you find yourself building many complex reusable components.

---

**Last Updated**: November 27, 2025
