# Source candidate review

Reviewed 2026-10-02. This records the engineering preparation of the published source snapshot. It is not a security certification or legal clearance. Original code and associated documentation are licensed under [MIT](LICENSE); third-party license scopes remain separate.

## Included and excluded material

The candidate was generated from tracked source files only, without any original Git history. Deployment-specific project identifiers and hard-coded private URLs were removed. The widget now uses a validated runtime origin, disabled when unconfigured. The package includes application source, MCP tools/UI, schema-only migrations, synthetic tests, generic local configuration, docs, and retained vendor notices. Unused connector-preview templates, unused UI components and generic helper scaffolding were removed; straightforward build/dev commands and a minimal Worker entry replace the excluded helpers.

No production database was queried or exported for this preparation. No credential store, environment secrets, session history, original photo, health export, private note, screenshot, runtime log, installed dependency directory, or compiled application is included in the publication snapshot. The two retained PNGs were visually checked: they are generic pulse icons with only standard PNG image/resolution chunks.

Only synthetic identities, health values, and date fixtures are included. Schema migration metadata UUIDs are migration identifiers, not user identities. Historical transport diagnostic rows are not included.

The source audit script scans text for a bounded set of credential/identifier patterns and rejects common private-artifact filenames. It cannot prove the absence of every possible secret or personal datum; manual review and an independent scanner remain advisable before release.

## Verification on the candidate

- Separate skills-only workflow: 12 offline schema/source tests passed; its live-provider and installation behavior remain unverified
- Unit/render/metadata/widget tests: 35 passed
- D1/API/MCP integration checks: 37 passed
- Race-condition checks: 2 passed
- Event discovery and configurable-origin checks: 17 passed
- TypeScript check: passed
- Production build: passed
- Local schema migration: all 3 migrations passed against an isolated empty database
- Local smoke checks: unauthenticated API rejected, spoofed identity headers stripped, loopback synthetic sign-in worked, real data remained disabled, empty migrated demo database loaded, and dashboard rendered HTTP 200
- Lint: passed after separating event-driven loading indicators from asynchronous response updates; generated fixture/build directories are excluded
- The final reduced source was rebuilt and the local smoke checks rerun successfully

Existing installed dependencies were reused to avoid a network installation; a fresh `npm ci` was not independently exercised. No cloud deployment, remote database migration, GitHub CI, mobile visual/browser test, model-extraction accuracy test, dependency vulnerability scan, penetration test, or self-hosted OAuth/gateway verification is established by these results.

## Release gates

1. Retain the project's [MIT license](LICENSE) and the verified, scoped notices for copied OpenAI Sites/shadcn source; preserve all applicable dependency terms
2. Publish only the reviewed file list, excluding generated runtime/build state and the original history
3. Verify remote file/tree hashes after upload before claiming success
4. Before enabling real data on any new deployment, establish private audience, trusted authentication/no bypass, owner consent, and actual device/host behavior

The current privately hosted service is separate from this publication candidate and was not changed by this preparation.
