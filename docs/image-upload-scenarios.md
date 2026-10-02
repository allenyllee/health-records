# Image-upload scenarios / 圖片上傳使用情境

The included test card and all scenarios below are synthetic. They contain no
real health records, photos or screenshots. The card is a test input, not evidence
of completed image analysis, saving or model accuracy.
本文所附測試卡與以下情境皆為合成範例，不含真實健康紀錄、照片或截圖。測試卡是輸入
範例，不代表已完成圖片辨識、儲存或驗證模型準確率。

## Current prototype and expected future integration / 現有原型與預期整合

**Current prototype:** the original interactive ChatGPT widget and standalone
Web App/PWA share owner-scoped Cloudflare D1 records. Real mode requires existing
server-side owner authorization; synthetic demo is separate. The embedded widget
can send the selected image batch only when the active host advertises the necessary
image capability and the user agrees. It checks bounded JPEG date metadata and
redraws image pixels to remove hidden metadata. A host accepting a message
does not prove the model saw the image or saved a record. Tests cover model/date
rules, bridge handshakes, chart rendering, idempotency and isolated store behavior;
they do not prove every device, host or image extraction is accurate.

**現有原型：** 原本的 ChatGPT 互動介面與獨立 Web App/PWA 共用本人範圍內的
Cloudflare D1 結構化紀錄。真實資料模式需既有伺服器端本人授權，合成示範另行隔離。
內嵌介面僅在目前主程式宣告圖片能力且使用者同意後傳送本次選取的圖片；會解析有界限
的 JPEG 日期中繼資料，並重繪正式圖片像素以移除隱藏資訊。主程式接受訊息不等於模型
看見圖片，也不等於紀錄已儲存。測試涵蓋資料與日期規則、橋接、圖表、重試及隔離儲存
行為，不能推論所有裝置、主程式或圖片的辨識結果都正確。

**Expected future work, not delivered by this prototype:** standalone automatic
ChatGPT analysis using approved plan-backed access; a shared canonical Library,
Space, Notion or Drive dataset across both frontends. The standalone page currently
provides manual entry and draft review, with guidance to use ChatGPT for photos.
Local multi-image metadata/manual review and atomic D1 batch save are implemented;
it has no standalone automatic-analysis endpoint or background worker
or model API credential. SIWC application review, access approval and actual
capability validation are still needed before claiming that planned flow. Sign-in
alone does not grant inference, connector access or common Library/Space
synchronization.

**預期後續工作，尚非此原型已完成功能：** 使用正式核准的方案存取，在獨立網頁自動
呼叫 ChatGPT 分析；以及兩個前端共用同一個 Library、Space、Notion 或 Drive 正式
資料集。獨立頁面目前提供手動輸入、草稿核對及轉到 ChatGPT 處理照片的說明，沒有獨立
自動辨識端點、背景工作或模型 API 金鑰；本機多圖日期／手動核對及整批 D1 儲存已實作。
正式 SIWC 申請審查、存取核准與
實際能力驗證仍是預期流程的前提；登入本身不代表取得推論、連接器或共用 Library/Space
同步能力。

## Language behavior / 語言行為

Choose **Auto / 自動**, **繁體中文**, or **English** in either frontend and the
PWA offline shell. Auto in the standalone app follows supported browser languages.
Embedded Auto prefers the current host's optional BCP 47 locale hint, then browser
languages, then English. MCP Apps `hostContext.locale` and
`ui/notifications/host-context-changed` are used when provided; the ChatGPT
compatibility path reads `window.openai.locale` and `openai:set_globals` locale
updates. These are current environment hints, not access to conversation history
or a permanent user-language profile. No IP, GPS or location inference is used.
Only a manual language preference is stored locally; Auto removes it. Host/browser
changes update Auto, while manual choice wins until reset. Storage restrictions
may limit a manual preference to the current view. Language choices can persist
separately across origins/devices; no account-wide language sync is promised.

