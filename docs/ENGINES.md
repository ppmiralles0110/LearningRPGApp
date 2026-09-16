# Progression, Recommendation, and Exam Engines

## Gamification engine

### XP sources

XP defaults are persisted in `xp_config` and can be changed without modifying domain logic:

| Source | Default XP |
|---|---:|
| Reading | 10 |
| Lab | 25 |
| Quiz (correct) | 15 |
| Challenge | 50 |
| Boss battle | 150 |
| Raid | 500 |
| Certification evidence | 1000 |
| Streak milestone | Variable |

An incorrect quiz answer records the attempt and completion but awards zero quiz XP. Recording learner-attested certificate evidence awards certification XP once per supported credential; replacing its file cannot award XP again. Practice exams do not award 1000 XP.

### Idempotency and transaction model

Each reward has a unique learner-scoped event key:

```text
quest:{questId}:step:{stepId}
streak:daily:{periodKey}
certification:{certificationCode}
```

`UNIQUE(user_id, event_key)` is the final defense against duplicate XP. A quest-step transaction:

1. Reads and authorizes the learner-owned quest.
2. Rejects an unknown step or invalid quiz answer.
3. Returns an idempotent result if the step already exists.
4. Inserts the completion and XP ledger event.
5. Updates domain mastery, confidence, attempts, and correct-answer count.
6. Updates challenge progress.
7. Completes the quest only when every template step is persisted.
8. Advances streaks and evaluates achievements.
9. Commits all changes or none.

Hands-on steps add four ordered, persisted checkpoints: prepare, execute,
validate, and document. A learner cannot complete a later checkpoint before its
predecessors or claim step XP before all checkpoints are complete. Reopening a
checkpoint also reopens every dependent checkpoint.

### Level curve

Levels range from 1 to 100. XP required to enter level `L` is:

```text
completedLevels = L - 1
requiredXP(L) = completedLevels × (500 + (completedLevels - 1) × 50) ÷ 2
```

This is the cumulative sum of per-level costs beginning at 250 XP and increasing by 50 XP. The early campaign moves quickly; high levels require sustained practical work. Level 100 is a hard cap.

| Levels | Tier |
|---|---|
| 1–9 | Novice |
| 10–24 | Explorer |
| 25–39 | Practitioner |
| 40–54 | Specialist |
| 55–69 | Architect |
| 70–84 | Master Architect |
| 85–100 | Legend |

### Streaks

Period keys use UTC to make server behavior deterministic:

- Daily: `YYYY-MM-DD`
- Weekly: ISO-style Monday start date
- Monthly: `YYYY-MM`

The same period key never increments a streak twice. The immediately previous key increments; any gap resets to one while preserving `best_count`.

Daily milestone bonuses:

| Milestone | Bonus |
|---|---:|
| Every 3 days | 10 XP |
| Every 7 days | 25 XP |
| Every 14 days | 50 XP |
| Every 30 days | 100 XP |

The largest applicable milestone wins. The period-key XP event prevents a second quest on the same day from farming the bonus. A future timezone setting can replace UTC key generation without changing the storage model.

### Achievements

The MVP evaluates:

- **First Lab:** first persisted hands-on step.
- **GitHub Explorer:** three GitHub-domain steps.
- **Copilot Champion:** completed GitHub Copilot quest.
- **Foundry Builder:** Azure AI Foundry hands-on completion.
- **AI Security Defender:** AI Security boss battle.
- **Certification Warrior:** practice score at or above 70% or recorded certificate evidence.

Achievements use a learner/code primary key, so repeated evaluation is safe.

## Adaptive recommendation engine

### Inputs

For each candidate and learner:

- Default domain priority.
- Ordered learner focus rank.
- Domain mastery.
- Learner confidence.
- Recent quiz/exam accuracy.
- Available daily minutes.
- Template duration and difficulty.
- Required prerequisite domains.

### Prerequisite gate

A candidate is eligible only when every prerequisite domain has mastery of at least 30. The gate is intentionally understandable. Future content-level dependency graphs can be added after the platform has enough authored content to justify them.

### Score

The current deterministic score is:

```text
score =
  adjustedDomainPriority × 5
  + focusBonus
  + masteryGapBonus
  + confidenceGapBonus
  + accuracyGapBonus
  + timeFitBonusOrPenalty
  - difficultyDistancePenalty
```

Details:

- Focus bonus is strongest for rank 1 and decreases by rank.
- Mastery below 50 increases the score.
- Confidence below 50 increases the score independently.
- Accuracy between 1 and 69 increases remediation priority.
- A candidate fitting the available window receives a bonus; overrun is strongly penalized.
- Ideal difficulty is derived from mastery in 25-point bands.

