# Web App Implementation Checklist

**Purpose**: Step-by-step checklist for building Memoria web app using React Native Web
**Status**: Future reference (defer to Month 7-10 post-launch)
**Last Updated**: November 28, 2025

---

## Pre-Development Validation (Before Starting)

### User Demand Validation
- [ ] 30%+ of mobile users requested web access (analytics event tracked)
- [ ] Top 5 support ticket category is "How do I access on computer?"
- [ ] User interviews: 50%+ mention desktop workflows
- [ ] Survey results: 40%+ would use web version weekly

### Mobile Success Metrics
- [ ] 100+ monthly active users (MAU)
- [ ] 40%+ weekly retention rate
- [ ] Net Promoter Score (NPS) > 50
- [ ] Mobile app stable (< 5 critical bugs reported in last month)

### Resource Readiness
- [ ] $30K-40K budget allocated for web MVP
- [ ] OR: Second developer hired (frontend specialist)
- [ ] OR: Solo developer has 50% time available (10-15 hours/week for 16 weeks)
- [ ] Design system documented (DesignTokens.ts, Colors.ts already exist)

### Technical Prerequisites
- [ ] Expo SDK 50+ (already on 54.0.23)
- [ ] React Native Web installed (already in package.json)
- [ ] Supabase backend stable (RLS policies working, no major schema changes planned)
- [ ] Mobile app feature-complete (transcription, dev build, all core features shipped)

**GATE**: Do NOT proceed until ALL items checked above

---

## Phase 1: Environment Setup (Week 1-2)

### Week 1: Expo Web Configuration

#### Day 1-2: Test Current Web Build
- [ ] Run `npx expo start --web` to verify web support works
- [ ] Document what breaks (expected: audio recording, image picker, haptics)
- [ ] Test Expo Router on web (navigation should work)
- [ ] Verify Supabase client works in browser (auth, database queries)

**Command**:
```bash
npx expo start --web
# Open http://localhost:19006 in Chrome
```

#### Day 3-4: Platform File Structure Setup
- [ ] Create platform-specific file naming convention
  - `.native.tsx` for mobile (iOS + Android)
  - `.web.tsx` for web browsers
  - `.tsx` for shared code (works on all platforms)

**Example**:
```
components/
├── AudioRecorder.tsx           # Shared interface (TypeScript types)
├── AudioRecorder.native.tsx    # Mobile implementation (expo-av)
├── AudioRecorder.web.tsx       # Web implementation (MediaRecorder API)
```

- [ ] Update `metro.config.js` to handle platform extensions

**Add to metro.config.js**:
```javascript
module.exports = {
  resolver: {
    sourceExts: ['tsx', 'ts', 'jsx', 'js', 'json'],
    platforms: ['ios', 'android', 'web', 'native']
  }
};
```

#### Day 5: TypeScript Configuration
- [ ] Create `tsconfig.web.json` for web-specific types
- [ ] Install web types: `npm install --save-dev @types/dom-mediacapture-record`
- [ ] Add `compilerOptions.types: ["dom"]` for browser APIs

**tsconfig.web.json**:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "types": ["dom", "dom-mediacapture-record"]
  }
}
```

---

### Week 2: Deployment Pipeline

#### Day 6-7: Vercel/Netlify Setup
- [ ] Create account on Vercel or Netlify
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Configure static export: Verify `app.json` has `"web": {"output": "static"}`
- [ ] Test local build: `npx expo export:web`
- [ ] Deploy to preview: `vercel --prod` or `netlify deploy`

**Commands**:
```bash
# Local web build
npx expo export:web

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

#### Day 8-9: Custom Domain & SSL
- [ ] Register domain: `app.memoria.ai` or `memoria.app`
- [ ] Configure DNS (Vercel/Netlify provides instructions)
- [ ] Enable SSL (automatic with Vercel/Netlify)
- [ ] Set up redirects: `memoria.ai/web` → `app.memoria.ai`

