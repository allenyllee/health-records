# Portable format

The schemas in assets describe observations and the approved data home. They are
interchange contracts, not provider APIs or a requirement to store JSON. Map them
to native columns/properties after inspecting the real schema.

A record ID identifies one observation; operation ID groups a user-requested batch
and remains stable after interruption. Nullable normalized dates retain raw text;
a date-only value is not midnight UTC. Deleted status is a tombstone. Unsupported
future schema versions require an explicit migration, never automatic rewriting.

All included examples are synthetic. Never reuse their IDs, placeholder links,
timestamps or consent in a real dataset. Consent metadata documents actual user
approval and does not grant authority. Do not store passwords, tokens, private
service URLs or account inventories in either records or bindings.