兩個前端與 PWA 離線頁皆可選 **自動、繁體中文、English**。獨立網頁的自動模式依支援
的瀏覽器語言；內嵌介面優先採目前主程式提供的可選 BCP 47 語言提示，再依瀏覽器語言，
最後回退英文。支援主程式提供的 MCP Apps `hostContext.locale` 與
`ui/notifications/host-context-changed`，並相容 ChatGPT `window.openai.locale`
及 `openai:set_globals` 更新。這是當前環境提示，並非讀取歷史對話或永久語言設定；
不依 IP、GPS 或所在地猜語言。本機只保存手動語言偏好，選自動時移除。自動隨主程式／
瀏覽器更新，手動選擇優先直到重設。若儲存受限，手動偏好可能僅在本次介面有效；不同
來源網域與裝置不保證共用偏好，也不宣稱帳號層級同步。

`zh-Hant`, `zh-TW`, `zh-HK`, `zh-MO` and unspecified `zh` use Traditional Chinese;
English regional tags use English. Explicit `zh-Hans`/Chinese mainland or Singapore
without a Hant script use the next supported browser language, then English.
Simplified Chinese is not claimed as a translation. Locale changes format labels,
dates, numbers and known synthetic demo labels only. Original notes, exercise
names, values, machine IDs, consent, timestamps and date evidence are preserved.

繁體中文涵蓋上述 Hant／地區代碼及未指定地區的 `zh`；英文地區代碼使用英文。明確 Hans
或未指定 Hant 的中國／新加坡語言提示會回退下一個支援的瀏覽器語言，再回退英文，
不宣稱已有簡體翻譯。切換只改介面、日期／數字格式與已知合成示範文字的顯示；不改寫
原始備註、動作名稱、健康數值、機器 ID、授權、時間戳或日期證據。

## 1. Embedded scale image / 內嵌體脂計圖片

![合成體脂計測試卡：體重 72.4 公斤、體脂 21.6%、日期 2026-10-01、時區 Asia/Taipei；所有數值均為虛構。 / Synthetic scale test card: 72.4 kg, 21.6% body fat, 2026-10-01, Asia/Taipei; all values are fictional.](assets/synthetic-scale-test.png)

*Previously generated synthetic scale test card, reproduced unchanged. All values
are fictional and intended only for the demo namespace. This is not a real scale
photo or evidence that an image-analysis workflow has succeeded.*

*先前產生的合成體脂計測試卡，原圖未經修改。所有數值均為虛構，僅供合成示範空間使用；
這不是真實體脂計照片，也不是圖片辨識流程已成功的證據。*

**Implemented in this source snapshot:** both frontends provide bounded multiple
photo/screenshot selection, per-image date evidence, multi-session grouping and
one bilingual review screen. Limits: **8 files, 10 MB/file, 30 MB originals total,
40 MB sanitized pixels total, 64 million decoded pixels total, 16 sessions and
64 observations**. JPEG, PNG and WebP are supported; HEIC must be converted and
dates checked. All analysis paths, including legacy `capture_health_record`, now
create pending drafts only. A running private deployment may still use an older
snapshot until its separate update is verified.

**本原始碼已實作：** 兩個前端可一次選多張照片／截圖、逐圖核對日期證據、分組為多次
量測，並於同一雙語畫面核對。上限：**8 張、每張 10 MB、原檔合計 30 MB、清理後圖片
合計 40 MB、解碼像素合計 6,400 萬、16 次量測及 64 個觀察值**。支援 JPEG／PNG／
WebP；HEIC 請轉檔並核對日期。所有分析流程（含既有 `capture_health_record`）只建
待確認草稿。私人執行網站可能仍是舊版，須另行更新及驗證，本文不宣稱已部署。

### Batch → multiple sessions → one reviewed save / 整批 → 多次量測 → 一次核對入帳

1. **Select, inspect and consent.** Preview/remove selected inputs. Read available
   capture evidence locally; unsupported/missing/stripped metadata stays explicit.
   The embedded route requires actual declared image transport, separate image
   consent and optional draft permission. It sends every sanitized image together
   via the existing message/context route. Host acceptance is not proof that the
   model saw every image; missing/partial/unknown outcomes require chat inspection
   and readback before retry, with no text-only or paid-API fallback.
