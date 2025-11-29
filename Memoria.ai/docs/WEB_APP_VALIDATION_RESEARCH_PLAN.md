# Web App Validation Research Plan
## How to Gather Data to Make the Web Decision

**Date:** November 28, 2025
**Purpose:** Collect evidence to determine if and when to build a web app for Memoria
**Timeline:** Q1 2026 (during mobile beta testing)
**Decision Date:** End of Q1 2026

---

## Research Questions to Answer

Before building a web app, we need to answer these critical questions:

### Primary Questions

1. **How many elderly users need family help to successfully onboard?**
   - Current hypothesis: 40%+ need help
   - If true: Web setup assistance is valuable
   - If false: Web less urgent, mobile-only is fine

2. **Do family members want desktop viewing access?**
   - Current hypothesis: 50%+ prefer web viewing over app install
   - If true: View-only web removes adoption barrier
   - If false: Family mobile app is sufficient

3. **Would families use remote setup assistance tools?**
   - Current hypothesis: 30%+ would use desktop guides for helping elderly users
   - If true: Family dashboard has clear value
   - If false: Phone call support is preferred

### Secondary Questions

4. Do elderly users want desktop access for any features?
5. What specific web features would family members pay for?
6. Do care facilities need desktop admin dashboards?
7. How often would users switch between mobile and web?

---

## Research Methods

### Method 1: Beta User Survey (Primary)

**When:** During Q1 2026 beta testing
**Who:** 30+ elderly users + their family members
**How:** In-app survey + follow-up email

#### Survey for Elderly Users

**Section A: Onboarding Experience**
1. Did you need help from a family member or friend to set up Memoria?
   - [ ] Yes, I needed help
   - [ ] No, I did it myself
   - [ ] I tried myself first, then got help

2. If you needed help, how did they help you?
   - [ ] In person (they were with me)
   - [ ] Over the phone (they guided me verbally)
   - [ ] Video call (they could see my screen)
   - [ ] Text/email instructions
   - [ ] Other: ___________

3. If your helper could see instructions on their computer while helping you, would that have been easier?
   - [ ] Yes, definitely
   - [ ] Maybe
   - [ ] No difference
   - [ ] I don't know

**Section B: Recording Experience**
4. How do you usually record memories?
   - [ ] On my phone, wherever I am
   - [ ] At my desk/table with my phone
   - [ ] I haven't recorded much yet
   - [ ] Other: ___________

5. Would you want to record memories on a computer/desktop?
   - [ ] Yes, I prefer computers
   - [ ] Maybe, for certain types of memories
   - [ ] No, my phone is easier
   - [ ] I don't have a computer

**Section C: Device Ownership**
6. Which devices do you own? (Check all that apply)
   - [ ] Smartphone (iPhone/Android)
   - [ ] Tablet (iPad/Android tablet)
   - [ ] Laptop computer
   - [ ] Desktop computer
   - [ ] None of the above

7. If you own a computer, how often do you use it?
   - [ ] Daily
   - [ ] A few times a week
   - [ ] Rarely
   - [ ] Never (someone else uses it)
   - [ ] Don't own a computer

---

#### Survey for Family Members

**Section A: Helping with Setup**
1. Did you help your family member set up Memoria?
   - [ ] Yes, I was the primary helper
   - [ ] Yes, I helped a little
   - [ ] No, they did it themselves
   - [ ] No, someone else helped them

2. If you helped, how did you provide help?
   - [ ] In person (I was with them)
   - [ ] Phone call (verbal guidance)
   - [ ] Video call (could see their screen)
   - [ ] Texted them instructions
   - [ ] Other: ___________

3. How difficult was it to help them remotely (if applicable)?
   - [ ] Very difficult (took over an hour)
   - [ ] Somewhat difficult (30-60 min)
   - [ ] Manageable (15-30 min)
   - [ ] Easy (under 15 min)
   - [ ] N/A - I was in person

4. If you could access a desktop guide with screenshots and videos to help them, how useful would that be?
   - [ ] Extremely useful - would have saved a lot of time
   - [ ] Somewhat useful
   - [ ] Not very useful
   - [ ] Not useful at all

