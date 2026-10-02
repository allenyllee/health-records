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

**Standalone source now supports optional BYOK:** batch upload → user-billed
OpenAI analysis → extracted session results → one reviewed save. Correction
controls stay behind **Edit**, and draft internals are handled by the save flow.
The key is entered by the user, held only in page memory and sent directly to
OpenAI. This is an explicit-risk browser option, not a claim that browser keys
are protected from page code or extensions. No real API key, paid inference or
live health image was used during validation.

**Expected future work, still unavailable:** approved ChatGPT-native inference on
the standalone page and common canonical Library/Space/Notion/Drive storage.
Sign-in does not grant inference or connector permissions. Embedded host image
visibility, mobile behavior and model extraction accuracy require actual validation.

**獨立頁面原始碼已提供可選 BYOK：** 整批上傳 → 本人付費 OpenAI 分析 → 辨識分次
結果 → 核對一次儲存。「修正」才展開更正欄位，草稿內部流程由儲存處理。Key 由本人
輸入，只在頁面記憶體並直接送 OpenAI；此為明確告知風險的瀏覽器選项，不宣稱 key
不會被頁面程式／擴充套件存取。驗證未使用真實 key、付費推論或真實健康圖片。

**尚未提供：** 獨立頁面正式核准的 ChatGPT 原生推論，以及共用 Library／Space／
Notion／Drive 正式資料集。登入不等於推論或連接器權限。內嵌主程式看見圖片、手機
行為與模型辨識準確率仍須實際驗證。

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

1. **Upload a batch, then consent to analysis.** Select/preview/remove photos or
   screenshots. Capture dates are read locally and hidden metadata is removed
   automatically; there is no separate metadata-reading or manual-entry step.
   Standalone BYOK discloses OpenAI, own-account API charges and browser key risk
   before Analyze. The embedded route needs an actually declared image channel
   and consent to analysis/pending results; it never falls back to a paid API.
2. **The agent extracts and groups.** Current scale cycles can share a session;
   different days or independently timed measurements stay separate. Historical
   screenshots can provide several sessions with stable source/observation IDs.
   Keep exact labels/units: weight, body-fat percentage, skeletal/total muscle
   mass and muscle percentage are separate. Never derive percentages from mass,
   or infer an unknown date, time, timezone or unit. Unreadable fields remain null.
3. **Review results once; Edit only when needed.** Read-only result cards show
   extracted values, dates, units and session grouping. Only unclear or conflicting
   evidence blocks saving. **Edit** reveals source/date/value corrections and
   split/merge controls; **Done editing** returns to results and **Cancel edits**
   restores the previous values. New-session/metric/grouping controls are not
   presented before results. A date-only result stays date-only, without midnight.
4. **Confirm and save.** One explicit Save confirms the presented sources, dates
   and grouping. The UI handles immutable draft creation/replacement with the
   expected previous digest, then confirms the whole batch atomically. It reads
   back the exact ID/digest/full batch before showing success. Unknown values,
   invalid dates/units, missing timezone evidence, source conflicts and empty
   sessions still block saving. Model output cannot exclude readings or invent user conflict resolutions; these remain user edits. No automatic confirmed save follows analysis.

1. **整批上傳後同意分析：** 選取、預覽／移除照片或截圖，自動在本機讀取拍攝日期並
   去除隱藏中繼資料，不需要另外按日期解析或從空白表單輸入。獨立頁 BYOK 會先說明
   OpenAI、本人 API 費用與瀏覽器 key 風險；內嵌流程需實際圖片通道及分析／待核對
   結果同意，不自動改用付費 API。
2. **Agent 擷取並分類：** 同一次體脂計顯示循環可合併；不同日期或同日不同量測須
   分開。一張歷史截圖可有多次量測，保留固定來源及觀察 ID。體重、體脂率、骨骼／
   總肌肉重量與肌肉率分開，不由重量推算百分比，也不猜日期、時間、時區或單位。
   無法辨讀的欄位保留 null。
3. **核對一次，必要時才修正：** 結果卡顯示數值、日期、單位及分次分類；只有不明或
   矛盾資料阻擋儲存。「修正」才開啟來源／日期／數值更正及合併拆分；「完成修正」
   回結果，「取消修正」恢復原值。結果前不顯示新增量測／指標／分組控制。只有日期
   就保留日期，不補成午夜。
