import type { HealthBatch, BatchDraft, SavedBatch, MeasurementSession } from './batch';
import type { batchRuntime } from './batch';
import type { PreparedBatch } from './photo-metadata';
type BatchData = {
    batchRecords: SavedBatch[];
    batchDrafts: BatchDraft[];
    batchNextOffset: number | null;
    realEnabled?: boolean;
};
type Options = {
    model: typeof batchRuntime;
    locale: () => string;
    namespace: () => string;
    trash?: () => boolean;
    call: (action: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    prepare: (files: File[], cancelled: () => boolean) => Promise<PreparedBatch>;
    analyze?: (prepared: PreparedBatch, settings: {
        allowDraft: boolean;
        namespace: string;
        cancelled: () => boolean;
    }) => Promise<unknown>;
    window: Window & typeof globalThis;
};
/** Same DOM review implementation in the website and isolated MCP iframe. No innerHTML/eval. */
export function mountBatchUI(root: HTMLElement, options: Options) {
    const model = options.model, w = options.window, doc = root.ownerDocument, t = (key: string) => key.includes(';') ? key.split(';').map(k => model.t(k, options.locale())).join('; ') : model.t(key, options.locale());
    let input: HealthBatch = model.blank(), files: File[] = [], prepared: PreparedBatch | null = null, previewUrls: string[] = [], epoch = 0, busy = false, open = false, statusKey = '', detail = '', draft: BatchDraft | null = null, base: BatchDraft | null = null, requestKey = '', consent = false, allowDraft = false, pending: {
        action: string;
        args: Record<string, unknown>;
    } | null = null, data: BatchData = { batchRecords: [], batchDrafts: [], batchNextOffset: null };
    const append = (parent: Node, ...children: Node[]) => { for (const child of children)
        parent.appendChild(child); };
    const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => { const n = doc.createElement(tag); if (text !== undefined)
        n.textContent = text; return n; };
    const button = (key: string, fn: () => void | Promise<void>) => { const b = el('button', t(key)); b.type = 'button'; b.onclick = () => { void fn(); }; return b; };
    const release = () => { previewUrls.forEach(u => w.URL.revokeObjectURL(u)); previewUrls = []; };
    const setStatus = (key: string, error = '') => { statusKey = key; detail = error; paint(); };
    const changed = () => { draft = null; requestKey = ''; input.groupingConfirmed = false; };
    const sessionName = (s: MeasurementSession) => '#' + (input.sessions.indexOf(s) + 1) + ' · ' + (s.date || t('unknown')) + ' ' + (s.time || t('dateOnly')) + ' · ' + s.id.slice(0, 8);
    const newSession = (): MeasurementSession => ({ id: w.crypto.randomUUID(), date: null, time: null, timezone: null, precision: 'date', confirmed: false, note: '', observations: [] });
    const edit = (d: BatchDraft) => { epoch++; release(); files = []; prepared = null; input = JSON.parse(JSON.stringify(d.batch)); draft = d; base = d; requestKey = d.requestKey; pending = null; open = true; setStatus(''); };
    const captureSources = (p: PreparedBatch) => p.images.map(photo => ({ id: 'image-' + photo.sourceHash, kind: 'unknown' as const, capture: { status: photo.metadata.status, exifDateTime: photo.metadata.exifDateTime, exifOffset: photo.metadata.exifOffset, userDate: null, userTime: null, userTimezone: null, reviewed: false, note: '' } }));
    async function reload(more = false) { const ns = options.namespace(), generation = epoch; const result = await options.call('list', { namespace: ns, trash: options.trash?.() === true, ...(more ? { offset: data.batchNextOffset } : {}) }) as unknown as BatchData; if (ns !== options.namespace() || generation !== epoch)
        return; data = { ...result, batchRecords: more ? [...data.batchRecords, ...result.batchRecords] : result.batchRecords }; if (pending?.action === 'draft') {
        const found = data.batchDrafts.find(d => d.requestKey === pending!.args.requestKey);
        if (found)
            edit(found);
    } paint(); }
    const run = async (fn: () => Promise<void>) => { if (busy)
        return; busy = true; paint(); try {
        await fn();
    }
    catch (e) {
        const msg = (e as Error).message;
        if (msg === 'cancelled') {
            statusKey = 'cancelNote';
            detail = '';
            return;
        }
        if (['keyConflict', 'stale', 'schema', 'bounds'].includes(msg))
            pending = null;
        statusKey = pending ? 'partial' : model.labels[msg] ? '' : 'error';
        detail = msg;
    }
    finally {
        busy = false;
        paint();
    } };
    const mutate = (fn: () => void) => { if (busy || pending)
        return; try {
        fn();
        changed();
        paint();
    }
    catch (e) {
        setStatus('', (e as Error).message);
    } };
    function field(container: HTMLElement, key: string, value: string | null, update: (v: string) => void, type = 'text') { const l = el('label'), i = el('input'); append(l, el('span', t(key))); i.type = type; i.value = value || ''; i.onchange = () => mutate(() => update(i.value)); append(l, i); append(container, l); return i; }
    function check(container: HTMLElement, key: string, checked: boolean, update: (v: boolean) => void) { const l = el('label'), i = el('input'); i.type = 'checkbox'; i.checked = checked; i.onchange = () => { if (busy || pending)
        return; update(i.checked); draft = null; requestKey = ''; paint(); }; append(l, i, el('span', t(key))); append(container, l); }
    function select(container: HTMLElement, key: string, value: string, choices: [
        string,
        string
    ][], update: (v: string) => void) { const l = el('label'), i = el('select'); append(l, el('span', t(key))); for (const [v, label] of choices) {
        const o = el('option', label);
        o.value = v;
        append(i, o);
    } i.value = value; i.onchange = () => mutate(() => update(i.value)); append(l, i); append(container, l); return i; }
    function addObservation(s: MeasurementSession) { const sourceId = input.sources[0].id, used = input.sessions.flatMap(s => s.observations).filter(o => o.sourceId === sourceId).map(o => o.index); const index = Array.from({ length: 64 }, (_, i) => i).find(i => !used.includes(i)); if (index === undefined || input.sessions.reduce((n, s) => n + s.observations.length, 0) >= model.limits.observations)
        throw new Error('bounds'); s.observations.push({ sourceId, index, metric: 'weight', label: '', value: null, unit: 'kg', displayedDate: null, displayedTime: null, displayedTimezone: null, selected: true, resolution: '' }); s.confirmed = false; }
    function editor(parent: HTMLElement) {
        const form = el('fieldset');
        form.disabled = busy || !!pending;
        form.className = 'batch-editor';
        append(parent, form);
        for (const source of input.sources) {
            const card = el('section');
            card.className = 'batch-card';
            append(card, el('h3', t('source') + ' ' + source.id));
            select(card, 'kind', source.kind, ['unknown', 'photo', 'screenshot', 'manual'].map(k => [k, t(k)]), v => { source.kind = v as typeof source.kind; source.capture.reviewed = false; });
            append(card, el('p', t('capture') + ': ' + source.capture.status + ' · ' + (source.capture.exifDateTime || '—') + ' ' + (source.capture.exifOffset || '—')));
            field(card, 'captureDate', source.capture.userDate, v => { source.capture.userDate = v || null; source.capture.reviewed = false; }, 'date');
            field(card, 'captureTime', source.capture.userTime, v => { source.capture.userTime = v || null; source.capture.reviewed = false; }, 'time').step = '1';
            field(card, 'captureZone', source.capture.userTimezone, v => { source.capture.userTimezone = v || null; source.capture.reviewed = false; });
            field(card, 'captureNote', source.capture.note, v => { source.capture.note = v; source.capture.reviewed = false; });
            check(card, 'reviewCapture', source.capture.reviewed, v => source.capture.reviewed = v);
            append(form, card);
        }
        for (const s of input.sessions) {
            const card = el('section');
            card.className = 'batch-card';
            append(card, el('h3', t('session') + ' ' + sessionName(s)));
            field(card, 'date', s.date, v => { s.date = v || null; s.confirmed = false; }, 'date');
            field(card, 'time', s.time, v => { s.time = v || null; s.precision = v ? (v.length === 8 ? 'second' : 'minute') : 'date'; s.confirmed = false; }, 'time').step = '1';
            field(card, 'zone', s.timezone, v => { s.timezone = v || null; s.confirmed = false; });
            append(card, el('p', t(s.precision === 'date' ? 'dateOnly' : s.precision)));
            field(card, 'note', s.note, v => { s.note = v; s.confirmed = false; });
            for (const o of s.observations) {
                const row = el('section');
                row.className = 'batch-observation';
                append(row, el('h4', t('source') + ' ' + o.sourceId + ' : ' + o.index));
                select(row, 'source', o.sourceId, input.sources.map(x => [x.id, x.id]), v => { const used = input.sessions.flatMap(s => s.observations).filter(x => x !== o && x.sourceId === v).map(x => x.index); o.index = Array.from({ length: 64 }, (_, i) => i).find(i => !used.includes(i)) ?? 64; o.sourceId = v; s.confirmed = false; });
                select(row, 'metric', model.metrics[o.metric] ? o.metric : 'custom', Object.keys(model.metrics).map(k => [k, t(k)] as [
                    string,
                    string
                ]).concat([['custom', t('custom')]]), v => { o.metric = v === 'custom' ? 'custom:metric' : v; o.unit = model.metrics[v]?.[0] || null; s.confirmed = false; });
                if (o.metric.startsWith('custom:'))
                    field(row, 'metric', o.metric, v => { o.metric = v; s.confirmed = false; });
                field(row, 'label', o.label, v => { o.label = v; s.confirmed = false; });
                field(row, 'value', o.value === null ? null : String(o.value), v => { o.value = v === '' ? null : Number(v); s.confirmed = false; }, 'number').step = 'any';
                field(row, 'unit', o.unit, v => { o.unit = v || null; s.confirmed = false; });
                field(row, 'shownDate', o.displayedDate, v => { o.displayedDate = v || null; s.confirmed = false; }, 'date');
                field(row, 'shownTime', o.displayedTime, v => { o.displayedTime = v || null; s.confirmed = false; }, 'time').step = '1';
                field(row, 'shownZone', o.displayedTimezone, v => { o.displayedTimezone = v || null; s.confirmed = false; });
                check(row, 'selected', o.selected, v => { o.selected = v; s.confirmed = false; input.groupingConfirmed = false; });
                field(row, 'exclude', o.resolution, v => { o.resolution = v; s.confirmed = false; });
                select(row, 'move', s.id, input.sessions.map(x => [x.id, sessionName(x)]), v => { const target = input.sessions.find(x => x.id === v)!; s.observations = s.observations.filter(x => x !== o); target.observations.push(o); s.confirmed = false; target.confirmed = false; });
                append(card, row);
            }
            const add = button('addMetric', () => mutate(() => addObservation(s)));
            add.disabled = input.sessions.reduce((n, s) => n + s.observations.length, 0) >= model.limits.observations;
            append(card, add);
            check(card, 'confirmTime', s.confirmed, v => s.confirmed = v);
            if (!s.observations.length)
                append(card, button('remove', () => mutate(() => { input.sessions = input.sessions.filter(x => x !== s); })));
            append(form, card);
        }
        const add = button('newSession', () => mutate(() => { if (input.sessions.length < model.limits.sessions)
            input.sessions.push(newSession()); }));
        add.disabled = input.sessions.length >= model.limits.sessions;
        append(form, add, button('suggest', () => mutate(() => { input = model.suggest(input); })));
        check(form, 'grouping', input.groupingConfirmed, v => input.groupingConfirmed = v);
        const issues = (() => { try {
            return model.issues(model.clean(input));
        }
        catch (e) {
            return [(e as Error).message];
        } })();
        if (issues.length) {
            const ul = el('ul');
            for (const issue of issues)
                append(ul, el('li', t(issue)));
            append(form, ul);
        }
        append(form, button('draft', () => run(async () => { if (!pending) {
            const cleaned = model.clean(input);
            requestKey = requestKey || (base ? base.requestKey.slice(0, 80) + '-' + w.crypto.randomUUID() : prepared?.key || 'manual-' + w.crypto.randomUUID());
            pending = { action: 'draft', args: { namespace: options.namespace(), synthetic: options.namespace() === 'demo', userProvided: options.namespace() === 'real', requestKey, batch: cleaned, ...(base ? { replacesDraftId: base.id, expectedDigest: base.digest } : {}) } };
        } const result = await options.call(pending.action, pending.args); const saved = result.draft as BatchDraft; input = saved.batch; draft = saved; base = saved; pending = null; await reload(); })));
        const save = button('save', () => run(async () => { if (!draft)
            return; pending = { action: 'confirm', args: { draftId: draft.id, expectedDigest: draft.digest, confirmed: true } }; const result = await options.call('confirm', pending.args); const record = result.record as SavedBatch; const verified = await options.call('list', { namespace: options.namespace(), batchId: record.id }); const read = verified.record as SavedBatch; if (read.id !== record.id || read.digest !== draft.digest || JSON.stringify(read.batch) !== JSON.stringify(draft.batch))
            throw new Error('stale'); pending = null; statusKey = result.deleted ? 'deletedReplay' : 'saved'; draft = null; base = null; open = false; release(); prepared = null; files = []; await reload(); }));
        save.className = 'primary';
        save.disabled = !draft || issues.length > 0 || busy || !!pending;
        append(parent, save);
    }
    function report(parent: HTMLElement) {
        append(parent, el('h2', t('reports')));
        if (!data.batchRecords.length)
            append(parent, el('p', t('empty')));
        for (const r of data.batchRecords) {
            const card = el('details');
            card.className = 'batch-card';
            append(card, el('summary', r.created_at + ' · ' + r.batch.sessions.length + ' ' + t('session') + ' · ' + r.id));
            for (const s of r.batch.sessions) {
                append(card, el('h3', (s.date || '—') + ' ' + (s.time || t('dateOnly')) + ' ' + (s.timezone || '—') + ' · ' + s.id));
                const ul = el('ul');
                for (const m of model.consolidate(s)) {
                    append(ul, el('li', (model.metrics[m.metric] ? t(m.metric) : m.label) + ': ' + new Intl.NumberFormat(options.locale()).format(m.value) + ' ' + m.unit + ' · ' + m.observations.join(', ') + (m.duplicate ? ' · ' + t('duplicate') : '')));
                }
                append(card, ul);
            }
            const evidence = el('pre');
            evidence.textContent = JSON.stringify(r.batch, null, 2);
            append(card, evidence);
            append(card, button(r.deleted_at ? 'restore' : 'trash', () => run(async () => { if (!w.confirm(t('confirmAction')))
                return; await options.call(r.deleted_at ? 'restore' : 'delete', { batchId: r.id, requestKey: w.crypto.randomUUID(), confirmed: true }); await reload(); })));
            append(parent, card);
        }
        for (const g of model.trends(data.batchRecords)) {
            const card = el('section');
            card.className = 'batch-card';
            append(card, el('h3', (model.metrics[g.metric] ? t(g.metric) : g.label) + ' · ' + g.unit));
            const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 600 150');
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', (model.metrics[g.metric] ? t(g.metric) : g.label) + ' ' + g.unit);
            const values = g.points.map(p => p.value), lo = Math.min(...values), hi = Math.max(...values), xy = (i: number) => [30 + (g.points.length === 1 ? .5 : i / (g.points.length - 1)) * 540, 120 - (values[i] - lo) / (hi - lo || 1) * 90];
            const path = doc.createElementNS(svg.namespaceURI, 'path');
            path.setAttribute('d', g.points.map((_, i) => (i ? 'L' : 'M') + xy(i).join(',')).join(' '));
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#2266d7');
            path.setAttribute('stroke-width', '3');
            append(svg, path);
            const ul = el('ul');
            g.points.forEach((p, i) => { const label = p.date + ' ' + (p.time || t('dateOnly')) + ' ' + p.timezone + ' · ' + new Intl.NumberFormat(options.locale()).format(p.value) + ' ' + g.unit; const dot = doc.createElementNS(svg.namespaceURI, 'circle'); dot.setAttribute('cx', String(xy(i)[0])); dot.setAttribute('cy', String(xy(i)[1])); dot.setAttribute('r', '4'); dot.setAttribute('fill', '#2266d7'); const title = doc.createElementNS(svg.namespaceURI, 'title'); title.textContent = label; append(dot, title); append(svg, dot); append(ul, el('li', label + ' · ' + p.sessionId)); });
            append(card, el('p', t('ordinalTrend')), svg, ul);
            append(parent, card);
        }
        if (data.batchNextOffset !== null)
            append(parent, el('p', t('partialList')), button('more', () => run(() => reload(true))));
    }
    function paint() {
        root.replaceChildren();
        root.className = 'batch-panel';
        append(root, el('h2', t('title')), el('p', t('limits')), el('p', t('destination')));
        if (!options.analyze)
            append(root, el('p', t('manualOnly')));
        const picker = el('input');
        picker.type = 'file';
        picker.multiple = true;
        picker.accept = 'image/jpeg,image/png,image/webp';
        picker.setAttribute('aria-label', t('select'));
        picker.disabled = busy || !!pending;
        picker.onchange = () => { if (busy || pending)
            return; epoch++; release(); files = Array.from(picker.files || []); consent = false; allowDraft = false; prepared = null; draft = null; base = null; requestKey = ''; open = true; input = model.blank(); input.sessions = [newSession()]; setStatus(''); };
        append(root, picker);
        const previews = el('div');
        files.forEach((f, i) => { const card = el('div'); append(card, el('span', '#' + (i + 1) + ' · ' + Math.ceil(f.size / 1024) + ' KB')); const img = el('img'); img.alt = '#' + (i + 1); if (!previewUrls[i])
            previewUrls[i] = w.URL.createObjectURL(f); img.src = previewUrls[i]; img.width = 80; append(card, img); const rm = button('remove', () => { epoch++; release(); files = files.filter((_, j) => j !== i); consent = false; allowDraft = false; prepared = null; input = model.blank(); input.sessions = [newSession()]; changed(); paint(); }); rm.disabled = busy || !!pending; append(card, rm); append(previews, card); });
        append(root, previews);
        const prepare = button('reading', () => run(async () => { const generation = ++epoch; statusKey = 'preparing'; prepared = await options.prepare(files, () => generation !== epoch); input.sources = captureSources(prepared); input.sessions = [newSession()]; input.groupingConfirmed = false; draft = null; base = null; requestKey = ''; open = true; statusKey = ''; detail = prepared.duplicates.length ? t('duplicate') : ''; }));
        prepare.disabled = !files.length || busy || !!pending || !!prepared;
        append(root, prepare);
        if (options.analyze) {
            const permissions = el('fieldset');
            permissions.disabled = busy || !!pending;
            check(permissions, 'consent', consent, v => consent = v);
            check(permissions, 'allowDraft', allowDraft, v => allowDraft = v);
            const analyze = button('analyze', () => run(async () => { if (!consent)
                throw new Error('consent'); const generation = epoch, ns = options.namespace(); const wasPrepared = prepared !== null; const ready = prepared || await options.prepare(files, () => generation !== epoch); prepared = ready; if (!wasPrepared) {
                input.sources = captureSources(ready);
                input.sessions = [newSession()];
                input.groupingConfirmed = false;
            } if (generation !== epoch)
                throw new Error('cancelled'); await options.analyze!(ready, { allowDraft, namespace: ns, cancelled: () => generation !== epoch }); statusKey = 'accepted'; await reload(); }));
            analyze.disabled = !files.length || busy || !!pending;
            append(permissions, analyze);
            append(root, permissions);
        }
        append(root, button('newSession', () => { if (busy || pending)
            return; if (!open) {
            input = model.blank();
            input.sessions = [newSession()];
            draft = null;
            base = null;
            requestKey = '';
            consent = false;
            allowDraft = false;
            open = true;
        }
        else
            mutate(() => { if (input.sessions.length < model.limits.sessions)
                input.sessions.push(newSession()); }); paint(); }), button('reload', () => run(async () => { if (pending?.action === 'draft') {
            const result = await options.call('list', { namespace: options.namespace(), requestKey: pending.args.requestKey });
            if (result.record) {
                const saved = result.record as SavedBatch;
                const read = await options.call('list', { namespace: options.namespace(), batchId: saved.id });
                if ((read.record as SavedBatch).digest !== saved.digest)
                    throw new Error('stale');
                pending = null;
                open = false;
                statusKey = saved.deleted_at ? 'deletedReplay' : 'saved';
            }
            else if (result.draft) {
                const found = result.draft as BatchDraft;
                if (found.status === 'pending')
                    edit(found);
                else {
                    pending = null;
                    setStatus('stale');
                }
            }
            else {
                const replay = await options.call('draft', pending.args);
                edit(replay.draft as BatchDraft);
            }
        }
        else if (pending?.action === 'confirm') {
            const result = await options.call('confirm', pending.args);
            const saved = result.record as SavedBatch;
            const read = await options.call('list', { namespace: options.namespace(), batchId: saved.id });
            if ((read.record as SavedBatch).digest !== saved.digest)
                throw new Error('stale');
            pending = null;
            open = false;
            statusKey = result.deleted ? 'deletedReplay' : 'saved';
        } await reload(); })), button('cancel', () => { epoch++; release(); files = []; prepared = null; consent = false; allowDraft = false; open = false; draft = null; base = null; setStatus('cancelNote'); }));
        const status = el('p', t(statusKey) + (detail ? ' ' + t(detail) : ''));
        status.setAttribute('role', 'status');
        append(root, status);
        if (open && (!files.length || prepared))
            editor(root);
        for (const d of data.batchDrafts) {
            const b = button('edit', () => edit(d));
            b.disabled = busy || !!pending;
            append(root, el('p', d.id + ' · ' + d.issues.map(t).join('; ')), b);
        }
        report(root);
    }
    paint();
    void run(() => reload());
    return { paint, refresh: () => run(() => reload()), receiveDraft: (next: BatchDraft) => { if (!busy && !pending && next.status === 'pending')
            edit(next); }, setData: (next: BatchData) => { if (Array.isArray(next.batchRecords)) {
            data = next;
            paint();
        } }, dispose: () => { epoch++; release(); root.replaceChildren(); } };
}
export const batchUiSource = `const mountHealthBatchUI=${mountBatchUI.toString()};`;

export const batchCss=`.batch-panel{padding:16px;overflow-wrap:anywhere}.batch-panel label{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0}.batch-panel input,.batch-panel select{max-width:100%;padding:7px;border:1px solid #b9c9dd;border-radius:6px;color:inherit;background:transparent}.batch-panel button{margin:5px;padding:8px 12px}.batch-editor{border:0;padding:0;min-width:0}.batch-card,.batch-observation{border:1px solid #b9c9dd;border-radius:8px;padding:12px;margin:10px 0}.batch-panel pre{white-space:pre-wrap;max-height:350px;overflow:auto;font-size:12px}.batch-panel svg{width:100%;max-height:180px}.batch-panel img{object-fit:contain;margin:8px}`;
