# Product Requirements and Experience

## Product definition

**LevelUp Architect** is an adaptive learning campaign for Cloud Solution Architects. Its primary job is to remove “what should I learn next?” from the learner’s daily routine and replace it with one bounded, relevant, evidence-producing quest.

The MVP is local-first and immediately explorable. It is not a learning-management system, an official certification provider, or a simulated integration hub. It uses reviewed seed content and official links, persists real progress, and exposes honest extension points for future platform capabilities.

## Problem

Cloud architects face rapidly changing technologies across GitHub, Azure AI, security, responsible AI, software delivery, and certification programs. Typical learning portals optimize for catalog discovery, which leaves the learner to choose sequence, difficulty, time, and remediation. The result is decision fatigue, shallow content consumption, and weak evidence of practical capability.

## Vision and principles

1. **One clear next action:** the home experience should answer what to do now.
2. **Build, do not browse:** every daily quest pairs official reading with hands-on work and a knowledge check.
3. **Adapt from evidence:** prerequisite completion, mastery, accuracy, confidence, focus, and time influence sequencing.
4. **Reward durable behavior:** XP and streaks reward completed evidence, not page views or rapid repeated clicks.
5. **Make progress legible:** levels, readiness, skill heatmaps, and remediation explain why a recommendation exists.
6. **Never fake integration:** unconfigured GitHub, Microsoft Learn, or model-provider capabilities fail visibly or remain labeled roadmap items.
7. **Local first, enterprise ready:** local operation requires no paid service; domain and authorization boundaries support later multi-user operation.

## Goals and measures

| Goal | MVP measure | Future measure |
|---|---|---|
| Reduce decision burden | Learner receives an eligible quest in one action | Median time-to-start under 60 seconds |
| Improve deliberate practice | Every daily template has reading, hands-on, and quiz steps | Weekly completed practical artifacts |
| Improve retention | Weak-topic remediation and spaced recommendations | 30/60/90-day knowledge retention |
| Improve certification preparedness | Transparent readiness and timed practice | Calibration of readiness against learner outcomes |
| Sustain engagement responsibly | Streaks advance once per period; XP is idempotent | Completion and return rate without unhealthy usage |

## Non-goals for the MVP

- Reproducing or claiming equivalence to protected vendor exam content.
- Scraping Microsoft Learn or GitHub documentation.
- Automatically asserting that a GitHub URL proves challenge completion.
- Hosting organization-wide leaderboards or employee performance ranking.
- Horizontally scaling SQLite across multiple replicas.
- Making certification, employment, or security-risk decisions for a learner.

## Learning domains

The default priority order is:

1. GitHub Fundamentals
2. GitHub Administration
3. GitHub Actions
4. GitHub Advanced Security
5. GitHub Copilot
6. Azure AI Foundry
7. AI Engineering
8. AI Security
9. Responsible AI
10. Microsoft Security for AI Workloads

Priority is an input, not a fixed curriculum. Focus selection, prerequisites, weakness, confidence, exam performance, and available time alter the recommendation score.

## Personas and roles

### Learner

A Cloud Solution Architect who wants a reliable daily learning path, practical challenges, progress evidence, and certification preparation without maintaining a personal curriculum spreadsheet.

### Content reviewer

A subject-matter expert who will eventually review quest templates, rubrics, sources, question clarity, deprecations, and marketplace submissions. The role exists in the authorization model; workflow UI is a roadmap item.

### Administrator

An operator who will eventually manage content policy, organizations, integrations, analytics boundaries, retention, and access. The role exists in the authorization model; enterprise administration UI is a roadmap item.

## User stories and acceptance criteria

### Account and onboarding

- As a learner, I can register locally so my progress belongs to an authenticated account.
- As a learner, I can select one to five ordered focus areas and a 30/45/60-minute window.
- As a learner, I can state starting confidence per focus area.
- Inputs are validated on the client for usability and on the server for trust.
- A known demo account is available outside production for immediate exploration.

### Daily learning

- As a learner, I can generate one daily quest per UTC day.
- The quest contains an official resource, hands-on task, and quiz.
- The generated template meets demonstrated prerequisites.
- Completion persists by step and survives reload/restart.
- Completing the same step twice does not award duplicate XP.
- A wrong quiz answer records performance and remediation without awarding quiz XP.

### Boss battles and raids

- As a learner, I can generate one weekly boss battle and one monthly raid per period when prerequisites are met.
- Each produces a substantive architecture, workflow, assessment, or application deliverable.
- I can record an evidence URL and reflection.
- The MVP labels this as learner attestation; it does not claim repository verification.

### Progression and engagement

- As a learner, I see total XP, current level, tier, progress to next level, recent ledger events, achievements, and daily/weekly/monthly streaks.
- Levels cap at 100 and map to Novice, Explorer, Practitioner, Specialist, Architect, Master Architect, and Legend.
- Streaks can advance once per period and reset after a gap.
- Milestone bonus events have unique period-based keys.