4. **確認並儲存：** 一次儲存確認畫面來源、日期及分組；UI 內部帶舊摘要建立／更正
   不可變草稿，再原子確認整批，讀回確切 ID／摘要／完整內容才顯示成功。未知數值、
   無效日期／單位、缺時區證據、來源矛盾或空量測仍阻擋。模型不能排除讀數或虛構本人矛盾釐清，這些僅由本人修正；分析後不自動正式入帳。

### Capture time and measurement time / 拍攝時間與量測時間

For a **current scale photo**, known capture and measurement times are compared
as evidence-backed instants. A five-minute window allows a scale display cycle;
minute precision retains its minute interval. Larger differences require an
explicit observation conflict resolution. Equivalent instants in different
offsets (including across midnight) agree. Date-only sessions stay date-only;
a missing capture offset does not acquire a guessed timezone. Historical
screenshots do not use capture time as measurement time.

**當下體脂計照片**若拍攝及量測時間／時差已知，會比較有證據的時刻；容許五分鐘的
顯示循環，分鐘精度保留該分鐘區間。差異超出此範圍須逐觀察值明確說明矛盾。
不同時差（含跨午夜）表示同一時刻時不視為矛盾。只有日期仍保留日期精度，缺拍攝
時差不猜時區；歷史截圖的拍攝時間不當作量測時間。

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

**Implemented flow:** the batch picker is above reports. After selection, enter
an own OpenAI API key and acknowledge provider charges, photo transmission and
browser key exposure, then choose **Analyze whole batch**. The browser sanitizes
pixels, preserves local capture date evidence, and calls the fixed official
Responses endpoint with `gpt-4.1-mini-2025-04-14`. Structured extraction is validated
locally and shown as read-only session results. There is no manual Add Record
button competing with upload, and no source/session/metric editor before results.
Only **Edit** reveals corrections. One explicit Save handles the guarded draft and
atomic owner-D1 confirmation, then verifies canonical readback. Existing records,
reports, export and recoverable deletion remain compatible.

**Browser and provider limits:** API key is memory-only, never URL, server relay,
cookie, local/session storage, DB or application log. **Forget key**, page hide and
panel disposal clear it; cancellation aborts local waiting. Page code/browser
extensions can still access it. This is not the recommended server-secret
architecture: it is the user's explicitly chosen own-key option on a trusted page.
Requests use `credentials:omit`, `cache:no-store`, redirects disabled, `store:false`
and `prompt_cache_retention:in_memory`; they contain no tools, conversation state,
file uploads or remote image URLs. `store:false` concerns response state, not zero
retention; standard provider abuse-monitoring retention can be up to 30 days.

A request is bounded to **8 images**, **1536 px longest side**, **12 MB sanitized
PNG bytes**, **17 MB serialized request**, **6,000 output tokens**, **128 KB response**
and **90 seconds local wait**. Original preparation limits still apply. This is a
bounded request, not a guaranteed price cap. Incomplete, refused, malformed or
invalid output is rejected as a whole; unknown fields remain review questions.
No key/model request is made on selection, key entry, locale switching or reload.
No automatic retry occurs. Same-batch repeats are blocked unless the user selects
an explicit retry and accepts a possible additional charge. Abort/timeout does
not guarantee provider processing or billing stops; no server cancel is promised.
A CORS/CSP/network failure reports the blocked/uncertain outcome and never creates
a backend relay or falls back to another provider.

**Still unavailable:** ChatGPT-native standalone analysis and shared
Library/Space/Notion/Drive storage. The ChatGPT route uses the connected app and
actual host capabilities; selecting photos here does not secretly send them to
ChatGPT. A future authorized native adapter must return the same normalized
`AnalysisResult { version:1, batch }` for the common review/save flow. No persistent
grant, operator API credential, native-token assumption or storage migration is
introduced. The existing owner D1 gate remains authoritative.

