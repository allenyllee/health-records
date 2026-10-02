import type { HealthBatch, BatchDraft, SavedBatch, MeasurementSession } from './batch';
import type { batchRuntime } from './batch';
import type { PreparedBatch } from './photo-metadata';
import type { BrowserVisionProvider } from './vision-provider';
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
    byok?: BrowserVisionProvider;
    window: Window & typeof globalThis;
};
/** Same DOM review implementation in the website and isolated MCP iframe. No innerHTML/eval. */
export function mountBatchUI(root: HTMLElement, options: Options) {
    const model = options.model, w = options.window, doc = root.ownerDocument, t = (key: string) => key.includes(';') ? key.split(';').map(k => model.t(k, options.locale())).join('; ') : model.t(key, options.locale());
    let input: HealthBatch = model.blank(), files: File[] = [], prepared: PreparedBatch | null = null, previewUrls: string[] = [], epoch = 0, disposed = false, busy = false, open = false, editing = false, original: { input: HealthBatch; draft: BatchDraft | null; requestKey: string } | null = null, statusKey = '', detail = '', draft: BatchDraft | null = null, base: BatchDraft | null = null, requestKey = '', consent = false, pending: {
        action: string;
        args: Record<string, unknown>;
    } | null = null, data: BatchData = { batchRecords: [], batchDrafts: [], batchNextOffset: null };
    let settingsOpen = false, keyDraft = '', checkboxIndex = 0;
    const disclosureOpen = new Set<string>(), scopeId = 'batch-' + w.crypto.randomUUID(), focusNodes = new Map<string, HTMLElement>();
    const focusNode = <T extends HTMLElement>(node: T, key: string): T => { node.setAttribute('data-batch-focus', scopeId + key); focusNodes.set(scopeId + key, node); return node; };
    const namespace = options.namespace(), trash = options.trash?.() === true;
    const active = () => !disposed && namespace === options.namespace() && trash === (options.trash?.() === true);
    // Invalidate every asynchronous continuation, including providers that ignore cancellation.
    const awaitActive = async <T,>(work: () => Promise<T>): Promise<T> => {
        if (!active()) throw new Error('inactivePanel');
        const generation = epoch;
        try {
            const value = await work();
            if (!active() || generation !== epoch) throw new Error('inactivePanel');
            return value;
        } catch (error) {
            if (!active() || generation !== epoch) throw new Error('inactivePanel');
            throw error;
        }
    };
    const call = (action: string, args: Record<string, unknown>) => awaitActive(() => options.call(action, args));
    const append = (parent: Node, ...children: Node[]) => { for (const child of children)
        parent.appendChild(child); };
    const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => { const n = doc.createElement(tag); if (text !== undefined)
        n.textContent = text; return n; };
    const button = (key: string, fn: () => void | Promise<void>) => { const b = el('button', t(key)); b.type = 'button'; b.onclick = () => { if (active() && !b.disabled) void fn(); }; return b; };
    const release = () => { previewUrls.forEach(u => w.URL.revokeObjectURL(u)); previewUrls = []; };
    const setStatus = (key: string, error = '') => { if (!active()) return; statusKey = key; detail = error; paint(); };
    const changed = () => { draft = null; requestKey = ''; input.groupingConfirmed = false; };
    const sessionName = (s: MeasurementSession) => '#' + (input.sessions.indexOf(s) + 1) + ' · ' + (s.date || t('unknown')) + ' ' + (s.time || t('dateOnly')) + ' · ' + s.id.slice(0, 8);
    const newSession = (): MeasurementSession => ({ id: w.crypto.randomUUID(), date: null, time: null, timezone: null, precision: 'date', confirmed: false, note: '', observations: [] });
    const edit = (d: BatchDraft) => { if (!active()) return; epoch++; release(); files = []; prepared = null; input = JSON.parse(JSON.stringify(d.batch)); draft = d; base = d; requestKey = d.requestKey; pending = null; open = true; editing = false; original = null; setStatus(''); };
    async function reload(more = false) { const ns = options.namespace(), generation = epoch; const result = await call('list', { namespace: ns, trash: options.trash?.() === true, ...(more ? { offset: data.batchNextOffset } : {}) }) as unknown as BatchData; if (ns !== options.namespace() || generation !== epoch)
        return; data = { ...result, batchRecords: more ? [...data.batchRecords, ...result.batchRecords] : result.batchRecords }; if (pending?.action === 'draft') {
        const found = data.batchDrafts.find(d => d.requestKey === pending!.args.requestKey);
        if (found)
            edit(found);
    } else if (prepared && !editing) { const found = data.batchDrafts.find(d => d.requestKey === prepared!.key); if (found) edit(found); } paint(); }
    const run = async (fn: () => Promise<void>) => { if (!active() || busy)
        return; busy = true; paint(); try {
        await fn();
    }
    catch (e) {
        const msg = (e as Error).message;
        if (!active() || msg === 'inactivePanel') return;
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
    const mutate = (fn: () => void) => { if (!active() || busy || pending)
        return; try {
        fn();
        changed();
        paint();
    }
    catch (e) {
        setStatus('', (e as Error).message);
    } };
    function field(container: HTMLElement, key: string, value: string | null, update: (v: string) => void, type = 'text') { const l = el('label'), i = el('input'); append(l, el('span', t(key))); i.type = type; i.value = value || ''; i.onchange = () => mutate(() => update(i.value)); append(l, i); append(container, l); return i; }
    function check(container: HTMLElement, key: string, checked: boolean, update: (v: boolean) => void) { const l = el('label'), i = el('input'); i.type = 'checkbox'; focusNode(i, key + '-' + checkboxIndex++); i.checked = checked; i.onchange = () => { if (!active() || busy || pending)
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
            if (!s.observations.length)
                append(card, button('remove', () => mutate(() => { input.sessions = input.sessions.filter(x => x !== s); })));
            append(form, card);
        }
        const add = button('newSession', () => mutate(() => { if (input.sessions.length < model.limits.sessions)
            input.sessions.push(newSession()); }));
        add.disabled = input.sessions.length >= model.limits.sessions;
        append(form, add, button('suggest', () => mutate(() => { input = model.suggest(input); })));
        append(parent, button('applyEdit', () => { if (busy || pending) return; editing = false; original = null; paint(); }), button('cancelEdit', () => { if (busy || pending || !original) return; input = original.input; draft = original.draft; requestKey = original.requestKey; original = null; editing = false; paint(); }));
    }
    // One explicit reviewed save confirms the presented sources, dates and grouping.
    // Structural uncertainty, missing evidence and conflicts still block this candidate.
    function reviewedInput() { const b = model.clean(input); return { ...b, groupingConfirmed: true, sources: b.sources.map(s => ({ ...s, capture: { ...s.capture, reviewed: true } })), sessions: b.sessions.map(s => ({ ...s, confirmed: true })) }; }
    function review(parent: HTMLElement) {
        const card = el('section'); card.className = 'batch-results';
        append(card, el('h2', t('results')), el('p', t('reviewOnce')), el('p', [...new Set(input.sources.map(s => s.kind))].map(kind => t(kind) + ': ' + input.sources.filter(s => s.kind === kind).length).join(' · ')));
        for (const s of input.sessions) {
            append(card, el('h3', (s.date || t('unknown')) + ' ' + (s.time || t('dateOnly')) + ' · ' + (s.timezone || t('unknown'))));
            const values = el('ul');
            for (const o of s.observations) append(values, el('li', (o.selected ? '' : t('excluded') + ' · ') + (model.metrics[o.metric] ? t(o.metric) : o.label) + ': ' + (o.value === null ? t('unknown') : new Intl.NumberFormat(options.locale()).format(o.value)) + ' ' + (o.unit || t('unknown')) + (o.resolution ? ' · ' + o.resolution : '')));
            append(card, values);
            if (s.note && (!s.date || !s.timezone || s.observations.some(o => o.selected && (o.value === null || !o.unit)))) append(card, el('p', s.note));
        }
        const issues = (() => { try { return model.issues(reviewedInput()); } catch (e) { return [(e as Error).message]; } })();
        if (issues.length) { append(card, el('p', t('needsClarification'))); for (const source of input.sources) if (source.kind === 'unknown' && source.capture.note) append(card, el('p', source.capture.note)); const list = el('ul'); for (const issue of issues) append(list, el('li', t(issue))); append(card, list); }
        if (editing) editor(card);
        else {
            const corrections = button('edit', () => { if (busy || pending) return; original = { input: JSON.parse(JSON.stringify(input)), draft, requestKey }; editing = true; paint(); });
            corrections.disabled = busy || !!pending;
            append(card, corrections);
            const save = button('save', () => run(async () => {
                const candidate = reviewedInput();
                if (model.issues(candidate).length) throw new Error('measurement');
                if (!draft || JSON.stringify(draft.batch) !== JSON.stringify(candidate)) {
                    requestKey = base ? base.requestKey.slice(0, 80) + '-' + w.crypto.randomUUID() : prepared?.key || 'review-' + w.crypto.randomUUID();
                    pending = { action: 'draft', args: { namespace, synthetic: namespace === 'demo', userProvided: namespace === 'real', requestKey, batch: candidate, ...(base ? { replacesDraftId: base.id, expectedDigest: base.digest } : {}) } };
                    const created = await call('draft', pending.args); const saved = created.draft as BatchDraft;
                    if (JSON.stringify(saved.batch) !== JSON.stringify(candidate) || model.issues(saved.batch).length) throw new Error('stale');
                    input = saved.batch; draft = saved; base = saved; pending = null;
                }
                pending = { action: 'confirm', args: { draftId: draft!.id, expectedDigest: draft!.digest, confirmed: true } };
                const result = await call('confirm', pending.args); const record = result.record as SavedBatch;
                const verified = await call('list', { namespace, batchId: record.id }); const read = verified.record as SavedBatch;
                if (read.id !== record.id || read.digest !== draft!.digest || JSON.stringify(read.batch) !== JSON.stringify(draft!.batch)) throw new Error('stale');
                pending = null; statusKey = result.deleted ? 'deletedReplay' : 'saved'; draft = null; base = null; open = false; editing = false; original = null; release(); prepared = null; files = []; await reload();
            }));
            save.className = 'primary'; save.disabled = issues.length > 0 || busy || !!pending;
            append(card, save);
        }
        append(parent, card);
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
                return; await call(r.deleted_at ? 'restore' : 'delete', { batchId: r.id, requestKey: w.crypto.randomUUID(), confirmed: true }); await reload(); })));
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
    const analyzeBatch = (retry = false) => { if (settingsOpen || !files.length) return Promise.resolve(); return run(async () => {
        if (!consent) throw new Error('consent'); const generation = epoch;
        statusKey = 'preparing'; detail = ''; paint();
        const ready = prepared || await awaitActive(() => options.prepare(files, () => !active() || generation !== epoch));
        prepared = ready;
        if (generation !== epoch) throw new Error('cancelled');
        if (options.byok) {
            statusKey = 'analyzing'; paint();
            const result = await awaitActive(() => options.byok!.analyze(ready, { cancelled: () => !active() || generation !== epoch, retry }));
            input = result.batch; draft = null; base = null; requestKey = ''; open = true; editing = false; original = null; statusKey = 'extracted';
        } else {
            await awaitActive(() => options.analyze!(ready, { allowDraft: true, namespace, cancelled: () => !active() || generation !== epoch }));
            statusKey = 'accepted'; await reload();
        }
    });
    };
    // Settings are an inline region, not a modal: normal Tab order stays available.
    // Typed replacements are staged until Use key; Close/Cancel/Escape discard them.
    function closeSettings() {
        if (!active()) return;
        const keyInput = focusNodes.get(scopeId + 'key') as HTMLInputElement | undefined; if (keyInput) keyInput.value = '';
        keyDraft = ''; settingsOpen = false; paint(); focusNodes.get(scopeId + 'settings')?.focus();
    }
    function disclosure(key: string, ...content: HTMLElement[]) {
        const details = el('details'); details.className = 'batch-note'; details.open = disclosureOpen.has(key);
        const summary = focusNode(el('summary', t(key)), key);
        details.ontoggle = () => { if (!active()) return; if (details.open) disclosureOpen.add(key); else disclosureOpen.delete(key); };
        append(details, summary, ...content); return details;
    }
    function policyLink() {
        const policy = el('a', t('providerPolicy')); policy.href = 'https://developers.openai.com/api/docs/guides/your-data'; policy.target = '_blank'; policy.rel = 'noopener noreferrer'; return policy;
    }
    function paint() {
        if (!active()) return;
        const focused = doc.activeElement?.getAttribute('data-batch-focus');
        const oldKey = focusNodes.get(scopeId + 'key') as HTMLInputElement | undefined; if (oldKey) oldKey.value = '';
        focusNodes.clear(); checkboxIndex = 0; root.replaceChildren(); root.className = 'batch-panel';
        const header = el('div'); header.className = 'batch-upload-header';
        const heading = el('div'); append(heading, el('h2', t('uploadTitle')));
        const steps = el('ol'); steps.className = 'batch-steps'; steps.setAttribute('aria-label', t('uploadFlow'));
        ['uploadStep', 'reviewStep', 'saveStep'].forEach((key, i) => { const step = el('li'); if (i === (open ? 1 : 0)) step.className = 'current'; append(step, el('span', String(i + 1)), el('span', t(key))); append(steps, step); });
        append(heading, steps); append(header, heading);
        if (options.byok) {
            const settings = focusNode(button('settings', () => { if (busy || pending) return; if (settingsOpen) closeSettings(); else { settingsOpen = true; keyDraft = ''; paint(); focusNodes.get(scopeId + 'key')?.focus(); } }), 'settings');
            settings.className = 'batch-settings-toggle'; settings.disabled = busy || !!pending;
            settings.setAttribute('aria-expanded', String(settingsOpen)); settings.setAttribute('aria-controls', scopeId + '-settings'); append(header, settings);
        }
        append(root, header);
        if (options.byok) {
            const provider = el('div'); provider.className = 'batch-provider-strip';
            append(provider, el('span', t('providerFixed')));
            const badge = el('span', t(options.byok.hasKey() ? 'keyConfigured' : 'keyMissing')); badge.className = 'batch-key-badge' + (options.byok.hasKey() ? ' ready' : ''); append(provider, badge); append(root, provider);
            if (settingsOpen) {
                const region = el('section'); region.className = 'batch-settings'; region.id = scopeId + '-settings'; region.setAttribute('role', 'region'); region.setAttribute('aria-labelledby', scopeId + '-settings-title');
                region.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeSettings(); } };
                const title = el('h3', t('settingsTitle')); title.id = scopeId + '-settings-title';
                const top = el('div'); top.className = 'batch-settings-heading'; append(top, title, focusNode(button('closeSettings', closeSettings), 'closeSettings')); append(region, top);
                const fixed = el('p', t('analysisProvider') + ': OpenAI · gpt-4.1-mini-2025-04-14'); fixed.className = 'batch-subtle'; append(region, fixed);
                const label = el('label'); label.className = 'batch-key-field'; const keyInput = focusNode(el('input'), 'key');
                keyInput.type = 'password'; keyInput.autocomplete = 'off'; keyInput.spellcheck = false; keyInput.maxLength = 512; keyInput.value = keyDraft; keyInput.placeholder = options.byok.hasKey() ? t('keyReady') : 'sk-…'; keyInput.setAttribute('aria-describedby', scopeId + '-key-hint'); keyInput.disabled = busy || !!pending;
                const apply = focusNode(button('useKey', () => { if (!settingsOpen || busy || pending) return; if (keyDraft.trim()) { options.byok!.setKey(keyDraft); consent = false; } closeSettings(); }), 'useKey');
                apply.className = 'primary'; apply.disabled = busy || !!pending || (!keyDraft.trim() && !options.byok.hasKey());
                keyInput.oninput = () => { if (!active() || busy || pending || !settingsOpen) return; keyDraft = keyInput.value; apply.disabled = !keyDraft.trim() && !options.byok!.hasKey(); };
                append(label, el('span', t('apiKey')), keyInput); append(region, label);
                const hint = el('p', t('keyHint')); hint.id = scopeId + '-key-hint'; hint.className = 'batch-subtle'; append(region, hint);
                const actions = el('div'); actions.className = 'batch-settings-actions';
                if (options.byok.hasKey()) { const clear = focusNode(button('forgetKey', () => { if (!settingsOpen || busy || pending) return; options.byok!.clearKey(); keyDraft = ''; consent = false; paint(); focusNodes.get(scopeId + 'key')?.focus(); }), 'forgetKey'); clear.disabled = busy || !!pending; append(actions, clear); }
                append(actions, focusNode(button('cancelSettings', closeSettings), 'cancelSettings'), apply); append(region, actions); append(root, region);
            }
        }
        if (!options.analyze && !options.byok) {
            const capability = el('section'); capability.className = 'batch-capability';
            append(capability, el('h3', t('analysisUnavailable')), el('p', t('chatgptPath')));
            const link = el('a', t('openChatGPT')); link.href = 'https://chatgpt.com/'; link.target = '_blank'; link.rel = 'noopener noreferrer'; append(capability, link); append(root, capability);
        }
        const picker = focusNode(el('input'), 'picker'); picker.type = 'file'; picker.multiple = true; picker.accept = 'image/jpeg,image/png,image/webp'; picker.setAttribute('aria-label', t('select')); picker.disabled = busy || !!pending;
        picker.onchange = () => { if (!active() || busy || pending) return; epoch++; release(); files = Array.from(picker.files || []); consent = false; prepared = null; draft = null; base = null; requestKey = ''; open = false; editing = false; original = null; input = model.blank(); setStatus(''); };
        const upload = el('label'); upload.className = 'batch-upload-zone';
        const icon = el('span', '↑'); icon.className = 'batch-upload-icon'; icon.setAttribute('aria-hidden', 'true');
        const copy = el('span'); copy.className = 'batch-upload-copy'; append(copy, el('strong', t('uploadHint')), el('span', t('uploadFormats')));
        const choose = el('span', t('select')); choose.className = 'batch-choose'; append(upload, icon, copy, choose, picker); append(root, upload);
        if (files.length) {
            const selected = el('div'); selected.className = 'batch-selected-heading'; append(selected, el('h3', t('selectedPhotos')), el('span', String(files.length) + ' / 8')); append(root, selected);
            const previews = el('div'); previews.className = 'batch-previews';
            files.forEach((f, i) => {
                const card = el('article'); card.className = 'batch-photo';
                const img = el('img'); img.alt = t('photoLabel') + ' ' + (i + 1); if (!previewUrls[i]) previewUrls[i] = w.URL.createObjectURL(f); img.src = previewUrls[i]; append(card, img);
                const caption = el('div'); caption.className = 'batch-photo-caption'; append(caption, el('span', t('photoLabel') + ' ' + (i + 1) + ' · ' + Math.ceil(f.size / 1024) + ' KB'));
                const rm = button('remove', () => { if (busy || pending) return; epoch++; release(); files = files.filter((_, j) => j !== i); consent = false; prepared = null; input = model.blank(); open = false; editing = false; original = null; changed(); paint(); }); rm.disabled = busy || !!pending; rm.setAttribute('aria-label', t('remove') + ' ' + t('photoLabel') + ' ' + (i + 1)); append(caption, rm); append(card, caption); append(previews, card);
            }); append(root, previews);
        }
        if (options.byok) {
            const chat = el('a', t('openChatGPT')); chat.href = 'https://chatgpt.com/'; chat.target = '_blank'; chat.rel = 'noopener noreferrer';
            append(root, disclosure('aboutDemo', el('p', t('byokAvailable')), el('p', t('nativeUnavailable')), chat));
            append(root, disclosure('privacyDetails', el('p', t('byokDisclosure')), el('p', t('byokRisk')), policyLink(), el('p', t('limits'))));
        } else append(root, disclosure('privacyDetails', el('p', t('limits'))));
        if ((options.analyze || options.byok) && !open) {
            const permissions = el('fieldset'); permissions.className = 'batch-analysis'; permissions.disabled = busy || !!pending;
            if (options.byok) { const note = el('p', t('sendNote')); note.className = 'batch-send-note'; append(permissions, note); }
            if (files.length) check(permissions, options.byok ? 'byokConsent' : 'consent', consent, v => consent = v);
            const actions = el('div'); actions.className = 'batch-analysis-actions';
            const hint = el('span', t(options.byok && !options.byok.hasKey() ? 'keyNeeded' : 'analyzeHint')); hint.className = 'batch-subtle';
            const analyze = focusNode(button('analyze', () => analyzeBatch()), 'analyze'); analyze.className = 'primary'; analyze.disabled = busy || !!pending || settingsOpen || !files.length || !consent || !!options.byok && !options.byok.hasKey(); append(actions, hint, analyze); append(permissions, actions); append(root, permissions);
            if (options.byok && ['analysisNetwork', 'analysisTimeout', 'analysisCancelled', 'analysisDuplicate', 'analysisInvalid', 'analysisIncomplete', 'analysisLimit', 'analysisQuota', 'analysisRate', 'analysisAuth'].includes(detail)) {
                const retry = button('retryAnalysis', () => { if (w.confirm(t('retryCost'))) return analyzeBatch(true); }); retry.disabled = busy || !!pending || settingsOpen || !files.length || !consent || !options.byok.hasKey(); append(root, retry);
            }
        }
        const utilities = el('div'); utilities.className = 'batch-utilities';
        append(utilities, button('reload', () => run(async () => { if (pending?.action === 'draft') {
            const result = await call('list', { namespace: options.namespace(), requestKey: pending.args.requestKey });
            if (result.record) {
                const saved = result.record as SavedBatch;
                const read = await call('list', { namespace: options.namespace(), batchId: saved.id });
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
                const replay = await call('draft', pending.args);
                edit(replay.draft as BatchDraft);
            }
        }
        else if (pending?.action === 'confirm') {
            const result = await call('confirm', pending.args);
            const saved = result.record as SavedBatch;
            const read = await call('list', { namespace: options.namespace(), batchId: saved.id });
            if ((read.record as SavedBatch).digest !== saved.digest)
                throw new Error('stale');
            pending = null;
            open = false;
            statusKey = result.deleted ? 'deletedReplay' : 'saved';
        } await reload(); })), button('cancel', () => { epoch++; release(); files = []; prepared = null; consent = false; open = false; editing = false; original = null; draft = null; base = null; keyDraft = ''; settingsOpen = false; setStatus('cancelNote'); }));
        append(root, utilities);
        const status = el('p', t(statusKey) + (detail ? ' ' + t(detail) : ''));
        status.setAttribute('role', 'status');
        status.className = 'batch-status'; if (status.textContent) append(root, status);
        if (open) review(root);
        for (const d of data.batchDrafts) {
            const b = button('reviewResults', () => edit(d));
            b.disabled = busy || !!pending;
            if (!open || base?.id !== d.id) append(root, el('p', d.batch.sessions.length + ' ' + t('session')), b);
        }
        const reports = el('section'); reports.className = 'batch-reports'; report(reports); append(root, reports);
        if (focused) focusNodes.get(focused)?.focus();
    }
    paint();
    void run(() => reload());
    return { paint, clearKey: () => { if (!active()) return; epoch++; const key = focusNodes.get(scopeId + 'key') as HTMLInputElement | undefined; if (key) key.value = ''; options.byok?.clearKey(); keyDraft = ''; settingsOpen = false; consent = false; paint(); }, refresh: () => run(() => reload()), receiveDraft: (next: BatchDraft) => { if (active() && !busy && !pending && next.status === 'pending')
            edit(next); }, setData: (next: BatchData) => { if (active() && Array.isArray(next.batchRecords)) {
            data = next;
            paint();
        } }, dispose: () => { if (disposed) return; const key = focusNodes.get(scopeId + 'key') as HTMLInputElement | undefined; if (key) key.value = ''; focusNodes.clear(); disposed = true; epoch++; keyDraft = ''; settingsOpen = false; options.byok?.dispose(); release(); root.replaceChildren(); } };
}
export const batchUiSource = `const mountHealthBatchUI=${mountBatchUI.toString()};`;