2. **Analyze each image without mixing sessions.** A scale cycling weight, body fat
   and muscle readings may form one session. A batch may instead span different
   days or separate sessions on the same day. One screenshot may contain multiple
   historical dates; its source ID can support many sessions through distinct
   fixed observation indices. Screenshot creation/EXIF/upload time never replaces
   visible historical measurement dates. Metadata only assists grouping.
3. **Keep exact labels, values and units.** The unchanged original card shows
   **72.4 kg, body fat 21.6%, observation date 2026-10-01, Asia/Taipei**. It shows no
   muscle reading or capture time. A hypothetical extra **skeletal muscle mass
   30.2 kg** is a separate synthetic specification. Skeletal muscle mass, total
   muscle mass and their percentages are distinct typed metrics; explicit custom
   metric IDs/labels/units support other readings. No mass-to-percent inference.
4. **Review grouping and conflicts once.** Suggested groups use visible dates and
   require approval; same-day sessions need explicit split/merge correction. Add
   sessions, move observations to merge/split, and remove emptied sessions.
   Preserve per-image capture evidence and per-observation displayed date/time/zone.
   Review every source, explain unavailable/conflicting capture evidence, confirm
   each session's measurement date/time/precision/zone, then confirm the grouping.
   Exact image duplicates are processed once. Repeated metric/value/unit readings
   consolidate with all sources; conflicting values or units block confirmation.
   Select the intended observations and explain exclusions; never average or pick
   the latest upload. Recompressed/near-duplicate images require review.
5. **Create/update one pending batch draft.** Structured extraction creates no
   confirmed records. Edits require a new immutable draft and the prior digest;
   stale corrections are rejected. Unknown dates, zones, values or unresolved
   conflicts keep the entire batch pending, including otherwise clear sessions.
   A date-only measurement can be explicitly accepted with unknown time; it is
   never stored as midnight. Ambiguous/nonexistent IANA-zone local times require
   clarification or an explicit correct UTC offset before timed confirmation.
6. **Confirm the reviewed batch atomically, then read back.** One explicit action
   confirms **all reviewed sessions/metrics/provenance** together, or none. They
   remain separate sessions in one bounded batch payload. Expected digest and
   immutable draft state guard stale saves; the same request key with different
   content is rejected. Canonical exact-ID readback verifies the saved digest and
   complete batch before success. Reports expose session values and evidence;
   trends group exact metric/unit (and custom label), retain date-only precision,
   and exclude pending/deleted batches. Trends display observation order, not an
   invented UTC timeline. Batch deletion/restoration affects the whole batch only
   after explicit confirmation; retry never restores deleted data.

1. **選圖、檢查及同意：** 預覽／移除本次圖片，在本機逐圖讀取拍攝證據；不支援、缺漏
   或已移除中繼資料會明示。內嵌分析須實際宣告圖片通道，另行同意圖片傳送及可選的
   草稿建立權限，透過既有訊息／內容通道一起送出全部清理後圖片。接受不代表模型看見
   每張；缺少、部分送達或結果不明須先查看對話與讀回，再重試，不改送純文字或付費 API。
2. **逐圖分析但不混次：** 體脂計輪流顯示體重、體脂及肌肉讀數可屬同次；整批亦可含
   不同日期或同一天的不同次數。一張截圖可有多個歷史日期，以相同來源編號與不同固定
   觀察序號對應多次量測。截圖建立／EXIF／上傳時間不代替畫面歷史量測時間，日期僅輔助分組。
3. **保留指標、數值及單位：** 原卡未修改，顯示 **72.4 公斤、體脂 21.6%、2026-10-01、
   Asia/Taipei**，沒有肌肉讀數或拍攝時間。假設額外的**骨骼肌重量 30.2 公斤**是另一
   合成規格；骨骼肌、總肌肉重量及其百分比分為不同指標，其他讀數可用明確自訂編號／
   名稱／單位，不以重量推算百分比。
