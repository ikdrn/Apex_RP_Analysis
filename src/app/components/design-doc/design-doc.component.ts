import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignDocSection, DesignDocDiagramNode } from './design-doc-section.interface';

@Component({
  selector: 'app-design-doc',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './design-doc.component.html'
})
export class DesignDocComponent {
  selectedSectionId: 'requirements' | 'basic-design' | 'detailed-design' | 'testing' | 'future' = 'requirements';

  sections: DesignDocSection[] = [

    // ============================================================
    // 1. 要件定義書
    // ============================================================
    {
      id: 'requirements',
      title: '1. 要件定義書',
      order: 1,
      items: [
        {
          label: 'システム化の目的・背景',
          content: 'ぺこんぽのApex LegendsランクマッチにおけるRP（Ranking Points）推移を可視化・記録するシステムを構築する。',
          note: 'apexstatus等の既存サービスはリアルタイムのRP表示に特化しており、過去のRP履歴を遡って確認する機能を持たない。本システムはSupabaseに自動蓄積された直近30日分のRPデータを可視化し、「ぺこんぽが今どのランクにいて、どのような軌跡を辿ってきたか」を時系列で把握できる唯一の手段となる。',
          subItems: [
            'ランクマッチ後の振り返りを即座に行える環境の提供',
            '停滞期・成長期を時系列グラフで客観的に把握',
            '日次集計・平均RP/日でペースを数値化',
            'CSVエクスポートにより外部ツールでの詳細分析を可能にする'
          ]
        },
        {
          label: 'システム概要',
          content: 'システムの基本属性を以下に定義する。',
          table: {
            headers: ['項目', '内容'],
            rows: [
              ['システム名', 'Apex RP Analysis'],
              ['対象プレイヤー', 'ぺこんぽ（主利用者）、チームメンバー（閲覧者）'],
              ['利用シーン', 'ランクマッチ後の振り返り、目標RP設定、進捗確認、CSV分析'],
              ['アクセス方法', 'PCブラウザ / スマートフォンブラウザ（URLに直接アクセス）'],
              ['データソース', 'Supabase player_rp テーブル（外部スクレイピングシステムが自動蓄積）'],
              ['データ保持期間', '直近30日分（スクレイピング仕様に依存）'],
              ['利用想定頻度', 'ランクマッチのセッション後（1日1〜複数回）']
            ]
          }
        },
        {
          label: '業務フロー（As-Is vs To-Be）',
          content: '本システム導入前後の業務フローを比較する。',
          diagram: {
            type: 'comparison',
            leftTitle: 'As-Is（現状の課題）',
            leftItems: [
              'ゲームクライアントを起動してランク画面を手動確認',
              '過去のRP履歴を遡って見る手段がない',
              'apexstatusはリアルタイム表示のみ（日次履歴なし）',
              'CSVなどでの外部分析ができない',
              '成長の傾向や停滞期を把握しづらい',
              '他人に現在の状況を共有する手段がない'
            ],
            rightTitle: 'To-Be（本システム導入後）',
            rightItems: [
              'ブラウザでURLにアクセスするだけで即座に確認',
              '直近30日分のRP推移をグラフで一覧確認',
              'ランク帯・平均RP/日・日次集計で多角的に分析',
              'CSVダウンロードでスプレッドシート分析も可能',
              '成長曲線や停滞期を視覚的に把握できる',
              'URLを共有するだけで現状を即座に伝えられる'
            ]
          }
        },
        {
          label: '機能要件一覧（CRUDマトリクス含む）',
          content: '本システムが提供する機能と各データエンティティへのCRUD操作権限を定義する。',
          table: {
            headers: ['要件ID', '機能名', '概要', '優先度', 'Create', 'Read', 'Update', 'Delete'],
            rows: [
              ['FRQ-001', 'RPグラフ表示', '期間内RP推移を折れ線グラフで表示', '必須', '-', '✓', '-', '-'],
              ['FRQ-002', '期間切替', '7日/30日ボタンで表示範囲を動的切替', '必須', '-', '✓', '-', '-'],
              ['FRQ-003', '統計カード表示', '最新RP・最高/最低RP・期間変化・平均RP/日', '必須', '-', '✓', '-', '-'],
              ['FRQ-004', 'ランク自動判定', '最新RPからApexランク帯（Rookie〜Master）をバッジ表示', '必須', '-', '✓', '-', '-'],
              ['FRQ-005', '日次集計ビュー', '1日ごとの最高/最低RP・変化量・最終ランクを集計', '必須', '-', '✓', '-', '-'],
              ['FRQ-006', 'データ一覧表示', '全RPレコードをランク付きで時系列テーブル表示', '必須', '-', '✓', '-', '-'],
              ['FRQ-007', '手動更新', 'ボタン操作で最新データをAPIから再取得', '必須', '-', '✓', '-', '-'],
              ['FRQ-008', 'CSVダウンロード', '表示中データをRFC4180準拠CSVとして保存', '必須', '✓', '✓', '-', '-'],
              ['FRQ-009', 'エラー表示', 'API失敗時に原因と再試行方法を画面表示', '必須', '-', '-', '-', '-'],
              ['FRQ-010', '設計書閲覧', '本システム設計書をアプリ内タブで閲覧可能', '推奨', '-', '✓', '-', '-']
            ]
          }
        },
        {
          label: '非機能要件',
          content: 'システムとして満たすべき品質・運用・可用性要件を定義する。',
          table: {
            headers: ['要件ID', '分類', '要件名', '要件値', '根拠・補足'],
            rows: [
              ['NFR-001', '性能', 'APIレスポンス時間', '通常 2秒以内', 'ユーザー体験の最低基準。Supabase負荷次第で変動あり'],
              ['NFR-002', '可用性', 'サービス稼働率', 'Vercel SLA に依存（99.9% 目標）', '個人利用のためVercel管理域の障害は許容する'],
              ['NFR-003', 'セキュリティ', 'CORS制限', 'ALLOWED_ORIGIN 環境変数で制御', '許可オリジン以外からのAPI直接呼び出しを制限'],
              ['NFR-004', 'セキュリティ', 'レート制限', '60リクエスト/分/IPアドレス', 'DDoS・スクレイピングによる過負荷を防止'],
              ['NFR-005', 'セキュリティ', '認証（任意）', 'Basic認証（環境変数で有効化）', '未設定の場合は認証なし。チーム内のみ公開ならON推奨'],
              ['NFR-006', 'ブラウザ対応', '対応ブラウザ', 'Chrome / Safari / Firefox 最新版', '主要ブラウザのモダン機能（ES2022, Fetch API）に依存'],
              ['NFR-007', 'データ保持', 'データ保持期間', '最大30日分（スクレイピング仕様に準拠）', '90日取得は対象外。30日分以上のデータは表示できない'],
              ['NFR-008', '保守性', 'ログ出力', 'APIで console.info/warn/error 出力', 'Vercelダッシュボードで閲覧可能。障害調査に活用']
            ]
          }
        },
        {
          label: '外部インターフェース要件',
          content: '本システムが連携する外部サービスと通信規約を定義する。',
          table: {
            headers: ['連携先', '種別', '通信方式', '認証方式', '備考'],
            rows: [
              ['Supabase PostgreSQL', 'データソース', 'HTTPS REST API (PostgREST)', 'Service Role Key (Bearer Token)', 'api/get-rp.js 経由でのみアクセス。フロントエンドから直接呼び出さない'],
              ['Vercel Functions', '実行環境', 'HTTP (サーバー内部)', 'なし', 'Angular SPA から /api/get-rp への相対パスリクエスト'],
              ['外部スクレイピングシステム', 'データ書込み', '直接DB書込み（本システム外）', 'Supabase 接続情報', '本システムはデータを読むのみ。書込みはスコープ外']
            ]
          }
        },
        {
          label: 'データ要件（管理対象データ定義）',
          content: 'システムが参照するデータエンティティと各フィールドの業務的意味を定義する。',
          table: {
            headers: ['エンティティ', 'フィールド', '型', '業務的意味', '値の範囲'],
            rows: [
              ['RP記録 (player_rp)', 'id', '整数', 'レコードの一意識別子', '1以上の自動採番'],
              ['RP記録 (player_rp)', 'rp', '整数', 'ぺこんぽのその時点でのランクポイント値', '0以上（Rookieは0〜、Masterは16000以上）'],
              ['RP記録 (player_rp)', 'created_at', 'タイムスタンプ(UTC)', 'スクレイピングシステムがRPを取得した日時', '過去30日以内のデータが有効']
            ]
          }
        }
      ]
    },

    // ============================================================
    // 2. 基本設計書
    // ============================================================
    {
      id: 'basic-design',
      title: '2. 基本設計書',
      order: 2,
      items: [
        {
          label: 'システム構成図',
          content: 'ブラウザからSupabaseまでのデータフローと各コンポーネントの役割を示す。',
          diagram: {
            type: 'flow-h',
            nodes: [
              { label: 'ブラウザ', sublabel: 'ユーザー端末', description: 'Chrome / Safari / Firefox', color: 'gray' },
              { label: 'Vercel CDN', sublabel: 'Angular 17 SPA', description: 'フロントエンド配信', color: 'blue' },
              { label: 'Vercel Function', sublabel: 'api/get-rp.js', description: 'サーバーレスAPI', color: 'teal' },
              { label: 'Supabase', sublabel: 'PostgreSQL', description: 'player_rp テーブル', color: 'green' }
            ]
          },
          table: {
            headers: ['コンポーネント', '種別', '役割', '使用技術'],
            rows: [
              ['Angular SPA', 'フロントエンド', 'UI表示・グラフ描画・統計算出・ランク判定', 'Angular 17.3 / TypeScript 5.4 / Tailwind CSS 3.4 / Chart.js 4.4'],
              ['api/get-rp.js', 'サーバーレス関数', 'CORS制御・認証・レート制限・Supabase中継', 'Node.js 18 (CommonJS) / Vercel Functions'],
              ['Supabase PostgreSQL', '外部データストア', 'RPデータの永続化・クエリ提供', 'PostgreSQL / PostgREST REST API'],
              ['Vercel', 'ホスティング', 'SPAとAPIのデプロイ・実行・CDN配信', 'Vercel Edge Network']
            ]
          }
        },
        {
          label: '画面遷移図',
          content: '本システムはSPA構成のためURLは変わらず、タブ操作でコンテンツを切り替える。',
          diagram: {
            type: 'flow-h',
            nodes: [
              { label: 'Analysis', sublabel: '（初期表示）', description: 'RP推移グラフ', color: 'blue' },
              { label: 'Data Table', sublabel: '', description: 'レコード一覧', color: 'blue' },
              { label: 'Daily', sublabel: '', description: '日次集計', color: 'blue' },
              { label: '設計書', sublabel: '', description: '本文書', color: 'gray' }
            ]
          },
          subItems: [
            '全タブ間は双方向に遷移可能（←→）',
            'ヘッダーの「設計書を見る」ボタンから設計書タブへ直接遷移',
            'タブ切替時はAPIを再呼び出しせず、ロード済みの records を参照',
            'データ未取得（loading中）でも設計書タブは表示可能'
          ]
        },
        {
          label: 'ワイヤーフレーム（画面レイアウト）',
          content: 'Analysisタブ表示時の画面構成をASCIIアートで示す。',
          code: `┌─────────────────────────────────────────────────────────────┐
│  ▌ Apex RP Analysis              [設計書を見る ▶]           │ ← ヘッダー
│    ぺこんぽのRP推移 — 過去30日分を追跡します                   │
├─────────────────────────────────────────────────────────────┤
│  表示期間: [7日] [30日▼]    [⟳ 最新データに更新]  [↓ CSV]   │ ← コントロール
├──────────┬──────────┬──────────┬──────────┬───────────────┤
│  最新RP  │  最高RP  │  最低RP  │ 期間変化 │   平均RP/日   │ ← 統計カード
│  14,250  │  14,500  │  13,800  │   +450   │      +65      │
│ DiamondⅢ │          │          │          │               │
├──────────┴──────────┴──────────┴──────────┴───────────────┤
│  [Analysis ▼]  [Data Table]  [Daily]  [設計書]              │ ← タブ
├─────────────────────────────────────────────────────────────┤
│  RP推移（過去30日）                              300 レコード │
│                                                              │
│  14,500 ─────────────────────/‾‾\──────────────────────   │
│  14,250 ────────────────────/    \──────/‾‾‾‾‾\───────   │ ← グラフ
│  14,000 ─────────/‾‾‾‾‾‾‾‾/      ────/         \─────   │
│  13,800 ────────/                                  ───   │
│          2/7   2/14   2/21   2/28   3/7                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘`
        },
        {
          label: '帳票・出力設計（CSVエクスポート）',
          content: 'CSVダウンロード機能の出力仕様を定義する。',
          subItems: [
            'ファイル名: apex-rp-{N}days.csv（N = 選択中の期間日数: 7 または 30）',
            '文字エンコーディング: UTF-8（BOMなし）',
            'フォーマット: RFC4180準拠（カンマ区切り・ダブルクォート囲み・ヘッダー行あり）',
            '出力列: id（整数）/ rp（整数）/ created_at（ISO 8601形式文字列）',
            'ソート順: created_at 昇順（グラフと同一順序）',
            'ダウンロード方式: Blob URL + アンカータグ click()によるブラウザダウンロード'
          ],
          code: `# CSVサンプル出力 (apex-rp-30days.csv)
"id","rp","created_at"
"1001","14250","2026-02-07T08:30:00.000Z"
"1002","14300","2026-02-07T12:15:00.000Z"
"1003","14180","2026-02-07T20:45:00.000Z"
...`
        },
        {
          label: '外部インターフェース設計（API仕様）',
          content: 'フロントエンドとサーバーレスAPIの通信インターフェースを定義する。',
          table: {
            headers: ['項目', '仕様'],
            rows: [
              ['エンドポイント', 'GET /api/get-rp'],
              ['クエリパラメータ', 'days: "7" または "30"（省略・不正値は "30" にフォールバック）'],
              ['リクエストヘッダー', 'Authorization: Basic {base64} （Basic認証設定時のみ必須）'],
              ['レスポンス形式', 'JSON配列: [{id: number, rp: number, created_at: string}, ...]（created_at 昇順）'],
              ['エラーレスポンス形式', 'JSON: {error: string}（各種HTTPステータスコード付き）'],
              ['タイムアウト', 'Vercel Function のデフォルトタイムアウト（10秒）に依存']
            ]
          },
          code: `// リクエスト例
GET /api/get-rp?days=7
Authorization: Basic dXNlcjpwYXNz  ← 任意（Basic認証設定時のみ）

// 正常レスポンス例 (HTTP 200)
[
  { "id": 1001, "rp": 14250, "created_at": "2026-03-01T08:30:00.000Z" },
  { "id": 1002, "rp": 14300, "created_at": "2026-03-01T12:15:00.000Z" }
]

// エラーレスポンス例 (HTTP 429)
{ "error": "Too many requests. Please try again later." }

// エラーレスポンス例 (HTTP 500)
{ "error": "Supabase error: ..." }`
        },
        {
          label: 'データモデル（論理設計・ER図）',
          content: '本システムが参照するデータモデルを論理設計レベルで定義する。現行は1テーブル構成。',
          code: `╔══════════════════════════════════════╗
║          player_rp                   ║
╠══════════════════════════════════════╣
║ PK  id          INTEGER  NOT NULL    ║
║     rp          INTEGER  NOT NULL    ║
║     created_at  TIMESTAMPTZ NOT NULL ║
╚══════════════════════════════════════╝

外部キー    : なし（スタンドアロン1テーブル構成）
データ書込み: 外部スクレイピングシステムが INSERT
データ読取り: 本システムが SELECT のみ実行（更新・削除なし）
INDEX推奨   : created_at（範囲クエリ gte に使用）`
        },
        {
          label: 'セキュリティ設計（画面・API別のアクセス権限）',
          content: '画面・API単位のアクセス制御設計を定義する。',
          table: {
            headers: ['対象', '機能', '制御方式', '設定値', '未設定時の挙動'],
            rows: [
              ['API全体', 'CORS制限', 'Access-Control-Allow-Origin ヘッダー', 'ALLOWED_ORIGIN 環境変数', '* （全オリジン許可）'],
              ['API全体', 'Basic認証', 'Authorization ヘッダー検証', 'BASIC_AUTH_USER / BASIC_AUTH_PASS', '認証スキップ（全員アクセス可）'],
              ['API全体', 'レート制限', 'IPアドレス別スライディングウィンドウ', '60リクエスト/分/IP', '常時有効（設定不要）'],
              ['APIリクエスト', 'パラメータ検証', 'daysクエリの許可値チェック', '7 または 30 のみ許可', '不正値は 30 にフォールバック'],
              ['フロントエンド', 'ページ認証', 'なし（URLを知れば誰でもアクセス可）', '—', 'Basic認証でAPI保護を推奨']
            ]
          }
        }
      ]
    },

    // ============================================================
    // 3. 詳細設計書
    // ============================================================
    {
      id: 'detailed-design',
      title: '3. 詳細設計書',
      order: 3,
      items: [
        {
          label: 'シーケンス図（初期表示・期間変更）',
          content: '主要な操作シナリオにおけるコンポーネント間のメッセージ交換を定義する。',
          code: `=== シーケンス①: 初期表示（ページロード時） ===

Browser         Angular SPA       api/get-rp.js      Supabase
   │                 │                  │                 │
   │── URLアクセス ──→│                  │                 │
   │                 │── ngOnInit()     │                 │
   │                 │── loadRecords(false)               │
   │                 │── GET /api/get-rp?days=30 ────────→│
   │                 │                  │── CORS検証       │
   │                 │                  │── Basic認証チェック│
   │                 │                  │── レート制限確認  │
   │                 │                  │── days=30検証    │
   │                 │                  │── SELECT player_rp WHERE created_at >= '30日前' ──→│
   │                 │                  │←── [{id,rp,created_at},...] ──────────────────────│
   │                 │←── HTTP 200 JSON─│                 │
   │                 │── records更新    │                 │
   │                 │── グラフデータ生成│                 │
   │                 │── 統計カード算出  │                 │
   │                 │── ランク判定     │                 │
   │                 │── 日次集計       │                 │
   │←── UI表示完了 ──│                  │                 │

=== シーケンス②: 期間変更（7日ボタンクリック） ===

   │── [7日]クリック─→│                  │                 │
   │                 │── onRangeChange(7)│                 │
   │                 │── selectedRange=7 │                 │
   │                 │── GET /api/get-rp?days=7 ─────────→│
   │                 │              (以降 ①と同様)         │
   │←── グラフ更新 ──│                  │                 │`
        },
        {
          label: 'フロントエンド コンポーネント構成',
          content: 'Angularコンポーネントの親子関係と責務を定義する。',
          code: `AppComponent  (src/app/app.component.ts)
 ├── 状態管理: records / selectedRange / activeTab / loading / error
 ├── API通信: HttpClient → GET /api/get-rp
 ├── 統計算出: latestRp / maxRp / minRp / rpChange / rpPerDay ゲッター
 ├── ランク判定: getRankInfo(rp) → RANK_THRESHOLDS テーブル参照
 ├── 日次集計: dailySummary ゲッター → created_at で日付グループ化
 ├── グラフ: Chart.js (ng2-charts) lineChartData / lineChartOptions
 │
 └── DesignDocComponent  (src/app/components/design-doc/)
      ├── design-doc.component.ts   → 設計書データ定義・セクション選択
      ├── design-doc.component.html → テーブル/箇条書き/図解 レンダリング
      └── design-doc-section.interface.ts → 型定義`
        },
        {
          label: '関数・メソッド仕様',
          content: 'AppComponent の全関数・ゲッターの入出力・処理・例外処理を定義する。',
          table: {
            headers: ['関数名', '引数', '戻り値', '処理概要', '例外処理'],
            rows: [
              ['ngOnInit()', 'なし', 'void', 'コンポーネント初期化。loadRecords()を呼び出し初期データを取得', 'なし（loadRecordsで処理）'],
              ['loadRecords(isRefresh)', 'isRefresh: boolean', 'void', 'APIからRPデータ取得・グラフ更新。isRefresh=trueは更新インジケータ使用', 'エラー時はthis.errorに日本語メッセージをセット'],
              ['onRangeChange(days)', 'days: RangeOption', 'void', '選択期間が変更された場合のみselectedRangeを更新しloadRecords()を実行', '同一値の場合は処理中断（APIリクエスト不要）'],
              ['refresh()', 'なし', 'void', 'isRefresh=trueでloadRecords()を呼び出し最新データを再取得', 'loadRecordsに委譲'],
              ['downloadCsv()', 'なし', 'void', 'recordsをRFC4180形式CSVに変換してBlobダウンロード', 'records=[]の場合は処理中断（ダウンロード不実行）'],
              ['getRankInfo(rp)', 'rp: number', 'RankInfo', 'RP値をRANK_THRESHOLDSと照合しランク名・ティア・カラークラスを返す', 'マッチしない場合は末尾（Rookie）を返す'],
              ['latestRp (getter)', 'なし', 'number | null', 'records末尾のRP値', 'records=[]の場合はnull'],
              ['maxRp (getter)', 'なし', 'number | null', 'records全件のRP最大値', 'records=[]の場合はnull'],
              ['minRp (getter)', 'なし', 'number | null', 'records全件のRP最小値', 'records=[]の場合はnull'],
              ['rpChange (getter)', 'なし', 'number | null', '最古と最新のRP差分（増減量）', 'records < 2件の場合はnull'],
              ['rpPerDay (getter)', 'なし', 'number | null', 'RP変化量 ÷ 日数差で平均RP/日を算出（小数点切捨て）', '2件未満または日数差 ≦ 0の場合はnull'],
              ['dailySummary (getter)', 'なし', 'DailySummary[]', 'recordsをJST日付でグループ化し日別の最高/最低RP・変化量を集計、日付昇順で返す', 'records=[]の場合は空配列'],
              ['rankLabel (getter)', 'なし', 'string', '最新RPのランク文字列（例: "Diamond IV"）を返す', 'latestRp=nullの場合は "—"'],
              ['rankColorClass (getter)', 'なし', 'string', '最新RPに対応するTailwindバッジカラークラスを返す', 'latestRp=nullの場合はグレー系クラス']
            ]
          }
        },
        {
          label: 'DBテーブル物理設計（player_rp）',
          content: 'Supabase上のplayer_rpテーブルの物理的なカラム定義・制約・インデックス設計を示す。',
          table: {
            headers: ['カラム名', 'データ型', 'NULL', 'デフォルト値', '制約', 'インデックス', '備考'],
            rows: [
              ['id', 'INTEGER', 'NOT NULL', 'SEQUENCE自動採番', 'PRIMARY KEY', 'PK（自動）', '連番。外部スクレイピングで自動発番'],
              ['rp', 'INTEGER', 'NOT NULL', 'なし', 'CHECK(rp >= 0) 推奨', 'なし', 'ランクポイント値。0以上の整数'],
              ['created_at', 'TIMESTAMP WITH TIME ZONE', 'NOT NULL', 'now()', 'なし', 'B-Tree推奨（範囲クエリ使用）', 'UTC保存。APIで gte クエリに使用。件数増加時にインデックス追加推奨']
            ]
          }
        },
        {
          label: 'ランク判定ロジック（RANK_THRESHOLDS）',
          content: 'getRankInfo()が参照するApexランク閾値テーブル。Diamond以上はユーザー提供情報（確認済み）。下位ランクは一般仕様に基づく近似値。',
          table: {
            headers: ['RP（以上）', 'RP（未満）', 'ランク', 'ティア', 'バッジカラー', '確認状況'],
            rows: [
              ['16000', '—', 'Master', '—', 'パープル', '確認済み'],
              ['15000', '16000', 'Diamond', 'I', 'シアン/ブルー', '確認済み'],
              ['14000', '15000', 'Diamond', 'II', 'シアン/ブルー', '確認済み'],
              ['13000', '14000', 'Diamond', 'III', 'シアン/ブルー', '確認済み'],
              ['12000', '13000', 'Diamond', 'IV', 'シアン/ブルー', '確認済み'],
              ['11000', '12000', 'Platinum', 'I', 'ティール', '近似値'],
              ['10000', '11000', 'Platinum', 'II', 'ティール', '近似値'],
              ['9000', '10000', 'Platinum', 'III', 'ティール', '近似値'],
              ['8000', '9000', 'Platinum', 'IV', 'ティール', '近似値'],
              ['7000', '8000', 'Gold', 'I', 'イエロー', '近似値'],
              ['6000', '7000', 'Gold', 'II', 'イエロー', '近似値'],
              ['5000', '6000', 'Gold', 'III', 'イエロー', '近似値'],
              ['4000', '5000', 'Gold', 'IV', 'イエロー', '近似値'],
              ['3000', '4000', 'Silver', 'I', 'スレート', '近似値'],
              ['2500', '3000', 'Silver', 'II', 'スレート', '近似値'],
              ['2000', '2500', 'Silver', 'III', 'スレート', '近似値'],
              ['1500', '2000', 'Silver', 'IV', 'スレート', '近似値'],
              ['1000', '1500', 'Bronze', 'I', 'オレンジ', '近似値'],
              ['750', '1000', 'Bronze', 'II', 'オレンジ', '近似値'],
              ['500', '750', 'Bronze', 'III', 'オレンジ', '近似値'],
              ['250', '500', 'Bronze', 'IV', 'オレンジ', '近似値'],
              ['0', '250', 'Rookie', '—', 'グレー', '近似値']
            ]
          },
          note: 'Diamond以上（12000〜）の閾値はユーザー確認済み。下位ランクは一般的なApex仕様に基づく近似値のため、シーズン変更や実際の閾値と異なる場合は定数 RANK_THRESHOLDS を更新すること。'
        },
        {
          label: '例外処理・エラーハンドリング一覧',
          content: 'APIとフロントエンドの両層で発生するエラーの処理方針を定義する。',
          table: {
            headers: ['レイヤー', 'HTTPステータス', '発生条件', 'ログレベル', 'ユーザーへの表示', 'リトライ方針'],
            rows: [
              ['API', '204', 'OPTIONSプリフライト', 'なし', '表示なし', '—'],
              ['API', '401', 'Basic認証失敗・未提供', 'なし', 'エラーメッセージ（認証エラー）', 'ブラウザの認証ダイアログで再入力'],
              ['API', '405', 'GET以外のHTTPメソッド', 'なし', '表示なし（正常利用では発生しない）', '—'],
              ['API', '429', 'レート制限超過（60req/分）', 'WARN: clientIp', '「時間をおいて再試行してください」', '1分待ってから手動更新ボタン'],
              ['API', '500', '環境変数SUPABASE_URL/KEY未設定', 'ERROR: missing env vars', '「設定エラーです。管理者に連絡してください」', 'Vercel環境変数を設定後再デプロイ'],
              ['API', '500', 'Supabase REST APIエラー', 'ERROR: status + body', '「データ取得エラー。時間をおいて再試行」', '少し待ってから手動更新'],
              ['API', '500', 'fetchネットワーク例外', 'ERROR: message', '「接続エラー。ネットワークを確認してください」', 'ネットワーク確認後に手動更新'],
              ['Frontend', '—', 'API 4xx/5xx返却', '—', 'err.error.error または err.message を画面表示', 'ユーザーが手動更新ボタンで再試行']
            ]
          }
        },
        {
          label: 'ライブラリ・フレームワーク構成',
          content: '本システムで使用するライブラリとバージョンの一覧。package.jsonの依存関係に基づく。',
          table: {
            headers: ['ライブラリ / フレームワーク', 'バージョン', '用途', '備考'],
            rows: [
              ['Angular', '17.3.x', 'SPAフレームワーク（Standalone Components）', 'コンポーネント単位でモジュール不要'],
              ['TypeScript', '5.4.5', '型安全な開発', 'strict mode有効・ES2022ターゲット'],
              ['Tailwind CSS', '3.4.3', 'ユーティリティCSSフレームワーク', 'JITコンパイル・カスタムトークン未使用'],
              ['Chart.js', '4.4.2', 'グラフ描画エンジン（折れ線グラフ）', 'Tree-shakingで必要なChartコンポーネントのみ登録'],
              ['ng2-charts', '5.0.4', 'AngularのChart.jsラッパー', 'BaseChartDirectiveをStandalone Importで使用'],
              ['RxJS', '7.8.1', '非同期処理（HttpClientのObservable）', 'subscribe()でデータ受信'],
              ['Node.js', '18.x', 'Vercel Serverless関数の実行環境', 'CommonJS形式（require/module.exports）'],
              ['@vercel/node', '5.6.10', 'Vercel Function型定義', 'TypeScript開発時の補完用'],
              ['PostCSS + Autoprefixer', '8.4 / 10.4', 'TailwindのCSSビルドツール', 'Angular CLIのビルドパイプライン内で自動実行']
            ]
          }
        },
        {
          label: '環境変数定義',
          content: 'Vercelダッシュボードに設定が必要な環境変数の一覧。',
          table: {
            headers: ['変数名', '必須/任意', '説明', '設定例'],
            rows: [
              ['SUPABASE_URL', '必須', 'SupabaseプロジェクトのベースURL', 'https://abcxyz.supabase.co'],
              ['SUPABASE_SERVICE_ROLE_KEY', '必須', 'Supabaseのサービスロール用JWTキー（管理者権限）', 'eyJhbGciOiJIUzI1NiIsInR5...'],
              ['ALLOWED_ORIGIN', '任意', 'CORS許可オリジン（未設定は * で全許可）', 'https://apex-app.vercel.app'],
              ['BASIC_AUTH_USER', '任意', 'Basic認証ユーザー名（PASSとペア設定）', 'pekonpo'],
              ['BASIC_AUTH_PASS', '任意', 'Basic認証パスワード（USERとペア設定）', 'securepassword']
            ]
          }
        }
      ]
    },

    // ============================================================
    // 4. テスト仕様書
    // ============================================================
    {
      id: 'testing',
      title: '4. テスト仕様書',
      order: 4,
      items: [
        {
          label: 'テストレベル概要',
          content: '実施するテストのレベルと各フェーズにおける主な観点を示す。',
          table: {
            headers: ['テストレベル', '略称', '主な観点', '実施タイミング'],
            rows: [
              ['単体テスト', 'UT', 'クラス・関数のロジックが仕様通りか（正常系・異常系・境界値）', 'コード実装後、各関数単位'],
              ['統合テスト', 'IT', '画面→API→DBの連携が正しいか（データ整合性・エラー伝播）', 'UI実装完了後'],
              ['システムテスト', 'ST', 'ユーザーシナリオ通りに業務が完結するか（ビルド・デプロイ・性能）', 'デプロイ後の本番/ステージング環境']
            ]
          }
        },
        {
          label: '単体テスト仕様（UT）',
          content: '関数・ゲッター単位のテストケース。操作手順・期待値・合否を記録する。',
          table: {
            headers: ['ID', '機能名', 'テスト内容', '操作手順', '期待値', '結果', '備考'],
            rows: [
              ['UT-001', 'onRangeChange', '同一期間値を再選択', '現在30日選択中に[30日]ボタンをクリック', 'API未呼び出し。selectedRange変更なし', '—', '無駄なAPIリクエスト防止'],
              ['UT-002', 'onRangeChange', '異なる期間へ切替', '[7日]ボタンをクリック（30日選択中）', 'selectedRange=7に更新。loadRecords()実行', '—', ''],
              ['UT-003', 'downloadCsv', 'データ0件時', 'records=[]の状態でCSVボタンクリック', 'ダウンロード処理が実行されない（Blob作成なし）', '—', 'ボタンはdisabledのため通常発生しない'],
              ['UT-004', 'downloadCsv', '正常データ3件', 'records=[{id:1,rp:100,...}×3]でCSVボタンクリック', 'ヘッダー行+3行のCSVが生成・ダウンロード開始', '—', 'RFC4180形式確認'],
              ['UT-005', 'latestRp', 'records空配列', 'records=[]', 'null を返す', '—', ''],
              ['UT-006', 'latestRp', '複数レコードあり', 'records=[{rp:100},{rp:200},{rp:150}]', '150 を返す（末尾の値）', '—', '末尾=最新'],
              ['UT-007', 'rpChange', 'records=1件', 'records=[{rp:14250}]', 'null を返す（差分計算不可）', '—', ''],
              ['UT-008', 'rpChange', 'records=2件', 'records=[{rp:14000},{rp:14500}]', '+500 を返す', '—', ''],
              ['UT-009', 'rpPerDay', 'records=1件', 'records=[{rp:14250,created_at:今日}]', 'null を返す（日数差算出不可）', '—', ''],
              ['UT-010', 'rpPerDay', '7日で+700RP', '7日前と現在で+700RPの2件', '+100（700÷7）を返す', '—', '小数点切捨て'],
              ['UT-011', 'getRankInfo', 'Diamond IV閾値', 'rp=12000', 'name="Diamond", tier="IV"', '—', 'ユーザー確認済み値'],
              ['UT-012', 'getRankInfo', 'Master閾値', 'rp=16000', 'name="Master", tier=""', '—', 'ユーザー確認済み値'],
              ['UT-013', 'dailySummary', '同日2レコード', 'JST同一日付に2レコード（rp:100, rp:200）', '1エントリ: max=200, min=100, change=+100', '—', '日付はJST基準'],
              ['UT-014', 'days検証(API)', 'days=90を送信', 'GET /api/get-rp?days=90', '30にフォールバックして処理。ログなし', '—', '90日廃止のため'],
              ['UT-015', 'days検証(API)', 'days=abcを送信', 'GET /api/get-rp?days=abc', '30にフォールバックして処理', '—', ''],
              ['UT-016', 'レート制限(API)', '61回連続リクエスト', '同一IPから61回GETリクエスト', '61回目に HTTP 429 を返却', '—', 'Vercel Functionはコールドスタートでカウントがリセットされる場合あり']
            ]
          }
        },
        {
          label: '統合テスト仕様（IT）',
          content: '画面・API・DB間の連携動作を検証するテストケース。',
          table: {
            headers: ['ID', '機能名', 'テスト内容', '操作手順', '期待値', '結果', '備考'],
            rows: [
              ['IT-001', '初期表示', 'ページロード時のデータ取得', '1. URLにアクセス', 'グラフ・統計5カード・ランクバッジが表示される', '—', ''],
              ['IT-002', '期間切替', '7日→30日切替でデータ更新', '1. [30日]選択中に[7日]をクリック', 'APIを再呼び出し・グラフデータが更新される（件数が減少）', '—', ''],
              ['IT-003', '手動更新', '更新ボタンの動作確認', '1. [最新データに更新]ボタンをクリック', '"更新中..."表示後、最新データが反映される', '—', ''],
              ['IT-004', 'CSV出力', 'ダウンロードと内容確認', '1. [CSVダウンロード]ボタンをクリック\n2. ダウンロードファイルを開く', 'ファイルがダウンロードされ内容がrecordsと一致', '—', 'ファイル名・ヘッダー行も確認'],
              ['IT-005', 'API異常時', 'エラーメッセージの表示', '1. SUPABASE_URL を無効値に変更してデプロイ\n2. ページをリロード', 'エラーメッセージがUI上に表示・グラフ非表示', '—', 'テスト後は元に戻すこと'],
              ['IT-006', 'Data Tableタブ', 'レコード一覧とランク表示', '1. [Data Table]タブをクリック', 'records全件が表示・各行にランクバッジ表示', '—', 'ランク表示が正確か確認'],
              ['IT-007', 'Dailyタブ', '日次集計の正確性確認', '1. [Daily]タブをクリック', '日次集計テーブルが表示・最高/最低RP/変化量/最終ランクが正確', '—', ''],
              ['IT-008', '設計書タブ', '全セクション表示確認', '1. [設計書]タブをクリック\n2. 全5セクションのボタンを順にクリック', '各セクション・テーブル・図解・コードブロックが正常に表示される', '—', '']
            ]
          }
        },
        {
          label: 'システムテスト仕様（ST）',
          content: 'デプロイ済み環境でのシステム全体の動作・品質を検証するテストケース。',
          table: {
            headers: ['ID', 'テストシナリオ', '操作手順', '合格基準', '結果', '備考'],
            rows: [
              ['ST-001', 'ビルド正常性', '1. npx ng build を実行', 'エラー・警告なしで完了。dist/以下に成果物生成', '—', 'TypeScript型エラーも合否対象'],
              ['ST-002', 'Vercelデプロイ', '1. git push → Vercel自動デプロイ', 'Vercel Preview/Production デプロイが成功。ビルドログにエラーなし', '—', ''],
              ['ST-003', 'レスポンス性能', '1. 本番URLでページを開く\n2. ブラウザDevTools Networkタブで計測', 'APIレスポンスが通常2秒以内', '—', 'Supabaseコールドスタート時は超過する場合あり'],
              ['ST-004', 'ブラウザ互換性', '1. Chrome/Safari/Firefox 最新版で動作確認\n2. スマートフォンでも確認', '全ブラウザで表示崩れ・JS エラーなし', '—', 'スマートフォンは横スクロール発生するが許容'],
              ['ST-005', 'セキュリティ動作確認', '1. curlでCORS確認\n2. 61回連続リクエストで429確認\n3. 認証設定時に不正パスワードで401確認', 'CORS/レート制限/Basic認証が設定通りに機能', '—', 'BASIC_AUTH設定時のみ401確認が必要']
            ]
          }
        },
        {
          label: '異常系シナリオ',
          content: '業務上発生しうる異常ケースの入力・条件とシステムの期待挙動を定義する。',
          table: {
            headers: ['シナリオID', '異常条件', '操作内容', '期待挙動', 'エラーコード', '回復方法'],
            rows: [
              ['ERR-001', '不正なdaysパラメータ', 'GET /api/get-rp?days=abc を直接呼び出し', '30にフォールバックして正常処理', 'HTTP 200（エラーなし）', '不要（自動フォールバック）'],
              ['ERR-002', 'ネットワーク遮断', 'APIリクエスト中にオフライン状態', 'フロントエンドにエラーメッセージ表示', 'ネットワークエラー（HTTP応答なし）', 'ネットワーク回復後に手動更新'],
              ['ERR-003', 'Supabase障害', 'Supabase REST APIが503返却', 'フロントエンドに「データ取得エラー」を表示', 'HTTP 500（Supabase error）', '少し待ってから手動更新'],
              ['ERR-004', 'レート制限超過', '60req/分を超えるリクエスト', 'APIが429返却・フロントエンドにエラー表示', 'HTTP 429', '1分後に手動更新ボタンで再試行'],
              ['ERR-005', '環境変数未設定', 'SUPABASE_URLまたはKEYが未設定でデプロイ', 'APIが500返却・「設定エラー」をUI表示', 'HTTP 500（Missing env vars）', 'Vercel環境変数を設定して再デプロイ'],
              ['ERR-006', '0件データ', '指定期間内にデータが存在しない', '「この期間のデータはまだありません」を表示', 'HTTP 200（空配列）', 'スクレイピングシステムの動作確認・日付を遡って確認'],
              ['ERR-007', 'Basic認証失敗', 'ブラウザの認証ダイアログで誤入力', 'APIが401返却・ブラウザが再入力を促す', 'HTTP 401', '正しい認証情報を入力']
            ]
          }
        },
        {
          label: 'テスト環境・証跡管理',
          content: 'テスト実施に必要な環境情報と証跡の保管ルールを定義する。',
          table: {
            headers: ['項目', '値'],
            rows: [
              ['フロントエンドテスト環境', 'ローカル（ng serve） または Vercel Preview URL'],
              ['APIテスト環境', 'ローカル（vercel dev） または Vercel Preview Functions'],
              ['テストデータ', 'Supabase player_rp テーブルの実データ（直近30日分）'],
              ['テストツール', 'ブラウザ DevTools / curl / docs/evidence/api-smoke-test.js'],
              ['証跡保管先', 'docs/evidence/ ディレクトリ（.gitignoreで追跡対象外）'],
              ['証跡命名規則', '{YYYY-MM-DD}-{テストID}-{pass|fail}.txt（例: 2026-03-07-ST-001-pass.txt）'],
              ['証跡提出先', 'PR本文またはIssueコメントに添付して記録']
            ]
          }
        }
      ]
    },

    // ============================================================
    // 5. 将来対応機能
    // ============================================================
    {
      id: 'future',
      title: '5. 将来対応機能',
      order: 5,
      items: [
        {
          label: '将来実装候補一覧',
          content: '現在の実装スコープには含まないが、ぺこんぽのRP分析において有用性が高い機能の候補一覧。優先度は実装コストとニーズを総合評価。',
          table: {
            headers: ['機能名', '概要', '優先度', '実装コスト', '依存変更'],
            rows: [
              ['目標RPライン', 'グラフに目標RP水平線を追加。入力欄で目標値を設定し「あと何RP」を視覚化', '高', '低（フロントのみ）', 'なし'],
              ['PWA対応', 'スマートフォンにアプリとしてインストール可能。Service Worker でオフラインキャッシュ', '中', '中', 'angular.json 設定追加'],
              ['ダークモード', 'Tailwind CSS の dark mode によるUI切替機能', '低', '中', 'Tailwind dark mode 設定'],
              ['グラフ画像保存', 'Canvas API を使いグラフをPNG形式でダウンロード', '低', '低（フロントのみ）', 'なし'],
              ['複数プレイヤー対応', 'player_rp テーブルに player_id カラムを追加し複数プレイヤーのRP管理', '低', '高', 'DBスキーマ変更 + Supabase Migration']
            ]
          }
        },
        {
          label: 'アーキテクチャ拡張方針',
          content: '将来の機能追加・規模拡大に備えた設計上の指針を示す。',
          subItems: [
            'DBスキーマ変更が必要な機能（複数プレイヤー等）はSupabase Migrationで管理する',
            '新しいAPIエンドポイントはapi/ディレクトリ配下にファイルを追加（Vercelのファイルベースルーティング）',
            '複雑な状態管理が必要になった場合はAngular Signals / NgRx Signalを検討する',
            '認証強化が必要な場合はSupabase Auth / Vercel Authの導入を検討する',
            'ランク閾値テーブル（RANK_THRESHOLDS）はシーズン変更時に定数を更新する'
          ]
        },
        {
          label: '廃止・見送り経緯',
          content: '過去に検討したが対応しないと判断した機能の経緯を記録する。',
          subItems: [
            '90日表示オプション: Supabaseのスクレイピング仕様上、30日分のみ蓄積されるため廃止（本バージョンで除去済み）',
            'アラート/プッシュ通知: 個人利用のため複雑性に対してメリットが少ないと判断し見送り',
            'リアルタイム自動更新（WebSocket）: ポーリングで十分かつシンプルな手動更新で代替'
          ]
        }
      ]
    }
  ];

  selectSection(sectionId: 'requirements' | 'basic-design' | 'detailed-design' | 'testing' | 'future'): void {
    this.selectedSectionId = sectionId;
  }

  get selectedSection(): DesignDocSection | undefined {
    return this.sections.find(s => s.id === this.selectedSectionId);
  }

  getDiagramNodeClass(color: DesignDocDiagramNode['color']): string {
    const map: Record<DesignDocDiagramNode['color'], string> = {
      blue: 'border-blue-400 bg-blue-50 text-blue-900',
      gray: 'border-gray-400 bg-gray-100 text-gray-800',
      teal: 'border-teal-400 bg-teal-50 text-teal-900',
      purple: 'border-purple-400 bg-purple-50 text-purple-900',
      green: 'border-green-400 bg-green-50 text-green-900',
      orange: 'border-orange-400 bg-orange-50 text-orange-900',
      red: 'border-red-400 bg-red-50 text-red-900'
    };
    return map[color] ?? 'border-gray-400 bg-gray-100 text-gray-800';
  }
}
