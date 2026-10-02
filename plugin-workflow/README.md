# Health Record Workflow — source prototype

A provider-neutral, skills-only plugin design. ChatGPT performs analysis and uses
the user's already-connected storage tools. No operator backend, model API key,
database, image store, OAuth proxy, telemetry or paid service is included.

The agent chooses an actually suitable destination, obtains explicit approval
before sending health data there, and pins one canonical user-owned dataset.
Notion, Drive/Sheets, ChatGPT Space/Library and others are capability candidates,
not guaranteed integrations or a fixed priority order. An unavailable provider
does not trigger silent migration, replication or new permissions.

## Status and validation boundary

This directory is source only: not installed, connected, deployed or
submitted for review. It does not migrate or replace the existing private D1
prototype. Included records and consent examples are fabricated. Schemas and
policy fixtures validate portable structure, not real provider behavior.

Before real use, test with explicitly authorized synthetic destinations: discover
permissions, select/bind, create/read back, reopen, deduplicate a retry, correct a
record, handle conflict/timeout, and apply provider-specific recoverable deletion.
Test each available provider and each supported ChatGPT surface separately. Do
not extrapolate a successful connector call to every user's account or platform.

Skills-only public ZIPs currently exclude app/MCP configuration; this package
includes neither. Users must separately have usable connected storage tools.
No automatic connection, permission grant or public-directory acceptance is
promised. Public health-data policy eligibility remains a separate review gate.

## Files

- `.codex-plugin/plugin.json`: compatible source manifest
- `skills/manage-health-records/SKILL.md`: workflow and boundaries
- `references/`: capability mapping, mutation safety and record conventions
- `assets/`: schemas and synthetic examples
- `tests/`: local schema and policy-case validation

Run `python3 tests/validate.py` from this directory (Python 3 and jsonschema required). It performs no network calls.
OpenAI's plugin/skill validators should also be run against the source tree.

## Provenance

Workflow prose, schemas, fixtures and tests are newly authored for this project.
The manifest/skill skeleton was generated with OpenAI's provided scaffold tools;
no SDK code or third-party implementation is bundled. This original workflow code
and associated documentation are covered by the repository's [MIT License](../LICENSE),
copyright (c) 2026 Allen Lee. See [LICENSE-STATUS.md](../LICENSE-STATUS.md) for license
scope and third-party terms.

Official design references checked 2026-10-02:

- https://developers.openai.com/plugins/concepts/plugins
- https://developers.openai.com/plugins/build/skills
- https://developers.openai.com/plugins/deploy/submission-errors
- https://developers.openai.com/plugins/plugin-guidelines
