# Contributing

Thank you for improving LevelUp Architect. Changes should preserve the product’s central guarantee: every visible progression result is backed by persisted, validated evidence.

## Development workflow

1. Use Node.js 22 LTS and run `npm ci`.
2. Copy `.env.example` to `.env.local`; use only local/test credentials.
3. Create focused changes that follow existing domain, service, API, and UI boundaries.
4. Add or update tests for progression, XP, streak, recommendation, readiness, exam, validation, or authorization behavior.
5. Run:

   ```powershell
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

6. Complete the pull request template, including risk and rollout notes.

## Engineering expectations

- Keep domain math pure when possible; persistence belongs in services.
- Wrap multi-record progression operations in one SQLite transaction.
- Give every XP-producing event a deterministic, learner-scoped idempotency key.
- Validate request bodies with Zod and authenticate before reading learner data.
- Enforce roles in services or route handlers; hiding UI is not authorization.
- Prefer official GitHub and Microsoft sources and record the source URL.
- Make unsupported integrations return an explicit error. Never generate success-shaped placeholder evidence.
- Avoid SQLite-specific behavior in domain logic so PostgreSQL migration remains straightforward.
- Maintain keyboard navigation, visible focus, semantic headings, labels, loading states, empty states, and errors.

## Content contributions

Quest content must include a measurable objective, an official source where possible, a hands-on outcome, estimated time, difficulty, prerequisite domains, and a review date. Questions require one unambiguous best answer and an explanation. Certification content must not claim endorsement or reproduce protected exam material.

Marketplace publishing and reviewer workflow are roadmap capabilities. Until implemented, submit content changes through pull requests for normal code review.

## Database changes

Increment `SCHEMA_VERSION`, add an ordered migration instead of rewriting an applied migration, update `docs/ARCHITECTURE.md`, and test both a fresh database and an upgrade fixture. Never commit generated `.db`, WAL, or SHM files.

## Reporting problems

Use the issue forms for bugs and features. Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).
