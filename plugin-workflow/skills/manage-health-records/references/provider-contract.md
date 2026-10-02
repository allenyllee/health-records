# Provider-neutral capability contract

Use only tools actually advertised and authorized in the current host. The
operation names below describe responsibilities; they are not callable APIs.

## Required observations

- Provider/account identity, including multiple connected accounts
- Canonical target ID and verified user-openable link
- Relevant read/write access and actual sharing audience; unknown stays unknown
- Exact created/updated-object or bounded-range readback
- Stable record identity across reopens and duplicate lookup
- Available create/append/update/soft-delete behavior for this target
- Real conditional-write support versus best-effort last-edited checks
- Durable destination of writes, distinguished from UI state/materialized copies

Read-only tasks require only relevant read capabilities. New datasets require
container creation and readback; existing datasets need not allow new containers.
Images/attachments are optional and need separate user intent.

## Conceptual operations

inspectCapabilities, resolveDataset, readRecords, findRecordIds, createRecords,
updateRecord, readBack and markDeleted are adapter responsibilities. Map them to
observed tool names, schemas and permissions in the current session. Never invoke
these invented names or assume support from the provider's brand.

## Provider examples

### Notion

Inspect the exact database/data-source schema. Use native pages/rows and stable
record-ID properties; retain returned native page IDs and read them back. A
last-edited timestamp is not an atomic compare-and-swap token. Missing query or
update capability does not justify rebuilding the database. Use a deleted status
property only when supported by the approved schema. Archive/trash has separate
semantics and is not a substitute without authorization.

### Drive / Sheets

Ground spreadsheet ID, tab ID, headers and bounded ranges. Keep a stable record-ID
column; row numbers alone are unstable. Re-read affected cells before corrections.
Batch atomicity, when documented, does not make a prior read and later write one
transaction. Avoid concurrent writers without conditional-write support. Use raw
JSON/CSV files only when exact read/replace/version capabilities exist.

### ChatGPT Space / Library

Use supported host-native operations actually available to the agent. Pages,
files and Sites are distinct types. Existing agent file tools do not grant their
permissions to an external iframe or PWA. Verify updates preserve the intended
identity and save to the canonical provider rather than a local copy. Widget
state, model context and chat memory are not record storage. Upload/select helpers
do not imply a general create/list/update/delete interface.

### Other providers

Apply the same capability checks with no fixed allowlist or ranking. Use only the
approved container and bounded data. Unsupported operations stay unsupported.

## Binding

Keep the approved provider/account reference, canonical dataset, categories,
schema version and consent scope with the user's dataset when supported. A saved
binding records a decision; it grants no authority beyond current instructions,
permissions and required confirmations. Never store credentials in a binding.