**Section B: Viewing Memories**
5. How do you currently access your family member's shared memories?
   - [ ] I installed the Memoria app on my phone
   - [ ] They show me on their phone in person
   - [ ] They send me audio files separately
   - [ ] I haven't accessed them yet
   - [ ] Other: ___________

6. If you could view shared memories on a website (no app install needed), would you prefer that?
   - [ ] Yes, definitely prefer website
   - [ ] Maybe, depends on features
   - [ ] No, mobile app is fine
   - [ ] I don't need to view memories

7. From where do you most often want to view shared memories?
   - [ ] My computer/laptop at home
   - [ ] My phone anywhere
   - [ ] My work computer
   - [ ] Tablet
   - [ ] Other: ___________

**Section C: Desired Features**
8. What would you want to do on a desktop website? (Check all that apply)
   - [ ] View and listen to shared memories
   - [ ] Organize memories into collections
   - [ ] Request specific memory topics from my family member
   - [ ] Help them configure app settings
   - [ ] See when they record new memories (activity feed)
   - [ ] Export memories to a book or document
   - [ ] Other: ___________

9. Would you pay for premium family features on desktop?
   - [ ] Yes ($5-10/month)
   - [ ] Yes ($20-50/year)
   - [ ] Maybe, depends on features
   - [ ] No, only if free

**Section D: Use Case Scenarios**
10. Imagine your family member calls saying they can't figure out how to change a setting. Which would you prefer?
    - [ ] Walk them through it on the phone (current option)
    - [ ] Access a desktop dashboard to change it for them remotely
    - [ ] Send them a video tutorial link
    - [ ] Have them wait until I can visit in person

---

### Method 2: User Interviews (Deep Dive)

**When:** Q1 2026, after survey results
**Who:** 15-20 participants (mix of elderly users and family members)
**How:** 45-minute video/phone interviews

#### Interview Guide - Family Members

**Part 1: Current Pain Points (15 min)**
1. Walk me through the last time you helped [elderly family member] with Memoria
   - What specifically did they need help with?
   - How did you provide that help?
   - What was frustrating about the process?
   - What would have made it easier?

2. How often do you help them with technology?
   - Just initial setup, or ongoing support?
   - What types of issues come up repeatedly?
   - Do you wish there was a way to help them without being on the phone?

**Part 2: Desktop Viewing Desires (15 min)**
3. Do you currently view the memories they've shared?
   - If yes: How do you access them? What's that experience like?
   - If no: What's preventing you from viewing them?

4. Imagine you receive an email: "[Mom] shared a new memory with you"
   - Would you click a link to view it in a browser?
   - Or would you rather open a mobile app?
   - Why?

5. What would the ideal memory viewing experience look like for you?
   - What device? When? Where?
   - What features would you want?

**Part 3: Prototype Reaction (10 min)**
6. [Show mockups of Family Dashboard web app]
   - What are your first impressions?
   - Which features would you actually use?
   - Which features seem unnecessary?
   - What's missing?

**Part 4: Willingness to Pay (5 min)**
7. If this desktop experience cost $5/month or $50/year, would you pay for it?
   - Why or why not?
   - What would make it worth paying for?

---

#### Interview Guide - Elderly Users

**Part 1: Onboarding Experience (10 min)**
1. Tell me about when you first started using Memoria
   - Who helped you set it up?
   - What was confusing?
   - What was easier than expected?

2. If you needed help, was it hard for that person to help you remotely?
   - What did they struggle to explain over the phone?
   - Would screen sharing have helped?

**Part 2: Recording Preferences (15 min)**
3. Where do you usually record memories?
   - Sitting at home? Walking around? In bed?
   - Phone in hand? On a table?

4. Do you use a computer regularly?
   - If yes: What do you use it for?
   - If yes: Would you ever want to record memories on your computer instead of phone?
   - If no: Is there a reason you don't use computers?

**Part 3: Reviewing Memories (10 min)**
5. How do you review your past memories?
   - On your phone? On a bigger screen?
   - Do you wish the screen was bigger when listening?
   - Do you ever want to edit the text transcription?

**Part 4: Ideal Experience (10 min)**
6. If you could wave a magic wand, what would make Memoria even easier to use?
   - Different device?
   - Bigger buttons?
   - Less steps?
   - Something else?

