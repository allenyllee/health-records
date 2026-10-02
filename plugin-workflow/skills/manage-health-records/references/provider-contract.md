# Provider handoff contract

Discover actual advertised tools and their schemas in the current session. Read
relevant installed provider skills before mutation. Tool names in this document
are examples observed on this host, not universal aliases. No toolkit code calls
connectors. Notion, Sheets, Drive, Library and Space are candidates only when their
observed capabilities support the requested operation. Do not choose a fixed
vendor order or request accounts, tokens, grants, app installation or permission
changes as part of this workflow.

## Choose and pin

Use a verified existing binding first. Otherwise inspect bounded relevant metadata:
canonical dataset ID, exposed account identity, read/create/update capabilities,
sharing audience, native stable IDs, durable readback, and concurrency support.
Installed tools or a successful read do not prove write permission. Permission,
identity and sharing not exposed by tools stay unknown. Store null for unknown
accountReference/canonicalUrl/consent.approvedAt; optional observedAt records
inspection time, never fabricated approval time. sharingObservation can explicitly
say unknown or remain null. A successful mutation verifies only that operation on
that target; it does not establish a general permission or private audience.

Show one concrete target with the known observations and uncertainties; obtain
user approval for that destination, categories and purpose before health-data
transmission. Reuse prior approval when its scope clearly covers the action.
Synthetic consent never authorizes real health data. If privacy/account ownership
cannot be verified, disclose the precise uncertainty and stop dependent real-data
writes until the user can resolve it or knowingly approve that exact uncertainty.
Never use test writes as permission probes. No suitable writable target means a
reviewed local export and clear blocker, not silent migration or backend creation.

Keep binding and durable operation receipts in the approved dataset or explicitly
approved companion metadata in the same user-owned container. Do not create a
metadata container/schema without approval. Provider unavailable means stop writes.

## Library JSON file

When current tools expose them, use Library list/search to resolve exact
library_file_id, and read/materialize via the current Library skill. Owned files
can use replace_library_file; shared files follow that skill's upload route.
Retain the current concrete version and replace the SAME library_file_id with
expected_current_version. The observed direct call shape on this host is:
`replace_library_file(library_file_id=<returned ID>, file=<candidate absolute path>,
expected_current_version=<retained integer>)`; invoke the actual discovered tool,
not this pseudocode. Version conflicts require fresh read and review, never
removing the guard. New creation is only for a user-approved new dataset or copy.

Download/read current complete JSON, validate, build candidate with toolkit using
its separate dataset revision, guarded replace, then fresh-read that same identity
and validate/compare intended record fields, receipts and dataset revision. If
return version is known, use it for fresh read where supported. Retry after unclear
write first reads the same identity and checks receipt/records. Present matching
means saved; conflicting means stop; proven absent means rebuild against current
revision, then guarded retry if still authorized. Search snippets are insufficient.
Preserve returned identity/version metadata with the local file using current
Library helpers. Do not convert a Site-backed Library projection into a dataset.

## Sheets

Resolve spreadsheet ID, native tab ID, header mapping and a bounded complete read
of relevant rows (paginate; record bounds). Keep recordId and operationId columns;
retain native spreadsheet/tab identities in the binding. Never use row number as
identity. Re-query stable ID immediately before correction and verify exactly one
match; zero/multiple matches stop. Use exact bounded cell ranges and current tool
schemas, not whole-sheet overwrite, sorting, clear or row removal. Read back the
exact affected ranges and reconcile all items of a batch. No RAW/USER_ENTERED
assumption: select literal/RAW writes only if the real tool supports them to avoid
formula injection from raw text, or stop if safe literal storage is unavailable.

Persist dataset revision/receipts in approved metadata cells/tab if supported.
If durable receipts cannot be represented, the portable retry guarantee is not
available; explain and stop retry-dependent writes. Row writes plus receipt writes
may not be atomic. After partial success, reconcile stable IDs and request hashes;
never replay already completed rows or advance metadata blindly. A transactional
batch is not atomic conditional read/write. Without CAS, reread affected rows and
metadata just before mutation, serialize agent writes, disclose residual races,
and require a single-writer arrangement for this workflow.

## Notion

Use discovered fetch/query tools to inspect the actual database/data-source and
page property schema and permitted bounded rows. If an access-inspection tool is
missing (for example get_tool_access), do not call it: current fetch/self metadata
may identify an account but does not establish target write permission or sharing.
Resolve those facts with available tools; unavailable facts stay unknown.

Store recordId/operationId in approved native properties, retain returned native
page IDs in providerRecordReference, and keep an approved property/block mapping
for revision and receipts. Query exact stable record IDs before append; complete
pagination is required to claim absence. Correct using fetched native page ID,
verify it still has the intended stable recordId and reread last-edited metadata
immediately before mutation. Use actual exposed page/property update schemas.
Read back each affected page by its stable page ID. Preserve unrelated properties
and blocks. Native IDs assigned after create are provider mapping metadata; only
fill the returned ID, never rewrite a conflicting known native ID.

Last-edited timestamps are best-effort checks, not CAS. Disclose races and use a
single writer unless true conditions are available. Portable receipts may need
multiple property/block writes; incomplete batches require reconciliation. A
status property is a tombstone only if the approved schema supports it. Notion
archive/trash is not this reversible status operation. No automatic hard delete.

## Drive files and Space Pages

Drive JSON replacement is suitable only with same-file identity, full readback
and conditional version semantics actually exposed. Do not infer these from a
Drive brand name. Space ordinary Pages, native documents, artifacts, Library files
and Sites have distinct APIs. Use current Page tools only if exact content,
identity and conflict behavior can be represented without destroying unrelated
content. Local workspace files, widget state and chat memory are not canonical
storage. Do not invent generic Space CRUD or adapter APIs. Unsupported required
capabilities remain blockers.

## Common completion rule

Toolkit expected-revision guards local snapshots only; they cannot create provider
atomicity. After provider write, read fresh canonical data and compare exact stable
IDs, requested fields, operation IDs, status and receipts. Then use that readback
for summary/report. Label source revision and disclose bounded/incomplete reads.
Say saved only after verification; distinguish partial and unknown outcomes.