4. **同一畫面核對分組與矛盾：** 可依畫面日期提議分組，但仍須核准；同日不同次數須
   明確拆分／合併。新增量測、搬移觀察值合併或拆分，再移除空量測。逐圖拍攝證據及逐
   觀察值畫面日期／時間／時區都保留。每來源須核對並說明缺漏／矛盾，再確認各次量測
   日期／時間／精度／時區與整體分組。完全相同圖片只處理一次，相同指標／值／單位
   整合並保留全部來源；不同值／單位阻擋入帳，須選擇及說明排除，不平均、不取最後上傳。
   重新壓縮或近似圖片仍需核對。
5. **建立／更新一個待確認批次：** 擷取只建草稿，不自動入帳。修改須帶舊摘要建立新
   不可變草稿，過期更正會拒絕。日期、時區、數值或衝突未釐清時整批維持待確認，即使
   其他量測已明確。本人可明確接受只有日期、時間未知，不補成午夜。IANA 時區的夏令
   時間歧義／不存在當地時間須釐清，或改填確切正確 UTC 時差，才確認有時間的紀錄。
6. **一次確認整批原子入帳並讀回：** 一個明確動作讓**全部已核對量測／數值／證據**一起
   成功或全部不入帳，批次內仍分開各次量測。預期摘要與不可變草稿狀態防止過期儲存；
   相同編號不同內容拒絕。讀回正式確切編號、摘要及完整批次後才表示成功。報表呈現
   各次數值及證據；趨勢依相同指標／單位（自訂指標另依名稱）分組，保留只有日期的精度，
   排除草稿／已刪批次，顯示觀察順序而非虛構 UTC 時間軸。整批刪除／還原須明確確認，
   重試不自行還原。

### Capture time and measurement time / 拍攝時間與量測時間

These are separate facts. Preserve each source's raw date/time, evidence kind and
precision; do not turn a date-only value into midnight or invent seconds. A UTC
instant is available only with a resolved local date/time and offset/time zone.
If unknown, retain `null` plus a reason. The original card's 2026-10-01 and
Asia/Taipei are displayed observation evidence, not EXIF or a known capture time.

拍攝與量測是不同事實。逐來源保留原日期／時間、證據類別與精度；只有日期時不補成
午夜或虛構秒數。日期、當地時間及時差／時區都釐清後才能產生 UTC 時刻，未知保留
`null` 與原因。原卡的 2026-10-01、Asia/Taipei 是畫面觀察證據，不是 EXIF 或已知拍攝時間。

| Evidence or case / 證據或情況 | Target handling / 預期處理 |
| --- | --- |
| Original EXIF / 原始 EXIF | Read actual `DateTimeOriginal` and `OffsetTimeOriginal` when available, preserving raw values/status. Capture time becomes measurement evidence only after contemporaneous scale context is confirmed. / 真正讀到才保留原值／狀態；確認是當下體脂計讀數後才可作量測佐證。 |
| Missing, invalid or stripped metadata / 缺漏、損壞或已移除中繼資料 | Label the condition per image. Chat attachments or host conversion can strip EXIF; vision cannot reconstruct it. Ask for capture and measurement information separately; user answers have their own provenance. / 逐圖標示，主程式或附件可能移除 EXIF，視覺不能還原；分別詢問拍攝與量測資訊並標記本人提供。 |
| Displayed date/time differs from EXIF / 畫面日期時間與 EXIF 不同 | Keep both and ask whether this is a current reading, historical screen, incorrect device clock or another session; do not select either silently. / 兩者都保留，詢問當下讀數、歷史畫面、裝置時鐘錯誤或另次量測，不自動選一個。 |
| Offset absent or time zone uncertain / 缺時差或時區不明 | Ask the capture location's time zone/offset without collecting coordinates. Device/browser zone is only a UI hint, never capture evidence; an offset does not uniquely identify an IANA zone. Resolve DST ambiguous/nonexistent times rather than guessing. / 不收座標而詢問拍攝時區／時差；瀏覽器／裝置時區不是證據，單一時差不唯一對應 IANA 時區，夏令時間歧義須釐清。 |
| Date only or capture time unknown / 只有日期或拍攝時間未知 | Display the missing precision explicitly. If the user accepts a date-only measurement, store that precision and unknown capture time rather than claiming a full timestamp. Unresolved grouping or conflicting measurement evidence stays pending. / 明示缺漏；本人接受只有日期時保留其精度及未知拍攝時間，不宣稱完整時刻；分組或量測證據矛盾仍待確認。 |
| Closely timed photos, midnight or travel / 時間相近、跨午夜或旅行 | Times help propose groups only. Confirm whether the scale cycle crosses midnight; keep each photo's capture evidence and one user-confirmed session time without flattening different offsets/days. / 時間只輔助分組；跨午夜須確認，逐圖證據及本人確認的量測時間並存，不抹平不同日期／時差。 |
| Upload/file/server timestamps / 上傳、檔案或伺服器時間 | Operational timestamps only. Never substitute upload time, file modification time, today or server time for capture or measurement time. / 僅為操作時間，不能代替拍攝或量測時間。 |

