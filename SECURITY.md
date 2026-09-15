# Security Policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use the repository’s **Security → Report a vulnerability** workflow to create a private GitHub Security Advisory. Include affected version/commit, prerequisites, reproducible steps, impact, and any safe mitigation.

Do not include real credentials, session cookies, private learner data, or proprietary repository evidence. A maintainer should acknowledge a complete report within five business days and coordinate remediation and disclosure based on severity.

## Supported versions

The latest `main` branch and the latest tagged release receive security fixes. Pre-release branches are supported only while actively under review.

## Production hardening

Before production:

- Set a unique, randomly generated `AUTH_SECRET` with at least 32 characters.
- Keep `SEED_DEMO_USER` unset or `false`.
- Terminate TLS at the platform and preserve secure-cookie behavior.
- Store secrets in the hosting platform or Azure Key Vault; never expose them as `NEXT_PUBLIC_*`.
- Restrict filesystem and database access to the application identity.
- Back up the database and test restore procedures.
- Use PostgreSQL before running multiple application replicas.
- Add centralized rate limiting and session revocation for Internet-facing deployments.
- Review official resource URLs and content on a defined cadence.
- Treat challenge evidence URLs and mentor messages as potentially sensitive learning data.

## Known MVP boundaries

- Login throttling is process-local and intended for a local/single-instance MVP.
- SQLite serializes writes and is not a horizontal-scaling database.
- Challenge evidence is learner attestation; no GitHub activity is verified.
- Local mentor output is deterministic guidance, not professional certification or security advice.
- An external mentor provider receives the submitted message and derived learning context only when explicitly configured by the operator.

These boundaries are documented to prevent security-through-assumption. Planned mitigations are tracked in [docs/ROADMAP.md](docs/ROADMAP.md).
