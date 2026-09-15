# Development Roadmap, Sprint Plan, and Implementation Plan

## Delivery status

The current repository is a complete runnable MVP, not a complete long-term community/enterprise platform. This document separates proven behavior from planned capability.

### Implemented

- Local registration, demo login, secure password/session handling, and constrained roles.
- Onboarding with ordered focus, confidence, and 30/45/60-minute study windows.
- Ten requested learning domains and official GitHub/Microsoft resource links.
- Adaptive daily quests, weekly boss battles, and monthly raids with prerequisite gates.
- Reading, hands-on, quiz, boss, and raid step persistence.
- Evidence URL/reflection capture with explicit learner-attestation labeling.
- Configurable XP defaults, immutable ledger, idempotent rewards, levels 1–100, tiers, achievements, and daily/weekly/monthly streaks.
- Skill mastery, confidence, attempts, accuracy, and recommendation reasons.
- Ten requested certification paths, readiness, timed practice exams, scenario/case-study questions, topic scores, answer review, and remediation.
- Local deterministic mentor and optional OpenAI-compatible provider with explicit failures.
- Responsive accessible application, SQLite migration/seed, tests, CI, CodeQL, Dependabot, Docker, Compose, and devcontainer.

### Extension contracts but not live

- GitHub activity verification.
- External learning catalog/Microsoft Learn synchronization.
- Automated submission, repository, architecture, and documentation review.
- Organization analytics event export.

### Not yet implemented

- OAuth/Entra/GitHub SSO, password reset, email verification, MFA, and account administration.
- Content reviewer/admin UI and approval workflow.
- Real certification evidence verification.
- GitHub App installation and challenge repository lifecycle.
- Guilds, shared challenges, teams, and learner/team/certification leaderboards.
- Marketplace submissions, review queues, versioning, trust scores, and content moderation.
- Organization tenancy, enterprise policies, audit UI, analytics, and retention.
- Calendar scheduling, reminders, spaced-repetition due dates, and notification subscriptions.
- PostgreSQL adapter, distributed throttle, queues, object storage, and multi-replica deployment.
- Mobile apps or offline synchronization.

## Product roadmap

### Phase 1 — Reliable individual learning

**Outcome:** a learner can trust the path and evidence.

- Expand each domain to at least 20 reviewed daily templates, 6 boss battles, and 3 raids.
- Add content version, author, reviewer, objective tags, review due date, and deprecation state.
- Add spaced-repetition due signals and learner feedback (“too easy,” “too hard,” “not relevant”).
- Add certification target dates and blueprint-weighted exam banks.
- Add account/session management, password reset, and learner data export/delete.
- Add browser-level accessibility and core-flow tests.

**Exit criteria:** 80% of pilot learners can start a relevant quest in under one minute; no duplicate XP or lost completion incidents; content review SLA met.

### Phase 2 — Verified GitHub practice

**Outcome:** challenge evidence becomes machine-checkable without overclaiming.

- Build a GitHub App with minimum repository metadata, pull request, issue, commit, and workflow permissions.
- Use installation-scoped tokens, webhook signature verification, replay protection, and rate-limit handling.
- Materialize a `verification_attempts` audit table with requested checks, observed evidence, status, provider trace, and manual-review reason.
- Support starter repository creation from reviewed templates.
- Verify explicit rubrics such as “workflow run succeeded with declared permissions,” not vague repository quality.
- Provide manual review when data is inaccessible or ambiguous.

**Exit criteria:** verification precision measured against reviewer labels; every result has evidence and timestamp; no challenge is auto-completed on provider failure.

### Phase 3 — Reviewed content marketplace and community

**Outcome:** experts can contribute safely without diluting quality.

- Introduce versioned content packages, author identity, license/provenance, objectives, prerequisites, rubrics, source review dates, and supported product versions.
- Add draft → review → approved → published → deprecated workflow.
- Require two-person approval for XP/reward changes.
- Add guilds and shared challenges with invite/privacy controls.
- Add opt-in individual/team/certification leaderboards using normalized seasonal XP and anti-abuse rules.
- Add reporting and moderation workflow.

**Exit criteria:** published content is traceable to approved versions; leaderboard actions are auditable; learners can opt out without losing core functionality.

### Phase 4 — AI review and mentor providers

**Outcome:** AI augments evidence review and explanation without becoming an unaccountable judge.

- Provider registry with organization policy, explicit consent, data classification, redaction, retention, and regional controls.
- Rubric-grounded review for code, repositories, architecture diagrams, and documents.
- Require citations to submitted evidence and confidence per finding.
- Keep blocking outcomes in human review until quality/safety thresholds are demonstrated.
- Evaluate hallucination, false-positive, bias, prompt-injection, and data-leakage risks.
- Add mentor conversation controls, delete/export, provider selection, and evaluation telemetry.

**Exit criteria:** reviewed offline evaluation set, human override, provider audit, and no silent fallback/success.

### Phase 5 — Organization and enterprise platform

**Outcome:** organizations can govern learning while protecting learner autonomy.