export const batchCss=`.batch-panel{padding:28px;overflow-wrap:anywhere;color:var(--foreground,#152c49);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,'Noto Sans TC',sans-serif}.batch-panel *{box-sizing:border-box}.batch-panel h2{font-size:22px;line-height:1.35;letter-spacing:-.4px;margin:0}.batch-panel h3{font-size:15px;font-weight:650;margin:0}.batch-panel p{margin:8px 0}.batch-panel label{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0}.batch-panel input,.batch-panel select{max-width:100%;padding:9px 11px;border:1px solid #cdd9e8;border-radius:8px;color:inherit;background:var(--background,#fff);font:inherit}.batch-panel input[type=checkbox]{flex:none;accent-color:#2266d7;width:17px;height:17px;margin:3px 0}.batch-panel button{font:inherit;font-size:13px;font-weight:600;margin:0;padding:9px 14px;border:1px solid #d5dfed;border-radius:8px;cursor:pointer;color:#315174;background:var(--background,#fff);min-height:40px;touch-action:manipulation}.batch-panel button:hover:not(:disabled){background:#edf4ff;border-color:#b4c9e5}.batch-panel button:disabled{opacity:.5;cursor:default}.batch-panel button.primary{background:#2266d7;color:#fff;border-color:#2266d7;padding:11px 24px;box-shadow:0 3px 9px #2266d71a}.batch-panel button.primary:hover:not(:disabled){background:#1e59ba}.batch-panel :is(button,input,select,summary,a):focus-visible{outline:3px solid #87b5ff;outline-offset:3px}.batch-panel a{color:#2266d7;text-decoration:underline;text-underline-offset:3px}.batch-panel pre{white-space:pre-wrap;max-height:350px;overflow:auto;font-size:12px}.batch-panel svg{width:100%;max-height:180px}.batch-panel img{object-fit:contain}.batch-upload-header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:20px}.batch-steps{display:flex;flex-wrap:wrap;gap:20px;list-style:none;margin:14px 0 0;padding:0!important;color:#75859a;font-size:12px}.batch-steps li{display:flex;align-items:center;gap:7px}.batch-steps li>span:first-child{display:grid;place-items:center;width:21px;height:21px;border-radius:50%;background:#eef2f7;font-size:11px;font-weight:700}.batch-steps li.current{color:#2266d7;font-weight:650}.batch-steps li.current>span:first-child{background:#e6efff}.batch-settings-toggle{white-space:nowrap}.batch-provider-strip{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:12px;color:#61728a;margin-bottom:18px}.batch-key-badge{display:inline-flex;align-items:center;gap:6px;border-radius:20px;background:#f0f3f8;padding:4px 10px;color:#718198}.batch-key-badge:before{content:'';width:6px;height:6px;border-radius:50%;background:#95a3b5}.batch-key-badge.ready{background:#eaf6f0;color:#287454}.batch-key-badge.ready:before{background:#359370}.batch-panel .batch-upload-zone{position:relative;display:flex;gap:18px;align-items:center;padding:28px;border:1.5px dashed #b6ccef;border-radius:14px;background:linear-gradient(110deg,#f4f8ff,#fbfdff);margin:0 0 20px;cursor:pointer;flex-wrap:nowrap}.batch-upload-zone:hover{border-color:#2266d7;background:#edf4ff}.batch-upload-zone:focus-within{outline:3px solid #87b5ff;outline-offset:3px}.batch-upload-icon{flex:none;display:grid;place-items:center;width:48px;height:48px;border-radius:13px;background:#e3edff;color:#2266d7;font-size:29px;font-weight:500}.batch-upload-copy{display:flex;flex-direction:column;gap:5px;flex:1;min-width:0}.batch-upload-copy strong{font-size:16px;font-weight:650;color:#284c76}.batch-upload-copy>span{font-size:12px;color:#75879d}.batch-choose{flex:none;font-size:13px;font-weight:650;padding:10px 14px;border:1px solid #c9d9ee;border-radius:8px;background:#fff;color:#2266d7}.batch-panel .batch-upload-zone input[type=file]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;margin:0;padding:0}.batch-upload-zone:has(input:disabled){opacity:.6;cursor:default}.batch-selected-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.batch-selected-heading>span{font-size:12px;color:#75859a}.batch-previews{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:22px}.batch-photo{border:1px solid #e0e8f2;border-radius:12px;overflow:hidden;background:var(--background,#fff);min-width:0}.batch-panel .batch-photo img{display:block;width:100%;height:185px;margin:0;padding:12px;background:#f5f8fc;object-fit:contain}.batch-photo-caption{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:10px 12px;font-size:11px;color:#6d7e94}.batch-panel .batch-photo-caption button{border:0;background:none;min-height:32px;padding:4px;font-size:11px;color:#6d7e94}.batch-note{border:1px solid #e3eaf3;border-radius:9px;margin:10px 0;background:var(--background,#fff);color:#61728a;font-size:12px}.batch-note summary{cursor:pointer;padding:12px 14px;color:#456184;font-weight:600;touch-action:manipulation}.batch-note[open] summary{border-bottom:1px solid #e9eef5}.batch-note>p,.batch-note>a{margin:12px 16px;display:block}.batch-settings{border:1px solid #cdddf5;border-radius:12px;background:#f7faff;padding:20px;margin:0 0 20px}.batch-settings-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.batch-panel .batch-settings-heading button{border:0;background:transparent;padding:4px 8px;font-size:12px;min-height:32px}.batch-subtle{color:#718198;font-size:12px;line-height:1.6}.batch-panel .batch-key-field{display:flex;flex-direction:column;align-items:stretch;gap:7px;margin:16px 0 8px;font-size:13px;font-weight:600}.batch-key-field input{width:100%;min-height:44px;font-weight:400}.batch-settings-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:16px}.batch-settings-actions>button:first-child:not(.primary){margin-right:auto}.batch-panel .batch-analysis{border:0;border-top:1px solid #e5ecf5;padding:18px 0 0;margin:20px 0 0;min-width:0}.batch-panel .batch-send-note{font-size:12px;color:#58718f;margin:0 0 12px}.batch-analysis label{font-size:12px;color:#526981;align-items:flex-start;flex-wrap:nowrap;line-height:1.7;margin:0 0 18px}.batch-analysis-actions{display:flex;align-items:center;justify-content:space-between;gap:16px}.batch-analysis-actions .primary{min-width:155px}.batch-utilities{display:flex;align-items:center;gap:16px;flex-wrap:wrap;border-top:1px solid #e9eef5;padding-top:16px;margin-top:20px}.batch-panel .batch-utilities button{background:none;border:0;padding:4px 0;min-height:32px;color:#70829a;font-weight:500;font-size:12px}.batch-status{padding:12px 15px;border-radius:9px;background:#edf4ff;color:#365e92;font-size:13px}.batch-editor{border:0;padding:0;margin:15px 0;min-width:0}.batch-editor button,.batch-results button{margin:4px}.batch-card,.batch-observation{border:1px solid #d5e0ee;border-radius:10px;padding:14px;margin:12px 0}.batch-results,.batch-capability{border:1px solid #d5e0ee;border-radius:12px;padding:20px;margin:18px 0}.batch-panel ul{padding-left:22px}.batch-reports{margin-top:24px;padding-top:24px;border-top:1px solid #e9eef5}.batch-reports h2{font-size:18px;margin-bottom:8px}.batch-reports>p{color:#718198;font-size:13px}.batch-panel>h3{margin-top:24px}.batch-panel>details:not(.batch-note){margin:12px 0}.batch-panel>p{color:#718198;font-size:13px}@media(max-width:600px){.batch-panel{padding:20px 16px}.batch-panel h2{font-size:19px}.batch-upload-header{gap:12px}.batch-steps{gap:12px;font-size:11px}.batch-panel .batch-upload-zone{padding:22px 16px;flex-direction:column;text-align:center;gap:12px}.batch-upload-copy strong{font-size:15px}.batch-choose{width:100%}.batch-provider-strip{align-items:flex-start;gap:8px}.batch-previews{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.batch-panel .batch-photo img{height:140px;padding:8px}.batch-photo-caption{padding:8px;flex-wrap:wrap}.batch-analysis-actions{align-items:stretch;flex-direction:column;gap:10px}.batch-analysis-actions .primary{width:100%}.batch-settings{padding:16px}.batch-settings-actions{gap:6px}.batch-panel .batch-settings-actions button{font-size:12px;padding:9px 11px}.batch-settings-heading{align-items:flex-start}.batch-settings-heading button{max-width:45%}}`;
