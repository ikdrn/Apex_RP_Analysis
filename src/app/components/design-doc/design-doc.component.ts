import { Component, OnInit, AfterViewChecked, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignDocSection, DesignDocSectionId } from './design-doc-section.interface';
import mermaid from 'mermaid';

@Component({
  selector: 'app-design-doc',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './design-doc.component.html'
})
export class DesignDocComponent implements OnInit, AfterViewChecked, OnChanges {
  @Input() isDark = false;

  selectedSectionId: DesignDocSection['id'] = 'requirements';
  private mermaidInitialized = false;
  private needsRender = false;

  readonly sections: DesignDocSection[] = [
    // ─────────────────────────────────────────
    // 1. 要件定義書
    // ─────────────────────────────────────────
    {
      id: 'requirements',
      title: '1. 要件定義書',
      order: 1,
      items: [
        {
          label: '背景・目的',
          content: `対象プレイヤー：ぺこんぽって

Apex Legends の公式ツールや Apex Status のようなサードパーティサービスは、現時点のランクポイント（RP）をリアルタイムで確認することはできる。しかし、過去の推移を時系列でグラフ化・可視化する手段は存在しない。

本システムは、ぺこんぽってプレイヤーの RP を定期的に自動取得・蓄積し、日々・時間帯ごとの RP 変化をグラフと表で振り返れるようにすることを目的として開発された。
「今どのくらいか」だけでなく「この 1 週間でどう変化したか」「ピーク帯の成績は？」を即座に把握できる環境を提供する。`
        },
        {
          label: '業務要件',
          content: `① RP 自動取得：毎日 21:00〜翌 03:00 の間、15 分ごとに外部 API（Apex Legends Status API）からぺこんぽってプレイヤーの RP を取得し Supabase に保存する。
② データ保持：最新 30 日分のみ保持。それ以前のレコードは Supabase のバッチ処理で自動削除する。
③ 可視化：蓄積データを Web 画面でグラフ（折れ線）・表・統計カードとして表示する。
④ CSV 出力：表示中のデータを CSV ファイルとしてダウンロードできる。`
        },
        {
          label: 'システム化範囲',
          content: `【対象】
・RP 定期取得バッチ（Supabase pg_cron）
・古レコード削除バッチ（Supabase pg_cron）
・データ参照 API（Vercel Serverless Function）
・RP 可視化 Web アプリ（Angular SPA / Vercel ホスティング）

【対象外】
・Apex Legends ゲーム本体・公式 API の管理
・RP 以外のプレイヤーデータ（kills、ダメージ等）
・複数プレイヤーの比較機能
・認証・ユーザー管理機能（Basic 認証は任意オプション）`
        },
        {
          label: '機能要件',
          content: `FR-01 RP グラフ表示：折れ線グラフで RP 推移を表示する。横軸=日時(JST)、縦軸=RP。
FR-02 表示期間切替：7 日 / 30 日 を画面上のボタンで切り替える。
FR-03 統計カード表示：最新 RP・最高 RP・最低 RP・期間内変化・平均 RP・1 日あたり変化量を表示する。
FR-04 データテーブル表示：取得レコード一覧（連番 id、rp、created_at）を日付ソート（昇順/降順）・検索フィルター付きで表示する。
FR-05 CSV ダウンロード：表示中データを id,rp,created_at の CSV ファイルとして出力する。
FR-06 最新データ更新：ボタン操作で API を再取得する。
FR-07 日別集計タブ（Daily）：日付単位で最初・最後・最大・最小 RP と変化量を集計表示する。
FR-08 設計書閲覧：本設計書を Web 画面内タブで参照できる。
FR-09 ダークモード切替：テーマをライト/ダークで切り替え、localStorage に永続化する。
FR-10 エラー表示：データ取得失敗時に日本語エラーメッセージを表示する。`
        },
        {
          label: '非機能要件',
          content: `【性能】
・API レスポンス：通常時 2 秒以内
・グラフ描画：データ受信後 500ms 以内
・同時接続：個人用途のため 10 接続以下を想定

【可用性】
・Vercel の SLA に準拠（99.9% 以上）
・Supabase の SLA に準拠（99.9% 以上）
・メンテナンスウィンドウなし（個人用途）

【セキュリティ】
・Supabase Service Role Key は環境変数で管理、クライアントに非公開
・レートリミット：IP ごとに 60 req/分
・CORS：ALLOWED_ORIGIN 環境変数で制御（未設定時は * ）
・Basic 認証：BASIC_AUTH_USER / BASIC_AUTH_PASS 設定時のみ有効

【拡張性・保守性】
・バッチ処理は Supabase pg_cron で完結（外部 cron サーバー不要）
・Angular スタンドアロンコンポーネント構成で依存を最小化
・ダークモードは Tailwind dark: クラスで一元管理`
        },
        {
          label: 'インターフェース要件',
          content: `外部 I/F：
・Apex Legends Status API（RP 取得元）→ Supabase pg_cron から HTTPS GET
・Supabase REST API → Vercel API から HTTPS GET（Service Role Key 認証）

内部 I/F：
・Angular HttpClient → Vercel Serverless Function（/api/get-rp）HTTPS GET
・レスポンス形式：JSON 配列 [{ id, rp, created_at }]`
        },
        {
          label: 'データ要件',
          content: `・主テーブル：player_rp（id: UUID, rp: INTEGER, created_at: TIMESTAMPTZ JST）
・保持期間：最新 30 日（超過分は pg_cron で自動削除）
・取得頻度：15 分ごと（21:00〜03:00 JST）→ 最大 145 レコード/日
・30 日最大レコード数：約 4,350 件
・データ移行：既存 player_rp テーブルをそのまま使用（移行処理なし）`
        },
        {
          label: '運用・保守要件',
          content: `・バッチ監視：Supabase Dashboard の cron ジョブログで確認
・アプリ監視：Vercel Dashboard のデプロイログ・Function ログで確認
・障害対応：Supabase / Vercel の障害はサービス復旧待ち（個人用途のため SLA 補償なし）
・設定変更：Vercel 環境変数の更新 → 自動再デプロイ
・依存ライブラリ更新：npm audit / Dependabot アラート確認後に手動更新`
        },
        {
          label: '制約条件',
          content: `・Apex Legends Status API の利用規約に従うこと
・Supabase 無料プランの制限（500MB ストレージ、50,000 行/月など）を考慮すること
・Vercel 無料プランの制限（100GB 帯域/月、Function 実行 100 時間/月）を考慮すること
・取得対象プレイヤーはぺこんぽってのみ（マルチプレイヤー対応は対象外）`
        },
        {
          label: '業務フロー',
          content: `【As-Is（現状）】
ユーザーが Apex Status などのサービスを開く → 現在の RP を目視確認 → 過去との比較は手作業メモのみ → 推移の把握が困難

【To-Be（本システム導入後）】
① バッチが 21:00〜03:00 の間 15 分ごとに自動で RP を取得・保存
② ユーザーが Web 画面を開く
③ 表示期間（7 日 / 30 日）を選択する
④ RP 推移グラフ・統計カード・データテーブル・日別集計で確認する
⑤ 必要に応じて CSV をダウンロードする`
        },
        {
          label: '画面・帳票イメージ',
          content: `【メイン画面】
┌─────────────────────────────────────────┐
│ Apex RP Analysis           [設計書を見る] │
│ 期間: [7日] [30日]  [最新に更新] [CSV]   │
├──────┬──────┬──────┬──────┬──────┬──────┤
│最新RP│最高RP│最低RP│期間変│平均RP│/日  │
├─────────────────────────────────────────┤
│ [Analysis] [Data Table] [Daily] [設計書]  │
│                                          │
│  ▲                                      │
│  │  RP折れ線グラフ                       │
│  └────────────────────────────────      │
└─────────────────────────────────────────┘

【CSV 帳票】
ファイル名: apex-rp-{N}days.csv
列: id, rp, created_at
形式: UTF-8、ダブルクォート囲い`
        }
      ]
    },

    // ─────────────────────────────────────────
    // 2. 基本設計書
    // ─────────────────────────────────────────
    {
      id: 'basic-design',
      title: '2. 基本設計書',
      order: 2,
      items: [
        {
          label: 'システム構成図',
          content: `【テキスト概要】
Browser(Angular SPA) → GET /api/get-rp?days=N → Vercel(Serverless API)
Vercel → REST API(service_role_key) → Supabase(PostgreSQL)
Supabase → JSON array → Vercel → JSON 200 OK → Browser`,
          diagram: `flowchart LR
    Browser["🌐 Browser\\nAngular SPA"]
    Vercel["⚡ Vercel\\nAngular + Serverless API"]
    Supabase["🗄️ Supabase\\nPostgreSQL"]
    Browser -->|"GET /api/get-rp?days=N"| Vercel
    Vercel -->|"REST API\\n(service_role_key)"| Supabase
    Supabase -->|"JSON array"| Vercel
    Vercel -->|"JSON 200 OK"| Browser`
        },
        {
          label: '画面遷移図',
          content: '',
          diagram: `stateDiagram-v2
    [*] --> Analysis : 初期表示
    Analysis --> DataTable : Data Tableタブ
    Analysis --> Daily : Dailyタブ
    Analysis --> DesignDoc : 設計書タブ
    DataTable --> Analysis : Analysisタブ
    DataTable --> Daily : Dailyタブ
    DataTable --> DesignDoc : 設計書タブ
    Daily --> Analysis : Analysisタブ
    Daily --> DataTable : Data Tableタブ
    Daily --> DesignDoc : 設計書タブ
    DesignDoc --> Analysis : Analysisタブ
    DesignDoc --> DataTable : Data Tableタブ
    DesignDoc --> Daily : Dailyタブ`
        },
        {
          label: '機能一覧',
          content: `FN-01 RP グラフ表示（Chart.js 折れ線グラフ）
FN-02 表示期間切替（7日 / 30日）
FN-03 統計カード（最新 / 最高 / 最低 / 変化量 / 平均 / 1日あたり）
FN-04 データテーブル表示（連番 id・日付ソート・検索フィルター）
FN-05 CSV ダウンロード
FN-06 最新データ更新ボタン
FN-07 日別集計タブ（Daily）
FN-08 設計書タブ表示
FN-09 ダークモード切替（localStorage 永続化）
FN-10 エラー表示（API 失敗時）
FN-11 RP 定期取得バッチ（pg_cron / 15 分間隔 / 21:00〜03:00 JST）
FN-12 古レコード削除バッチ（pg_cron / 30 日超過分を自動削除）`
        },
        {
          label: '画面レイアウト',
          content: `Header: タイトル「Apex RP Analysis」＋ダークモードトグル＋「設計書を見る」リンク
Period Selector: 7日 / 30日 ボタン ＋ 更新ボタン ＋ CSV ボタン
Stats Cards: 最新RP / 最高RP / 最低RP / 変化量 / 平均RP / 1日あたり変化（6カード）
Main Tab Area: Analysis / Data Table / Daily / 設計書 タブパネル
Footer: 「Apex RP Analysis · Powered by Supabase & Vercel」`
        },
        {
          label: '帳票設計',
          content: `帳票種別: CSV ファイル
ファイル名: apex-rp-{N}days.csv（N=7 または 30）
文字コード: UTF-8
出力形式: RFC 4180 準拠（ダブルクォート囲い、カンマ区切り）
出力列:
  1列目: id（UUID）
  2列目: rp（整数）
  3列目: created_at（ISO 8601 UTC タイムスタンプ）
ヘッダ行: 1行目に列名を出力
出力行数: API 取得件数に依存（最大約 2,905 件 / 7日）`
        },
        {
          label: 'インターフェース設計（外部 I/F 仕様）',
          content: `【I/F-01: Vercel API → Supabase REST API】
プロトコル: HTTPS
メソッド: GET
エンドポイント: {SUPABASE_URL}/rest/v1/player_rp
クエリ: select=id,rp,created_at&created_at=gte.{since}&order=created_at.asc
認証: apikey ヘッダ（Service Role Key）

【I/F-02: Angular → Vercel API】
プロトコル: HTTPS
メソッド: GET
エンドポイント: /api/get-rp?days={7|30}
認証: 任意 Basic 認証（環境変数設定時のみ）
レスポンス: JSON 配列 [{ id: string, rp: number, created_at: string }]

【I/F-03: Supabase pg_cron → Apex Status API】
プロトコル: HTTPS / 外部 HTTP 拡張（pg_net）
メソッド: GET
詳細: Supabase バッチ設計書を参照`
        },
        {
          label: 'コード設計（定数・区分値）',
          content: `表示期間区分:
  7  = 7日間
  30 = 30日間（デフォルト）
  ※ API 側で上記以外は 30 にフォールバック

レートリミット:
  RATE_LIMIT_WINDOW_MS = 60,000 ms（1分）
  RATE_LIMIT_MAX_REQUESTS = 60 req

グラフ配色:
  線色: #1e40af（青 800）
  塗り: rgba(30, 64, 175, 0.08)（薄青）
  ポイント: #1e40af / 枠 #ffffff`
        },
        {
          label: 'セキュリティ設計',
          content: `① 機密情報管理:
  ・SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は Vercel 環境変数でのみ保持
  ・クライアント側 JavaScript には一切公開しない

② 認証:
  ・Basic 認証（オプション）: BASIC_AUTH_USER / BASIC_AUTH_PASS が設定された場合のみ有効
  ・未設定時は認証なし（個人利用前提）

③ API 保護:
  ・レートリミット: IP ごとに 60 req/分を超えたら 429 を返す
  ・CORS: ALLOWED_ORIGIN 環境変数で許可オリジンを制限可能

④ 入力バリデーション:
  ・days パラメータ: [7, 30] 以外は 30 にフォールバック（インジェクション対策）
  ・Supabase クエリは REST API のクエリパラメータ形式で組み立て（SQL インジェクション対策）`
        },
        {
          label: '性能設計',
          content: `・Supabase: created_at DESC インデックス（idx_player_rp_created_at_desc）により期間フィルタを高速化
・Vercel Edge Network による CDN キャッシュ（静的アセット）
・Angular: OnPush ChangeDetection は未使用（データ件数が少量のため不要）
・グラフ: Chart.js は登録コントローラのみインポート（バンドルサイズ最適化）
・API: Serverless Function の Cold Start を考慮し UX ではローディングスピナー表示`
        },
        {
          label: '運用設計（バックアップ・ジョブスケジュール）',
          content: `【ジョブスケジュール】
Job-01: RP 取得バッチ
  スケジュール: 毎日 21:00〜03:00（JST）の各 :00, :15, :30, :45
  cron 式（UTC）: */15 12-18 * * * （21:00〜翌03:00 JST = 12:00〜18:00 UTC）
  処理: Apex Status API からぺこんぽっての RP を取得し player_rp に INSERT

Job-02: 古データ削除バッチ
  スケジュール: 毎日 03:05（JST）= 18:05 UTC
  cron 式（UTC）: 5 18 * * *
  処理: created_at < now() - INTERVAL '30 days' のレコードを DELETE

【バックアップ】
  Supabase の自動バックアップ機能に依存（無料プランは Point-in-Time Recovery なし）
  重要データは定期的に CSV ダウンロードで手動バックアップを推奨`
        },
        {
          label: 'データベース設計（論理モデル・ER 図）',
          content: `【エンティティ】
player_rp（RPレコード）
  ・UUID で一意識別
  ・RP 値（整数）
  ・記録日時（タイムゾーン付き）

インデックス:
  idx_player_rp_created_at_desc (created_at DESC)`,
          diagram: `erDiagram
    player_rp {
        uuid id PK
        integer rp
        timestamptz created_at
    }`
        },
        {
          label: 'プログラム構造設計（モジュール構成図）',
          content: `apex-rp-analysis/
├── api/
│   └── get-rp.js              # Vercel Serverless Function
│       ├── getClientIp()       # IP アドレス取得
│       ├── isRateLimited()     # レートリミット判定
│       ├── getAllowedOrigin()   # CORS オリジン取得
│       ├── validateBasicAuth() # Basic 認証検証
│       └── handler()           # メインハンドラ
│
└── src/app/
    ├── app.component.ts        # ルートコンポーネント（UI 制御・データ取得）
    │   ├── loadRecords()        # API 呼び出し・グラフ更新
    │   ├── onRangeChange()      # 期間切替
    │   ├── refresh()            # 再取得
    │   ├── downloadCsv()        # CSV 出力
    │   ├── toggleDark()         # ダークモード切替
    │   └── get dailyRecords()   # 日別集計算出
    │
    └── components/design-doc/
        ├── design-doc.component.ts   # 設計書コンポーネント
        ├── design-doc.component.html # 設計書テンプレート
        └── design-doc-section.interface.ts # 型定義`
        }
      ]
    },

    // ─────────────────────────────────────────
    // 3. 詳細設計書
    // ─────────────────────────────────────────
    {
      id: 'detailed-design',
      title: '3. 詳細設計書',
      order: 3,
      items: [
        {
          label: 'プログラム間インターフェース設計',
          content: `【AppComponent → /api/get-rp】
呼び出し方法: Angular HttpClient.get<RpRecord[]>()
URL: /api/get-rp
クエリパラメータ: days=7|30
レスポンス型: RpRecord[] = { id: number, rp: number, created_at: string }[]
エラー時: error.error.error または error.message を UI に表示

【/api/get-rp → Supabase REST API】
呼び出し方法: fetch()（Node.js 組み込み）
URL: {SUPABASE_URL}/rest/v1/player_rp?select=id,rp,created_at&created_at=gte.{since}&order=created_at.asc
ヘッダ: apikey: {SERVICE_ROLE_KEY}, Authorization: Bearer {SERVICE_ROLE_KEY}
レスポンス型: 同上 JSON 配列`
        },
        {
          label: 'バッチ処理設計',
          content: `【Job-01: RP 取得バッチ】
実行基盤: Supabase pg_cron + pg_net
スケジュール: */15 12-18 * * *（UTC）= 21:00〜03:00 JST 15 分ごと
処理概要:
  1. pg_net.http_get() で Apex Status API を呼び出す
  2. レスポンスの JSON から RP 値を抽出する
  3. player_rp テーブルに INSERT する
     INSERT INTO player_rp(rp, created_at)
     VALUES ({rp_value}, timezone('Asia/Tokyo', now()));
エラー処理: pg_cron のジョブ実行ログに記録（Supabase Dashboard で確認可能）
タイムアウト: pg_net のデフォルトタイムアウト（5秒）

【Job-02: 古データ削除バッチ】
実行基盤: Supabase pg_cron
スケジュール: 5 18 * * *（UTC）= 03:05 JST（RP 取得時間外）
処理概要:
  DELETE FROM player_rp
  WHERE created_at < timezone('Asia/Tokyo', now()) - INTERVAL '30 days';
エラー処理: pg_cron のジョブ実行ログに記録`
        },
        {
          label: 'オンライン処理設計',
          content: `【GET /api/get-rp 処理フロー】
① CORS プリフライト（OPTIONS）→ 204 返却
② メソッド確認（GET 以外 → 405）
③ Basic 認証検証（設定あり且つ失敗 → 401）
④ レートリミット確認（超過 → 429）
⑤ 環境変数確認（未設定 → 500）
⑥ days パラメータ取得・バリデーション（[7,30] 以外 → 30 にフォールバック）
⑦ since 日時算出（Date.now() - days * 86400000）
⑧ Supabase REST API を fetch() で呼び出す
⑨ Supabase エラー（!response.ok）→ 500
⑩ JSON パース・200 返却
⑪ 例外（ネットワークエラー等）→ 500`
        },
        {
          label: '共通モジュール設計',
          content: `【api/get-rp.js 内共通関数】
getClientIp(req): string
  - x-forwarded-for ヘッダから最初の IP を取得
  - なければ socket.remoteAddress を使用

isRateLimited(clientIp: string): boolean
  - requestBuckets Map で IP ごとのカウントを管理
  - 1 分ウィンドウで 60 件超過時に true を返す

getAllowedOrigin(req): string
  - ALLOWED_ORIGIN 環境変数と req.headers.origin を照合

validateBasicAuth(req): { ok: boolean, reason?: string }
  - BASIC_AUTH_USER / BASIC_AUTH_PASS 未設定時は { ok: true }
  - Base64 デコードで user:pass を検証

【Angular 共通】
HttpClient（@angular/common/http）: HTTP 通信
Chart.js + ng2-charts: グラフ描画
mermaid: 設計書の図表描画
CommonModule / DatePipe: テンプレート共通機能`
        },
        {
          label: 'エラー処理設計',
          content: `【API レイヤー（api/get-rp.js）】
エラー種別        HTTPステータス  レスポンス body
────────────────────────────────────────────────
OPTIONS 以外の非GET   405         { error: 'Method Not Allowed' }
認証失敗              401         { error: 'Authentication required' }
レートリミット超過     429         { error: 'Too many requests...' }
環境変数未設定        500         { error: 'Missing env vars: ...' }
Supabase エラー       500         { error: 'Supabase error: {body}' }
予期せぬ例外          500         { error: '{message}' }

【Angular レイヤー（app.component.ts）】
エラー発生時: this.error に日本語メッセージをセット
  → 「データの取得に失敗しました。({detail})」
表示: テンプレート上の *ngIf="error" ブロックで赤背景のエラーカードを表示`
        },
        {
          label: 'ログ出力設計',
          content: `【api/get-rp.js ログ】
レベル  出力条件                        メッセージ例
──────────────────────────────────────────────────────
info    正常取得完了    [get-rp] success { days: 30, count: 2880 }
warn    レートリミット超過 [get-rp] rate limited { clientIp: '...' }
error   環境変数未設定  [get-rp] missing env vars
error   Supabase エラー [get-rp] supabase error { status: 500, body: '...' }
error   予期せぬ例外    [get-rp] unexpected error { message: '...' }

出力先: Vercel Dashboard → Functions → Logs
保持期間: Vercel の無料プランで 1 日分`
        },
        {
          label: 'クラス設計（主要コンポーネント）',
          content: `【AppComponent】
プロパティ:
  activeTab: 'analysis' | 'table' | 'daily' | 'design'  現在のアクティブタブ
  loading: boolean                               初回ロード中フラグ
  refreshing: boolean                            再取得中フラグ
  error: string                                  エラーメッセージ
  records: RpRecord[]                            取得 RP レコード配列
  selectedRange: 7 | 30                          選択中の表示期間
  isDark: boolean                                ダークモードフラグ
  tableSortDir: 'asc' | 'desc'                   テーブルソート方向
  tableFilter: string                            テーブル検索フィルター
  dailySortDir: 'asc' | 'desc'                   日別集計ソート方向

算出プロパティ（getter）:
  latestRp / maxRp / minRp / rpChange / avgRp / rpPerDay
  dailyRecords: 日別集計配列
  sortedRecords: ソート・フィルター済みレコード

メソッド:
  ngOnInit() / loadRecords(isRefresh?) / onRangeChange(days)
  refresh() / downloadCsv() / toggleDark() / showDesignDoc()`
        },
        {
          label: 'インターフェース設計（詳細・シーケンス図）',
          content: `タイムアウト設定:
  Angular HttpClient: デフォルト（無制限）
  fetch（API→Supabase）: Node.js デフォルト（個人用途のため許容）
  pg_net（バッチ→Apex API）: 5 秒（pg_net デフォルト）`,
          diagram: `sequenceDiagram
    participant U as Browser
    participant A as Angular
    participant V as Vercel API
    participant D as Supabase
    U->>A: 画面起動 / 期間変更
    A->>V: GET /api/get-rp?days=N
    V->>V: レート制限チェック
    V->>D: SELECT id,rp,created_at WHERE created_at >= since ORDER BY created_at ASC
    D-->>V: RpRecord[]
    V-->>A: JSON 200 OK
    A-->>U: グラフ・表・日別集計を更新`
        },
        {
          label: 'データベース設計（物理モデル・詳細）',
          content: `【テーブル定義: player_rp】
列名       データ型                    NOT NULL  デフォルト値
──────────────────────────────────────────────────────────────
id         uuid                        YES       gen_random_uuid()
rp         integer                     YES       なし
created_at timestamp with time zone    YES       timezone('Asia/Tokyo', now())

【主キー】player_rp_pkey (id)

【インデックス定義】
  名前: idx_player_rp_created_at_desc
  種別: B-Tree / 列: created_at DESC
  用途: 期間フィルタクエリの高速化

【ビュー・ストアドプロシージャ・トリガー】なし（シンプル構成）

【データ容量見積もり】
  1レコード: 約 60〜80 bytes
  30日分最大件数: 約 4,350 件
  最大データサイズ: 約 350 KB（余裕を持って 1 MB 以下）`
        },
        {
          label: 'プログラム設計（SQL 文詳細）',
          content: `【RP データ取得クエリ（Supabase REST → SQL 変換）】
SELECT id, rp, created_at
FROM player_rp
WHERE created_at >= '{since}'
ORDER BY created_at ASC;

{since} = Date.now() - days * 86400000 の ISO 8601 文字列

【削除バッチ SQL（Job-02）】
DELETE FROM player_rp
WHERE created_at < timezone('Asia/Tokyo', now()) - INTERVAL '30 days';

【取得バッチ INSERT SQL（Job-01）】
INSERT INTO player_rp (rp, created_at)
VALUES ({rp_value}, timezone('Asia/Tokyo', now()));

【件数確認（運用時手動実行）】
SELECT COUNT(*), MIN(created_at), MAX(created_at) FROM player_rp;`
        }
      ]
    },

    // ─────────────────────────────────────────
    // 4. 単体テスト設計書
    // ─────────────────────────────────────────
    {
      id: 'unit-test',
      title: '4. 単体テスト設計書',
      order: 4,
      items: [
        {
          label: 'テスト計画（対象範囲）',
          content: `対象:
  UT-A: api/get-rp.js の各関数
  UT-B: AppComponent の算出プロパティ・メソッド
  UT-C: DesignDocComponent のセクション切替

除外:
  ・Chart.js / Mermaid の描画結果（ライブラリの責務）
  ・Supabase / Apex API の通信（IT で確認）
  ・pg_cron ジョブの実行タイミング（IT で確認）`
        },
        {
          label: 'テストケース',
          content: `UT-A-01: getClientIp — x-forwarded-for ヘッダあり → 最初の IP を返す
UT-A-02: getClientIp — ヘッダなし → socket.remoteAddress を返す
UT-A-03: isRateLimited — 60 件以下 → false を返す
UT-A-04: isRateLimited — 61 件目 → true を返す
UT-A-05: isRateLimited — 1 分経過後リセット → false を返す
UT-A-06: validateBasicAuth — 環境変数未設定 → { ok: true }
UT-A-07: validateBasicAuth — 正しい認証情報 → { ok: true }
UT-A-08: validateBasicAuth — 誤った認証情報 → { ok: false, reason: 'invalid' }
UT-A-09: validateBasicAuth — Authorization ヘッダなし → { ok: false, reason: 'missing' }
UT-A-10: handler — days=7 → since が 7 日前の ISO 文字列
UT-A-11: handler — days=99（不正値）→ days=30 にフォールバック
UT-A-12: handler — SUPABASE_URL 未設定 → 500 レスポンス

UT-B-01: latestRp — records 空 → null
UT-B-02: latestRp — records あり → 最後の rp 値
UT-B-03: rpChange — records 1件 → null
UT-B-04: rpChange — records 複数 → 最後 - 最初
UT-B-05: avgRp — 整数に丸め → Math.round 結果
UT-B-06: rpPerDay — 時間差 < 0.01 日 → null
UT-B-07: downloadCsv — records 空 → 何も起きない
UT-B-08: downloadCsv — records あり → CSV Blob が生成される
UT-B-09: dailyRecords — 同一日付の複数レコードが 1 行に集計される
UT-B-10: toggleDark — isDark が反転し localStorage に保存される

UT-C-01: selectSection — 'basic-design' → selectedSectionId が更新される
UT-C-02: selectedSection — 存在しない ID → undefined`
        },
        {
          label: 'テストデータ',
          content: `RpRecord サンプル:
  { id: 1, rp: 1500, created_at: '2026-03-01T12:00:00+09:00' }
  { id: 2, rp: 1600, created_at: '2026-03-02T12:00:00+09:00' }
  { id: 3, rp: 1400, created_at: '2026-03-03T12:00:00+09:00' }

境界値:
  days=7（最小有効値）
  days=30（最大有効値）
  days=0, days=90, days=abc（無効値）
  records=[]（空配列）
  records=[1件]（統計計算不能境界）`
        },
        {
          label: 'テスト手順',
          content: `① npm test コマンドを実行する（ng test）
② Karma + Jasmine でブラウザ上でテストを実行する
③ テスト結果のサマリを確認する（PASSED / FAILED 件数）
④ カバレッジレポートを確認する（ng test --code-coverage）
⑤ 失敗したケースの原因を調査・修正する`
        },
        {
          label: '期待結果・受け入れ基準',
          content: `・全テストケースが PASS すること
・カバレッジ（行カバレッジ）: api/get-rp.js ≥ 80%、AppComponent ≥ 70%
・エラー分岐（UT-A-06〜12）が必ず PASS すること
・境界値テスト（UT-A-11 days 不正値フォールバック）が PASS すること`
        },
        {
          label: 'テスト環境構成',
          content: `テスト実行環境: ローカル開発マシン
テストフレームワーク: Jasmine + Karma（Angular CLI 標準）
Node.js: 20.x（Vercel 対応バージョン）
ブラウザ: Chrome（Karma デフォルト）
環境変数: テスト用モック（SUPABASE_URL=http://localhost、etc.）`
        },
        {
          label: '証跡',
          content: 'docs/test-evidence.md と docs/evidence/*.txt に保存。'
        }
      ]
    },

    // ─────────────────────────────────────────
    // 5. 結合テスト設計書
    // ─────────────────────────────────────────
    {
      id: 'integration-test',
      title: '5. 結合テスト設計書',
      order: 5,
      items: [
        {
          label: 'テスト計画（対象範囲）',
          content: `対象:
  IT-A: Angular → /api/get-rp → Supabase の E2E データフロー
  IT-B: 画面操作（期間切替・再取得・CSV・Daily タブ）の結合動作
  IT-C: エラーシナリオ（Supabase 接続失敗・認証エラー）

前提条件:
  ・Vercel デプロイ済みの Preview 環境
  ・Supabase テスト用テーブルに最低 10 件以上のデータが存在すること
  ・BASIC_AUTH 未設定（テスト簡略化のため）`
        },
        {
          label: 'テストケース',
          content: `IT-A-01: 画面初期表示 → API が呼ばれ selectedRange=30 のデータが表示される
IT-A-02: days=7 で API 呼び出し → 7 日以内のデータのみ返却される
IT-A-03: days=30 で API 呼び出し → 30 日以内のデータのみ返却される
IT-A-04: Supabase に存在しない日付範囲 → 空配列が返り「データなし」表示
IT-B-01: 「7日」ボタンをクリック → グラフ・統計が 7 日データで再描画される
IT-B-02: 「30日」ボタンをクリック → グラフ・統計が 30 日データで再描画される
IT-B-03: 「最新データに更新」ボタン → ローディング表示後にデータが再取得される
IT-B-04: CSVダウンロード → ダウンロードファイルの列・件数がデータと一致する
IT-B-05: Analysis → Data Table → Daily → 設計書 タブ切替が正常に動作する
IT-B-06: Daily タブ → 日別集計が正しく表示され、ソートが動作する
IT-B-07: ダークモード切替 → 画面全体がダーク対応に切り替わる
IT-C-01: SUPABASE_URL を無効値に変更 → 500 エラーが返り UI にエラー表示される
IT-C-02: ネットワーク切断状態で更新 → エラーメッセージが表示される`
        },
        {
          label: 'テストデータ',
          content: `Supabase テスト DB に以下を事前投入:
  ・直近 7 日以内: 10 件以上
  ・8〜30 日以内: 10 件以上
  ・31 日以前: 5 件（削除対象の確認用）

CSV 検証用の期待値:
  ・7 日テスト: created_at が 7 日前以降のレコードのみ含まれること
  ・ヘッダ行: "id","rp","created_at"`
        },
        {
          label: 'テスト手順',
          content: `① Vercel Preview URL にブラウザでアクセスする
② DevTools の Network タブを開き、API リクエスト・レスポンスを確認する
③ 各テストケースの操作を順に実行する
④ 期待結果と実際の画面表示・ネットワークレスポンスを比較する
⑤ CSV ダウンロードの場合はファイルをテキストエディタで開いて内容を確認する
⑥ エラーケースは DevTools Console でエラーログを確認する`
        },
        {
          label: '期待結果・受け入れ基準',
          content: `・全テストケースが期待結果と一致すること
・IT-A: API レスポンスの created_at が指定期間内のレコードのみであること
・IT-B: 画面の統計値が API レスポンスデータと一致すること
・IT-C: エラー時に UI 上にエラーメッセージが表示されること
・CSV の列順・ヘッダ・文字コードが仕様通りであること`
        },
        {
          label: 'テスト環境構成',
          content: `環境: Vercel Preview デプロイ（本番とは別の Supabase プロジェクト推奨）
ブラウザ: Chrome 最新版
DevTools: Network / Console タブ使用
テスト DB: Supabase（テスト用プロジェクト）
テストデータ投入: Supabase Dashboard の SQL エディタで手動 INSERT`
        }
      ]
    },

    // ─────────────────────────────────────────
    // 6. 総合テスト設計書
    // ─────────────────────────────────────────
    {
      id: 'system-test',
      title: '6. 総合テスト設計書',
      order: 6,
      items: [
        {
          label: 'テスト計画（対象範囲）',
          content: `対象:
  ST-A: 本番環境（Vercel + 本番 Supabase）での全機能動作確認
  ST-B: バッチ処理（RP 取得・削除）の実動作確認
  ST-C: 性能・可用性確認
  ST-D: セキュリティ確認

前提条件:
  ・本番 Vercel へのデプロイが完了していること
  ・本番 Supabase の pg_cron ジョブが設定済みであること
  ・実際のぺこんぽってプレイヤーデータが 1 件以上存在すること`
        },
        {
          label: 'テストケース',
          content: `ST-A-01: 本番 URL でアプリが表示され、RP グラフが描画される
ST-A-02: 7日 / 30日 切替でグラフが正しく更新される
ST-A-03: 統計カード（最新・最高・最低・変化・平均・1日あたり）が全て表示される
ST-A-04: Data Table タブでデータ一覧が表示され、ソート・フィルターが動作する
ST-A-05: Daily タブで日別集計が表示される
ST-A-06: CSVダウンロードでファイルが取得でき、データが正しい
ST-A-07: ダークモード切替が正常に動作し、リロード後も設定が維持される
ST-A-08: 設計書タブで全 7 セクションが閲覧できる
ST-B-01: 21:00〜03:00 の期間内 15 分後にレコードが増加していることを確認
ST-B-02: 30 日超過レコードが翌 03:05 以降に削除されていることを確認
ST-C-01: API レスポンスタイムが 2 秒以内であること（Chrome DevTools で確認）
ST-C-02: グラフが 500ms 以内に描画されること（体感確認）
ST-D-01: SUPABASE_SERVICE_ROLE_KEY がクライアントの JS に露出していないこと
ST-D-02: 不正な days パラメータが 30 日にフォールバックされ安全に動作すること
ST-D-03: レートリミット超過時（61 req/min）に 429 が返ること`
        },
        {
          label: 'テストデータ',
          content: `本番データを使用（実際のぺこんぽっての RP データ）
削除テスト用: 31 日以前のレコードを 1 件手動 INSERT し、バッチ実行後に削除されることを確認
性能テスト用: 7 日分・30 日分のデータが蓄積された状態でレスポンス時間を計測`
        },
        {
          label: 'テスト手順',
          content: `① 本番 URL にアクセスし、スクリーンショットで初期表示を記録する
② 各機能テスト（ST-A-01〜08）を順に実行し、スクリーンショットで記録する
③ pg_cron バッチ確認（ST-B）は Supabase Dashboard の cron ログで確認する
④ Chrome DevTools の Network タブで API レスポンス時間を計測する（ST-C）
⑤ DevTools の Sources でバンドル JS を検索し、SERVICE_ROLE_KEY が含まれていないことを確認する（ST-D-01）
⑥ curl でレートリミットテストを実行する（ST-D-03）
⑦ 全テスト結果をスプレッドシートに記録する`
        },
        {
          label: '期待結果・受け入れ基準',
          content: `・ST-A 全ケース: 画面表示・操作が正常であること
・ST-B: バッチが設定スケジュール通りに動作し、30 日超過データが自動削除されること
・ST-C: API 2 秒以内、グラフ描画 500ms 以内
・ST-D: 機密情報の露出がないこと、インジェクション攻撃に対して安全であること
・受け入れ基準: ST-A〜D 全ケース PASS でリリース承認とする`
        },
        {
          label: 'テスト環境構成',
          content: `環境: 本番（Vercel Production + Supabase Production）
ブラウザ: Chrome 最新版
監視ツール: Vercel Dashboard（Function Logs）、Supabase Dashboard（cron Logs）
レートリミットテスト: curl コマンドでループリクエスト
テスト実施者: システム管理者（ぺこんぽって本人 or 担当者）`
        }
      ]
    },

    // ─────────────────────────────────────────
    // 7. 構成管理書
    // ─────────────────────────────────────────
    {
      id: 'config-management',
      title: '7. 構成管理書',
      order: 7,
      items: [
        {
          label: '構成アイテム一覧',
          content: `CI-01: ソースコード（src/）— Angular SPA
CI-02: API コード（api/get-rp.js）— Vercel Serverless Function
CI-03: ビルド設定（angular.json / tsconfig.json）
CI-04: 依存関係定義（package.json / package-lock.json）
CI-05: Vercel 設定（vercel.json）
CI-06: スタイル設定（tailwind.config.js / postcss.config.js）
CI-07: 環境変数定義（.env.example）
CI-08: 設計書（本コンポーネント）— design-doc.component.ts
CI-09: Supabase スキーマ（DDL: player_rp テーブル・インデックス）
CI-10: Supabase pg_cron ジョブ設定（Dashboard 上で管理）`
        },
        {
          label: 'バージョン管理方法',
          content: `VCS: Git（GitHub リポジトリ: ikdrn/Apex_RP_Analysis）
ブランチ戦略:
  Main: 本番リリース済みコード
  claude/{feature-name}-{id}: 機能追加・修正ブランチ（Claude Code 作業用）
  PR: GitHub Pull Request でレビュー後 Main にマージ

コミットメッセージ規約:
  feat: 新機能
  fix: バグ修正
  refactor: リファクタリング
  docs: ドキュメント更新
  chore: 設定・依存更新

タグ: リリース時に v{MAJOR}.{MINOR}.{PATCH} タグを打つ（例: v1.0.0）`
        },
        {
          label: 'リリース手順',
          content: `① 機能ブランチで開発・テスト完了を確認する
② GitHub で Pull Request を作成し、差分をレビューする
③ Main ブランチへ Squash Merge または Merge Commit でマージする
④ Vercel が Main ブランチの push を検知して自動ビルド・デプロイを実行する
⑤ Vercel Dashboard でデプロイが成功したことを確認する
⑥ 本番 URL で総合テスト（ST-A-01〜08）を実施する
⑦ 問題がなければ GitHub にリリースタグ（v{version}）を作成する
⑧ 問題があれば即座に Vercel Dashboard の「Rollback」機能で前バージョンに戻す`
        },
        {
          label: '変更管理手順',
          content: `① 変更要求を GitHub Issue に起票する（タイトル・背景・影響範囲を記載）
② Issue に対して開発ブランチを切る（claude/{issue}-{id} 形式）
③ 変更を実装し、設計書（本コンポーネント）も同時に更新する
④ PR を作成し、変更差分・テスト結果をコメントする
⑤ レビュー・承認後にマージ・デプロイする
⑥ Supabase スキーマ変更が必要な場合は DDL を Issue に記録してから実行する`
        },
        {
          label: '環境構築手順',
          content: `【ローカル開発環境】
① git clone https://github.com/ikdrn/Apex_RP_Analysis
② cd Apex_RP_Analysis && npm install
③ .env.example をコピーして .env.local を作成し、各値を設定する
   SUPABASE_URL=https://{your-project}.supabase.co
   SUPABASE_SERVICE_ROLE_KEY={your-service-role-key}
   ALLOWED_ORIGIN=http://localhost:4200（任意）
④ npm run start でローカルサーバー起動（http://localhost:4200）

【Vercel 本番環境】
① Vercel Dashboard でプロジェクトをインポート（GitHub 連携）
② Settings → Environment Variables に以下を設定:
   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ALLOWED_ORIGIN
   （任意）BASIC_AUTH_USER / BASIC_AUTH_PASS
③ Main ブランチへの push で自動デプロイが有効になることを確認する

【Supabase 環境】
① Supabase Dashboard で新規プロジェクトを作成する
② SQL エディタで player_rp テーブル・インデックスを作成する（DDL は DB 設計書参照）
③ Extensions で pg_cron / pg_net を有効化する
④ pg_cron でジョブを登録する（バッチ設計書の cron 式を使用）`
        },
        {
          label: 'ミドルウェア設定情報',
          content: `【Vercel】
  ランタイム: Node.js 20.x（Serverless Function）
  ビルドコマンド: ng build（angular.json の outputPath: dist/apex-rp-analysis）
  出力ディレクトリ: dist/apex-rp-analysis/browser
  ルーティング: vercel.json の rewrites で /api/* → api/*.js

【Angular】
  バージョン: 17.3.x
  ビルドモード: production（ng build --configuration production）
  バンドラー: esbuild（Angular 17 デフォルト）
  CSS: Tailwind CSS 3.4.x + PostCSS

【Supabase（PostgreSQL）】
  拡張機能: pgcrypto（gen_random_uuid 用）、pg_cron、pg_net
  タイムゾーン: Asia/Tokyo（created_at のデフォルト値）
  プラン: Free Tier（個人用途）

【ライブラリバージョン】
  chart.js: 4.4.x / ng2-charts: 5.0.x
  mermaid: 11.x / rxjs: 7.8.x
  TypeScript: 5.4.x`
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.initMermaid();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isDark'] && !changes['isDark'].firstChange) {
      this.initMermaid();
      this.needsRender = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.needsRender) {
      this.needsRender = false;
      this.renderMermaid();
    }
  }

  private initMermaid(): void {
    mermaid.initialize({
      startOnLoad: false,
      theme: this.isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, "Noto Sans JP", sans-serif'
    });
    this.mermaidInitialized = true;
    this.needsRender = true;
  }

  renderMermaid(): void {
    if (!this.mermaidInitialized) return;
    const elements = document.querySelectorAll('.mermaid:not([data-processed="true"])');
    if (elements.length > 0) {
      mermaid.run({ nodes: Array.from(elements) as HTMLElement[] });
    }
  }

  selectSection(sectionId: DesignDocSection['id']): void {
    this.selectedSectionId = sectionId;
    setTimeout(() => {
      const elements = document.querySelectorAll('.mermaid');
      elements.forEach((el) => el.removeAttribute('data-processed'));
      this.renderMermaid();
    }, 0);
  }

  get selectedSection(): DesignDocSection | undefined {
    return this.sections.find((s) => s.id === this.selectedSectionId);
  }
}
