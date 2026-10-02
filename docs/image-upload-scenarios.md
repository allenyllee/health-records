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
can send a selected image only when the active host advertises the necessary
image capability and the user agrees. It checks bounded JPEG date metadata and
redraws real-image pixels to remove hidden metadata. A host accepting a message
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
It has no standalone image-upload/automatic-analysis endpoint, background worker
or model API credential. SIWC application review, access approval and actual
capability validation are still needed before claiming that planned flow. Sign-in
alone does not grant inference, connector access or common Library/Space
synchronization.

**預期後續工作，尚非此原型已完成功能：** 使用正式核准的方案存取，在獨立網頁自動
呼叫 ChatGPT 分析；以及兩個前端共用同一個 Library、Space、Notion 或 Drive 正式
資料集。獨立頁面目前提供手動輸入、草稿核對及轉到 ChatGPT 處理照片的說明，沒有獨立
圖片上傳／自動辨識端點、背景工作或模型 API 金鑰。正式 SIWC 申請審查、存取核准與
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

**Today:** the embedded selector sends one image per request. The synthetic card
above can test that route; draft creation is a separate opt-in and analysis-only
permits no writes. In the already authorized real-photo path, clear fields can
be saved automatically by `capture_health_record`; unresolved fields remain a
draft. That existing behavior is not the review-once batch flow described below.
Only a successful tool result followed by record readback establishes saving.
No real photo or multi-image/model-accuracy validation is included here.

**目前：** 內嵌選取器每次只送一張圖片；上述合成卡可供測試，建立合成草稿須另外同意，
只辨識不授權寫入。現有已授權真實照片流程可由 `capture_health_record` 自動儲存明確
欄位，不確定欄位保留草稿；這不是下列「整批核對一次」流程。僅工具成功並讀回紀錄才
表示已儲存；本文不含真實照片，也不宣稱已驗證多圖流程或模型準確率。

### Target: one scale cycle, one reviewed session / 目標：一輪體脂計讀數，一次核對入帳

The user photographs a scale as its display cycles through weight, body-fat
percentage, skeletal muscle mass and other labeled values. Multiple photos are
inputs to **one measurement session**, not independent complete records. This is
planned behavior; no runtime change is delivered by this document.

使用者在體脂計輪流顯示體重、體脂率、骨骼肌重量及其他具標示數值時拍攝多張照片。
這些圖片是**同一次量測**的輸入，不是每張各建一筆完整紀錄。以下是預期功能，本文未
交付執行程式變更。

1. **Select and approve the batch.** Show all selected thumbnails, count and
   removal controls, the analysis recipient and exact save destination. Consent
   covers only this batch. Check actual multi-image transport support and bounded
   file count, total bytes and dimensions before sending anything. If unsupported,
   stop with a truthful limitation; do not silently send only the first image.
2. **Keep per-image evidence.** Assign a stable source ID/hash and fixed observation
   indices; retain each image's metadata status, capture date/time/offset when
   actually available, visible date/time/time-zone text and the source of each
   extracted metric. Read allowed date metadata locally before redrawing pixels
   to remove hidden metadata; send sanitized pixels plus the explicit date-evidence
   envelope. The website retains structured evidence, not original photos or GPS.
3. **Analyze the whole batch and propose groups.** Extract visible metric labels,
   raw values and units from every image. Weight **72.4 kg** and body fat **21.6%**
   match the original card; it supplies no muscle reading or capture time. A
   hypothetical additional photo could show **skeletal muscle mass 30.2 kg**; this
   is a separate synthetic specification, not a value visible in the card.
   Skeletal muscle mass in kg, total muscle mass in kg and muscle percentage are
   distinct fields. Never relabel or derive one from another. Preserve kg/lb/%;
   unknown labels or units remain unresolved rather than being discarded.
4. **Consolidate, without guessing.** Repeated photos of the same metric/value/unit
   in one confirmed session contribute supporting sources, not extra measurements.
   Identical image hashes are flagged and reused once. Different values for the
   same metric are a conflict: show all candidates and sources, never average,
   pick the newest upload or silently overwrite. Near-duplicate/recompressed images
   need review; a new hash alone does not prove a new reading. Dates close together
   assist grouping but cannot prove the same person, scale or session. Separate
   different dates, sessions or ambiguous groups; ask the user to merge/split.
5. **Review once for the session.** Present all consolidated metrics/units, their
   image sources, duplicates/conflicts, capture evidence for each image, selected
   measurement date/time/time zone and destination in one draft. Ask about missing
   or conflicting evidence. Require explicit approval of this exact resolved draft
   before saving; the new batch route must not reuse the existing auto-save behavior.
   Distinct sessions remain distinct drafts and require their own review.
