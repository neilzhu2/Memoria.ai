# Memoria.ai Development Roadmap

**Last Updated**: January 20, 2026
**Current Phase**: Phase 1 - Clean Schema & Core Features (Near Completion - iOS Deployment)

---

## 🎯 Product Vision

**Mission**: Help elderly users preserve their life stories and memories through simple, accessible audio recording.

**Target Audience**: Elderly users (65+), especially Chinese seniors and their families

**Core Value Proposition**:
- Dead-simple audio recording (one tap to start)
- Warm, accessible UI optimized for elderly users
- Cultural sensitivity (Chinese family values, bilingual support)
- Family sharing with respect for hierarchy
- Privacy-first approach (user data isolation)

---

## 📍 Current Status (Nov 9, 2025)

### ✅ MVP Complete - Core Features Working

**What's live**:
- User registration and authentication
- Audio recording and playback
- Memory CRUD (create, read, update, delete)
- Search and filtering memories
- User data isolation (privacy secured)
- Dark/Light theme support
- Session persistence

**Tech stack**:
- Expo Go (development environment)
- Supabase (backend + auth + storage)
- React Native / TypeScript
- AsyncStorage (session management)

**What works really well**:
- Auth flow (login → logout → login cycle stable)
- Recording auto-start (UX improvement)
- User isolation (memories scoped by user_id)
- Performance optimizations on settings

---

## 🗺️ Development Phases

### ✅ Phase 0: MVP (Completed Oct 2025)
**Goal**: Basic working app with core recording functionality

**Completed**:
- ✅ User authentication
- ✅ Audio recording and playback
- ✅ Memory storage in Supabase
- ✅ Basic UI with dark mode
- ✅ Memory editing and deletion
- ✅ Search functionality
- ✅ User data isolation (CRITICAL privacy fix)

---

### 🔄 Phase 1: Clean Schema & Core Features (Nov 2025 - Current)
**Goal**: Clean up codebase, add essential features, prepare for UI polish

**Completed**:
- [x] Fix user isolation bug (Oct 25)
- [x] Fix AsyncStorage corruption (Nov 2-4)
- [x] Code cleanup (deleted 14 duplicate folders, Nov 9)
- [x] Organize future features (`src/` → `future-features/`, Nov 9)
- [x] Document roadmap and cleanup plan
- [x] **Topics System Implementation** (Dec 3-4)
  - [x] Database schema with 3 tables (categories, topics, history)
  - [x] 50 curated topics across 10 categories
  - [x] Offline-first topics service with caching
  - [x] Smart topic rotation (30-day no-repeat window)
  - [x] Category filtering UI on home screen
  - [x] Category badges in memories list
  - [x] Category display in memory detail view
- [x] Verify RLS policies (Nov 29)
- [x] Analytics infrastructure setup (Nov 29)
- [x] **Profile image upload/change** (Nov 10-24)
  - [x] Setup Supabase Storage bucket for avatars
  - [x] Image picker UI (camera + photo library)
  - [x] Image upload and cropping
  - [x] Display avatar in profile
  - [x] Avatar UX improvements (honey gold border, action sheet removal)
- [x] Documentation ecosystem complete (Jan 19, 2026)
  - [x] README.md comprehensive rewrite
  - [x] AI_ASSISTANT_CONTEXT.md navigation map
  - [x] iOS deployment documentation

**Immediate Next Steps** (Path to TestFlight):
1. [x] **iOS Dev Build to Physical Device** (Completed Feb 10, 2026)
   - [x] Setup app-specific password from wife's Apple Developer account
   - [x] Add account to Xcode
   - [x] Change bundle identifier to unique ID
   - [x] Build to iPhone via Xcode
   - [x] See `docs/APPLE_DEVELOPER_ACCOUNT_SETUP.md`

2. [ ] **Recording Function Implementation** (After dev build)
   - [ ] Finish recording implementation
   - [ ] Polish recording UX

3. [ ] **Transcription Implementation** (After recording)
   - [ ] Implement transcription API (expo-speech-recognition or cloud)
   - [ ] Test transcription accuracy

4. [ ] **UX Polish** (After transcription)
   - [ ] Final UX refinements
   - [ ] Address any critical UX issues

5. [ ] **TestFlight Beta Launch** (After UX polish)
   - [ ] Configure TestFlight
   - [ ] Push to TestFlight
   - [ ] Market-fit research and user testing
   - [ ] Collect feedback

**Deferred to Post-TestFlight**:
- [ ] Clean Supabase test data
- [ ] Document final schema
- [ ] Further feature development based on TestFlight feedback

**Timeline**: Target TestFlight launch - February 2026

---

### 📅 Phase 2: UI Polish & Elderly Optimization (Late Nov 2025)
**Goal**: Create warm, accessible, elderly-friendly design

**Planned features**:
- [ ] Implement elderly-optimized design system
  - [ ] Large touch targets (56pt recommended)
  - [ ] WCAG AAA contrast ratios (7:1)
  - [ ] Generous spacing, readable fonts (18pt baseline)
  - [ ] Warm color palette (terracotta, sage, soft blues)
