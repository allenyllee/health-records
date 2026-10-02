/** JPEG metadata whitelist; no GPS/MakerNote traversal. Shared by both frontends. */
export type PhotoMetadata = {
    status: string;
    exifDateTime: string | null;
    exifOffset: string | null;
    reason: string;
};
export type PhotoWindow = {
    createImageBitmap?: typeof createImageBitmap;
    document?: Document;
    crypto: Crypto;
};
export function createPhotoRuntime() {
    function extractPhotoDate(buffer: ArrayBuffer, mime: string): PhotoMetadata {
        const bytes = new Uint8Array(buffer), none = (status: string, reason: string): PhotoMetadata => ({ status, exifDateTime: null, exifOffset: null, reason });
        if (bytes.length > 10 * 1024 * 1024)
            return none('oversized', '圖片超過 10 MB，未解析');
        if (mime !== 'image/jpeg' || bytes[0] !== 255 || bytes[1] !== 216)
            return none('unsupported', '此格式未解析 EXIF；請用画面日期或確認量測日期');
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), found: {
            exifDateTime: string;
            exifOffset: string | null;
        }[] = [];
        let at = 2, segments = 0;
        const validDate = (v: string) => { if (!/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(v))
            return false; const d = v.slice(0, 10).replaceAll(':', '-'); return !Number.isNaN(Date.parse(d + 'T12:00:00Z')) && new Date(d + 'T12:00:00Z').toISOString().slice(0, 10) === d && Number(v.slice(11, 13)) < 24 && Number(v.slice(14, 16)) < 60 && Number(v.slice(17, 19)) < 60; };
        const validOffset = (v: string) => /^[-+]\d{2}:\d{2}$/.test(v) && Number(v.slice(1, 3)) <= 14 && Number(v.slice(4)) < 60 && (Number(v.slice(1, 3)) < 14 || Number(v.slice(4)) === 0);
        try {
            while (at < bytes.length) {
                if (++segments > 128 || at > 1024 * 1024)
                    return none('invalid', 'EXIF 解析範圍超過上限');
                if (bytes[at++] !== 255)
                    throw 0;
                while (bytes[at] === 255)
                    at++;
                const marker = bytes[at++];
                if (marker === 218 || marker === 217)
                    break;
                if (marker === 1 || (marker >= 208 && marker <= 215))
                    continue;
                if (at + 2 > bytes.length)
                    throw 0;
                const length = view.getUint16(at);
                if (length < 2 || at + length > bytes.length)
                    throw 0;
                const start = at + 2, end = at + length;
                at = end;
                if (marker !== 225 || end - start < 6 || bytes[start] !== 69 || bytes[start + 1] !== 120 || bytes[start + 2] !== 105 || bytes[start + 3] !== 102 || bytes[start + 4] !== 0 || bytes[start + 5] !== 0)
                    continue;
                const base = start + 6, bound = (pos: number, n: number) => { if (!Number.isSafeInteger(pos) || pos < base || pos + n > end)
                    throw 0; }, u16 = (pos: number): number => { bound(pos, 2); return view.getUint16(pos, little); }, u32 = (pos: number): number => { bound(pos, 4); return view.getUint32(pos, little); };
                bound(base, 8);
                const little = bytes[base] === 73 && bytes[base + 1] === 73;
                if (!little && !(bytes[base] === 77 && bytes[base + 1] === 77))
                    throw 0;
                if (u16(base + 2) !== 42)
                    throw 0;
                function entries(offset: number): number[] { const pos = base + offset; bound(pos, 2); const count = u16(pos); if (count > 256)
                    throw 0; bound(pos + 2, count * 12 + 4); return Array.from({ length: count }, (_, i) => pos + 2 + i * 12); }
                const first = entries(u32(base + 4));
                const pointers = first.filter(pos => u16(pos) === 0x8769);
                if (pointers.length > 1)
                    throw 0;
                if (!pointers.length)
                    continue;
                const ptr = pointers[0];
                if (u16(ptr + 2) !== 4 || u32(ptr + 4) !== 1)
                    throw 0;
                const fields = entries(u32(ptr + 8));
                let date: string | null = null, offset: string | null = null;
                const seen = new Set<number>();
                for (const pos of fields) {
                    const tag = u16(pos);
                    if (tag !== 0x9003 && tag !== 0x9011)
                        continue;
                    if (seen.has(tag))
                        throw 0;
                    seen.add(tag);
                    const expected = tag === 0x9003 ? 20 : 7;
                    if (u16(pos + 2) !== 2 || u32(pos + 4) !== expected)
                        throw 0;
                    const where = base + u32(pos + 8);
                    bound(where, expected);
                    if (bytes[where + expected - 1] !== 0)
                        throw 0;
                    const chars = bytes.subarray(where, where + expected - 1);
                    if (chars.some(v => v < 32 || v > 126))
                        throw 0;
                    const value = String.fromCharCode(...chars).trim();
                    if (tag === 0x9003) {
                        if (value && !validDate(value))
                            throw 0;
                        date = value || null;
                    }
                    else {
                        if (value && !validOffset(value))
                            throw 0;
                        offset = value || null;
                    }
                }
                if (date)
                    found.push({ exifDateTime: date, exifOffset: offset });
            }
        }
        catch {
            return none('invalid', '照片 EXIF 損壞或不符合支援格式，請確認日期');
        }
        if (!found.length)
            return none('missing', '未讀到原始拍攝日期；請檢查畫面日期或補充日期');
        if (found.some(v => v.exifDateTime !== found[0].exifDateTime || v.exifOffset !== found[0].exifOffset))
            return none('conflict', '照片含有互相矛盾的拍攝時間，請確認日期');
        return { status: 'available', ...found[0], reason: found[0].exifOffset ? '讀到 EXIF 原始拍攝時間與時差' : '讀到拍攝時間，但沒有 EXIF 時區，需確認時區' };
    }
    async function preparePrivatePhoto(w: PhotoWindow, file: File) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)
            throw new Error('請選擇 10 MB 以下的 JPEG、PNG 或 WebP。HEIC 日期尚不支援，請轉為 JPEG 並核對日期');
        const bytes = await file.arrayBuffer();
        const metadata = extractPhotoDate(bytes, file.type);
        if (!w.createImageBitmap || !w.document)
            throw new Error('目前介面無法在裝置上清除照片隱藏資訊，請改用對話附件並先移除定位資訊');
        const bitmap = await w.createImageBitmap(file);
        try {
            if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 32000000 || bitmap.width > 12000 || bitmap.height > 12000)
                throw new Error('圖片尺寸過大，請選較小的圖片並核對日期');
            const canvas = w.document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const context = canvas.getContext('2d');
            if (!context)
                throw new Error('無法處理圖片');
            context.drawImage(bitmap, 0, 0);
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob || blob.size > 20 * 1024 * 1024)
                throw new Error('清除隱藏資訊後圖片太大，請使用較小圖片');
            const cleanBytes = new Uint8Array(await blob.arrayBuffer());
            const hash = Array.from(new Uint8Array(await w.crypto.subtle.digest('SHA-256', bytes))).map(v => v.toString(16).padStart(2, '0')).join('');
            return { bytes: cleanBytes, width: bitmap.width, height: bitmap.height, mimeType: 'image/png', metadata, sourceHash: hash };
        }
        finally {
            bitmap.close();
        }
    }
    async function preparePhotoBatch(w: PhotoWindow, files: File[], cancelled: () => boolean = () => false) {
        if (!files.length || files.length > 8 || files.some(f => f.size > 10 * 1024 * 1024) || files.reduce((n, f) => n + f.size, 0) > 30 * 1024 * 1024)
            throw new Error('bounds');
        const images: Awaited<ReturnType<typeof preparePrivatePhoto>>[] = [], duplicates: string[] = [];
        let total = 0, pixels = 0;
        for (const file of files) {
            if (cancelled())
                throw new Error('cancelled');
            const photo = await preparePrivatePhoto(w, file);
            if (cancelled())
                throw new Error('cancelled');
            if (images.some(x => x.sourceHash === photo.sourceHash)) {
                duplicates.push(photo.sourceHash);
                continue;
            }
            total += photo.bytes.length;
            pixels += photo.width * photo.height;
            if (total > 40 * 1024 * 1024 || pixels > 64000000)
                throw new Error('bounds');
            images.push(photo);
        }
        const ids = images.map(x => x.sourceHash).sort();
        const hash = Array.from(new Uint8Array(await w.crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(ids))))).map(v => v.toString(16).padStart(2, '0')).join('');
        if (cancelled())
            throw new Error('cancelled');
        return { images: images.sort((a, b) => a.sourceHash.localeCompare(b.sourceHash)), duplicates, key: 'batch-' + hash };
    }
    return { extractPhotoDate, preparePrivatePhoto, preparePhotoBatch };
}
export const { extractPhotoDate, preparePrivatePhoto, preparePhotoBatch } = createPhotoRuntime();
export type PreparedBatch = Awaited<ReturnType<typeof preparePhotoBatch>>;
export const photoMetadataSource = `const {extractPhotoDate,preparePrivatePhoto,preparePhotoBatch}=(${createPhotoRuntime.toString()})();`;
