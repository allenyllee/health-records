# Health Record Workflow

A skills-only plugin with a self-contained Python toolkit. ChatGPT interprets
user-provided records, discovers available connected storage, confirms one exact
user-owned destination, and reuses it. No operator backend, database, photo store,
model API key, provider SDK, network listener or telemetry is included. The user's
ChatGPT usage and storage access still apply.

The separate Sites application stays a prototype; this package does not deploy,
modify or migrate it. Source publication does not install a plugin or create a
public plugin listing.

## Run and package

Python 3.10+; standard library only. From this directory:

```bash
python3 tests/validate.py
python3 tests/test_package.py
python3 scripts/build_plugin.py --output /tmp/health-record-workflow-0.2.0.zip
```

The output must not exist. ZIP entries sit at the plugin root with portable
`plugin.json`, compatibility `.codex-plugin/plugin.json`, skill, runtime schemas,
fixtures, references, tests and MIT notices. The deterministic allowlist excludes
application source, parent files, private datasets, logs and deployment configs.
The skill alone can also be copied as a personal skill: everything it runs lives
inside `skills/manage-health-records/`, including its LICENSE. No repository
parent is required.

A synthetic offline walkthrough, from the skill directory:

```bash
python3 scripts/health_records.py validate assets/synthetic-empty-dataset.json
python3 scripts/health_records.py apply assets/synthetic-empty-dataset.json assets/synthetic-append.json --expected-revision 0 --output /tmp/demo-candidate.json
python3 scripts/health_records.py apply /tmp/demo-candidate.json assets/synthetic-correction.json --expected-revision 1 --output /tmp/demo-corrected.json
python3 scripts/health_records.py report /tmp/demo-corrected.json --output /tmp/demo-report.html
```

These are local synthetic candidates, not provider saves. Exact CLI, schema,
idempotency, revision and report rules are in
[toolkit.md](skills/manage-health-records/references/toolkit.md).

## Installation and use

Use the host's current supported personal-skill import workflow for the complete
`manage-health-records` directory, or its plugin import/local-source flow for the
ZIP. Do not upload this as an MCP server or register a URL: no MCP is bundled.
Where a host only accepts public-directory submissions, a ZIP alone does not
install it; stop and report that surface's missing private import capability.
Plugin/skill import availability and admin policy vary by surface. Do not grant
new connector permissions merely to install this package. Installation has not
been performed or verified by this implementation task.

Invoke `$manage-health-records` or the host's skill picker with a request such as:
“Save this measurement to my existing health dataset” or “Summarize the records
already saved in my confirmed dataset.” For a first destination, the agent must
identify an actually writable store with necessary readback/identity capabilities,
show the exact target and unresolved account/sharing observations, and obtain
approval before transmitting health data. A read-only question never authorizes
a write. No usable writable store means a reviewed local export and a precise
blocker. No fixed vendor priority, silent migration or operator registry exists.

The workflow supports append/correction with stable IDs and persistent retry
receipts, optimistic dataset revisions, instructed deleted/active status changes,
and reports from fresh canonical readback. Provider guards remain separate.
[Provider handoff rules](skills/manage-health-records/references/provider-contract.md)
cover same-ID guarded Library replacement, Sheets stable-ID bounded ranges and
Notion stable page IDs, partial writes and absent capabilities.

## Validation boundary (2026-10-02)

- Executable offline tests cover schema rejection, atomic candidate append,
  deduplication after reopen, conflicting operation IDs, correction field
  preservation, stale revision, delete/restore, timestamp/unit separation,
  exclusions, escaped static reports and no output overwrite.
- ZIP tests rebuild deterministically, extract to a temporary directory, run its
  tests/toolkit and separately run an extracted standalone skill. No downloads.
- A separate worker reported current-session synthetic Library create/read,
  same-file correction/readback, duplicate reconciliation and stale provider
  version rejection. This is connector evidence, not an installed skill E2E test.
  Its initial fixture was separate from this toolkit; replay is pending unless
  subsequently documented by that worker. No private IDs or health data are kept
  in this repository. Account identity, canonical URL and sharing were not exposed
  by the tested Library tools; those facts remain unknown.
- Notion/Sheets writes, mobile, fresh-chat binding recovery, real health data,
  installed plugin/skill activation and public directory acceptance have not been
  validated. Human workflow scenarios in `tests/behavior-cases.json` are a manual
  evaluation inventory, not claimed executable coverage.

## License and references

Original package code, prose, fixtures and schemas: [MIT](LICENSE), copyright
(c) 2026 Allen Lee. [NOTICE.md](NOTICE.md) defines the scoped distribution. No
third-party implementation is bundled; original repository license changes are
preserved.

Official packaging guidance checked 2026-10-02:
[Build skills](https://developers.openai.com/plugins/build/skills),
[Package your plugin](https://developers.openai.com/plugins/build/plugins).
This retains the supported compatibility overlay and adds a portable manifest.
OpenAI's local skill validator is an additional structural check; no plugin
submission validator was available in this environment.
