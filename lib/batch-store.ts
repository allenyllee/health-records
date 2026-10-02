import { AppError } from './health';
import { db, scope, key, listData, realEnabled } from './store';
import { batchRuntime, type HealthBatch } from './batch';
type Row = {
    id: string;
    namespace: string;
    request_key: string;
    digest: string;
    payload: string;
    status?: string;
    created_at: string;
    deleted_at?: string | null;
    updated_at?: string | null;
};
const decode = (r: Row) => ({ id: r.id, namespace: r.namespace, requestKey: r.request_key, digest: r.digest, status: r.status, batch: JSON.parse(r.payload) as HealthBatch, created_at: r.created_at, deleted_at: r.deleted_at ?? null, updated_at: r.updated_at });
const digest = async (payload: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload)))).map(v => v.toString(16).padStart(2, '0')).join('');
export async function createBatchDraft(owner: string, args: Record<string, unknown>) {
    const ns = scope(owner, args.namespace);
    if (ns === 'demo' ? args.synthetic !== true : args.userProvided !== true)
        throw new AppError(403, 'Only current user-provided input or synthetic fixtures are allowed');
    let batch: HealthBatch;
    try {
        batch = batchRuntime.clean(args.batch);
    }
    catch (e) {
        throw new AppError(400, (e as Error).message);
    }
    const payload = JSON.stringify(batch);
    if (new TextEncoder().encode(payload).length > batchRuntime.limits.payloadBytes)
        throw new AppError(413, 'bounds');
    const hash = await digest(payload), requestKey = key(args.requestKey), d = db();
    const old = await d.prepare('SELECT * FROM health_batch_drafts WHERE owner_id=? AND namespace=? AND request_key=?').bind(owner, ns, requestKey).first<Row>();
    if (old) {
        if (old.digest !== hash || old.payload !== payload)
            throw new AppError(409, 'keyConflict');
        if (old.status === 'superseded' || old.status === 'cancelled')
            throw new AppError(409, 'stale');
        return { draft: decode(old), issues: batchRuntime.issues(batch) };
    }
    const replaced = typeof args.replacesDraftId === 'string' ? args.replacesDraftId : null, id = crypto.randomUUID(), now = new Date().toISOString();
    if (replaced && typeof args.expectedDigest !== 'string')
        throw new AppError(400, 'stale');
    const insert = replaced ? d.prepare("INSERT OR IGNORE INTO health_batch_drafts(id,owner_id,namespace,request_key,digest,payload,status,created_at) SELECT ?,?,?,?,?,?,'pending',? WHERE EXISTS(SELECT 1 FROM health_batch_drafts WHERE id=? AND owner_id=? AND namespace=? AND status='pending' AND digest=?)").bind(id, owner, ns, requestKey, hash, payload, now, replaced, owner, ns, args.expectedDigest) : d.prepare("INSERT OR IGNORE INTO health_batch_drafts(id,owner_id,namespace,request_key,digest,payload,status,created_at) VALUES(?,?,?,?,?,?,'pending',?)").bind(id, owner, ns, requestKey, hash, payload, now);
    const statements = [insert];
    if (replaced)
        statements.push(d.prepare("UPDATE health_batch_drafts SET status='superseded' WHERE id=? AND owner_id=? AND namespace=? AND status='pending' AND digest=? AND EXISTS(SELECT 1 FROM health_batch_drafts WHERE id=?)").bind(replaced, owner, ns, args.expectedDigest, id));
    await d.batch(statements);
    const saved = await d.prepare('SELECT * FROM health_batch_drafts WHERE owner_id=? AND namespace=? AND request_key=?').bind(owner, ns, requestKey).first<Row>();
    if (!saved)
        throw new AppError(409, 'stale');
    if (saved.digest !== hash || saved.payload !== payload)
        throw new AppError(409, 'keyConflict');
    return { draft: decode(saved), issues: batchRuntime.issues(batch) };
}
export async function confirmBatchDraft(owner: string, args: Record<string, unknown>) {
    if (args.confirmed !== true || typeof args.expectedDigest !== 'string')
        throw new AppError(400, 'measurement');
    const d = db(), row = await d.prepare('SELECT * FROM health_batch_drafts WHERE owner_id=? AND id=?').bind(owner, String(args.draftId || '')).first<Row>();
    if (!row)
        throw new AppError(404, 'stale');
    const ns = scope(owner, row.namespace);
    if (row.digest !== args.expectedDigest || !['pending', 'confirmed'].includes(row.status || ''))
        throw new AppError(409, 'stale');
    const batch = batchRuntime.clean(JSON.parse(row.payload)), issues = batchRuntime.issues(batch);
    if (issues.length)
        throw new AppError(422, issues.join(';'));
    const id = crypto.randomUUID(), now = new Date().toISOString();
    await d.batch([
        d.prepare("INSERT OR IGNORE INTO health_batches(id,owner_id,namespace,request_key,digest,payload,created_at,updated_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM health_batch_drafts WHERE id=? AND owner_id=? AND namespace=? AND status IN ('pending','confirmed') AND digest=? AND payload=?)").bind(id, owner, ns, row.request_key, row.digest, row.payload, now, now, row.id, owner, ns, row.digest, row.payload),
        d.prepare("UPDATE health_batch_drafts SET status='confirmed' WHERE id=? AND owner_id=? AND namespace=? AND status IN ('pending','confirmed') AND digest=? AND payload=? AND EXISTS(SELECT 1 FROM health_batches WHERE owner_id=? AND namespace=? AND request_key=? AND digest=?)").bind(row.id, owner, ns, row.digest, row.payload, owner, ns, row.request_key, row.digest)
    ]);
    const saved = await d.prepare('SELECT * FROM health_batches WHERE owner_id=? AND namespace=? AND request_key=?').bind(owner, ns, row.request_key).first<Row>();
    if (!saved || saved.digest !== row.digest || saved.payload !== row.payload)
        throw new AppError(409, 'stale');
    return { record: decode(saved), deduplicated: saved.id !== id, deleted: !!saved.deleted_at };
}
export async function listBatches(owner: string, args: Record<string, unknown> = {}) {
    const ns = scope(owner, args.namespace), d = db();
    if (args.requestKey) {
        const row = await d.prepare('SELECT * FROM health_batch_drafts WHERE owner_id=? AND namespace=? AND request_key=?').bind(owner, ns, key(args.requestKey)).first<Row>();
        const saved = row?.status === 'confirmed' ? await d.prepare('SELECT * FROM health_batches WHERE owner_id=? AND namespace=? AND request_key=?').bind(owner, ns, row.request_key).first<Row>() : null;
        return { namespace: ns, draft: row ? { ...decode(row), issues: batchRuntime.issues(JSON.parse(row.payload)) } : null, record: saved ? decode(saved) : null };
    }
    if (args.batchId) {
        const row = await d.prepare('SELECT * FROM health_batches WHERE owner_id=? AND namespace=? AND id=?').bind(owner, ns, String(args.batchId)).first<Row>();
        if (!row)
            throw new AppError(404, 'stale');
        return { namespace: ns, record: decode(row) };
    }
    const trash = args.trash === true, offset = Number.isInteger(args.offset) && Number(args.offset) >= 0 ? Math.min(Number(args.offset), 100000) : 0;
    const [records, drafts, total] = await Promise.all([d.prepare(`SELECT * FROM health_batches WHERE owner_id=? AND namespace=? AND deleted_at IS ${trash ? 'NOT ' : ''}NULL ORDER BY created_at DESC,id LIMIT 100 OFFSET ?`).bind(owner, ns, offset).all<Row>(), d.prepare("SELECT * FROM health_batch_drafts WHERE owner_id=? AND namespace=? AND status='pending' ORDER BY created_at DESC,id LIMIT 100").bind(owner, ns).all<Row>(), d.prepare(`SELECT COUNT(*) AS n FROM health_batches WHERE owner_id=? AND namespace=? AND deleted_at IS ${trash ? 'NOT ' : ''}NULL`).bind(owner, ns).first<{
            n: number;
        }>()]);
    return { namespace: ns, realEnabled: realEnabled(owner), batchRecords: records.results.map(decode), batchDrafts: trash ? [] : drafts.results.map(r => ({ ...decode(r), issues: batchRuntime.issues(JSON.parse(r.payload)) })), batchTotal: total?.n || 0, batchNextOffset: offset + records.results.length < (total?.n || 0) ? offset + records.results.length : null };
}
export async function listAllData(owner: string, args: Record<string, unknown> = {}) { const [legacy, batches] = await Promise.all([listData(owner, args), listBatches(owner, args)]); return { ...legacy, ...batches }; }
export async function changeBatch(owner: string, args: Record<string, unknown>, action: 'delete' | 'restore') {
    if (args.confirmed !== true)
        throw new AppError(400, 'measurement');
    const d = db(), id = String(args.batchId || ''), requestKey = key(args.requestKey), row = await d.prepare('SELECT * FROM health_batches WHERE owner_id=? AND id=?').bind(owner, id).first<Row>();
    if (!row)
        throw new AppError(404, 'stale');
    scope(owner, row.namespace);
    const old = await d.prepare('SELECT record_id,action FROM health_events WHERE owner_id=? AND request_key=?').bind(owner, requestKey).first<{
        record_id: string;
        action: string;
    }>();
    const eventAction = 'batch-' + action;
    if (old) {
        if (old.record_id !== id || old.action !== eventAction)
            throw new AppError(409, 'keyConflict');
        return { record: decode(row), replayed: true };
    }
    const eventId = crypto.randomUUID(), now = new Date().toISOString();
    await d.batch([d.prepare('INSERT OR IGNORE INTO health_events(id,owner_id,record_id,action,request_key,created_at) VALUES(?,?,?,?,?,?)').bind(eventId, owner, id, eventAction, requestKey, now), d.prepare(`UPDATE health_batches SET deleted_at=?,updated_at=? WHERE owner_id=? AND id=? AND deleted_at IS ${action === 'delete' ? '' : 'NOT '}NULL AND EXISTS(SELECT 1 FROM health_events WHERE id=? AND owner_id=? AND request_key=? AND record_id=? AND action=?)`).bind(action === 'delete' ? now : null, now, owner, id, eventId, owner, requestKey, id, eventAction)]);
    const event = await d.prepare('SELECT record_id,action FROM health_events WHERE owner_id=? AND request_key=?').bind(owner, requestKey).first<{
        record_id: string;
        action: string;
    }>();
    if (event?.record_id !== id || event.action !== eventAction)
        throw new AppError(409, 'keyConflict');
    const saved = await d.prepare('SELECT * FROM health_batches WHERE owner_id=? AND id=?').bind(owner, id).first<Row>();
    return { record: decode(saved!), replayed: false };
}
export async function exportBatches(owner: string) { const d = db(); const [r, p] = await Promise.all([d.prepare('SELECT * FROM health_batches WHERE owner_id=? ORDER BY created_at DESC LIMIT 10001').bind(owner).all<Row>(), d.prepare("SELECT * FROM health_batch_drafts WHERE owner_id=? AND status='pending' ORDER BY created_at DESC LIMIT 10001").bind(owner).all<Row>()]); if (r.results.length > 10000 || p.results.length > 10000)
    throw new AppError(413, 'bounds'); return { batchRecords: r.results.map(decode), batchDrafts: p.results.map(decode) }; }
