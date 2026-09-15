## Outcome

Describe the learner or operator outcome.

## Changes

- 

## Validation

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`

## Risk and rollout

Describe database, authentication, progression, content, or deployment impact. State "None" if not applicable.

## Checklist

- [ ] XP-producing operations are idempotent and transactionally safe.
- [ ] New APIs validate input and enforce authentication/authorization.
- [ ] External integrations fail explicitly rather than simulating success.
- [ ] Documentation and seed data are updated when behavior changes.