---

### Method 3: Usage Analytics (Quantitative)

**When:** Throughout Q1 2026 beta
**What to Track:**

#### Onboarding Metrics
- % of users who complete signup on first attempt
- Average time to complete first recording
- % of users who contact support during onboarding
- Most common support questions (tag: setup/recording/settings/sharing)

#### Recording Behavior
- Time of day memories are recorded
- Average recording duration
- Location patterns (home WiFi vs. mobile data)
- Frequency: daily/weekly/monthly users

#### Sharing Patterns
- % of elderly users who share memories with family
- % of family members who install app to view
- % of shared memories that are actually viewed
- Time between share and family view

#### Support Tickets
- Category: Setup help / Feature confusion / Technical issue
- Resolution method: Self-serve / Family help / Support agent
- % that could have been solved with desktop guide

**Key Metrics for Web Decision:**

| Metric | Threshold for "Build Web" |
|--------|--------------------------|
| % users needing family help to onboard | >40% |
| % family preferring desktop viewing | >50% |
| Support tickets for remote help | >30% of all tickets |
| Family member view rate without app | <30% (barrier exists) |

---

### Method 4: Competitive App Audits

**When:** Q1 2026 (parallel to user research)
**Who:** UX researcher
**What:** Hands-on testing of competitor web experiences

#### Apps to Audit

**1. Day One (Journaling)**
- Test desktop vs. mobile recording UX
- Compare feature parity across platforms
- Note when you naturally reach for each platform
- Document cross-device sync experience

**2. 1 Second Everyday (Video Diary)**
- Test mobile recording + desktop viewing workflow
- Note what features are desktop-only
- Assess if web viewing adds value
- Document sharing UX

**3. StoryWorth (Elderly Storytelling)**
- Test family member setup process on desktop
- Note how they differentiate elderly vs. family interfaces
- Assess remote help capabilities
- Document pricing model for family features

**4. Google Photos**
- Test mobile capture + desktop organization
- Note when web is superior to mobile
- Assess family sharing UX across platforms
- Document how they handle audio files

#### Audit Framework

For each app, document:
1. What features are mobile-only? Why?
2. What features are desktop-only? Why?
3. When did you naturally choose desktop over mobile?
4. What would have been worse if it was mobile-only?
5. What web features felt unnecessary (could have been mobile)?

---

### Method 5: Prototype Testing

**When:** Late Q1 2026 (after survey + interviews)
**Who:** 10 family members
**What:** Test clickable mockup of Family Dashboard

#### Prototype Scenarios

**Scenario 1: Remote Setup Help**
- Task: Your mom calls saying she can't find the recording button
- Prototype: Desktop guide with screenshots showing where button is
- Success: Finds correct guide page in <30 seconds
- Measure: Time, satisfaction, likelihood to use

**Scenario 2: Memory Viewing**
- Task: You receive email that dad shared a memory, view it
- Prototype: Click email link → web player → listen to memory
- Success: Completes without confusion
- Measure: Time, audio playback success, likelihood to return

**Scenario 3: Topic Request**
- Task: You want dad to record a story about his childhood
- Prototype: Desktop dashboard → "Request topic" → send to dad's app
- Success: Completes request, understands how dad will see it
- Measure: Time, understanding, perceived value

**Scenario 4: Account Management**
- Task: Add another family member to view memories
- Prototype: Family group settings → invite member
- Success: Completes invite flow
- Measure: Time, confusion points, success rate

#### Prototype Success Criteria

| Metric | Target |
|--------|--------|
| Task completion rate | >90% |
| Average time per task | <2 minutes |
| User satisfaction (1-5) | >4.0 |
| "Would use this" score | >70% |
| Willingness to pay | >40% |

If prototype testing meets these targets, proceed with web development.

---

## Analysis Framework

### How to Synthesize Research Data

#### Step 1: Quantify Pain Points
From surveys + interviews, calculate:
- % of elderly users who needed family help
- % of help attempts that were remote (not in person)
- % of remote help that was difficult/frustrating
- Projected time saved with desktop guides

**Decision Threshold:**
- If >40% needed remote help AND >50% found it difficult → **Web setup assistance validated**

---

