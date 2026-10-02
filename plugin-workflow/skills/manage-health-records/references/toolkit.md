# Offline toolkit contract

Requires Python 3.10+ only. Resolve `scripts/health_records.py` relative to this
skill, not the repository or current directory. Read `assets/dataset.schema.json`
and `assets/request.schema.json` for the exact envelope and actions. Existing
record and binding schemas remain the interchange format. Validation evaluates
only the bundled schema subset, not arbitrary third-party JSON Schemas.

```bash
python3 scripts/health_records.py validate /private/canonical-readback.json
python3 scripts/health_records.py apply /private/canonical-readback.json /private/request.json --expected-revision 0 --output /private/candidate.json
python3 scripts/health_records.py summary /private/verified-readback.json --output /private/summary.json
python3 scripts/health_records.py report /private/verified-readback.json --output /private/report.html
```

Paths are illustrative. Run from the skill folder or use the resolved absolute
script path. All output paths must be new. The toolkit never replaces inputs or
existing outputs. `summary` without `--output` prints data to stdout: avoid that
in public logs. Success exits 0; validation, revision, or filesystem conflicts
exit 2 with a data-free error. `validate`/`apply` stdout contains only status,
revision and hash. `apply` creates a candidate; it does not save to any provider.

## Dataset and request

Dataset fields: `schemaVersion:1`, stable `datasetId`, integer `revision`, approved
`binding`, `records` and ordered `operations`. Start a new dataset at revision 0,
operations `[]`. A native provider baseline may include existing validated records
at revision 0 after the user approves mapping; never reset history on an existing
portable dataset. Dataset revision and provider version are different counters.

Every applied request adds exactly one receipt and increments dataset revision.
Receipt: `operationId`, `requestHash` (SHA-256 of UTF-8, sorted-key compact JSON
of the request), `action`, resulting `revision`, `recordIds`. Receipts persist with
the dataset, never in an operator registry. Keep them on reopen. Do not fabricate
receipts or discard history to bypass a validation error.

- Append: `{ "operationId": "stable-id", "action": "append", "records": [...] }`.
  Every record must be active and carry that operation ID. Generate UUIDs once
  for a reviewed operation and its observations, then persist/reuse them. Matching
  measurements can be legitimate; values never serve as duplicate keys. Existing
  IDs always conflict unless the exact operation receipt proves this is a retry.
- Correct: `{ "operationId": "new-stable-id", "action": "correct", "recordId":
  "existing-id", "patch": { "value": 44, "rawValueText": "44" } }`. Only metric,
  value, rawValueText, unit, measurementTime and sourceReference are editable.
  `measurementTime` is replaced as a whole. Record ID, native ID and synthetic
  classification stay fixed. Corrected records retain their stable ID and gain
  the correction operation ID. Deleted records require explicit restoration first.
- Status: `{ "operationId": "new-id", "action": "status", "recordId": "existing-id",
  "status": "deleted", "deletedAt": "2026-01-04T00:00:00Z", "userInstruction":
  "Reference to actual user deletion instruction" }`. Restoration uses active and
  deletedAt null. Never synthesize userInstruction: the string is an evidence
  reference, not a permission system. Append/correct cannot change status.

New operations require exact expected revision. An exact retry with a stored
receipt is a no-op even after later operations: it returns the current dataset,
never an older copy. For that retry, expected revision must be either its original
base revision or the current revision. Reusing an operation ID for different
content conflicts. Within a candidate, a whole append is validated before output;
provider batches may still partially fail and must be reconciled separately.

## Report semantics

Summaries label dataset ID, revision and canonical content hash. Active observations
are grouped by exact metric/unit; no conversion, clinical inference or prediction.
Unknown-unit raw values are labeled unknown; no chart/delta is calculated for them.
Only confirmed dated numeric observations enter trends. Visible exclusion counts
cover missing values and uncertain/unknown dates. Date-only and datetime series
are separate; offset timestamps normalize to UTC only for ordering. Equal times
suppress delta/lines. Delta is the observed last minus first, not regression or
causality. Decimal statistics are strings with deterministic precision 40.

HTML is a portable static report with escaped text and inline SVG, no scripts,
remote assets or fetches. Charts use elapsed-time axes, omit missing observations
without filling zeros, and omit connecting lines across missing/uncertain records.
Above 500 points per series, complete tables remain but charts are omitted.
Reports contain health data: keep them in approved user-owned destinations; do
not commit them or publish a preview server. A local file alone is not canonical
storage, nor proof of a provider save.