No GPS, camera serial number or unrelated EXIF is needed. Original images remain
transient inputs; structured provenance must not retain image URLs or private
filenames. Metadata assists grouping and review, never proves session membership.

不需要 GPS、相機序號或無關 EXIF；原圖是暫時輸入，結構化來源不保存圖片網址或私人
檔名。中繼資料輔助分組與核對，不能證明圖片必屬同次量測。

## 2. Embedded workout screenshot / 內嵌訓練截圖

Use a fabricated screenshot specification: **Squat, 60 kg, 8 repetitions × 3
sets**, measurement date **2026-10-02**. Treat each exercise as a separate record
with a stable image-source ID plus fixed observation index. If the screenshot
shows `60` without kg/lb, retain a pending draft and ask about the unit. Screenshot
capture EXIF does not establish when the workout occurred. The user's exercise
name and notes remain original text even when the interface changes language.
After clarification and authorized confirmation, compare loads only for the same
exercise. The dashboard displays its existing kg-normalized weight/load charts;
it does not infer training recommendations.

使用虛構截圖規格：**深蹲、60 公斤、每組 8 次 × 3 組**，量測日期 **2026-10-02**。
每個動作是一筆獨立紀錄，使用穩定圖片來源 ID 加固定欄位序號。若截圖只有 `60` 而無
公斤／磅，保留待釐清草稿並詢問單位；截圖拍攝 EXIF 不能證明訓練日期。切換語言仍保留
使用者原始動作名稱與備註。釐清並授權確認後，僅比較同一動作負重。現有圖表維持以公斤
正規化顯示體重／負重，不推論訓練建議。

## 3. Standalone Web App/PWA upload intent / 獨立網頁／PWA 上傳意圖

**Implemented standalone flow:** select a bounded batch, preview/remove images,
choose **Read date evidence locally**, inspect each capture status and enter the
visible metric/date/time/unit observations manually. Mark photos versus historical
screenshots, group/split/merge into sessions, resolve conflicts and review the whole
batch. Create/update a pending draft, then explicitly confirm its atomic D1 save.
Reloaded reports contain every session and its provenance. Legacy manual single
records remain compatible. Original images remain in local transient memory;
health data is never persisted to browser storage or PWA caches.

**Still unavailable:** automatic standalone ChatGPT-plan image analysis and common
Library/Space/Notion/Drive storage. No model API key, approved plan token or inferred
connector grant is introduced. Embedded transport/model behavior needs real host
validation; user-owned storage needs an actually available writable capability,
exact destination approval and readback verification. Sign-in alone grants none
of these. The existing owner D1 authorization remains the storage gate.

**已實作獨立流程：** 選取有上限批次，預覽／移除，按「在本機讀取日期證據」，逐圖查看
拍攝狀態並手動填入可見數值／日期／時間／單位。標示照片或歷史截圖，合併／拆分為多次
量測，釐清衝突並核對整批；建立／更新草稿後明確確認整批 D1 原子儲存，重讀報表呈現
所有量測及證據。舊單筆手動紀錄仍相容；原圖僅在本機暫時記憶體，不將健康資料存入
瀏覽器儲存或 PWA 快取。