- [ ] Typography improvements
  - [ ] Dynamic Type support with scaling limits
  - [ ] Elderly-optimized font sizes
- [ ] Accessibility enhancements
  - [ ] Reduce Motion support
  - [ ] High contrast mode
  - [ ] Voice feedback improvements
- [ ] Animation refinements
  - [ ] Haptic feedback polish
  - [ ] Smooth transitions
- [ ] Usability testing with elderly users (65+)

**Reference**: See `docs/archive/2025-10-OCT.md` for complete UI polish plan

**Timeline**: 3-4 weeks

---

### 🚀 Phase 3: Transcription & Dev Build (Dec 2025)
**Goal**: Add core transcription feature and prepare for production

**Planned features**:
- [ ] Implement transcription API
  - Option A: expo-speech-recognition (on-device)
  - Option B: Cloud service (Whisper API, Deepgram)
  - Auto-detect language (English/Chinese)
- [ ] Migrate from Expo Go to Development Build
  - [ ] Configure app metadata (name, icon, bundle ID)
  - [ ] Setup EAS Build
  - [ ] Test on real devices (iOS + Android)
- [ ] Performance optimizations
  - [ ] Convert memory list to FlatList
  - [ ] Image optimization (WebP)
  - [ ] Bundle size analysis (expo-atlas)
- [ ] Prepare for App Store
  - [ ] App Store screenshots
  - [ ] Privacy policy
  - [ ] Terms of service

**Timeline**: 3-4 weeks

---

### 📱 Phase 4: Beta Release (Jan 2026)
**Goal**: Soft launch with beta testers

**Planned**:
- [ ] TestFlight beta (iOS)
- [ ] Google Play internal testing (Android)
- [ ] Recruit 20-30 elderly beta testers
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Iterate on UX based on feedback
- [ ] Monitor crash reports
- [ ] Performance monitoring

**Success metrics**:
- SUS score > 75 (System Usability Scale)
- Task success rate > 85%
- App crash rate < 1%
- Average session time > 5 minutes

**Timeline**: 4-6 weeks

---

### 🌟 Phase 5: Family Sharing MVP (Feb-Mar 2026)
**Goal**: Enable simple family memory sharing

**Core User Flow**:
1. User A (Grandpa) creates family group, invites User B (Grandson)
2. User B requests topic: "Tell me about the war"
3. User A sees request, records memory about that topic
4. User A shares memory with family → B can view/listen
5. User A can unshare or edit later

**Planned features**:
- [ ] Create family groups
- [ ] Invite family members via email/link
- [ ] Request topics for family members to record
- [ ] Share memories with specific families
- [ ] View shared memories from your families
- [ ] Unshare/edit shared memories

**Database**: Already created (4 tables):
- ✅ `families` - Family groups
- ✅ `family_members` - Who belongs to which family
- ✅ `topic_requests` - Requested topics
- ✅ `memory_shares` - Shared memories

**Implementation**:
- Simplify code from `future-features/components/FamilySetup/`
- Simplify code from `future-features/components/MemorySharing/`
- Use existing database schema (created in Phase 1)

**NOT included** (archived as too complex):
- ❌ Family hierarchy/roles
- ❌ Cultural respect levels
- ❌ Elder approval workflows
- ❌ Generation-specific sharing

**Timeline**: 4-6 weeks

---

### 💾 Phase 6: Cloud Backup & Sync (Apr 2026)
**Goal**: Enable automatic backup and multi-device sync

**Planned features**:
- [ ] Auto backup to cloud (Supabase Storage)
- [ ] Manual backup/restore
- [ ] Multi-device sync
- [ ] Backup health monitoring
- [ ] Restore from backup
- [ ] Encryption at rest

**Implementation**:
- Activate code from `future-features/components/CloudBackup/`
- Activate `future-features/services/cloudBackupService.ts`
- Activate `future-features/services/syncService.ts`
- Activate `future-features/services/encryptionService.ts`

**Timeline**: 3-4 weeks

---

### 🎨 Phase 7: Enhanced Features (May-Jun 2026)
**Goal**: Iterate based on user feedback from Phase 5-6

**Approach**: Let users guide feature development

**Potential features** (TBD based on feedback):
- [ ] Family memory collections
- [ ] Topic categories/themes
- [ ] Memory comments/reactions
- [ ] Notification preferences
- [ ] Family activity feed
- [ ] Advanced search in shared memories

**Decision process**:
1. Launch Phase 5 family sharing
2. Collect user feedback
3. Identify most-requested features
4. Prioritize based on user needs

**NOT planned** (archived as too complex):
- ❌ Family hierarchy/roles
- ❌ Cultural respect levels
- ❌ Elder approval workflows

**Timeline**: 4-6 weeks (based on user demand)

---

### 🚀 Phase 8: Public Launch (Jul 2026)
**Goal**: Full public release on App Store and Google Play

