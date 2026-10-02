# Deployment guide

## Supported local synthetic path

Use the README's local commands. The generic `wrangler.local.jsonc` and Vite configuration refer to the same local placeholder D1 binding. Apply migrations before starting the dashboard. `.dev.vars`, `.wrangler/`, build outputs and database files must stay out of source control.

The local mock user is a synthetic fixture. Do not use it as a production owner, attach real records to it, or expose the development server publicly.

## Independent private Sites deployment

1. Create or select an independently authorized private Sites project. This candidate does not target an existing account or project.
2. Configure a private audience and a D1 binding named `DB` through the platform. Preserve the platform's trusted authentication gateway and prevent direct worker bypass.
3. Supply `HEALTH_PUBLIC_ORIGIN` as the new deployment's HTTPS origin. Do not copy another person's deployment URL.
4. Apply the included SQL migrations through the platform's supported deployment flow to the new database.
5. Deploy code first with real-record mode disabled. Verify unauthorized requests are rejected and synthetic users cannot access each other's records.
6. Only after the actual owner's informed consent, privately set both `HEALTH_REAL_OWNER_ID` to the verified Site-scoped identity and `HEALTH_REAL_CONSENT_VERSION=owner-photos-structured-v1`. Neither value belongs in public Git history. An identity must come from a verified request, not an arbitrary client flag.
7. Run isolated synthetic checks first. Verify exported records, privacy controls, phone behavior and image/date handling before entrusting actual health information.

No cloud account is provisioned, remote migration executed, or deployment performed by this candidate.

## Self-hosting outside Sites

The current build uses Workers/D1 interfaces and is not a generic `next start` server. An independent deployment needs:

- Cloudflare Workers/D1 infrastructure, or explicitly implemented replacements for those APIs
- A production-grade authenticated gateway with verified identity mapping, forged-header stripping, and no unauthenticated direct origin
- Safe sign-in/sign-out/callback handling and any separate OAuth registration required by the identity provider
- A supported MCP host for the embedded UI and image channel
- Private access controls, secure operations, data retention and backups appropriate to sensitive health information

These pieces are not supplied as a turnkey self-hosted deployment. Do not expose the built worker directly as an authenticated service. `npm run build` proves bundling only, not an independently secure production deployment.

## Authentication versus model access

The app uses platform-provided identity. It has no independent SIWC exchange implementation or inference credential. Public source publication is separate from any provider's program eligibility, client registration, OAuth scopes, review, rate limits, or model-token grant. No such grant is promised here.

## Release hygiene

Publish a new, reviewed source snapshot. Do not push the original private Git history. Exclude dependencies, build outputs, local runtime state, database files, screenshots, photos, exports, logs, private notes and environment values. Select and add the original-code license only after approval; preserve applicable third-party notices and confirm provenance. Keep `package.json` marked private unless a separate npm package release is intended and reviewed.
