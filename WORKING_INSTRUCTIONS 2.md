# Memoria.ai - Working Instructions & Session Protocol

## 🔄 Session Start Protocol

### When Beginning Any Work Session:

1. **Read Current Status**
   - Review `MEMORIA_PROJECT_GUIDE.md` current status section
   - Check latest progress updates and next actions
   - Review any pending decisions or blockers

2. **Create Todo List**
   - Use TodoWrite tool to track session objectives
   - Break down work into specific, measurable tasks
   - Mark current task as "in_progress" before starting

3. **Specialized Agent Usage**
   - **technical-pm-coordinator**: For project coordination, task breakdown, cross-team communication
   - **native-app-architect**: For technical architecture decisions, implementation guidance
   - **ux-research-strategist**: For user research, elderly user considerations, accessibility
   - **expo-typescript-engineer**: For React Native/Expo specific implementation
   - **security-engineer-advisor**: For data privacy, security considerations
   - **mobile-qa-engineer**: For testing strategies and quality assurance

### Auto-Invoke Agents When:
- Making technical architecture decisions → `native-app-architect`
- Planning user research or accessibility features → `ux-research-strategist`
- Coordinating between multiple workstreams → `technical-pm-coordinator`
- Implementing React Native features → `expo-typescript-engineer`
- Addressing security/privacy concerns → `security-engineer-advisor`
- Planning testing strategies → `mobile-qa-engineer`

## 📝 Progress Documentation Requirements

### After Every Work Session:

1. **Update Project Guide**
   - Add progress update section with date
   - Update current status and next actions
   - Record any decisions made with rationale
   - Update metrics if applicable

2. **Document Code Changes**
   - Commit messages should reference elderly user benefits
   - Include accessibility considerations in PR descriptions
   - Tag commits with feature areas (audio, accessibility, ux, etc.)

3. **Track User Research Insights**
   - Document any elderly user feedback received
   - Note accessibility improvements made
   - Record cultural considerations addressed

## 🎯 Decision Making Framework

### For Technical Decisions:
1. **Elderly User Impact**: How does this affect our target demographic?
2. **Accessibility First**: Does this maintain or improve accessibility?
3. **Cultural Sensitivity**: Is this appropriate for Chinese-speaking users?
4. **Performance Impact**: How does this affect app performance for older devices?
5. **Maintenance Burden**: Can this be maintained long-term?

### For UX Decisions:
1. **Simplicity Test**: Can a 70-year-old use this without confusion?
2. **Cultural Appropriateness**: Is this respectful across cultures?
3. **Family Involvement**: How does this affect multi-generational usage?
4. **Accessibility Compliance**: Does this meet WCAG 2.1 AA standards?
5. **Engagement Balance**: Does this encourage without overwhelming?

## 🔧 Development Standards

### Code Quality Requirements:
- **TypeScript strict mode** for all new code
- **Accessibility props** on all interactive elements
- **Error boundaries** for graceful failure handling
- **Performance monitoring** for elderly device support
- **Internationalization** from day one

### Testing Requirements:
- **Accessibility testing** with screen readers
- **Performance testing** on older devices
- **Cultural testing** with bilingual content
- **Elderly user testing** for all major features
- **Family workflow testing** for sharing features

## 📊 Metrics Tracking

### Always Monitor:
- **Performance metrics**: App startup time, memory usage
- **Accessibility compliance**: WCAG 2.1 AA adherence
- **User engagement**: Recording frequency, session duration
- **Error rates**: Failed recordings, app crashes
- **Cultural metrics**: Chinese vs English usage patterns

### Report Weekly:
- Progress against Phase milestones
- User research insights collected
- Technical debt accumulated
- Accessibility improvements made
- Cultural adaptation progress

## 🚨 Escalation Triggers

### Immediately Consult Agents When:
- **Performance degradation** affecting elderly users → `native-app-architect`
- **Accessibility compliance issues** → `ux-research-strategist`
- **Cultural sensitivity concerns** → `ux-research-strategist`
- **Technical architecture changes needed** → `technical-pm-coordinator`
- **Security/privacy questions** → `security-engineer-advisor`
- **Testing strategy questions** → `mobile-qa-engineer`

## 🎮 Session Types & Approaches

### Development Sessions:
```markdown
1. Review current branch and recent changes
2. Check TodoWrite for pending tasks
3. Engage expo-typescript-engineer for implementation
4. Test on elderly-focused criteria
5. Update progress documentation
```

### Research Sessions:
```markdown
1. Review user research backlog
2. Engage ux-research-strategist for planning
3. Conduct research activities
4. Document insights and implications
5. Update user personas and journeys
```

### Architecture Sessions:
```markdown
1. Review technical decisions needed
2. Engage native-app-architect for guidance
3. Evaluate against elderly user needs
4. Document architectural decisions
5. Update technical roadmap
```

### Planning Sessions:
```markdown
1. Review project status and blockers
2. Engage technical-pm-coordinator for coordination
3. Prioritize upcoming work
4. Update roadmap and timelines
5. Communicate changes to stakeholders
```

## 📋 Standard Session Templates

### Development Session Template:
```markdown
## Development Session - [Date]

### Session Goals:
- [ ] Goal 1
- [ ] Goal 2

### Agents Consulted:
- Agent Name: Reason for consultation

### Code Changes Made:
- File: Change description and elderly user impact

### Testing Completed:
- [ ] Accessibility testing
- [ ] Performance testing
- [ ] Cultural appropriateness

### Next Session Priorities:
- [ ] Priority 1
- [ ] Priority 2

### Blockers/Questions:
- Any issues that need resolution
```

### Research Session Template:
```markdown
## Research Session - [Date]

### Research Objectives:
- [ ] Objective 1
- [ ] Objective 2

### Participants:
- Demographics and selection criteria

### Key Insights:
- Insight 1: Implication for design
- Insight 2: Implication for development

### Action Items:
- [ ] Design change needed
- [ ] Feature prioritization change

### Next Research Activities:
- [ ] Activity 1
- [ ] Activity 2
```

## 🔄 Continuous Improvement

### After Each Phase:
1. **Retrospective meeting** with all consulted agents
2. **User feedback analysis** and prioritization
3. **Technical debt assessment** and planning
4. **Accessibility audit** and improvements
5. **Cultural adaptation review** and enhancements

### Monthly Reviews:
- Progress against original plan
- User research insights integration
- Technical architecture evolution
- Market and competitive landscape changes
- Resource allocation and timeline adjustments

---

## 🎯 Quick Reference Commands

### Always Available:
- `Check MEMORIA_PROJECT_GUIDE.md for current status`
- `Use TodoWrite to track session tasks`
- `Update progress in project guide after session`
- `Consult appropriate agent based on work type`
- `Document decisions and rationale`

### Agent Invocation Patterns:
- "I need architectural guidance" → `native-app-architect`
- "I need UX research input" → `ux-research-strategist`
- "I need project coordination" → `technical-pm-coordinator`
- "I need React Native help" → `expo-typescript-engineer`
- "I need security guidance" → `security-engineer-advisor`
- "I need testing strategy" → `mobile-qa-engineer`

---

*These working instructions ensure consistent, productive sessions while maintaining focus on elderly users and cultural sensitivity throughout the Memoria.ai development process.*