### Skill and recommendation intelligence

- As a learner, I see mastery, confidence, accuracy, attempts, and focus rank per domain.
- I see recommendations with human-readable reasons.
- A recommendation is penalized when it exceeds available study time.
- Locked content is excluded until every prerequisite domain reaches the mastery threshold.

### Certification and exams

- As a learner, I see the requested Microsoft and GitHub roadmap in recommended order.
- Readiness combines domain mastery, recent practice scores, and confidence.
- I can start a timed, difficulty-scaled practice attempt.
- The attempt can contain multiple-choice, scenario, and case-study questions.
- Submission requires exactly one valid answer per question.
- Results show score, threshold, weak topics, topic scores, correct answers, explanations, and remediation guidance.

### Mentor

- As a learner, I can ask The Guide what to learn next, how to use limited time, or how to prepare for certification.
- Local mode works with no network or paid model.
- The response uses current quest, weakest skill, study time, and certification context.
- An external provider is optional and returns explicit configuration, timeout, HTTP, or empty-response errors.

## Information architecture

| Surface | Primary question answered |
|---|---|
| Login/register | How do I safely resume or create my campaign? |
| Onboarding | What matters, how confident am I, and how much time do I have? |
| Dashboard | Where am I and what should I do now? |
| Quest log | What steps and evidence complete each mission? |
| Certifications | Which credential is next and what evidence supports readiness? |
| Practice exam | What can I demonstrate under time pressure? |
| The Guide | How should I interpret my current state and choose a next action? |

## UI/UX wireframes

### Desktop dashboard

```text
┌──────────────────┬────────────────────────────────────────────────────────┐
│ LevelUp          │ Campaign heading                         [Quest log →] │
│ Architect        ├──────────────────────────┬───────────┬─────────────────┤
│                  │ Level / tier / XP        │ Streak    │ Achievements    │
│ Dashboard        ├──────────────────────────┴─────┬─────┴─────────────────┤
│ Quest log        │ Today's adaptive quest         │ The Guide             │
│ Certifications   │ steps + progress + continue    │ grounded counsel      │
│ The Guide        ├────────────────────────────────┼───────────────────────┤
│                  │ Recommended next + reasons     │ Certification         │
│ Account          ├────────────────────────────────┴───────────────────────┤
│ Sign out         │ Skill heatmap: mastery, confidence, accuracy, focus    │
│                  ├───────────────────────────────┬────────────────────────┤
│                  │ Recent XP ledger              │ Badge cabinet          │
└──────────────────┴───────────────────────────────┴────────────────────────┘
```

### Mobile dashboard

```text
┌──────────────────────────┐
│ LevelUp Architect  role  │
│ horizontal nav           │
├──────────────────────────┤
│ Level + XP progress      │
│ Streak                   │
│ Achievements             │
│ Today's quest            │
│ The Guide                │
│ Recommendations          │
│ Certification readiness │
│ Skill heatmap            │
│ XP / badges              │
└──────────────────────────┘
```

### Quest step

```text
┌────────────────────────────────────┐
│ Step 2 · Hands-on challenge        │
│ Instructions and expected outcome  │
│ Evidence URL (optional)            │
│ Reflection (optional)              │
│ MVP attestation disclosure         │
│                  [Mark complete]   │
└────────────────────────────────────┘
```

## Interaction states

- **Loading:** dashboard/cards use labeled skeletons; exams and mentor show bounded progress indicators.
- **Empty:** quest log explains how to generate the first quest; XP ledger explains what will appear; mentor offers quick prompts.
- **Validation:** controls block impossible actions, while server validation remains authoritative.
- **Error:** API failures are displayed in the relevant surface with retry or navigation; provider errors are not converted to success.
- **Success:** step completion announces XP and idempotent replay behavior; quiz remediation remains visible.
- **Expired:** exam submission after the stored deadline returns an explicit expired state.

## Accessibility

- Semantic headings, navigation landmarks, fieldsets, legends, labels, progressbar roles, and live regions.
- Keyboard-operable controls and visible focus outlines.
- Responsive content reflow rather than separate mobile behavior.
- Status is communicated with text and icons, not color alone.
- System font stack avoids external font requests.
- Light/dark theming derives exclusively from the Clawpilot color variables.

## Engagement and learning effectiveness rationale

- Bounded quests reduce choice overload and increase the probability of starting.
- Reading/lab/quiz sequencing moves from explanation to application to retrieval.
- Wrong answers remain productive by updating weak-topic signals and displaying explanations.
- Boss battles and raids create synthesis artifacts rather than reward only small tasks.
- Visible reasons improve recommendation trust and teach learners to self-regulate.
- Confidence is separate from accuracy, exposing over- and under-confidence.
- Streaks reward continuity while once-per-period advancement and idempotency discourage farming.
- Certification readiness is multi-signal and explicitly non-guaranteed, reducing false precision.