**已實作：** 批次選圖位於報表之前；選取後輸入本人 OpenAI key，了解費用、圖片
傳送及瀏覽器 key 風險，再按「分析整批」。瀏覽器清理像素、保留本機日期證據，直接
呼叫官方 Responses 端點及固定模型。嚴格驗證後顯示唯讀分次結果；沒有競爭的「新增
紀錄」，也不先顯示來源／量測／指標表單。「修正」才展開更正；一次儲存內部完成
草稿摘要防護、整批本人 D1 確認與正式讀回。既有紀錄、報表、匯出及可還原刪除保持相容。

**Key／服務商限制：** Key 只在頁面記憶體，不進 URL、轉送伺服器、cookie、本機／
session 儲存、DB 或應用日誌；清除 key、離開頁面、面板結束會清除。頁面程式與擴充
套件仍可存取，這是本人明確選擇的可信任頁面 BYOK 方式，不宣稱是建議的伺服器秘密
架構。store:false 只關閉回應狀態保存，不是零保留；濫用監控資料可能最多保留 30 天。
每次上限 **8 張、最長邊 1536px、清理 PNG 12MB、序列請求 17MB、輸出 6,000 tokens、
回應 128KB、本機等待 90 秒**，不是保證費用上限。拒絕／不完整／格式錯誤結果整批
拒絕；未知欄位待核對。選圖、輸入 key、切語言、重讀不送模型請求。不自動重試；
重送同批須明確接受可能再次計費。取消／逾時只停止本機等待，不保證服务商停止處理
或計費。CORS／CSP／網路失敗會明示，不建立轉送伺服器或換服務商。

**尚未提供：** 此頁 ChatGPT 原生分析及共用 Library／Space／Notion／Drive。
ChatGPT 路徑仍需已連接應用及真實主程式能力，選圖不會偷偷轉送到 ChatGPT。未來
核准的原生 adapter 使用相同 AnalysisResult，沿用核對／儲存；未新增持久權限、業者
付費 key、方案權杖假設或儲存遷移，既有本人 D1 授權仍有效。

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
  read-only results, Edit-only group corrections, internal guarded draft updates, one confirmed save,
  canonical readback, metric/unit trends and explicit whole-batch trash/restore.
- [Browser BYOK provider](../lib/vision-provider.ts) uses official Responses image input and strict Structured Outputs with a shared normalized result contract. Mock tests cover schema/IDs/units, refusal/incomplete output, request/response bounds, credential isolation, quota/rate errors, timeout/cancellation and explicit retries. No real key or paid inference has been used.
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
  唯讀結果、「修正」才開分組／搬移、內部不可變草稿更正、整批確認、正式讀回及回收／還原。
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

## BYOK official references and validation / BYOK 官方依據與驗證

Checked 2026-10-02. Official docs confirm [pinned mini image/Responses/Structured
Outputs support](https://developers.openai.com/api/docs/models/gpt-4.1-mini),
[image inputs](https://developers.openai.com/api/docs/guides/images-vision),
[strict structured output](https://developers.openai.com/api/docs/guides/structured-outputs),
[browser SDK opt-in and key exposure risk](https://developers.openai.com/api/reference/typescript),
[data retention](https://developers.openai.com/api/docs/guides/your-data), and
[prompt-cache retention](https://developers.openai.com/api/docs/guides/prompt-caching).
A credential-free OPTIONS preflight to the fixed Responses endpoint allowed POST,
authorization/content-type and wildcard origin. This is limited feasibility
verification; it does not guarantee every deployed origin, browser, account or
future provider policy. Only mocked fetch/synthetic tests were used for inference.
Real billed extraction, actual image accuracy, mobile and private-origin CSP/CORS
remain unvalidated. No installed plugin or public listing is claimed.

2026-10-02 查核官方模型／圖片／嚴格輸出／瀏覽器 opt-in 風險／資料及快取保留文件。
無 key 的 OPTIONS 預檢允許 POST、authorization/content-type 及 wildcard origin；
只證明當次可行性，不保證各網站、瀏覽器、帳戶或未來政策。推論僅用 mocked fetch
與合成測試；實際付費辨識、圖片準確率、手機及私人網站 CSP／CORS 尚未驗證。
不宣稱已替使用者安裝插件或公開上架。