#### Step 2: Assess Viewing Demand
From surveys + analytics, calculate:
- % of family members who installed mobile app to view
- % who wanted to view but didn't install app
- % who prefer desktop viewing when given the choice
- Actual view rates of shared memories

**Decision Threshold:**
- If >30% didn't install app OR >50% prefer desktop → **Web viewing validated**

---

#### Step 3: Validate Feature Priorities
From interviews + prototype testing, rank web features by:
1. Frequency mentioned in interviews
2. Success rate in prototype testing
3. Willingness to pay signals
4. Estimated development effort

**Priority Matrix:**
```
High Value, Low Effort (Build First):
- View-only shared memory links
- Setup assistance guides

High Value, High Effort (Build Second):
- Family dashboard with authentication
- Topic request system

Low Value, Any Effort (Don't Build):
- Desktop audio recording for elderly
- Full feature parity
```

---

#### Step 4: Calculate ROI
Using analytics + survey data, estimate:

**Costs:**
- Development: $30K (6-8 weeks)
- Maintenance: $6K/year (20% of mobile)
- Testing: $6K (3 weeks)
- Total Year 1: $42K

**Benefits:**
- Increased adoption: X more users × $50 LTV = $___ revenue
- Support cost reduction: Y fewer tickets × $15/ticket = $___ savings
- Enterprise opportunities: Z facilities × $500/month = $___ revenue
- Total Year 1: $___ value

**Decision Threshold:**
- If projected ROI >20% → **Financially viable**

---

#### Step 5: Assess Risk Level
From all data sources, evaluate:

**Technical Risk:**
- Expo web support sufficient? (Test prototype)
- Audio playback reliable? (Test across browsers)
- Team capacity exists? (Project plan review)

**User Risk:**
- Will elderly users be confused? (Survey + interviews)
- Will mobile quality suffer? (Resource allocation analysis)
- Will brand be diluted? (Competitive audit insights)

**Decision Matrix:**
```
           High Value  |  Low Value
           ------------|------------
High Risk  | DELAY     | DON'T BUILD
Low Risk   | BUILD NOW | OPTIONAL
```

---

## Decision Framework

At end of Q1 2026, use this framework to decide:

### BUILD WEB NOW if:
✅ >40% elderly users needed remote family help
✅ >50% families prefer desktop viewing
✅ Prototype testing shows >90% task completion
✅ Projected ROI >20%
✅ Team has capacity (dedicated web developer hired)
✅ Risk level is LOW

### DELAY WEB 3-6 MONTHS if:
⚠️ Pain points validated BUT team doesn't have capacity
⚠️ Demand exists BUT projected ROI <20%
⚠️ Interest shown BUT prototype testing <90% success
⚠️ Risk level is MEDIUM

### DON'T BUILD WEB if:
❌ <30% elderly users needed help (mobile is sufficient)
❌ <40% families want desktop access (low demand)
❌ Prototype testing shows confusion or low value perception
❌ Projected ROI negative or <10%
❌ Risk level is HIGH

---

## Research Timeline

### Week 1-2 (Early Q1 2026)
- Finalize survey questions
- Set up analytics tracking
- Recruit interview participants
- Begin competitive audits

### Week 3-6 (Mid Q1 2026)
- Deploy surveys to beta users
- Conduct 15-20 user interviews
- Collect usage analytics
- Complete competitive audits

### Week 7-8 (Mid-Late Q1 2026)
- Analyze survey results
- Synthesize interview themes
- Create prototype mockups
- Test prototypes with 10 families

### Week 9-10 (Late Q1 2026)
- Compile all research data
- Calculate ROI projections
- Assess risks
- Make GO/NO-GO decision

### Week 11-12 (End Q1 2026)
- Present findings to stakeholders
- If GO: Plan web development roadmap
- If NO-GO: Document decision rationale
- Schedule next review (Q3 2026)

---

## Deliverables

### Research Reports

**1. Survey Results Report (Week 6)**
- Sample size and demographics
- Key findings per question
- Charts and visualizations
- Initial recommendations

**2. Interview Insights Report (Week 7)**
- Participant profiles
- Pain point themes
- Opportunity areas
- Supporting quotes

