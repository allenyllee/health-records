---
name: manage-health-records
description: Organize, add, correct, query, and summarize a user's health records using their existing connected storage and ChatGPT analysis. Use for personal recordkeeping requests; not for diagnosis or treatment decisions.
---

# Manage user-owned health records

Use ChatGPT's available analysis and the user's existing connected storage. This
package is a workflow, not a backend or access grant. It has no model API key,
storage account, remote MCP endpoint, or automatic provider setup.

## Resolve the data home

1. Identify the requested action and data categories. Read-only questions do not
   authorize writes, uploads, new datasets, sharing, or migration.
2. Find an existing verified dataset binding in user-provided context or approved
   dataset metadata. Use its canonical provider/account/container IDs. A matching
   filename or title alone is insufficient.
3. With no binding, inspect the actually available connected storage tools and
   relevant documentation. Prefer an existing suitable dataset, then the user's
   explicit preference. Otherwise choose the least-friction connected destination
   whose actual capabilities meet the task. Never rank by a fixed vendor order.
   Notion, Drive/Sheets, Space/Library and others are candidates only when usable
   tools are available. An installed app or login does not prove write access.
4. Inspect only necessary metadata to verify account, target, permissions, sharing
   and readback. Unknown facts stay unknown/null; disclose any unresolved account
   or sharing uncertainty before approval. Do not run test writes to discover
   authorization or capability.
5. Propose one exact destination. Before first health-data transmission, obtain
   explicit approval naming service/account, target, data categories and purpose.
   Ask whether it should remain the data home for future recordkeeping requests.
   This does not authorize unrelated data, users, automation or sharing. Verify
   inherited access rather than assuming a new file will be private.
6. Save the approved binding only with the user's dataset or supported user-owned
   context. If a later conversation cannot recover it, ask for its canonical link.
   Do not maintain an operator registry. If the bound provider is unavailable,
   stop dependent writes: never switch providers, replicate, migrate, or request
   new persistent permissions silently.

Read [provider-contract.md](references/provider-contract.md) when choosing or
mapping storage. Conceptual adapter operations are responsibilities, not APIs.

## Read, extract, review, save

- Inspect user-supplied images with ChatGPT's own available analysis. Do not send
  images, records or tokens to a plugin-operated service. Preserve original images
  in their supplied location unless saving them elsewhere is explicitly requested.
- Preserve source values, units and uncertainty. Upload time is not measurement
  time. Keep uncertain normalized dates/times/units null and retain raw wording.
  Ask about ambiguities that affect correctness; do not guess clinical facts.
- Read the target's current schema and relevant records. Preserve unrelated
  content, permissions and formatting. Use stable record/operation IDs. Follow
  [write-safety.md](references/write-safety.md) for conflicts and uncertain writes.
- Review ambiguous extracted values before saving. Choosing a destination does
  not waive applicable confirmations or approve consequential guesses.
- Write only requested records to the pinned destination. Read back the exact
  returned records or bounded cells and compare IDs, values, dates and units.
  Say saved only after verification; report partial or unknown results accurately.
- Build trends/reports from the canonical stored records, not conversation memory.

The [portable format](references/record-format.md) and schemas under assets are
interchange definitions. Map to native provider columns/properties; do not force
JSON files onto an existing Notion database or Sheet.

## Execute the offline toolkit

Read [toolkit.md](references/toolkit.md) for exact commands, dataset/request
schemas and retry semantics. Use the self-contained `scripts/health_records.py`
with Python 3.10+ and no dependency installation. First materialize a complete
canonical dataset snapshot through the actual provider tool. Validate it, apply
the authorized request with its expected dataset revision to a new candidate
path, then hand off through [provider-contract.md](references/provider-contract.md).
Local revision checks do not provide provider atomicity. After saving, read fresh
canonical records and metadata before generating summary or static HTML report.
Keep real datasets/candidates/reports out of the source tree and public logs.

Native tables/pages require mapping approved columns/properties and durable
receipts to this snapshot. Missing metadata, pagination, safe literal writes or
readback is a blocker; do not quietly weaken the mutation guarantee. A new schema
or companion metadata location requires user approval. Do not impose JSON on a
usable native dataset.

## No suitable storage

Explain the precise missing capability. Offer a reviewed downloadable export or
explicitly requested connection setup. Do not invent Space write APIs, reuse
captured credentials, create a backend, or promise unverified synchronization.
An independent PWA does not inherit ChatGPT's connectors or analysis credentials.

This source package has an offline validated toolkit. Installation, public
listing and complete installed-skill workflows are unverified. Synthetic Library
connector checks are scoped in the package README; they do not prove Notion,
Sheets, mobile or real-health-data behavior. No operator infrastructure or model
API billing is required; the user's ChatGPT and storage access still apply.