6. **Save atomically, then read back.** Confirm all selected metrics and provenance
   for one session together, or save none. An unresolved required field, stale draft
   or failed write leaves the whole session pending. Reuse the stable batch/session
   request key on retry; changed content requires a new revision and review, not an
   overwrite. Read back the same session ID and all expected metrics from canonical
   records before claiming success. Reports show one session with its metrics and
   evidence; trends compare the same metric/unit and include only confirmed active
   sessions. No partial session may appear as a completed measurement.

1. **選取並同意整批傳送：** 顯示全部縮圖、張數、移除控制、分析接收對象及確切儲存
   目的地；同意僅涵蓋本批。傳送前確認實際多圖通道及張數、總位元組、尺寸上限。不支援
   時明確停止，不可只送第一張卻宣稱整批已處理。
2. **逐圖保留證據：** 每張使用穩定來源編號／雜湊與固定觀察序號，保留中繼資料狀態、
   實際可讀的拍攝日期／時間／時差、畫面日期／時間／時區，以及各數值的來源圖。先在
   裝置讀取允許的日期欄位，再重繪像素移除隱藏資訊；送出清理後圖片及明確日期證據。
   網站保存結構化證據，不保存原圖或 GPS。
3. **整批分析並提議分組：** 逐圖擷取可見指標、原始值與單位。原合成卡只有 **72.4 公斤、
   體脂 21.6%**，沒有肌肉讀數或拍攝時間。假設另張照片顯示**骨骼肌重量 30.2 公斤**，
   此為額外合成規格，並非原卡可見內容。骨骼肌公斤、總肌肉公斤及肌肉百分比是不同
   欄位，不可互相改名或推算；保留公斤／磅／百分比，名稱或單位不明仍待核對。
4. **整合但不猜測：** 同次已確認量測內，相同指標／值／單位的重複照片只增加佐證來源，
   不增加量測筆數；相同圖片雜湊標示重複並只處理一次。同一指標有不同值則列出候選值
   及來源，不平均、不取最後上傳值、不默默覆寫。近似或重新壓縮圖片需核對，新雜湊不
   代表新量測。拍攝時間相近只輔助分組，不能證明同一人、體脂計或量測；不同日期／
   次數或不明組別須分開，請使用者確認合併或拆分。
5. **整次核對一次：** 同一草稿呈現所有指標／單位、來源圖、重複／衝突、逐圖拍攝證據、
   選定量測日期／時間／時區與目的地。缺漏或矛盾先詢問，使用者明確核准這個已釐清版本
   後才儲存；新整批流程不能沿用現有自動入帳。不同量測各自保留草稿並分別核對。
6. **整次原子入帳並讀回：** 同次所有選定指標與證據一起成功或全部不入帳；必要欄位未
   確認、草稿過期或寫入失敗時，整次維持待確認。重試沿用穩定整批／量測請求編號，
   內容改動須新版本及重新核對，不覆寫舊結果。從正式紀錄讀回相同量測編號與全部預期
   指標後才宣稱成功；報表以一次量測呈現數值與證據，趨勢僅比較同指標／單位的有效
   已確認量測，不把部分資料當完整入帳。

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

**Today:** open the existing website or installed PWA, choose Auto/English/繁體中文,
and use Add record to enter the same synthetic scale/workout values manually.
Create a draft, inspect the actual date/time zone/unit, update it if needed and
confirm saving. To analyze an image, use the guided ChatGPT route; the standalone
page does not silently upload or analyze a selected file. Installed PWA behavior
is the same and requires a connection for records. Offline it shows a localized
generic shell; it caches no authenticated pages, health responses or images.

**Standalone target after official access and validation:** select multiple scale
photos at once, inspect/remove files, check per-image date evidence locally and
consent to the exact analysis recipient/destination. Analyze the entire bounded
batch using an actually supported plan-backed route, apply the same grouping,
metric and date/time rules above, review one consolidated session and explicitly
confirm its atomic save. Read the session back into the same records/reports in
both frontends. Sign-in alone supplies neither image inference nor writable
Library/Space/Notion/Drive access; shared storage must be approved and tested.
If access is unavailable, keep local/manual review or export and show the blocker;
do not silently send images elsewhere or introduce an operator model-API bill.
This picker, inference route and consolidated session save are not implemented in
the current standalone Web App/PWA. A generic image capability also does not prove
multi-image support or that every selected image reached the model.