**3. Prototype Testing Report (Week 9)**
- Task success rates
- Time on task analysis
- User feedback themes
- Feature priority ranking

**4. Competitive Analysis Report (Week 8)**
- Platform strategy comparison
- UX pattern library
- Best practices synthesis
- Lessons for Memoria

**5. Final Recommendation Report (Week 10)**
- Executive summary (1 page)
- Research synthesis (5 pages)
- ROI analysis (2 pages)
- Risk assessment (2 pages)
- Decision recommendation (1 page)
- Appendix: Raw data

---

## Success Metrics for the Research Itself

**How to know if this research was valuable:**

1. **Decision Confidence:** Stakeholders feel >90% confident in GO/NO-GO decision
2. **Data Quality:** Survey response rate >60%, interview saturation reached
3. **Actionability:** Clear feature priorities and roadmap (if building web)
4. **Risk Mitigation:** Major risks identified and mitigation plans defined
5. **ROI Clarity:** Financial model accurate within ±20%

---

## Budget Estimate

### Research Costs

**Internal Time:**
- UX Researcher: 80 hours @ $75/hr = $6,000
- Product Manager: 20 hours @ $100/hr = $2,000
- Designer (mockups): 40 hours @ $75/hr = $3,000
- Engineer (prototype): 20 hours @ $100/hr = $2,000

**External Costs:**
- Participant incentives: 30 users × $50 = $1,500
- Survey tools (Typeform/SurveyMonkey): $500
- Prototype tools (Figma): $0 (existing)
- Total External: $2,000

**Total Research Budget: $15,000**

**Value:**
- Prevents $30K wasted web development if demand doesn't exist
- Validates $50K+ annual value if web is successful
- De-risks strategic decision
- ROI of research: >200%

---

## Templates and Tools

### Survey Tool Recommendations
1. **Google Forms** (Free) - Basic but sufficient
2. **Typeform** ($35/month) - Better UX for elderly users
3. **SurveyMonkey** ($99/month) - Advanced analytics

**Recommendation:** Typeform for elderly users (larger text, better mobile UX)

---

### Interview Tools
1. **Zoom** - Video calls with recording
2. **Otter.ai** - Automatic transcription
3. **Dovetail** - Qualitative analysis
4. **Miro** - Thematic synthesis

---

### Prototype Tools
1. **Figma** - Interactive mockups
2. **Maze** - Remote usability testing
3. **Loom** - Video explanations
4. **UsabilityHub** - Quick preference tests

---

### Analytics Tools
1. **Mixpanel** - User behavior tracking
2. **Google Analytics** - Web traffic (if testing web prototype)
3. **PostHog** - Open-source alternative
4. **FullStory** - Session recordings

---

## Next Steps

### Immediate Actions (This Week)
1. Review and approve this research plan
2. Add survey questions to beta testing protocol
3. Recruit interview participants from beta list
4. Set up analytics tracking events

### Week 1 Actions
1. Finalize survey in Typeform
2. Schedule interview time slots
3. Begin competitive audits
4. Create research repository folder

### Monthly Check-ins
- Week 4: Review preliminary survey results
- Week 8: Review interview themes
- Week 10: Review final decision framework
- Week 12: Present final recommendation

---

## Questions This Research Will Answer

By end of Q1 2026, you will know:

✅ What % of elderly users need family help to onboard
✅ Whether families want desktop viewing access
✅ What specific web features have highest value
✅ Whether desktop guides reduce support burden
✅ If families would pay for premium web features
✅ What the ROI of web development would be
✅ What risks exist and how to mitigate them
✅ Whether to build web now, later, or never

**No more guessing. Just data-driven decisions.**

---

**Document:** `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/docs/WEB_APP_VALIDATION_RESEARCH_PLAN.md`

**Related Documents:**
- `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/docs/WEB_APP_EXECUTIVE_SUMMARY.md` (Strategic recommendation)
- `/Users/lihanzhu/Desktop/Memoria/Memoria.ai/docs/WEB_APP_UX_RESEARCH_ANALYSIS.md` (Full analysis)

**Owner:** UX Research Strategist
**Reviewers:** Product Manager, Engineering Lead
**Timeline:** Q1 2026
**Budget:** $15,000
**Expected ROI:** >200%