**仍不可用：** 獨立網頁自動 ChatGPT 方案圖片分析及共用 Library／Space／Notion／
Drive。未新增模型 API 金鑰、核准方案權杖或猜測的連接器權限；內嵌通道／模型行為須
實際主程式驗證，自有儲存須確認真正可寫能力、確切目的地與讀回。登入不代表取得這些
能力；目前儲存仍須既有本人 D1 授權。PWA 讀寫需連線，離線只顯示一般提示。

## 4. Retry, correction, trends, read-only and cancel / 重試、更正、趨勢、只讀與取消

**Batch behavior:** manifests use sorted source hashes, and observation indices
remain stable when moved between sessions. Selection order does not change the
analysis request key. Changed draft content needs a new request key and the
previous digest. Same key/different content and stale replacements are rejected.
After uncertain draft creation, lookup its exact key before replaying; uncertain
confirmation reuses the frozen draft ID/digest and reads back the saved batch.
All sessions in the reviewed batch save in one D1 transaction, not separate tool
calls. Closing local review releases previews but cannot revoke a submitted
request; retry/status readback remains available. Incomplete image delivery must
not be described as complete extraction.

**整批行為：** 清單依來源雜湊排序，搬移量測仍保留固定觀察序號；選圖順序不改分析
請求編號。草稿內容改動須用新編號及舊摘要，同編號不同內容或過期更正會拒絕。不明
草稿建立先依確切編號查回再重試；不明確認沿用原草稿編號／摘要，並讀回入帳批次。
整批各次量測在一個 D1 交易儲存，不以分次工具呼叫冒充原子操作。關閉本機核對會釋放
預覽，但不能撤回已送請求，仍可重試／讀回。部分圖片送達不能表示已完整辨識。

The following describes existing single-record behavior / 以下為現有單筆行為：

- **Retry / 重試：** after timeout, inspect the conversation/tool result and read
  the affected record before retrying. Reuse the stable request/source key; the
  prototype rejects conflicting content under one request ID and deduplicates
  confirmed entries. A transport acceptance is never a saved confirmation.
  逾時先查看對話／工具結果並讀回受影響紀錄，再用同一穩定請求／來源編號重試；相同
  編號不同內容會拒絕，已確認紀錄會去重。傳送成功不等於儲存成功。
- **Correction / 更正：** update a pending draft through its replacement-draft
  flow with a new request ID, then review and confirm. Do not silently overwrite a
  confirmed record. The current prototype has no direct confirmed-record edit
  button; correction may require an explicitly instructed replacement and
  recoverable deletion of the incorrect original. User-owned-storage correction
  remains a separate proposed integration.
  待確認草稿以新請求編號走取代草稿流程，再核對確認；不能默默覆寫已入帳紀錄。現有
  原型沒有直接編輯已入帳紀錄的按鈕；可能需使用者明確要求另建正確紀錄並把錯誤原筆
  移入可還原回收區。自有儲存更正仍屬另外的預期整合。
- **Trend / 趨勢：** drafts/deleted entries are excluded. A single saved observation
  displays a visible point; later observations form a dated series. Partial
  loaded data is labeled, and loading more does not fabricate missing values.
  草稿與刪除紀錄不計入；單筆顯示明確點位，多筆依日期形成曲線。部分載入資料有提示，
  載入更多不虛構缺值。
- **Read-only / 只讀：** Analyze only allows extraction discussion and no write
  tools. A question about trends or deletion is not permission to import, save,
  delete or restore. Only exact user-requested deletion/restoration is executed.
  只辨識僅展示擷取結果，不呼叫寫入；詢問趨勢或刪除功能不等於授權匯入、儲存、刪除
  或還原，只處理使用者明確指定的筆數／紀錄。
- **Cancel / 取消：** do not choose or consent to an image, or close the review
  dialog before saving. No new analysis/save request is sent. A draft already
  created remains pending; closing does not erase it. Once a message/save request
  has been sent, closing UI cannot promise cancellation—read back its status.
  未選圖／未同意，或儲存前關閉核對視窗，不送新的辨識／入帳請求；已建立草稿仍待確認，
  關閉不會刪掉它。已送出的訊息／儲存請求不能因關閉介面就宣稱取消，須讀回確認狀態。

