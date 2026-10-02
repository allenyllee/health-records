'use client';
import { useEffect, useRef } from 'react';
import { mountBatchUI } from '@/lib/batch-ui';
import { batchRuntime } from '@/lib/batch';
import { createBrowserVisionProvider, prepareVisionBatch } from '@/lib/vision-provider';
import type { Locale } from '@/lib/i18n';
export default function BatchPanel({ locale, namespace, trash }: {
    locale: Locale;
    namespace: 'real' | 'demo';
    trash: boolean;
}) {
    const container = useRef<HTMLDivElement>(null), localeRef = useRef(locale), panel = useRef<ReturnType<typeof mountBatchUI> | null>(null);
    useEffect(() => { localeRef.current = locale; panel.current?.paint(); }, [locale]);
    useEffect(() => { if (!container.current)
        return; const call = async (action: string, args: Record<string, unknown>) => { const query = new URLSearchParams(Object.entries(args).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => [k, v === true ? '1' : v === false ? '0' : String(v)])); const r = await fetch('/api/health' + (action === 'list' ? '?batches=1&' + query : ''), { method: action === 'list' ? 'GET' : 'POST', cache: 'no-store', ...(action === 'list' ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'batch-' + action, ...args }) }) }); const value = await r.json() as Record<string, unknown>; if (!r.ok)
        throw new Error(typeof value.error === 'string' ? value.error : 'error'); return value; }; const provider = createBrowserVisionProvider(window); const forget = () => { panel.current?.clearKey(); }; window.addEventListener('pagehide', forget); panel.current = mountBatchUI(container.current, { model: batchRuntime, locale: () => localeRef.current, namespace: () => namespace, trash: () => trash, window, prepare: (files, cancelled) => prepareVisionBatch(window, files, cancelled), byok: provider, call }); return () => { window.removeEventListener('pagehide', forget); panel.current?.dispose(); panel.current = null; }; }, [namespace, trash]);
    return <section className="records-panel"><div ref={container}/></section>;
}