- PostgreSQL, tenant/membership model, Entra ID and GitHub SSO, SCIM/group mapping, and role policy.
- Aggregated organization skill/readiness analytics with minimum cohort sizes.
- Learning campaigns, required controls, team capability goals, and admin policy.
- Audit/event retention, data residency, backup/restore, SLOs, incident response, and disaster recovery.
- Integrate Microsoft Learn only through supported feeds/APIs/deep links; do not scrape.

**Exit criteria:** tenant isolation tests, privacy review, operational SLOs, recovery exercises, and organization pilot sign-off.

## Complete implementation plan by workstream

### Identity and authorization

1. Add account/session settings and explicit all-session revocation.
2. Add verified email/password reset using a provider abstraction.
3. Model organizations, memberships, role assignments, and policy inheritance.
4. Add OIDC adapters and map claims through allow-listed organization rules.
5. Add security-event audit records and privileged-action confirmation.

### Learning content

1. Normalize authored steps/resources/questions into versioned content packages.
2. Add objective tags and content-level dependency graph.
3. Build reviewer UI with source freshness, preview, diff, rubric, and approval.
4. Add deprecation/migration rules for active quest instances.
5. Add import/export with signed package manifests and license metadata.

### Adaptation and effectiveness

1. Add time decay, spaced repetition, content freshness, and learner feedback signals.
2. Capture recommendation impressions, starts, completions, difficulty feedback, and skips.
3. Evaluate deterministic scoring for relevance, completion, and learning gain.
4. Train/introduce a learned ranker only in shadow mode.
5. Add explainability and rollback/versioning for every ranking model.

### Challenges and verification

1. Define check-level rubrics and required provider permissions.
2. Implement GitHub App webhook ingestion and backfill jobs.
3. Add idempotent verification attempts and evidence snapshots.
4. Map verified checks to completion events through the same XP transaction boundary.
5. Add manual review, disputes, and provider-outage behavior.

### Certification

1. Expand original question banks against public objective blueprints.
2. Add blueprint weights, seeded shuffle, adaptive difficulty, and item analytics.
3. Add question review/versioning and exposure controls.
4. Add readiness calibration and confidence intervals.
5. Add certification evidence upload/provider verification and award certification XP once.

### Community and marketplace

1. Add guild membership/invites and private/public visibility.
2. Add shared challenge scheduling and team submissions.
3. Add seasonal, normalized leaderboards and anti-abuse controls.
4. Add content author profiles, moderation, review SLAs, and provenance.
5. Add trust/safety reporting and appeals.

### Platform and operations

1. Introduce a database repository interface and PostgreSQL implementation.
2. Add distributed throttling, job queue, webhook worker, and object storage.
3. Add OpenTelemetry traces/metrics/logs and privacy-aware analytics.
4. Add deployment templates for App Service and Container Apps with managed identity and Key Vault.
5. Add backup, restore, migration, load, chaos, and disaster-recovery tests.

## Suggested sprint plan

Assume two-week sprints and one cross-functional product squad.

| Sprint | Goal | Deliverables |
|---|---|---|
| 1 | MVP hardening | Route-level tests, session cleanup, settings, accessibility audit, content metadata |
| 2 | Content scale | Reviewer schema, 50+ additional quests, source-review cadence, versioning |
| 3 | Recommendation v2 | Spaced repetition, feedback, target dates, recommendation telemetry |
| 4 | GitHub verification foundation | GitHub App, installation model, webhook verification, audit records |
| 5 | Verified challenge pilot | Actions/PR/issue rubrics, manual review, provider-outage behavior |
| 6 | Exam depth | Blueprint banks, seeded assembly, adaptive difficulty, item analysis |
| 7 | PostgreSQL and hosted identity | Repository adapter, migration, OIDC, distributed throttling |
| 8 | Organization pilot | Tenant model, campaigns, privacy-safe analytics, admin controls |

Community marketplace and AI review should start only after identity, content versioning, verification audit, and privacy controls are stable.

## Quality gates

Every increment must preserve:

- zero duplicate XP under replay;
- atomic completion/progression;
- server-side ownership and role checks;
- deterministic or persisted recommendation/exam selection;
- original/publicly grounded exam content;
- explicit provider failure;
- keyboard and screen-reader usability;
- database upgrade and rollback plan;
- no committed secrets or learner data.

## Metrics and safeguards

### Learning effectiveness

- Quest start/completion ratio.
- Hands-on and quiz completion ratio.
- Weak-topic improvement after remediation.
- Delayed retention checks.
- Practice readiness calibration.

### Engagement

- Weekly active learners and healthy return rate.
- Time from login to quest start.
- Voluntary streak continuity.
- Boss/raid deliverable completion.

### Quality and trust

- Recommendation relevance feedback.
- Verification precision/recall and manual-review rate.
- Content freshness SLA.
- Provider failure and timeout rate.
- Duplicate XP, authorization, and data-loss incidents.

Avoid optimizing raw session time, streak length, or leaderboard position. Those metrics can reward unhealthy behavior and gaming rather than learning.