**目前：** 開啟既有網站或已安裝 PWA，選自動／英文／繁體中文，以新增紀錄手動填入
現有體重／體脂或訓練欄位；建立草稿，核對日期、時區、單位，必要時更新後確認儲存。
圖片辨識請依說明轉到 ChatGPT；獨立頁面尚無多圖選取／自動分析端點，PWA 同樣需連線
讀寫，離線只顯示一般提示，不快取登入頁、健康回應或圖片。

**正式存取核准並驗證後的獨立網頁目標：** 一次選取多張體脂計照片，檢查／移除圖片，
在裝置逐圖查看日期證據，並明確同意分析對象與目的地。透過實際支援的方案分析通道處理
整個有上限的批次，採用上述分組、指標及日期／時間規則，核對一次整合量測後明確確認
原子入帳，再讀回兩個前端共用的紀錄／報表。登入不代表取得圖片推論或可寫的 Library／
Space／Notion／Drive；共用目的地仍須核准及實測。無存取時保留本機／手動核對或匯出並
說明阻礙，不偷偷改送其他服務或引入營運者模型 API 費用。目前 Web App/PWA 尚未實作
此選取器、推論通道或整合量測儲存；一般圖片能力也不代表多圖支援或每張都送達模型。

## 4. Retry, correction, trends, read-only and cancel / 重試、更正、趨勢、只讀與取消

**Batch target:** derive a stable manifest from source IDs and fixed observation
indices, with explicit session grouping and draft revision. File selection order
must not create a new session on retry; adding/removing an image or resolving a
conflict changes the reviewed revision. Reuse the original request key and exact
payload for a replay; the same key with different content must be rejected. After
a timeout, first read back that session's status and expected metrics. A failed or
partly transported analysis must not confirm a session from only the received
subset. Atomic save is per reviewed session; separate tool calls are not atomic.
Multiple sessions require separate review, and no cross-session atomicity is
promised. Closing a view does not undo a submitted request; no retry may restore a
deleted session without explicit user instruction.

**整批目標：** 以來源編號、固定觀察序號建立穩定清單，並明確標記量測分組與草稿版本；
重試時選圖順序不同不應產生新量測。增刪圖片或解決衝突會改變待核對版本；相同重試沿用
原請求編號及完全相同內容，同編號不同內容須拒絕。逾時先讀回量測狀態與預期指標；
分析失敗或只送達部分圖片時，不能用子集合確認整次量測。原子儲存以核對的一次量測為
範圍，分次工具呼叫不是原子操作；多次量測各自核對，不承諾跨量測原子性。關閉畫面不
會撤回已送請求，重試也不能未經使用者明確要求而還原已刪除量測。

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

## 5. Source gaps and minimal implementation plan / 原始碼差距與最小實作計畫

Inspected source on 2026-10-02; this is a plan, not an implementation or live-host
validation. Links below refer to repository files. Existing synthetic tests cover
single-image metadata/transport and single-record persistence; they do not validate
the proposed batch flow, real scale accuracy or standalone plan-backed analysis.

2026-10-02 檢視原始碼；以下為計畫，未實作或實測主程式。連結指向儲存庫檔案。既有合成
測試涵蓋單圖中繼資料／通道與單筆儲存，不代表已驗證整批流程、真實體脂計準確率或獨立
網頁的方案分析。

