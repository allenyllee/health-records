# Architecture

## Request and data flow

1. A trusted gateway authenticates the user and injects `oai-authenticated-user-*` headers. The application accepts these headers as already verified; it does not verify an OAuth token itself.
2. `/` renders the React dashboard. `/api/health` and `/mcp` both call the same owner-scoped store and D1 tables.
3. Requests identify a real or synthetic-demo namespace. Real writes additionally require a matching configured owner and the exact consent-version marker.
4. Date evidence, units, uncertainty and required values determine whether a current user-supplied record can be saved or must remain a draft. Source request keys handle retries; distinct observations remain separate.
5. The MCP HTML resource supplies a host-mediated image/message bridge. The browser reads bounded date metadata, strips hidden metadata by re-encoding, and sends the sanitized image only through a supported host channel after explicit consent.
6. The host/model produces structured values. No backend image-analysis API or background worker is configured by this code.

## Main modules

- `app/dashboard.tsx`: dashboard, manual entry, draft review, trash, export and pagination
- `lib/health.ts`, `lib/date-evidence.ts`: record validation, date provenance and synthetic fixtures
- `lib/store.ts`: D1 storage, identity scoping, namespace/consent checks, idempotency and audit events
- `lib/mcp.ts`, `lib/widget.ts`, `lib/widget-bridge.ts`: tool surface, HTML UI and host communication
- `lib/photo-metadata.ts`: bounded JPEG metadata parsing and sanitation helpers
- `lib/site-config.ts`: operator-provided public-origin validation
- `drizzle/`: schema migrations only; no database contents
- `public/sw.js`: generic offline fallback, not offline health storage

## Trust boundaries

The internet client is untrusted. A direct-to-worker deployment that accepts arbitrary identity headers is unsafe. Only a gateway that authenticates users, strips/replaces forged headers, and prevents bypass access may feed this app in production. Merely adding TLS, setting an owner ID, or checking an Origin header does not solve this authentication requirement.

Sites-managed hosting supplies platform services outside this repository. Unused connector-preview scaffolding and helper scripts are excluded from this source package. Local health tests and dashboard behavior do not require an external connector.

D1 persists structured health data, which remains sensitive even though original photos are excluded. Soft deletion is not erasure. Operators must manage private access, backups, retention and any legal requirements separately.

The `health_transport_probes` table is retained as an empty schema compatibility artifact. No historical diagnostic rows are included, and no route can send the former transport test requests. Event subscription remains disabled.

## Future direction, not implemented

A thinner plugin using user-controlled ChatGPT storage/Space and host analysis is a possible future direction. The required storage APIs, authentication scopes, eligibility and end-to-end behavior have not been verified or implemented here. This repository remains the current D1-backed prototype. No data migration, deletion, or storage replacement is part of this source preparation.