## 5. Implementation and validation limits / 實作與驗證界限

- [Shared batch model](../lib/batch.ts) validates versioned per-image capture
  evidence and one-to-many observations across separate sessions. Typed metrics,
  units, conflicts, exclusions, explicit precision/timezone, DST ambiguity and
  review flags are validated before confirmation; no timezone default is evidence.
- [Shared review/report UI](../lib/batch-ui.ts) runs in the [standalone panel](../app/batch-panel.tsx)
  and [v5 widget](../lib/widget.ts). It provides multiple selection, source review,
  group suggestions/moves, immutable draft updates, one confirmed batch save,
  canonical readback, metric/unit trends and explicit whole-batch trash/restore.
- [Local photo preparation](../lib/photo-metadata.ts) reads only whitelisted JPEG
  time/offset before redrawing pixels. [Bridge](../lib/widget-bridge.ts) sends all
  sanitized images through declared image-capable routes, with draft-only prompts.
  Actual host image-count limits, mobile behavior and model accuracy are not
  proven by these synthetic tests; transport acceptance is only an acknowledgement.
- [Batch store](../lib/batch-store.ts) uses owner/namespace checks, exact-key/digest
  guards and a single batch payload for atomic all-session confirmation. The
  [schema](../db/schema.ts) appends [migration 0003](../drizzle/0003_measurement_batches.sql),
  with no historical SQL/snapshot edit, seed or backfill. Existing single records
  remain readable; legacy real capture is draft-only.
- Synthetic tests cover mixed-day batches, same-day distinct sessions, a screenshot
  with multiple dated measurements, metadata/display differences, missing zones,
  partial uncertainty, duplicate/conflict resolution, order-stable manifests,
  guarded replacement/confirmation races, rollback and retry after delete/restore.
  Typecheck, lint and production build are required alongside these tests. This
  source does not claim live image inference, connected-provider storage validation
  or a deployed update. New tool metadata requires host refresh; v5 is advertised
  while the v4 resource URI still resolves compatibly.

- [共用模型](../lib/batch.ts)驗證逐圖拍攝證據與跨多次量測的一對多觀察值、指標／單位、
  衝突／排除、時間精度／時區、夏令時間歧義及核對旗標；不把預設時區當證據。
- [共用核對報表](../lib/batch-ui.ts)供獨立頁面及 v5 內嵌介面使用，多選、逐來源核對、
  分組提議／搬移、不可變草稿更正、整批確認、正式讀回、同指標單位趨勢及整批回收／還原。
- 日期白名單解析後在本機重繪像素，再由宣告圖片通道傳送整批，僅允許草稿。實際主程式
  張數限制、手機行為及模型準確率未經合成測試證明；傳送接受僅為確認收到請求。
- 儲存有本人／空間隔離、確切編號與摘要防護，以單一批次內容實現全部量測原子確認。
  僅附加 0003 結構遷移，不改歷史 SQL／快照，也無種子或回填；舊紀錄可讀，舊真實
  分析亦只建草稿。
- 合成測試涵蓋多日／同日分次、多日期截圖、中繼／畫面差異、缺時區、部分不確定、重複／
  衝突、反序清單、更正／確認競爭、回復及回收重試，另須型別、lint、正式建置檢查。
  不宣稱實際推論、自有連接器儲存驗證或已部署。新增工具資訊需主程式刷新；宣告 v5，
  v4 資源仍相容可讀。

## Official locale references / 官方語言介面依據

Checked 2026-10-02 / 查核日期：2026-10-02。
[OpenAI component locale and globals](https://developers.openai.com/plugins/reference),
[MCP Apps host locale](https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiHostContext.html),
[partial host-context updates](https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiHostContextChangedNotification.html).
These references establish optional hints, not universal host availability.
這些依據僅證明可選提示介面，不代表所有主程式皆提供。