Ties are resolved by stable template ID. Quest generation selects deterministically from the top three using learner, cadence, and period key, which balances recommendation quality and content rotation without random test failures.

### Explanation

The ranker returns reasons such as:

- Matches a selected focus area.
- Builds a current skill gap.
- Strengthens low-confidence knowledge.
- Remediates recent quiz performance.
- Fits the 45-minute study window.

The UI displays the top reasons. This makes adaptation inspectable and debuggable rather than an opaque “AI recommendation.”

### Future evolution

The next model should add content freshness, spaced-repetition due date, certification target date, prerequisite confidence, challenge evidence quality, and learner feedback. Any learned model should run in shadow mode against the deterministic ranker before influencing production recommendations.

## Certification readiness engine

### Roadmap

The seeded recommended order is:

1. AZ-900
2. GitHub Foundations
3. AI-900
4. SC-900
5. GitHub Administration
6. GitHub Copilot
7. AZ-204
8. AI-102
9. GitHub Advanced Security
10. AZ-305

This is a sensible default, not a mandatory path. Readiness and learner focus can guide a different order.

### Readiness formula

With recent practice evidence:

```text
readiness = averageDomainMastery × 0.50
          + averageLastFiveExamScores × 0.35
          + confidence × 0.15
```

Without practice evidence:

```text
readiness = averageDomainMastery × 0.50
          + confidence × 0.35
```

The missing 15% represents absent exam evidence rather than silently assuming an exam score. Readiness is rounded and capped at 100.

Status:

- `planned`: below 35
- `preparing`: 35–79
- `ready`: 80 or above
- `certified`: learner-attested certificate evidence has been recorded; readiness updates do not overwrite it

The score is guidance and should be calibrated with future anonymized outcome
data before organizational use. Uploaded PDF/image evidence is private to its
owner and marks the roadmap credential as certified with 100% progress. This is
an evidence record, not live verification with Microsoft or GitHub.

## Practice exam engine

### Question model

Questions have certification, domain, type, difficulty 1–5, optional case context, prompt, ordered options, one answer index, and explanation. Types are multiple choice, scenario, and case study.

Protected vendor exam questions must never be copied into this catalog. Seed questions assess public objectives using original scenarios.

### Attempt lifecycle

1. Validate certification, difficulty, and duration.
2. Apply a 60-question difficulty blueprint to the certification's 100-question bank.
3. Prefer questions absent from the learner's immediately previous attempt, then fill unavoidable overlap.
4. Shuffle the selected set using the unique attempt ID and persist its exact order with the server start time.
5. Return prompts/options without answers.
6. On submission, authorize ownership and check server deadline.
7. Require exactly one valid answer for every persisted question.
8. Score overall and by domain.
9. Persist answers, explanations, result, skill changes, readiness, and achievement in one transaction.

Every certification has 100 original, publicly objective-aligned practice
questions distributed evenly across difficulties 1–5 and the three supported
question types. The bank combines individual decisions with two-concept
architecture scenarios and rationale questions; all 100 rendered prompts are
distinct. Five blueprints shift emphasis toward the selected difficulty while
retaining foundational and stretch questions. An assessment includes at most two
questions for the same objective or objective pair. Selection and shuffling occur
server-side; the unique attempt ID produces fresh order while an injectable seed
keeps unit tests deterministic. The exact attempt snapshot is immutable. Catalog
questions removed by a future release are marked inactive so historical attempt
snapshots remain reviewable without retired content entering new assessments.

### Scoring and remediation

```text
score = correct ÷ total × 100
practice threshold = 70%
weak topic = topic score below 70%
```

Results show topic counts/percentages, correct options, explanations, and a remediation action: return to a matching daily quest, explain the concept, and retry with scenario practice.

## Mentor engine

Local mode is a deterministic rule engine grounded in:

- active quest;
- weakest focused domain;
- mastery;
- study window;
- next certification checkpoint;
- intent keywords for time, difficulty, certification, and next action.

It works offline and stores learner/mentor messages. The optional `openai-compatible` adapter sends only the submitted message and derived context to the configured endpoint. Configuration, HTTP, timeout, parsing, and empty-response failures are explicit.

Future mentor providers should implement a typed interface, redact organization-sensitive evidence, log consent and provider selection, constrain tool access, evaluate quality/safety, and preserve the local fallback as a user-selected mode rather than silently switching behavior.