| Current gap / 現有差距 | Minimal safe change / 最小安全變更 |
| --- | --- |
| [Widget](../lib/widget.ts) uses a single file input and `files[0]`; [bridge](../lib/widget-bridge.ts) sends one image. / 只選、送一張。 | Add bounded multi-selection, removal/status per image and a stable manifest. Preserve consent; verify actual multi-image host limits/delivery and fail explicitly on partial transport. / 增加有上限多選、逐圖移除／狀態與穩定清單，保留同意並驗證實際多圖限制，不完整送達須明示。 |
| [Photo parser](../lib/photo-metadata.ts) already reads whitelisted JPEG original time/offset and strips outgoing metadata, but does so for one image. / 已有 JPEG 日期白名單及移除隱藏資訊，但只有單圖。 | Reuse it per original image with bounded memory/total bytes; persist raw date evidence/status separately from sanitized pixels. Keep PNG/WebP/converted HEIC metadata absence explicit. / 逐圖重用並限制總容量，分開保存日期證據與清理像素，其他格式／轉檔缺 EXIF 仍明示。 |
| [Record model](../lib/health.ts) and [MCP schema](../lib/mcp.ts) support weight/body-fat and strength fields only; no session, metric-source list or muscle fields. Unknown fields are not retained by `cleanInput`. / 無量測分組、逐指標來源或肌肉欄位，未知欄位不保留。 | Add a bounded versioned session draft with typed metrics/units, observation sources, duplicate/conflict states and explicit grouping. Keep skeletal/total muscle mass distinct from percentages. Preserve old records through a compatible versioned reader. / 新增有版本量測草稿、指標單位／來源／衝突狀態，肌肉種類分開，舊資料相容讀取。 |
| [Date evidence](../lib/date-evidence.ts) holds EXIF time but selected measurement is date-only; no displayed/user time or precision/per-image evidence. `cleanInput` defaults blank time zone to Asia/Taipei. / 可存 EXIF 時間但量測只有日期，且空時區有預設值。 | Add separate capture/measurement time, raw sources, precision and explicit resolution; unknown zone stays unknown. Do not count that default as evidence. Resolve conflicts/DST and review grouping before confirmation. / 分開拍攝／量測時間、精度／來源，未知時區不自動填，預設不是證據，矛盾及分組先釐清。 |
| [Store](../lib/store.ts) creates/confirms one record; clear real capture can auto-save. Existing D1 batches protect single-record operations, not an entire photo session. / 單筆建立／確認，明確真實讀數可自動入帳；無整次交易。 | New batch path creates a draft only. Use explicit session revision/digest guards and an idempotent confirmation transaction for all session metrics/provenance plus status; reject stale/conflicting replays and read back one canonical session. / 新流程僅建草稿，以版本／摘要防過期，整次交易保存全部指標及證據，拒絕矛盾重試並讀回。 |
| [Dashboard](../app/dashboard.tsx) reviews one record and charts body weight/exercise load; muscle/session/time views absent. / 單筆核對及體重／負重圖，沒有量測與肌肉時間視圖。 | Add one consolidated session review/report with per-image evidence and same-metric trends; date-only entries remain date-only. Exclude draft/deleted sessions. / 增加整次核對／報表與逐圖證據、同指標趨勢，不把日期補成時間，排除草稿／刪除量測。 |
| [Standalone API](../app/api/health/route.ts) accepts structured JSON, not image inference. Owner authorization currently targets D1; shared connected storage is unimplemented. / 獨立 API 無圖片推論，目前授權目的地為 D1。 | Local picker/date parsing, manual session review and synthetic D1 transaction work are implementable without model credentials. Standalone automatic analysis and shared storage remain gated on approved actual capabilities/grants and readback validation. / 本機選圖／日期、手動量測核對及合成 D1 交易可先實作；獨立自動分析與共用儲存仍須正式能力／授權及讀回驗證。 |

Implement in that order: versioned session/evidence validation, local batch input
and grouping review, explicit atomic draft confirmation/readback, then reports and
host integration. Meaningful synthetic checks should cover reversed input order,
exact/near duplicates, kg versus %, same-metric conflicts, split sessions,
missing/stripped EXIF, display/EXIF mismatch, midnight/DST, date-only precision,
partial transport, stale revision, same-key/different-content rejection, interrupted
save rollback and replay readback. Only then run consented device/host tests with
non-private fixtures. An advertised image route is insufficient to claim real
multi-image extraction; an authenticated user is insufficient to claim inference
or connected-store write permission. Unknown capabilities/permissions stop the
blocked step; never invent an API or create a hidden provider fallback.

依序實作量測／證據版本驗證、本機整批輸入與分組核對、明確原子確認及讀回，再做報表與
主程式整合。合成檢查應涵蓋反序選圖、相同／近似重複、公斤與百分比、同指標衝突、拆分
量測、缺漏／已移除 EXIF、畫面與 EXIF 矛盾、跨午夜／夏令時間、只有日期的精度、部分
送達、過期版本、同編號不同內容、寫入中斷回復及重試讀回；再以非私人素材做已同意的
裝置／主程式測試。宣告圖片通道不代表實際多圖辨識，登入不代表推論或連接器寫入權限；
能力／權限不明時停止該步，不虛構 API 或隱藏替代服務。

## Official locale references / 官方語言介面依據

Checked 2026-10-02 / 查核日期：2026-10-02。
[OpenAI component locale and globals](https://developers.openai.com/plugins/reference),
[MCP Apps host locale](https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiHostContext.html),
[partial host-context updates](https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiHostContextChangedNotification.html).
These references establish optional hints, not universal host availability.
這些依據僅證明可選提示介面，不代表所有主程式皆提供。
