# Security and privacy

This prototype stores sensitive health information. Source availability does not certify security or regulatory compliance.

## Production requirements

- Keep the deployed app owner-private even if its source is public.
- Put a trusted authentication gateway in front of every app/API/MCP data path. It must verify identity, strip client-supplied identity headers, and prevent origin bypass.
- Real-data mode is disabled unless both the verified owner ID and informed-consent marker are configured privately.
- Never include original photos, health exports, production database files, private runtime settings, tokens or logs in a repository, issue, attachment or test fixture.
- Use synthetic data for tests and examples. Tests must never target a personal database.
- Keep required dependency notices and update vulnerable dependencies through a reviewed process. This candidate has not had a network vulnerability audit or independent penetration test.

## Known limitations

- Identity-header trust is supplied by the hosting gateway, not cryptographically verified by application code.
- Data is not end-to-end encrypted by this application. Structured records and date provenance exist in D1. Soft-deleted entries remain recoverable.
- An image selected in the embedded UI is sent to the active host/model after explicit consent, although the app does not persist it. Direct chat attachments are outside this browser sanitation path.
- Model extraction, unsupported image formats and incorrect date evidence can be wrong. Review uncertain fields and actual mobile behavior.
- Background event subscriptions remain disabled; discovery is not evidence that automated processing works.

## Reporting

Do not post health data or credentials in public issues. The maintainer must choose a private vulnerability-reporting channel (for example, repository private security advisories). No dedicated reporting address is configured in this source snapshot.
