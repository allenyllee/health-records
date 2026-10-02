/** Bounded, provider-free batch validation shared with both frontends. */
export type Capture = {
    status: string;
    exifDateTime: string | null;
    exifOffset: string | null;
    userDate: string | null;
    userTime: string | null;
    userTimezone: string | null;
    reviewed: boolean;
    note: string;
};
export type BatchSource = {
    id: string;
    kind: 'photo' | 'screenshot' | 'manual' | 'unknown';
    capture: Capture;
};
export type Observation = {
    sourceId: string;
    index: number;
    metric: string;
    label: string;
    value: number | null;
    unit: string | null;
    displayedDate: string | null;
    displayedTime: string | null;
    displayedTimezone: string | null;
    selected: boolean;
    resolution: string;
};
export type MeasurementSession = {
    id: string;
    date: string | null;
    time: string | null;
    timezone: string | null;
    precision: 'date' | 'minute' | 'second';
    confirmed: boolean;
    note: string;
    observations: Observation[];
};
export type HealthBatch = {
    version: 1;
    sources: BatchSource[];
    sessions: MeasurementSession[];
    groupingConfirmed: boolean;
};
export type BatchDraft = {
    id: string;
    requestKey: string;
    digest: string;
    status: string;
    batch: HealthBatch;
    issues: string[];
};
export type SavedBatch = {
    id: string;
    batch: HealthBatch;
    digest: string;
    deleted_at: string | null;
    created_at: string;
};
export function createBatchRuntime() {
    const limits = { files: 8, fileBytes: 10 * 1024 * 1024, totalBytes: 30 * 1024 * 1024, sanitizedBytes: 40 * 1024 * 1024, sessions: 16, observations: 64, payloadBytes: 64000 };
    const metrics: Record<string, string[]> = { weight: ['kg', 'lb'], body_fat_percent: ['%'], skeletal_muscle_mass: ['kg', 'lb'], muscle_mass: ['kg', 'lb'], skeletal_muscle_percent: ['%'], muscle_percent: ['%'], water_percent: ['%'], bone_mass: ['kg', 'lb'], bmi: ['kg/m²'], visceral_fat_level: ['level'] };
    const labels: Record<string, [
        string,
        string
    ]> = {
        ordinalTrend: ['Observation order; labels retain date-only precision and source timezone.', '觀察順序；標籤保留僅有日期的精度及來源時區。'], title: ['Measurement sessions', '量測批次'], limits: ['Up to 8 images · 10 MB each · 30 MB total. JPEG, PNG, WebP; convert HEIC and check dates.', '最多 8 張，每張 10 MB，合計 30 MB。JPEG、PNG、WebP；HEIC 請轉檔並核對日期。'], manualOnly: ['Local metadata and manual review only. Standalone ChatGPT-plan image inference is unavailable.', '僅本機日期解析與手動核對；獨立網頁尚無核准的 ChatGPT 方案圖片推論。'], destination: ['Destination: authenticated owner D1 records in the selected real/demo space. Original photos and GPS are not saved.', '目的地：目前選定正式／示範空間內，已授權本人的 D1 紀錄；不保存原圖或 GPS。'], select: ['Select photos/screenshots', '選取照片／截圖'], remove: ['Remove', '移除'], cancel: ['Clear local selection / close review', '清除本機選圖／關閉核對'], cancelNote: ['Closing cannot revoke an already submitted request. Read back before retrying.', '關閉不能撤回已送請求；重試前須讀回狀態。'], consent: ['I approve sending these selected images to ChatGPT for analysis.', '我同意將目前選定圖片送給 ChatGPT 分析。'], allowDraft: ['Allow only a pending batch draft; I will review before saving.', '僅允許建立待確認批次草稿，核對後才入帳。'], analyze: ['Analyze whole batch', '分析整批'], accepted: ['Host accepted the batch; model visibility/extraction is unverified. Check chat and reload drafts. No automatic save.', '主程式已接受整批；尚未驗證模型是否看見／辨識。請查看對話並重讀草稿，不會自動入帳。'], transportMissing: ['Host has no usable declared image transport. No images or analysis text were sent.', '主程式未宣告可用圖片通道，未送出圖片或分析文字。'], partial: ['Transport outcome is uncertain. Inspect chat and read drafts before retrying the same batch.', '傳送結果不明，請先查看對話及讀回草稿再重試相同批次。'], preparing: ['Reading date evidence and removing hidden metadata…', '正在讀取日期證據並移除隱藏資訊…'], newSession: ['Add separate session', '新增另次量測'], suggest: ['Suggest groups from visible dates (review required)', '依畫面日期提議分組（須核對）'], grouping: ['I reviewed the split/merge grouping; these sessions must remain separate.', '我已核對合併／拆分分組，各次量測不混用。'], session: ['Session', '量測'], date: ['Measurement date', '量測日期'], time: ['Measurement time (leave blank if unknown)', '量測時間（未知留空）'], zone: ['Evidence-backed timezone / UTC offset; no device default', '有證據的時區／UTC 時差，不採裝置預設'], confirmTime: ['I confirm this measurement date/time/zone and stated precision.', '我確認這次量測日期／時間／時區與精度。'], dateOnly: ['Date only; time unknown', '只有日期，時間未知'], minute: ['Minute precision', '分鐘精度'], second: ['Second precision', '秒精度'], note: ['Resolution / grouping note', '釐清／分組說明'], source: ['Source', '來源'], kind: ['Input kind', '圖片類型'], photo: ['Current scale photo', '當下體脂計照片'], screenshot: ['Screenshot / historical display', '截圖／歷史畫面'], unknown: ['Unknown', '未知'], manual: ['Manual entry', '手動輸入'], capture: ['Capture evidence', '拍攝證據'], captureDate: ['User-confirmed capture date', '本人確認拍攝日期'], captureTime: ['User-confirmed capture time', '本人確認拍攝時間'], captureZone: ['User-confirmed capture zone', '本人確認拍攝時區'], reviewCapture: ['I checked this source and its missing/conflicting capture evidence.', '我已核對此來源及缺漏／衝突拍攝證據。'], captureNote: ['Capture uncertainty / correction (keep unknown if unavailable)', '拍攝不確定／更正說明（無資料保留未知）'], addMetric: ['Add observation', '新增觀察值'], metric: ['Metric', '指標'], custom: ['Custom metric (explicit label/unit)', '其他指標（明確名稱／單位）'], label: ['Original metric label', '原始指標名稱'], value: ['Value', '數值'], unit: ['Unit', '單位'], shownDate: ['Displayed measurement date', '畫面量測日期'], shownTime: ['Displayed measurement time', '畫面量測時間'], shownZone: ['Displayed timezone', '畫面時區'], selected: ['Include in confirmed session', '納入本次入帳'], move: ['Move to session / merge', '移到量測／合併'], exclude: ['Exclusion / conflict resolution', '排除／衝突釐清'], draft: ['Create/update batch draft', '建立／更新批次草稿'], save: ['Confirm entire reviewed batch atomically', '確認整批原子入帳'], reload: ['Reload canonical records/drafts', '重讀正式紀錄／草稿'], edit: ['Review/edit draft', '核對／編輯草稿'], saved: ['Saved and read back the entire batch.', '整批已儲存並讀回。'], deletedReplay: ['This batch is in trash; retry did not restore it.', '此批次在回收區，重試未還原。'], trash: ['Move this whole batch to trash', '將整個批次移到回收區'], restore: ['Restore this whole batch', '還原整個批次'], confirmAction: ['Confirm this exact batch status change?', '確認變更這個批次的狀態？'], reports: ['Confirmed session reports and trends', '已確認量測報表與趨勢'], partialList: ['Partial records: load more for complete trends. Drafts bounded to latest 100.', '部分紀錄，請載入更多取得完整趨勢；草稿顯示最近 100 筆。'], more: ['Load more batches', '載入更多批次'], empty: ['No confirmed sessions.', '尚無已確認量測。'], duplicate: ['Repeated same metric/value/unit: one metric with all sources.', '相同指標／值／單位重複：整合一個指標並保留全部來源。'], reading: ['Read date evidence locally', '在本機讀取日期證據'], error: ['Unable to complete request.', '無法完成請求。'], stale: ['Draft changed. Reload and review again.', '草稿已變更，請重讀並核對。'], keyConflict: ['This request key was used for different content.', '此請求編號已用於不同內容。'], groupRequired: ['Confirm session grouping.', '請確認量測分組。'], sourceReview: ['Review every source and explain missing/conflicting capture evidence.', '請核對每個來源並說明缺漏／矛盾拍攝證據。'], measurement: ['Confirm valid measurement date/time/precision and timezone for every session.', '請確認每次量測有效日期／時間／精度與時區。'], observation: ['Resolve invalid metric/value/unit, duplicate observation IDs or missing sources.', '請釐清無效指標／值／單位、重複觀察編號或缺少來源。'], conflict: ['Conflicting values/units for one metric; select the intended reading and explain exclusions.', '同一指標值／單位衝突，請選擇讀數並說明排除原因。'], displayConflict: ['Displayed/capture date/time/offset differs from the session; provide an explicit resolution.', '畫面／拍攝日期時間／時差與量測不同，請明確說明。'], emptySession: ['Each session needs at least one selected metric; remove empty sessions.', '每次量測至少選一個指標，請移除空量測。'], bounds: ['Batch limits exceeded or invalid input.', '超過批次上限或輸入無效。'], weight: ['Body weight', '體重'], body_fat_percent: ['Body fat percentage', '體脂率'], skeletal_muscle_mass: ['Skeletal muscle mass', '骨骼肌重量'], muscle_mass: ['Total muscle mass', '總肌肉重量'], skeletal_muscle_percent: ['Skeletal muscle percentage', '骨骼肌率'], muscle_percent: ['Muscle percentage', '肌肉率'], water_percent: ['Body water percentage', '體水分率'], bone_mass: ['Bone mass', '骨量'], bmi: ['BMI', 'BMI'], visceral_fat_level: ['Visceral fat level', '內臟脂肪等級'], schema: ['Invalid batch structure or unsupported fields.', '批次結構無效或欄位不支援。']
    };
    const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
    const t = (key: string, locale: string) => labels[key]?.[locale === 'zh-Hant' ? 1 : 0] || key;
    const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
    const text = (v: unknown, max = 160): string | null => { if (v === null || v === undefined)
        return null; if (typeof v !== 'string' || v.length > max)
        throw new Error('schema'); return v.trim() || null; };
    const shape = (v: Record<string, unknown>, keys: string[]) => { if (Object.keys(v).some(k => !keys.includes(k)))
        throw new Error('schema'); };
    const validDate = (v: string | null) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v + 'T12:00:00Z')) && new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) === v;
    const validTime = (v: string | null) => !!v && /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(v);
    const validOffset = (v: string | null) => !!v && /^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(v) && (!v.slice(1).startsWith('14:') || v.slice(4) === '00');
    const validZone = (v: string | null) => { if (!v)
        return false; if (v.startsWith('UTC'))
        return v === 'UTC' || validOffset(v.slice(3)); try {
        new Intl.DateTimeFormat('en', { timeZone: v });
        return true;
    }
    catch {
        return false;
    } };
    function localInstants(date: string | null, time: string | null, zone: string | null): number[] { if (!validDate(date) || !validTime(time) || !validZone(zone))
        return []; const stamp = date + 'T' + time + (time!.length === 5 ? ':00' : ''); if (zone === 'UTC' || zone!.startsWith('UTC'))
        return [Date.parse(stamp + (zone === 'UTC' ? 'Z' : zone!.slice(3)))]; const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: zone!, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }); const raw = Date.parse(stamp + 'Z'), found: number[] = []; for (let offset = -840; offset <= 840; offset += 15) {
        const instant = raw + offset * 60000, parts = Object.fromEntries(fmt.formatToParts(new Date(instant)).map(p => [p.type, p.value]));
        if (parts.year + '-' + parts.month + '-' + parts.day + 'T' + parts.hour + ':' + parts.minute + ':' + parts.second === stamp)
            found.push(instant);
    } return found; }
    const id = (v: unknown) => { const s = text(v, 100); if (!s || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/.test(s))
        throw new Error('schema'); return s; };
    function clean(value: unknown): HealthBatch {
        const b = object(value);
        shape(b, ['version', 'sources', 'sessions', 'groupingConfirmed']);
        if (typeof b.groupingConfirmed !== 'boolean')
            throw new Error('schema');
        if (b.version !== 1 || !Array.isArray(b.sources) || !Array.isArray(b.sessions) || b.sources.length > limits.files || b.sessions.length > limits.sessions)
            throw new Error('bounds');
        const sources = b.sources.map(v => { const x = object(v), e = object(x.capture); shape(x, ['id', 'kind', 'capture']); shape(e, ['status', 'exifDateTime', 'exifOffset', 'userDate', 'userTime', 'userTimezone', 'reviewed', 'note']); if (typeof e.reviewed !== 'boolean')
            throw new Error('schema'); if (!['photo', 'screenshot', 'manual', 'unknown'].includes(String(x.kind)))
            throw new Error('schema'); return { id: id(x.id), kind: x.kind as BatchSource['kind'], capture: { status: text(e.status, 20) || 'unknown', exifDateTime: text(e.exifDateTime, 30), exifOffset: text(e.exifOffset, 10), userDate: text(e.userDate, 12), userTime: text(e.userTime, 10), userTimezone: text(e.userTimezone, 80), reviewed: e.reviewed === true, note: text(e.note, 300) || '' } }; });
        let count = 0;
        const sessions = b.sessions.map(v => { const x = object(v); shape(x, ['id', 'date', 'time', 'timezone', 'precision', 'confirmed', 'note', 'observations']); if (typeof x.confirmed !== 'boolean')
            throw new Error('schema'); if (!Array.isArray(x.observations) || !['date', 'minute', 'second'].includes(String(x.precision)))
            throw new Error('schema'); count += x.observations.length; return { id: id(x.id), date: text(x.date, 12), time: text(x.time, 10), timezone: text(x.timezone, 80), precision: x.precision as MeasurementSession['precision'], confirmed: x.confirmed === true, note: text(x.note, 300) || '', observations: x.observations.map(v => { const o = object(v); shape(o, ['sourceId', 'index', 'metric', 'label', 'value', 'unit', 'displayedDate', 'displayedTime', 'displayedTimezone', 'selected', 'resolution']); if (typeof o.selected !== 'boolean')
                throw new Error('schema'); if (!Number.isInteger(o.index) || Number(o.index) < 0 || Number(o.index) >= 64 || o.value !== null && (typeof o.value !== 'number' || !Number.isFinite(o.value)))
                throw new Error('schema'); return { sourceId: id(o.sourceId), index: Number(o.index), metric: id(o.metric), label: text(o.label, 80) || '', value: o.value as number | null, unit: text(o.unit, 16), displayedDate: text(o.displayedDate, 12), displayedTime: text(o.displayedTime, 10), displayedTimezone: text(o.displayedTimezone, 80), selected: o.selected !== false, resolution: text(o.resolution, 300) || '' }; }) }; });
        if (count > limits.observations || !sources.length || !sessions.length || new Set(sources.map(s => s.id)).size !== sources.length || new Set(sessions.map(s => s.id)).size !== sessions.length)
            throw new Error('bounds');
        return { version: 1, sources: sources.sort((a, b) => compare(a.id, b.id)), sessions: sessions.sort((a, b) => compare(a.id, b.id)).map(s => ({ ...s, observations: s.observations.sort((a, b) => compare(a.sourceId, b.sourceId) || a.index - b.index) })), groupingConfirmed: b.groupingConfirmed === true };
    }
    function consolidate(s: MeasurementSession) { const groups = new Map<string, {
        metric: string;
        label: string;
        value: number;
        unit: string;
        sources: string[];
        observations: string[];
        duplicate: boolean;
    }>(); for (const o of s.observations.filter(o => o.selected && o.value !== null && o.unit)) {
        const k = o.metric + '\0' + o.unit + '\0' + o.value + '\0' + (o.metric.startsWith('custom:') ? o.label : '');
        const old = groups.get(k);
        if (old) {
            old.sources = Array.from(new Set([...old.sources, o.sourceId]));
            old.observations.push(o.sourceId + ':' + o.index);
            old.duplicate = true;
        }
        else
            groups.set(k, { metric: o.metric, label: o.label, value: o.value!, unit: o.unit!, sources: [o.sourceId], observations: [o.sourceId + ':' + o.index], duplicate: false });
    } return [...groups.values()]; }
    function issues(b: HealthBatch) {
        const out = new Set<string>();
        if (!b.groupingConfirmed)
            out.add('groupRequired');
        const seen = new Set<string>();
        for (const s of b.sources) {
            const c = s.capture, exif = c.exifDateTime;
            if (!c.reviewed || s.kind === 'unknown' || !['available', 'missing', 'unsupported', 'invalid', 'conflict', 'manual', 'unknown'].includes(c.status) || (!exif || !c.exifOffset || ['invalid', 'conflict', 'unknown'].includes(c.status)) && !c.note)
                out.add('sourceReview');
            if (exif && (!/^\d{4}:\d{2}:\d{2} ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(exif) || !validDate(exif.slice(0, 10).replaceAll(':', '-'))) && !c.note)
                out.add('sourceReview');
            if (c.exifOffset && !validOffset(c.exifOffset) && !c.note)
                out.add('sourceReview');
            if (exif && !c.note && (c.userDate && c.userDate !== exif.slice(0, 10).replaceAll(':', '-') || c.userTime && c.userTime !== exif.slice(11, 11 + c.userTime.length) || c.userTimezone && validOffset(c.exifOffset) && !localInstants(exif.slice(0, 10).replaceAll(':', '-'), exif.slice(11), c.userTimezone).includes(Date.parse(exif.slice(0, 10).replaceAll(':', '-') + 'T' + exif.slice(11) + c.exifOffset))))
                out.add('sourceReview');
            if (c.userDate && !validDate(c.userDate) || c.userTime && !validTime(c.userTime) || c.userTimezone && !validZone(c.userTimezone))
                out.add('sourceReview');
        }
        for (const s of b.sessions) {
            if (!s.confirmed || !validDate(s.date) || !validZone(s.timezone) || (s.precision === 'date' ? s.time !== null : !validTime(s.time) || s.time!.length !== (s.precision === 'minute' ? 5 : 8) || localInstants(s.date, s.time, s.timezone).length !== 1))
                out.add('measurement');
            const picked = s.observations.filter(o => o.selected);
            if (!picked.length)
                out.add('emptySession');
            for (const o of s.observations) {
                const source = b.sources.find(x => x.id === o.sourceId), key = o.sourceId + ':' + o.index;
                if (!source || seen.has(key))
                    out.add('observation');
                seen.add(key);
                if (!o.selected) {
                    if (!o.resolution)
                        out.add('observation');
                    continue;
                }
                const units = metrics[o.metric];
                if (o.value === null || o.value < 0 || o.value > 10000 || !o.unit || (units ? !units.includes(o.unit) : !o.metric.startsWith('custom:') || !o.label) || o.unit === '%' && o.value! > 100)
                    out.add('observation');
                if (o.displayedDate && !validDate(o.displayedDate) || o.displayedTime && !validTime(o.displayedTime) || o.displayedTimezone && !validZone(o.displayedTimezone))
                    out.add('observation');
                const e = source?.capture;
                const captureDate = source?.kind === 'photo' ? (e?.userDate || e?.exifDateTime?.slice(0, 10).replaceAll(':', '-')) : null;
                const captureTime = source?.kind === 'photo' ? (e?.userTime || e?.exifDateTime?.slice(11)) : null;
                const captureZone = e?.userTimezone || (validOffset(e?.exifOffset || null) ? 'UTC' + e!.exifOffset : null);
                const captured = localInstants(captureDate || null, captureTime || null, captureZone);
                const measured = s.precision === 'date' ? [] : localInstants(s.date, s.time, s.timezone);
                // Five minutes accommodates a scale display cycle. Compare evidence-backed instants,
                // retaining minute intervals; never supply a timezone for missing EXIF offset.
                const timedCapture = captured.length === 1 && measured.length === 1;
                const captureEnd = (captured[0] || 0) + (captureTime?.length === 5 ? 59999 : 0);
                const measurementEnd = (measured[0] || 0) + (s.precision === 'minute' ? 59999 : 0);
                const captureConflict = timedCapture ? Math.max(captured[0] - measurementEnd, measured[0] - captureEnd, 0) > 5 * 60000 : !!captureDate && captureDate !== s.date;
                if ((o.displayedDate && o.displayedDate !== s.date || o.displayedTime && o.displayedTime !== s.time || o.displayedTimezone && o.displayedTimezone !== s.timezone || captureConflict) && !o.resolution)
                    out.add('displayConflict');
            }
            const byMetric = new Map<string, Set<string>>();
            for (const o of picked) {
                if (!byMetric.has(o.metric))
                    byMetric.set(o.metric, new Set());
                byMetric.get(o.metric)!.add(o.unit + '\0' + o.value + '\0' + (o.metric.startsWith('custom:') ? o.label : ''));
            }
            if ([...byMetric.values()].some(v => v.size > 1))
                out.add('conflict');
        }
        for (const source of b.sources) {
            if (!b.sessions.some(s => s.observations.some(o => o.sourceId === source.id)))
                out.add('observation');
        }
        return [...out];
    }
    const blank = (): HealthBatch => ({ version: 1, sources: [{ id: 'manual', kind: 'manual', capture: { status: 'manual', exifDateTime: null, exifOffset: null, userDate: null, userTime: null, userTimezone: null, reviewed: false, note: '' } }], sessions: [], groupingConfirmed: false });
    function suggest(b: HealthBatch) { const groups = new Map<string, MeasurementSession>(); for (const s of b.sessions)
        for (const o of s.observations) {
            const shown = validDate(o.displayedDate) ? o.displayedDate : null;
                const key = shown || 'unknown:' + s.id;
            let target = groups.get(key);
            if (!target) {
                target = { ...s, id: 'group-' + (shown || 'unknown-' + groups.size), date: shown || s.date, time: null, precision: 'date', confirmed: false, note: '', observations: [] };
                groups.set(key, target);
            }
            target.observations.push(o);
        } if (groups.size > limits.sessions)
        throw new Error('bounds'); return { ...b, sessions: [...groups.values()], groupingConfirmed: false }; }
    function trends(records: SavedBatch[]) { const groups = new Map<string, {
        metric: string;
        label: string;
        unit: string;
        points: {
            batchId: string;
            sessionId: string;
            date: string;
            time: string | null;
            timezone: string | null;
            precision: string;
            value: number;
        }[];
    }>(); for (const r of records.filter(r => !r.deleted_at))
        for (const s of r.batch.sessions)
            for (const m of consolidate(s)) {
                const key = m.metric + '\0' + m.unit + '\0' + (m.metric.startsWith('custom:') ? m.label : '');
                if (!groups.has(key))
                    groups.set(key, { metric: m.metric, label: m.label, unit: m.unit, points: [] });
                groups.get(key)!.points.push({ batchId: r.id, sessionId: s.id, date: s.date!, time: s.time, timezone: s.timezone, precision: s.precision, value: m.value });
            } return [...groups.values()].map(g => ({ ...g, points: g.points.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '') || a.sessionId.localeCompare(b.sessionId)) })); }
    return { limits, metrics, labels, t, localInstants, validDate, validTime, validZone, clean, issues, consolidate, blank, suggest, trends };
}
export const batchRuntime = createBatchRuntime();
export const batchSource = `const healthBatch=(${createBatchRuntime.toString()})();`;
