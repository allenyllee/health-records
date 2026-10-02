# Write safety

## Idempotency

Assign an operation ID to an intended import and stable record IDs before writing;
reuse them on retries. Keep IDs with the user's records so an uncertain result
can be checked. An authorized source/import fingerprint can identify a repeated
source in a later conversation. Matching values alone do not prove duplication:
repeated measurements may legitimately match.

Before creating records, query the exact IDs. If filtering is unavailable, use a
bounded complete paginated read of the relevant records. If completeness cannot
be established, do not claim absence or blindly repeat a prior uncertain write.
Do not invent an idempotency parameter that the provider does not support.

## Concurrency and ambiguous results

Use returned ETag/revision conditions when actually supported. Stop on conflict;
re-read and review a merge rather than removing the condition. Without atomic
conditional writes, re-read immediately before mutation, avoid parallel writers
and disclose residual race risk. Do not promise exactly-once behavior.

After timeout or unclear response, read the affected IDs/range first. Present and
matching means verify success; present but conflicting means stop for review.
Retry only when reliable evidence establishes no write occurred and the action
remains authorized. Otherwise leave it uncertain. Check every item in a batch
and do not replay completed rows. Compare IDs, dates, metrics, values, units,
statuses and operation IDs in exact readback, not a stale search snippet.

## Corrections and deletion

Read the current record by stable ID. Change only requested fields. Preserve a
correction/revision reference where the existing provider format supports it;
do not silently add an audit service or change the dataset schema.

When recoverable deletion is requested and the approved schema supports it, mark
status deleted and record a deleted-at timestamp. Exclude tombstones from reports
by default. This is not erasure; bytes may remain in history/backups. Explain that
when the user asks to erase data. Hard deletion, retention changes, or new schema
changes need their own authorization. Notion archive, Sheet row removal and
Library trash are not interchangeable operations.

## Uncertain extraction

Keep raw source text and explicit normalized fields. Unknown normalized dates,
times and units remain null. EXIF/camera time is a clue, not proof of measurement
time. Do not infer timezone from current location without confirmation. Keep
misleading or materially ambiguous values in a review draft; never silently write
today's date, a guessed year or an inferred diagnosis/medication.