**Example Vercel vercel.json**:
```json
{
  "redirects": [
    { "source": "/web", "destination": "https://app.memoria.ai", "permanent": true }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

#### Day 10: CI/CD Pipeline
- [ ] Create GitHub Actions workflow for web deployment
- [ ] Auto-deploy on push to `main` branch
- [ ] Run tests before deployment
- [ ] Set up preview deployments for pull requests

**Example .github/workflows/deploy-web.yml**:
```yaml
name: Deploy Web App

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npx expo export:web
      - uses: vercel/action@v3
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Phase 2: Core Viewing Experience (Week 3-4)

### Week 3: Memory List & Detail Views

#### Day 11-12: Responsive Memory List
- [ ] Test existing memory list on web (app/(tabs)/index.tsx)
- [ ] Add responsive breakpoints:
  - Mobile web (< 768px): Single column, cards
  - Tablet (768-1024px): Two columns
  - Desktop (> 1024px): Three columns or list view

**Add to constants/DesignTokens.ts**:
```typescript
export const Breakpoints = {
  mobile: 320,
  mobileLarge: 480,
  tablet: 768,
  desktop: 1024,
  desktopLarge: 1440,
};

export const useResponsive = () => {
  const [width, setWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  return {
    isMobile: width < Breakpoints.tablet,
    isTablet: width >= Breakpoints.tablet && width < Breakpoints.desktop,
    isDesktop: width >= Breakpoints.desktop,
  };
};
```

- [ ] Create responsive grid component using `useResponsive` hook
- [ ] Test on Chrome DevTools (mobile, tablet, desktop sizes)

#### Day 13-14: Memory Detail View
- [ ] Test existing detail view on web
- [ ] Implement audio playback using HTML5 `<audio>` element
- [ ] Add keyboard shortcuts:
  - Space: Play/pause
  - Left/Right arrows: Skip 10s backward/forward
  - Escape: Close modal

**Create components/AudioPlayer.web.tsx**:
```typescript
export const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        audioRef.current?.paused ? audioRef.current.play() : audioRef.current.pause();
      } else if (e.code === 'ArrowLeft') {
        audioRef.current!.currentTime -= 10;
      } else if (e.code === 'ArrowRight') {
        audioRef.current!.currentTime += 10;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <audio ref={audioRef} controls src={audioUrl}>
      Your browser does not support audio playback.
    </audio>
  );
};
```

- [ ] Verify audio playback works (Chrome, Safari, Firefox)
- [ ] Add loading state while audio loads
- [ ] Handle errors (network failure, unsupported format)

---

### Week 4: Search & Filtering

#### Day 15-16: Search UI (Web-Optimized)
- [ ] Test existing search component on web
- [ ] Add keyboard shortcut: Cmd+F (Mac) or Ctrl+F (Windows) to focus search
- [ ] Implement autofocus on desktop (skip on mobile web)
- [ ] Add search suggestions dropdown (show recent searches)

**Update search component**:
```typescript
const SearchInput = () => {
  const { isDesktop } = useResponsive();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    if (isDesktop) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isDesktop]);

  return (
    <input
      ref={searchInputRef}
      autoFocus={isDesktop} // Only autofocus on desktop
      placeholder="Search memories... (Cmd+F)"
    />
  );
};
```

#### Day 17-18: Filtering UI
- [ ] Test existing filter component on web
- [ ] Desktop: Persistent sidebar with filters (always visible)
- [ ] Mobile web: Bottom sheet or modal for filters (space-constrained)
- [ ] Add filter chips (selected filters visible, clickable to remove)

---

## Phase 3: Authentication & Navigation (Week 5-6)

### Week 5: Web-Optimized Login/Signup

#### Day 19-20: Login Form
- [ ] Test existing login form on web
- [ ] Enable Tab key navigation (input → input → button)
- [ ] Add Enter key submit (form onSubmit instead of button onClick)
- [ ] Email autofill support (autocomplete="email")
- [ ] Password manager integration (autocomplete="current-password")
- [ ] Show password toggle (eye icon)

**Update app/(auth)/login.tsx**:
```typescript
<form onSubmit={handleLogin}> {/* Add form wrapper */}
  <input
    type="email"
    name="email"
    autocomplete="email"
    placeholder="Email"
  />
  <input
    type="password"
    name="password"
    autocomplete="current-password"
    placeholder="Password"
  />
  <button type="submit">Log In</button>
</form>
```