**Planned**:
- [ ] App Store submission (iOS)
- [ ] Google Play submission (Android)
- [ ] Marketing website
- [ ] Launch announcement
- [ ] Press outreach
- [ ] Social media campaign
- [ ] User onboarding improvements
- [ ] Customer support setup

**Timeline**: 4-6 weeks

---

## 🔮 Future Phases (2026+)

### Phase 9: Premium Features
- [ ] Unlimited storage
- [ ] Advanced transcription (multi-language)
- [ ] Export to book format
- [ ] Professional audio editing
- [ ] Custom themes
- [ ] Priority support

### Phase 10: Enterprise/Care Facility Version
- [ ] Admin dashboard for care facilities
- [ ] Bulk family setup
- [ ] Caregiver access levels
- [ ] Activity reporting
- [ ] Compliance tools (HIPAA, etc.)

### Phase 11: AI Features
- [ ] AI-generated memory prompts
- [ ] Smart memory organization
- [ ] Automatic tagging
- [ ] Voice cloning (preserve voice)
- [ ] Memory book generation

---

## 📊 Key Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| MVP Complete | Oct 2025 | ✅ Done |
| Schema Cleanup | Nov 2025 | ✅ Done |
| Profile Images | Nov 2025 | ✅ Done |
| Topics System | Dec 2025 | ✅ Done |
| Documentation | Jan 2026 | ✅ Done |
| **iOS Dev Build** | **Feb 2026** | ✅ Done |
| **Recording Implementation** | **Feb 2026** | **⏳ Next** |
| **Transcription API** | **Feb 2026** | **⏳ Planned** |
| **UX Polish** | **Feb 2026** | **⏳ Planned** |
| **TestFlight Beta Launch** | **Feb 2026** | **🎯 TARGET** |
| Market-Fit Research | Feb-Mar 2026 | ⏳ Post-TestFlight |
| Family Sharing MVP | TBD | ⏳ Post-TestFlight |
| Cloud Backup | TBD | ⏳ Post-TestFlight |
| Public Launch | TBD | ⏳ Post-TestFlight |

---

## 🎯 Success Metrics

### Beta Phase (Jan-Feb 2026)
- 30+ active beta testers
- SUS score > 75
- App crash rate < 1%
- Average 3+ memories per user per week

### Public Launch (Jul 2026)
- 1,000+ downloads in first month
- 70%+ 7-day retention
- 4.5+ star rating on App Store
- 50%+ users create family group

### 6 Months Post-Launch (Jan 2027)
- 10,000+ active users
- 60%+ monthly active users
- 1,000+ family groups created
- 100,000+ memories stored

---

## 💰 Business Model (Future)

### Free Tier
- Up to 100 memories
- Basic family sharing (5 members)
- Standard audio quality
- Manual backup only

### Premium ($4.99/month or $49/year)
- Unlimited memories
- Advanced family sharing (unlimited members)
- High-quality audio
- Auto backup & sync
- Cultural features (calendar, hierarchy)
- Export to book

### Enterprise (Custom pricing)
- For care facilities
- Admin dashboard
- Bulk user management
- Compliance features
- Priority support

---

## 🛠️ Technology Evolution

### Current Stack
- Expo Go (dev)
- React Native
- TypeScript
- Supabase
- AsyncStorage

### Near Future (Phase 3)
- Development Build (replace Expo Go)
- EAS Build & Update
- Real device testing
- App Store deployment

### Long Term (Phase 9+)
- Premium backend infrastructure
- CDN for audio delivery
- AI/ML services
- Advanced analytics
- A/B testing platform

---

## 📚 Resources

### Code Assets
- Active codebase: `/app`, `/components`, `/contexts`, `/types`
- Future features: `/future-features` (~10,000 LOC)
- Documentation: `/docs`

### Design Assets
- UI Polish Plan: `docs/archive/2025-10-OCT.md`
- Design system: To be created in Phase 2

### Knowledge Base
- Technical learnings: `LEARNINGS.md`
- Work log: `WORKLOG.md`
- Schema docs: `supabase-setup.sql`, `SCHEMA_CLEANUP_PLAN.md`

---

## 🚨 Risks & Mitigation

### Technical Risks
- **Risk**: Transcription API costs
  - **Mitigation**: Start with on-device, upgrade to cloud if needed
- **Risk**: Storage costs for audio
  - **Mitigation**: Audio compression, lifecycle policies

### Business Risks
- **Risk**: Low adoption by elderly users
  - **Mitigation**: Extensive usability testing, simplified UX
- **Risk**: Privacy concerns
  - **Mitigation**: Clear privacy policy, user data isolation, encryption

### Execution Risks
- **Risk**: Scope creep on cultural features
  - **Mitigation**: Phase family features, start simple
- **Risk**: App Store rejection
  - **Mitigation**: Follow guidelines strictly, prepare appeals

---

**Next Review**: Mid-November 2025 (after Phase 1 completion)