- [ ] Test with password managers (1Password, LastPass, Chrome autofill)
- [ ] Ensure Tab order is logical (top to bottom)

#### Day 21-22: Session Persistence
- [ ] Verify Supabase session works on web (should already work)
- [ ] Test "Remember me" checkbox (extend session duration)
- [ ] Implement "Log out of all devices" feature
- [ ] Add session expiration warning (15 min before timeout)

**Add to contexts/AuthContext.tsx**:
```typescript
useEffect(() => {
  if (Platform.OS === 'web') {
    // Warn before session expires (15 min warning)
    const checkSession = setInterval(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          const expiresAt = new Date(data.session.expires_at!);
          const now = new Date();
          const minutesLeft = (expiresAt.getTime() - now.getTime()) / 1000 / 60;

          if (minutesLeft < 15) {
            alert('Your session will expire in 15 minutes. Please save your work.');
          }
        }
      });
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(checkSession);
  }
}, []);
```

---

### Week 6: Responsive Navigation

#### Day 23-24: Desktop Sidebar
- [ ] Create persistent sidebar for desktop (always visible)
- [ ] Navigation items: Home, Explore, My Life, Profile
- [ ] Highlight active route (use Expo Router's `usePathname()`)
- [ ] Collapsible sidebar (toggle button to expand/collapse)

**Create components/Navigation.web.tsx**:
```typescript
export const DesktopSidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside style={{ width: collapsed ? 80 : 240 }}>
      <button onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? '→' : '←'}
      </button>
      <nav>
        <Link href="/(tabs)" style={{ fontWeight: pathname === '/(tabs)' ? 'bold' : 'normal' }}>
          {collapsed ? '🏠' : 'Home'}
        </Link>
        <Link href="/(tabs)/explore">
          {collapsed ? '🔍' : 'Explore'}
        </Link>
        <Link href="/(tabs)/mylife">
          {collapsed ? '📚' : 'My Life'}
        </Link>
        <Link href="/(tabs)/profile">
          {collapsed ? '👤' : 'Profile'}
        </Link>
      </nav>
    </aside>
  );
};
```

#### Day 25-26: Mobile Web Bottom Tabs
- [ ] Reuse existing tab bar component (should already work)
- [ ] Ensure touch targets are 56pt on mobile web (same as native)
- [ ] Test on iOS Safari (viewport issues common)
- [ ] Add safe area insets for mobile web (iPhone notch)

---

## Phase 4: Polish & Testing (Week 7-8)

### Week 7: Responsive Design Refinement

#### Day 27-28: Breakpoint Testing
- [ ] Test on physical devices:
  - iPhone SE (375px width) - smallest mobile
  - iPad Mini (768px width) - tablet breakpoint
  - MacBook Air (1440px width) - desktop
- [ ] Test on Chrome DevTools responsive mode (all sizes 320px-2560px)
- [ ] Verify no horizontal scrolling on any screen size
- [ ] Check touch targets on mobile web (56pt minimum, use browser inspector)

**Create responsive.test.ts**:
```typescript
describe('Responsive Design', () => {
  const sizes = [
    { width: 320, name: 'iPhone SE' },
    { width: 768, name: 'iPad Mini' },
    { width: 1024, name: 'Desktop' },
    { width: 1440, name: 'Large Desktop' },
  ];

  sizes.forEach(({ width, name }) => {
    it(`renders correctly on ${name}`, () => {
      window.innerWidth = width;
      render(<App />);
      // Add assertions
    });
  });
});
```

#### Day 29-30: Accessibility Audit
- [ ] Run Lighthouse accessibility audit (target: 100 score)
- [ ] Test keyboard navigation (Tab through all interactive elements)
- [ ] Test screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Verify ARIA labels on all buttons/inputs
- [ ] Check color contrast (WCAG AAA: 7:1 ratio - already achieved in DesignTokens.ts)

**Run Lighthouse**:
```bash
npx expo export:web
cd dist
npx http-server -p 3000
# Open Chrome DevTools → Lighthouse → Run audit
```

**Accessibility checklist**:
- [ ] All images have alt text
- [ ] Form inputs have associated labels
- [ ] Buttons have descriptive text (not "Click here")
- [ ] Focus indicators visible (keyboard navigation)
- [ ] No reliance on color alone (use icons + text)

---

### Week 8: Performance Optimization

#### Day 31-32: Bundle Size Optimization
- [ ] Run bundle analyzer: `npx expo export:web --analyze`
- [ ] Identify largest dependencies (react-native-web, expo-av, etc.)
- [ ] Implement code splitting (route-based lazy loading)

**Add to app/_layout.tsx**:
```typescript
import { lazy, Suspense } from 'react';

const TabLayout = lazy(() => import('./(tabs)/_layout'));
const AuthLayout = lazy(() => import('./(auth)/_layout'));

export default function RootLayout() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {/* Render lazily-loaded components */}
    </Suspense>
  );
}
```

- [ ] Target: Initial bundle < 1MB (compressed)
- [ ] Defer non-critical assets (fonts, images loaded on-demand)

#### Day 33-34: Image Optimization
- [ ] Convert all PNGs to WebP (modern browsers support)
- [ ] Add lazy loading: `<img loading="lazy" />`
- [ ] Implement responsive images (srcset for different screen sizes)

**Example**:
```typescript
<img
  src="/images/memory.webp"
  srcSet="/images/memory-small.webp 480w, /images/memory-large.webp 1024w"
  sizes="(max-width: 768px) 480px, 1024px"
  loading="lazy"
  alt="Memory photo"
/>
```

#### Day 35-36: Lighthouse Performance Audit
- [ ] Run Lighthouse performance audit (target: 90+ score)
- [ ] Optimize Largest Contentful Paint (LCP < 2.5s)
- [ ] Optimize First Input Delay (FID < 100ms)
- [ ] Optimize Cumulative Layout Shift (CLS < 0.1)

**Performance budget**:
- [ ] LCP: < 2.5 seconds
- [ ] FID: < 100 milliseconds
- [ ] CLS: < 0.1
- [ ] Total bundle size: < 1MB (gzipped)
- [ ] Time to Interactive (TTI): < 5 seconds

---

## Phase 5: Beta Testing & Launch (Week 9-10)

### Week 9: Beta Testing

#### Day 37-38: Recruit Beta Testers
- [ ] Recruit 20 beta testers:
  - 10 elderly users (65+) - existing mobile users
  - 10 family members (40-60) - new to Memoria
- [ ] Create beta testing group (private Slack/Discord)
- [ ] Send beta invite emails with instructions
- [ ] Provide feedback form (Google Forms or Typeform)

**Beta tester feedback form**:
- [ ] Overall satisfaction (1-10 scale)
- [ ] Ease of use (1-10 scale)
- [ ] Features you used most
- [ ] Features you missed (vs. mobile)
- [ ] Bugs encountered (description, steps to reproduce)
- [ ] Would you use web regularly? (Yes/No/Maybe)

#### Day 39-40: Bug Fixing Sprint
- [ ] Triage all bugs reported by beta testers
- [ ] Classify severity: Critical (blocks usage), High (annoying), Low (polish)
- [ ] Fix all Critical and High bugs before launch
- [ ] Document Low bugs for post-launch iteration

**Bug tracking template**:
```
Bug #1: Audio playback fails on Safari
Severity: CRITICAL
Steps to Reproduce:
1. Open memory with audio on Safari 17
2. Click play button
3. Nothing happens

Expected: Audio plays
Actual: Silent, no error message

Fix: Use MediaSource API fallback for Safari
```

---

### Week 10: Public Launch

#### Day 41-42: Pre-Launch Checklist
- [ ] All Critical and High bugs fixed
- [ ] Lighthouse scores: Performance 90+, Accessibility 100
- [ ] Cross-browser testing complete (Chrome, Safari, Firefox, Edge)
- [ ] Mobile web testing complete (iOS Safari, Chrome Android)
- [ ] SSL certificate valid (HTTPS enforced)
- [ ] Privacy policy updated (mention web app data collection)
- [ ] Terms of service updated (web app usage terms)

#### Day 43-44: Deployment & Monitoring
- [ ] Deploy to production (app.memoria.ai)
- [ ] Set up error monitoring (Sentry for web)
- [ ] Set up analytics (Google Analytics or Plausible)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Create status page (status.memoria.ai)

**Add Sentry to web**:
```typescript
import * as Sentry from '@sentry/react';

if (Platform.OS === 'web') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_WEB,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}
```

#### Day 45-46: Launch Announcement
- [ ] Announce to existing mobile users (in-app banner)
- [ ] Send email to all users: "Memoria is now on the web!"
- [ ] Post on social media (if applicable)
- [ ] Update App Store/Google Play screenshots (mention web access)
- [ ] Update website (memoria.ai): Add "Try on Web" CTA

**In-app announcement banner**:
```typescript
<View style={styles.banner}>
  <Text>🎉 New: Access Memoria on your computer!</Text>
  <Link href="https://app.memoria.ai">Try Web App</Link>
</View>
```

#### Day 47-48: Post-Launch Monitoring
- [ ] Monitor error rates (Sentry dashboard)
- [ ] Monitor usage metrics (analytics dashboard)
- [ ] Track conversion: Mobile users → Web users (target: 20%+ in 30 days)
- [ ] Collect user feedback (in-app feedback modal)
- [ ] Triage any new bugs reported

**Success metrics (first 30 days)**:
- [ ] 20%+ of mobile users access web at least once
- [ ] 10%+ weekly web usage (Web DAU / Total DAU)
- [ ] Lighthouse Performance score > 90
- [ ] Zero critical bugs reported
- [ ] Average session duration on web > 5 minutes

---

## Phase 6: Full Feature Development (Month 3-6) - Future

### Audio Recording on Web (Month 3)
- [ ] Implement `AudioRecorder.web.tsx` using MediaRecorder API
- [ ] Request microphone permission (browser prompt)
- [ ] Handle permission denied gracefully
- [ ] Convert WebM audio to MP3 (browser compatibility)
- [ ] Upload to Supabase Storage (same as mobile)

**Create components/AudioRecorder.web.tsx**:
```typescript
export const AudioRecorder = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);

      const mediaRecorder = new MediaRecorder(mediaStream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        // Convert to MP3 or upload WebM directly
        await uploadToSupabase(blob);
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please enable in browser settings.');
      }
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    recorder?.stop();
    stream?.getTracks().forEach(track => track.stop());
  };

  return (
    <View>
      <Button onPress={startRecording} title="Start Recording" />
      <Button onPress={stopRecording} title="Stop Recording" />
    </View>
  );
};
```

### Photo Upload on Web (Month 3)
- [ ] Implement drag-and-drop photo upload
- [ ] Multi-file selection (Shift+Click to select multiple)
- [ ] Client-side image compression (before upload)
- [ ] Progress indicators for bulk uploads

**Create components/FileUpload.web.tsx**:
```typescript
export const FileUpload = ({ onUpload }: { onUpload: (files: File[]) => void }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    onUpload(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{ border: isDragging ? '2px dashed blue' : '2px dashed gray' }}
    >
      <p>Drag photos here or click to select</p>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => onUpload(Array.from(e.target.files || []))}
      />
    </div>
  );
};
```

### Desktop-Optimized Features (Month 4-6)
- [ ] Bulk operations (multi-select with Shift+Click)
- [ ] Keyboard shortcuts (Cmd+K command palette)
- [ ] Advanced search (filters, date ranges)
- [ ] Memory timeline visualization (calendar view)

---

## Post-Launch Maintenance (Ongoing)

### Monthly Tasks
- [ ] Review error logs (Sentry)
- [ ] Analyze usage metrics (analytics dashboard)
- [ ] Update dependencies (npm audit, npm outdated)
- [ ] Security patches (npm audit fix)

### Quarterly Tasks
- [ ] Performance audit (Lighthouse)
- [ ] Accessibility audit (WCAG compliance)
- [ ] Cross-browser testing (new browser versions)
- [ ] User satisfaction survey (NPS)

### Annual Tasks
- [ ] Major version updates (Expo SDK, React)
- [ ] Design refresh (align with mobile updates)
- [ ] Feature parity check (mobile vs. web)
- [ ] Infrastructure review (hosting, CDN, costs)

---

## Troubleshooting Common Issues

### Issue 1: `expo-av` doesn't work on web
**Symptom**: Audio recording fails with "expo-av not supported on web"
**Fix**: Create `AudioRecorder.web.tsx` using MediaRecorder API (see Phase 6)

### Issue 2: `expo-haptics` errors on web
**Symptom**: Console error: "expo-haptics is not supported on web"
**Fix**: Create no-op web implementation
```typescript
// components/Haptics.web.tsx
export const Haptics = {
  impactAsync: () => Promise.resolve(),
  notificationAsync: () => Promise.resolve(),
};
```

### Issue 3: Images not loading on web
**Symptom**: Images show broken icon
**Fix**: Use `expo-image` instead of `react-native` Image, or platform files
```typescript
import { Image } from 'expo-image'; // Works on web
// OR
import { Image } from './Image.web'; // Custom web implementation
```

### Issue 4: Slow initial load time
**Symptom**: Lighthouse Performance score < 50
**Fix**: Code splitting + lazy loading
```typescript
const TabLayout = lazy(() => import('./(tabs)/_layout'));
```

### Issue 5: Audio playback fails on Safari
**Symptom**: Audio doesn't play on iOS Safari
**Fix**: Use `<audio>` element instead of expo-av, add user interaction trigger
```typescript
const audioRef = useRef<HTMLAudioElement>(null);

// Safari requires user interaction before playing
const handlePlayClick = () => {
  audioRef.current?.play();
};
```

---

## Success Metrics Tracking

### Week 1 Post-Launch
- [ ] Web users: Target 20% of mobile users try web
- [ ] Critical bugs: Target 0 critical bugs
- [ ] Performance: Lighthouse score > 90

### Month 1 Post-Launch
- [ ] Web DAU/MAU: Target 10%+ daily active on web
- [ ] Session duration: Target 5+ minutes average
- [ ] Retention: Target 30%+ weekly retention (web users)

### Month 3 Post-Launch
- [ ] Feature parity: All mobile features available on web
- [ ] Creation rate: 50%+ of web users create at least 1 memory
- [ ] NPS: Net Promoter Score > 50 (web users)

### Month 6 Post-Launch
- [ ] Cross-platform: 30%+ of users use both mobile and web weekly
- [ ] Family features: 10%+ of users invite family members via web
- [ ] Revenue: Web premium tier converts 5%+ of web users

---

## Final Pre-Launch Sign-Off

**Before launching web app to production, verify ALL items below:**

### Technical Readiness
- [ ] All features from mobile work on web (or documented exceptions)
- [ ] Cross-browser tested (Chrome, Safari, Firefox, Edge)
- [ ] Mobile web tested (iOS Safari, Chrome Android)
- [ ] Performance: Lighthouse score > 90
- [ ] Accessibility: Lighthouse score 100
- [ ] Security: HTTPS enforced, headers configured
- [ ] Error monitoring: Sentry integrated and tested
- [ ] Analytics: Tracking events fire correctly

### Content Readiness
- [ ] Privacy policy updated (web app data collection)
- [ ] Terms of service updated (web app usage)
- [ ] Help center articles (how to use web app)
- [ ] FAQ updated (mobile vs. web comparison)

### Marketing Readiness
- [ ] Launch announcement drafted (in-app, email, social)
- [ ] Screenshots/GIFs of web app (for marketing)
- [ ] Press kit ready (if applicable)
- [ ] App Store/Google Play listings updated (mention web)

### Support Readiness
- [ ] Support team trained on web app features
- [ ] Known issues documented (for support tickets)
- [ ] Escalation process defined (critical bugs)

**FINAL APPROVAL**: Product Lead / Founder sign-off required

---

**End of Checklist**

**Related Documents**:
- Strategic Analysis: `/docs/WEB_APP_STRATEGIC_ANALYSIS.md`
- Executive Summary: `/docs/WEB_APP_DECISION_SUMMARY.md`
- Visual Roadmap: `/docs/WEB_APP_ROADMAP_VISUAL.md`
- This Checklist: `/docs/WEB_APP_IMPLEMENTATION_CHECKLIST.md`
