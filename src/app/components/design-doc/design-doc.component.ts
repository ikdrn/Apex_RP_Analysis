import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignDocSection } from './design-doc-section.interface';

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
          label: '背景・目的',
          content:
            '本システムはApex Legends（FPS）のランクマッチで記録されるRP（Ranking Points）推移を可視化するWebアプリケーションである。' +
            'apexstatus等の既存サービスはリアルタイムのRP表示に特化しており、過去のRP履歴を日付を遡って確認する機能を持たない。' +
            '本システムでは、Supabaseに自動蓄積された直近30日分のRPデータをグラフ・テーブル・CSV形式で閲覧できる環境を提供し、' +
            'プレイヤーの成長把握・課題分析・ランク攻略の支援を目的とする。'
        },
        {
          label: 'ステークホルダー',
          content: '本システムに関わる関係者を以下に整理する。',
          subItems: [
            'プレイヤー（主利用者）: RP推移の確認・分析・成長把握を行う利用者',
            '開発者: システムの設計・実装・保守・機能追加を担当',
            'Supabase: RPデータを永続化するBaaS（PostgreSQL）。スクレイピングシステムが自動蓄積',
            'Vercel: フロントエンドSPAとサーバーレスAPIのホスティング・実行環境を提供',
            '外部スクレイピングシステム: RPデータをゲームから取得しSupabaseに書き込む（本システム対象外）'
          ]
        },
        {
          label: 'スコープ定義',
          content: '本システムの対象範囲と対象外を明確に定義する。',
          subItems: [
            '[対象内] RPデータの可視化（折れ線グラフ・統計カード・ランク表示）',
            '[対象内] 期間フィルタ（7日 / 30日）によるデータ絞り込み',
            '[対象内] 日次集計ビュー（日別の最高/最低RP・変化量）',
            '[対象内] CSV出力（id / rp / created_at）',
            '[対象内] APIサーバー（Supabase中継・CORS・Basic認証・レート制限）',
            '[対象外] データ収集・スクレイピング（外部システムが担当）',
            '[対象外] ユーザー登録・認証管理（個人利用のためBasic認証で代替）',
            '[対象外] プッシュ通知・アラート機能',
            '[対象外] 複数プレイヤーの同時管理（現行DBは1プレイヤー想定）'
          ]
        },
        {
          label: '業務フロー',
          content: '現状（As-Is）の課題と本システム導入後（To-Be）の改善を示す。',
          subItems: [
            '[As-Is] ゲームクライアントを起動してランク画面を手動確認。過去の記録を遡れない',
            '[As-Is] apexstatus等のサービスでリアルタイムRP確認は可能だが30日履歴は持たない',
            '[To-Be] ブラウザでURLにアクセスし、期間ボタン（7日/30日）を選択',
            '[To-Be] グラフ・統計カード（最新RP/最高/最低/期間変化/ランク/平均RP日）で即座に状況把握',
            '[To-Be] 詳細分析が必要な場合はCSVをダウンロードしてスプレッドシートで活用'
          ]
        },
        {
          label: '機能要件',
          content: '以下の機能要件を実装する。優先度は必須/推奨で区分する。',
          table: {
            headers: ['要件ID', '要件名', '概要', '優先度'],
            rows: [
              ['FRQ-001', 'RPグラフ表示', '期間内RP推移を折れ線グラフで表示（X軸:日時 / Y軸:RP値）', '必須'],
              ['FRQ-002', '期間切替', '7日/30日のボタンで表示データ範囲を動的に切替', '必須'],
              ['FRQ-003', '統計カード表示', '最新RP・最高RP・最低RP・期間変化量を4カードで表示', '必須'],
              ['FRQ-004', 'ランク自動表示', '最新RPからApexランク帯を自動判定しバッジで表示', '必須'],
              ['FRQ-005', 'RP速度カード', '直近データから平均RP/日を算出し統計カードに表示', '必須'],
              ['FRQ-006', '日次集計ビュー', '1日ごとの最高/最低RP・変化量を集計したテーブル表示', '必須'],
              ['FRQ-007', 'データ一覧表示', '全RPレコードを日時順で表示するテーブルビュー', '必須'],
              ['FRQ-008', '手動データ更新', 'ボタン操作で最新データをAPIから再取得', '必須'],
              ['FRQ-009', 'CSVダウンロード', '表示中データをRFC4180準拠のCSVファイルとして保存', '必須'],
              ['FRQ-010', 'エラー表示', 'API失敗時に原因メッセージと再試行方法を画面表示', '必須'],
              ['FRQ-011', '設計書閲覧', 'システム設計書をアプリ内タブで閲覧可能', '推奨']
            ]
          }
        },
        {
          label: '非機能要件',
          content: 'システムとして満たすべき品質・運用要件を定義する。',
          table: {
            headers: ['要件ID', '項目', '要件値', '根拠'],
            rows: [
              ['NFR-001', 'レスポンス時間', 'APIレスポンス通常2秒以内', 'UXの最低基準'],
              ['NFR-002', '可用性', 'Vercel SLAに依存（99.9%目標）', '個人利用のためVercel管理域を許容'],
              ['NFR-003', 'セキュリティ', 'CORS制限・任意Basic認証・60req/分レート制限', '不正利用・過負荷防止'],
              ['NFR-004', 'ブラウザ対応', 'Chrome / Safari / Firefox 最新版', '主要ブラウザ対応'],
              ['NFR-005', 'データ保持期間', 'Supabaseの保持データに依存（最大30日分）', 'スクレイピング仕様に準拠']
            ]
          }
        },
        {
          label: '制約・前提条件',
          content: '本システムを構築・運用する上での制約と前提を以下に示す。',
          subItems: [
            'Supabaseのスクレイピングデータは直近30日分のみ保持（90日取得は対象外）',
            'Vercel Serverless FunctionはNode.js環境（CommonJS）で動作',
            '商用利用は想定しない（個人・チーム内利用）',
            'RPデータの書き込みは外部スクレイピングシステムが担当し、本システムの変更範囲外',
            'Supabaseのplayer_rpテーブルスキーマは変更しない'
          ]
        },
        {
          label: '用語定義',
          content: '本設計書で使用する専門用語を以下に定義する。',
          table: {
            headers: ['用語', '定義'],
            rows: [
              ['RP（Ranking Points）', 'Apex Legendsのランクマッチで獲得/消費するポイント。ランク帯の昇降を決定する'],
              ['Supabase', 'PostgreSQLベースのオープンソースBaaS。REST APIでDBアクセスが可能'],
              ['Vercel', 'フロントエンド/サーバーレス関数のホスティングサービス。CI/CD自動化に対応'],
              ['BaaS', 'Backend as a Service。バックエンドインフラをクラウドで提供するサービス形態'],
              ['SPA', 'Single Page Application。ページ遷移なしにJSでUIを動的更新するWebアプリ形態'],
              ['CSR', 'Client Side Rendering。ブラウザ側でHTMLを生成するAngularの動作モード']
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
          label: 'システム構成',
          content: '[Browser] → HTTPS → [Vercel: Angular SPA + api/get-rp.js] → HTTPS/REST → [Supabase: player_rp]。各コンポーネントの役割を以下に示す。',
          table: {
            headers: ['コンポーネント', '種別', '役割', '技術'],
            rows: [
              ['Angular SPA', 'フロントエンド', 'UI表示・操作・グラフ描画・状態管理', 'Angular 17 / TypeScript / Tailwind CSS / Chart.js'],
              ['api/get-rp.js', 'サーバーレスAPI', 'データ取得・認証・CORS制御・レート制限', 'Node.js (CommonJS) / Vercel Functions'],
              ['Supabase REST API', '外部サービス', 'RPデータの永続化・クエリ・提供', 'PostgreSQL / PostgREST'],
              ['Vercel', 'ホスティング', 'SPAとAPIのデプロイ・実行・CDN配信', 'Vercel Edge Network']
            ]
          }
        },
        {
          label: '画面遷移設計',
          content: '本システムはSPA構成のため、URLを変更せずタブ切替でコンテンツを表示する。',
          subItems: [
            '[Analysis タブ] RP推移折れ線グラフ。初期表示タブ',
            '[Data Table タブ] 全RPレコードの時系列テーブル。ランク列を含む',
            '[Daily タブ] 日次集計ビュー（日別の最高/最低RP・変化量）',
            '[設計書 タブ] 本システム設計書を5セクションでナビゲーション表示',
            'タブ切替時はデータ再取得なし（ロード済みのrecordsを参照）',
            'ヘッダーの「設計書を見る」ボタンも設計書タブに遷移'
          ]
        },
        {
          label: '画面レイアウト設計',
          content: '画面の主要エリアと各エリアに配置するコンポーネントを定義する。',
          subItems: [
            '[ヘッダー] アプリタイトル「Apex RP Analysis」/ 「設計書を見る」リンク',
            '[コントロールバー] 表示期間ボタン（7日/30日）/ 最新データ更新ボタン / CSVダウンロードボタン',
            '[統計カードエリア] 最新RP・ランクバッジ / 最高RP / 最低RP / 期間変化 / 平均RP/日 の5カード（データロード後に表示）',
            '[タブナビゲーション] Analysis / Data Table / Daily / 設計書 の4タブ',
            '[メインコンテンツ] 選択タブに応じてグラフ/テーブル/日次集計/設計書を表示'
          ]
        },
        {
          label: 'データモデル',
          content: 'Supabaseに存在するplayer_rpテーブルの物理設計を示す。',
          table: {
            headers: ['カラム名', '型', '制約', '説明'],
            rows: [
              ['id', 'INTEGER', 'PRIMARY KEY, NOT NULL', 'レコードの自動採番ID'],
              ['rp', 'INTEGER', 'NOT NULL', 'ランクポイント値（0以上の整数）'],
              ['created_at', 'TIMESTAMP WITH TIME ZONE', 'NOT NULL, DEFAULT now()', 'レコード記録日時（UTC）。スクレイピング実行時刻']
            ]
          }
        },
        {
          label: '外部連携仕様',
          content: 'フロントエンドとAPIサーバー間のインターフェース仕様を定義する。',
          table: {
            headers: ['項目', '値'],
            rows: [
              ['エンドポイント', 'GET /api/get-rp'],
              ['クエリパラメータ', 'days: "7" または "30"（省略・不正値の場合は "30" にフォールバック）'],
              ['レスポンス形式', 'JSON配列: [{id: number, rp: number, created_at: string}, ...]'],
              ['ソート順', 'created_at 昇順（古い順）'],
              ['認証', 'Basic認証（BASIC_AUTH_USER / BASIC_AUTH_PASS 設定時のみ必須）'],
              ['エラー形式', '{error: string}（各種HTTPステータスコード付き）']
            ]
          }
        },
        {
          label: '業務ロジック一覧',
          content: 'アプリケーションが実行する業務ロジックの一覧を定義する。',
          table: {
            headers: ['ロジックID', '名称', '処理内容', '実装場所'],
            rows: [
              ['BL-001', '期間フィルタ', '現在時刻からdays日前のISOタイムスタンプを算出しSupabaseのgte条件に使用', 'api/get-rp.js'],
              ['BL-002', '統計集計', 'レコード配列から最新値・最大値・最小値・変化量をgetterで算出', 'app.component.ts'],
              ['BL-003', 'ランク判定', 'RP値を閾値テーブルと照合しApexランク帯（Rookie〜Master）を返す', 'app.component.ts'],
              ['BL-004', 'RP速度算出', '最古と最新レコードのRP差÷日数差で平均RP/日を計算', 'app.component.ts'],
              ['BL-005', '日次集計', 'created_atの日付（JST）でレコードをグループ化し日別最高/最低/変化量を集計', 'app.component.ts'],
              ['BL-006', 'グラフ描画', 'RPデータを時系列折れ線グラフ（Chart.js）で可視化', 'app.component.ts'],
              ['BL-007', 'CSV生成', 'id/rp/created_atをRFC4180形式（ヘッダー行あり・UTF-8）でBlob生成', 'app.component.ts'],
              ['BL-008', 'レート制限', 'IPアドレス別にスライディングウィンドウ方式で60req/分を上限制御', 'api/get-rp.js']
            ]
          }
        },
        {
          label: '帳票仕様（CSV出力）',
          content: 'CSVダウンロード機能の出力仕様を定義する。',
          subItems: [
            'ファイル名: apex-rp-{N}days.csv（Nは選択中の期間日数: 7 または 30）',
            '文字エンコーディング: UTF-8（BOMなし）',
            'フォーマット: RFC4180準拠（カンマ区切り・ダブルクォート囲み・ヘッダー行あり）',
            '出力列定義: id（整数）/ rp（整数）/ created_at（ISO 8601形式文字列）',
            'ダウンロード方式: Blob URL + アンカータグのclick()でブラウザダウンロード'
          ]
        },
        {
          label: 'セキュリティ設計',
          content: 'APIサーバーに実装するセキュリティ機能の設計を定義する。',
          table: {
            headers: ['機能', '実装', '設定値', '効果'],
            rows: [
              ['CORS制限', 'Access-Control-Allow-Originヘッダー', 'ALLOWED_ORIGIN環境変数（未設定は *）', '許可オリジン以外からのAPIアクセスを制限'],
              ['Basic認証', 'AuthorizationヘッダーのBase64検証', 'BASIC_AUTH_USER/PASS環境変数（任意）', '認証情報なしのAPIアクセスを401で拒否'],
              ['レート制限', 'IPアドレス別スライディングウィンドウ', '60リクエスト/分/IP', 'DDoS・過負荷を429で拒否'],
              ['入力検証', 'daysパラメータの許可値チェック', '7または30のみ（それ以外は30にフォールバック）', '不正パラメータによるSupabase不正クエリを防止']
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
          label: 'モジュール構成',
          content: 'プロジェクトを構成するファイルの役割分担を定義する。',
          table: {
            headers: ['ファイルパス', '分類', '責務'],
            rows: [
              ['src/app/app.component.ts', 'Angularコンポーネント（TS）', '状態管理・API通信・グラフデータ生成・統計算出・ランク判定・日次集計'],
              ['src/app/app.component.html', 'Angularテンプレート（HTML）', 'UI描画・イベントバインディング・条件付き表示制御'],
              ['src/app/components/design-doc/design-doc.component.ts', 'サブコンポーネント（TS）', '設計書データの定義・セクション選択ロジック'],
              ['src/app/components/design-doc/design-doc.component.html', 'サブコンポーネント（HTML）', '設計書のナビゲーション・コンテンツ（テーブル/箇条書き）レンダリング'],
              ['src/app/components/design-doc/design-doc-section.interface.ts', 'TypeScript型定義', 'DesignDocSection / DesignDocItem / DesignDocTable の型定義'],
              ['api/get-rp.js', 'Vercel Serverless Function', 'CORS制御・Basic認証・レート制限・Supabase REST呼び出し・エラーハンドリング'],
              ['vercel.json', 'Vercel設定', 'APIルーティング・SPAルーティング設定']
            ]
          }
        },
        {
          label: 'フロントエンド関数仕様',
          content: 'AppComponent（app.component.ts）の主要関数・ゲッターの仕様を定義する。',
          table: {
            headers: ['関数/ゲッター名', '引数', '戻り値', '処理概要'],
            rows: [
              ['ngOnInit()', 'なし', 'void', 'コンポーネント初期化時にloadRecords()を呼び出し初期データを取得'],
              ['loadRecords(isRefresh)', 'isRefresh: boolean', 'void', 'APIからRPデータを取得しrecords/グラフデータを更新。isRefresh=trueは更新インジケータを使用'],
              ['onRangeChange(days)', 'days: RangeOption', 'void', '選択期間が変更された場合のみselectedRangeを更新しloadRecords()を実行'],
              ['refresh()', 'なし', 'void', 'isRefresh=trueでloadRecords()を呼び出し最新データを再取得'],
              ['downloadCsv()', 'なし', 'void', 'recordsをRFC4180形式のCSVに変換しBlobダウンロード。データなしは処理中断'],
              ['showDesignDoc()', 'なし', 'void', 'activeTabを"design"に設定し設計書タブを表示'],
              ['getRankInfo(rp)', 'rp: number', '{name, tier, colorClass}', 'RP値をランク閾値テーブルと照合しランク名・ティア・Tailwindカラークラスを返す'],
              ['latestRp (getter)', 'なし', 'number | null', 'records末尾のRP値。空配列はnull'],
              ['maxRp (getter)', 'なし', 'number | null', 'records全件のRP最大値。空配列はnull'],
              ['minRp (getter)', 'なし', 'number | null', 'records全件のRP最小値。空配列はnull'],
              ['rpChange (getter)', 'なし', 'number | null', '最古レコードと最新レコードのRP差分。1件以下はnull'],
              ['rpPerDay (getter)', 'なし', 'number | null', 'RP変化量÷日数差で平均RP/日を算出（小数点切捨て）。2件未満または日数差0はnull'],
              ['dailySummary (getter)', 'なし', 'DailySummary[]', 'recordsをcreated_atのJST日付でグループ化し日別の最高/最低RP・変化量を集計して日付昇順で返す'],
              ['rankLabel (getter)', 'なし', 'string', '最新RPからランク帯文字列（例: "Diamond IV"）を返す'],
              ['rankColorClass (getter)', 'なし', 'string', '最新RPに対応するTailwindバッジカラークラスを返す']
            ]
          }
        },
        {
          label: 'API処理フロー',
          content: 'api/get-rp.jsのhandler関数が実行するステップを定義する。',
          subItems: [
            '[Step 1] CORS ヘッダーを全リクエストに設定（Access-Control-Allow-Origin / Methods / Headers）',
            '[Step 2] プリフライトリクエスト（OPTIONS）には 204 No Content を即時返却',
            '[Step 3] GET 以外のHTTPメソッドには 405 Method Not Allowed を返却',
            '[Step 4] BASIC_AUTH_USER/PASS が環境変数に設定されている場合、Authorizationヘッダーを検証。不正の場合は 401 + WWW-Authenticateヘッダーを返却',
            '[Step 5] クライアントIPをx-forwarded-forヘッダーから取得し、requestBuckets Mapでレート制限チェック。60req/分超過の場合は 429 を返却',
            '[Step 6] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY の環境変数を検証。未設定の場合は 500 を返却',
            '[Step 7] days クエリパラメータを整数パースし、[7, 30] に含まれない場合は 30 にフォールバック',
            '[Step 8] 現在時刻からdays日前のISOタイムスタンプを算出し Supabase REST API にGETリクエスト',
            '[Step 9] Supabase からエラーレスポンスの場合は 500 + エラー詳細を返却',
            '[Step 10] 成功時は JSON 配列を 200 で返却し、取得件数を console.info でログ出力'
          ]
        },
        {
          label: 'エラーコード仕様',
          content: 'APIが返却するエラーレスポンスのHTTPステータスコードと条件を定義する。',
          table: {
            headers: ['HTTPステータス', '発生条件', 'ログレベル', 'レスポンスbody'],
            rows: [
              ['204', 'OPTIONSプリフライトリクエスト', 'なし', '（本文なし）'],
              ['401', 'Basic認証失敗または認証情報なし', 'なし', '{"error": "Authentication required"}'],
              ['405', 'GET以外のHTTPメソッド', 'なし', '{"error": "Method Not Allowed"}'],
              ['429', 'IPレート制限超過（60req/分）', 'WARN', '{"error": "Too many requests. Please try again later."}'],
              ['500', '環境変数SUPABASE_URL/KEYが未設定', 'ERROR', '{"error": "Missing env vars: ..."}'],
              ['500', 'Supabase REST APIがエラー返却', 'ERROR', '{"error": "Supabase error: ..."}'],
              ['500', 'fetchのネットワーク例外など予期しないエラー', 'ERROR', '{"error": "<エラーメッセージ>"}']
            ]
          }
        },
        {
          label: '環境変数定義',
          content: 'Vercelに設定が必要な環境変数の一覧を定義する。',
          table: {
            headers: ['変数名', '必須', '説明', '設定例'],
            rows: [
              ['SUPABASE_URL', '必須', 'SupabaseプロジェクトのベースURL', 'https://abcxyz.supabase.co'],
              ['SUPABASE_SERVICE_ROLE_KEY', '必須', 'Supabaseのサービスロール用JWTキー（管理者権限）', 'eyJhbGciOiJIUzI1NiIsInR5...'],
              ['ALLOWED_ORIGIN', '任意', 'CORS許可オリジン（未設定の場合は * で全許可）', 'https://apex-app.vercel.app'],
              ['BASIC_AUTH_USER', '任意', 'Basic認証のユーザー名（PASSとペアで設定）', 'admin'],
              ['BASIC_AUTH_PASS', '任意', 'Basic認証のパスワード（USERとペアで設定）', 'securepassword']
            ]
          }
        },
        {
          label: 'ログ仕様',
          content: 'APIサーバーが出力するログの形式と内容を定義する。',
          table: {
            headers: ['レベル', '関数', '出力タイミング', '含む情報'],
            rows: [
              ['INFO', 'console.info', 'Supabaseからの正常レスポンス時', '[get-rp] success / days / 取得レコード件数'],
              ['WARN', 'console.warn', 'IPレート制限発動時', '[get-rp] rate limited / clientIp'],
              ['ERROR', 'console.error', '環境変数未設定時', '[get-rp] missing env vars'],
              ['ERROR', 'console.error', 'Supabaseエラーレスポンス時', '[get-rp] supabase error / status / body'],
              ['ERROR', 'console.error', '予期しない例外発生時', '[get-rp] unexpected error / message']
            ]
          }
        },
        {
          label: 'ランク判定ロジック',
          content: 'getRankInfo()関数が使用するApexランク閾値テーブル。Diamond以上はユーザー確認済み。下位ランクは一般仕様に基づく近似値。',
          table: {
            headers: ['RP範囲（以上）', 'ランク', 'ティア', 'バッジカラー'],
            rows: [
              ['16000', 'Master', '—', 'パープル'],
              ['15000', 'Diamond', 'I', 'シアン/ブルー'],
              ['14000', 'Diamond', 'II', 'シアン/ブルー'],
              ['13000', 'Diamond', 'III', 'シアン/ブルー'],
              ['12000', 'Diamond', 'IV', 'シアン/ブルー'],
              ['11000', 'Platinum', 'I', 'ティール'],
              ['10000', 'Platinum', 'II', 'ティール'],
              ['9000', 'Platinum', 'III', 'ティール'],
              ['8000', 'Platinum', 'IV', 'ティール'],
              ['7000', 'Gold', 'I', 'イエロー'],
              ['6000', 'Gold', 'II', 'イエロー'],
              ['5000', 'Gold', 'III', 'イエロー'],
              ['4000', 'Gold', 'IV', 'イエロー'],
              ['3000', 'Silver', 'I', 'スレート'],
              ['2500', 'Silver', 'II', 'スレート'],
              ['2000', 'Silver', 'III', 'スレート'],
              ['1500', 'Silver', 'IV', 'スレート'],
              ['1000', 'Bronze', 'I', 'オレンジ'],
              ['750', 'Bronze', 'II', 'オレンジ'],
              ['500', 'Bronze', 'III', 'オレンジ'],
              ['250', 'Bronze', 'IV', 'オレンジ'],
              ['0', 'Rookie', '—', 'グレー']
            ]
          }
        },
        {
          label: 'DB物理設計',
          content: '参照するSupabaseテーブルplayer_rpの物理設計と推奨インデックスを示す。',
          table: {
            headers: ['カラム', '型', '制約', 'インデックス', '備考'],
            rows: [
              ['id', 'INTEGER', 'PRIMARY KEY', 'PK（自動）', '自動採番。Supabaseがシーケンスで管理'],
              ['rp', 'INTEGER', 'NOT NULL', 'なし', '負の値は想定外（ランクポイントは0以上）'],
              ['created_at', 'TIMESTAMP WITH TIME ZONE', 'NOT NULL, DEFAULT now()', '推奨: B-Treeインデックス', '範囲クエリ（gte）に使用。件数増加時にインデックス追加を推奨']
            ]
          }
        },
        {
          label: 'APIリファレンス',
          content: 'フロントエンドがAPIを呼び出す際の詳細仕様。',
          subItems: [
            'エンドポイント: GET /api/get-rp',
            'クエリパラメータ: days（string型: "7" または "30"。省略・不正値は "30" 扱い）',
            'レスポンス（成功）: HTTP 200、Body: [{id: number, rp: number, created_at: string（ISO 8601）}, ...]（created_at昇順）',
            'レスポンス（エラー）: HTTP 4xx/5xx、Body: {error: string}',
            'AngularでのURL: /api/get-rp?days=30（HttpClientのparamsオプションで付与）'
          ]
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
          label: '単体テスト（UT）',
          content: '個々の関数・ロジック単位でのテスト仕様を定義する。',
          table: {
            headers: ['テストID', 'テスト対象', 'テスト内容', '期待結果'],
            rows: [
              ['UT-001', 'onRangeChange', '同一期間値を選択', 'API未呼び出し・selectedRange変更なし'],
              ['UT-002', 'onRangeChange', '7→30日に切替', 'selectedRange=30更新・loadRecords実行'],
              ['UT-003', 'downloadCsv', 'records=[]の状態', 'ダウンロード処理が実行されない'],
              ['UT-004', 'downloadCsv', '正常データ3件', 'ヘッダー行+3行のCSV生成・ダウンロード開始'],
              ['UT-005', 'latestRp', 'records=[]', 'nullを返す'],
              ['UT-006', 'rpChange', 'records=1件', 'nullを返す（差分計算不可）'],
              ['UT-007', 'rpPerDay', 'records=1件', 'nullを返す'],
              ['UT-008', 'getRankInfo(15500)', 'Diamond Iの閾値範囲', 'name="Diamond"、tier="I"を返す'],
              ['UT-009', 'getRankInfo(16000)', 'Master閾値', 'name="Master"、tier=""を返す'],
              ['UT-010', 'dailySummary', '同日付に複数レコード', '1エントリに集計・最高/最低/変化量が正確'],
              ['UT-011', 'days検証（API）', 'days=90を送信', '30にフォールバックして処理'],
              ['UT-012', 'レート制限（API）', '61回連続リクエスト', '61回目に429を返却']
            ]
          }
        },
        {
          label: '統合テスト（IT）',
          content: '画面・API・DB間の連携動作を検証するテスト仕様を定義する。',
          table: {
            headers: ['テストID', 'テストシナリオ', '確認内容'],
            rows: [
              ['IT-001', '画面初期表示', 'API呼び出し→グラフ・統計カード・ランクバッジが表示される'],
              ['IT-002', '期間切替（7日→30日）', 'APIを再呼び出し・グラフデータが更新される'],
              ['IT-003', '手動更新ボタン', '"更新中..."スピナー表示→最新データ反映'],
              ['IT-004', 'CSV出力', 'CSVファイルがダウンロードされ内容がrecordsと一致'],
              ['IT-005', 'API異常時', 'エラーメッセージがUI上に表示・グラフ非表示'],
              ['IT-006', 'Data Tableタブ', 'recordsの全件が表示・ランク列が正しく表示'],
              ['IT-007', 'Dailyタブ', '日次集計テーブルが表示・集計値が正確'],
              ['IT-008', '設計書タブ', '全5セクションのナビゲーション・テーブル/箇条書き表示を確認']
            ]
          }
        },
        {
          label: 'システムテスト（ST）',
          content: 'デプロイ済み環境でのシステム全体の動作を検証するテスト仕様を定義する。',
          table: {
            headers: ['テストID', 'テストシナリオ', '合格基準'],
            rows: [
              ['ST-001', 'ビルド正常性', 'ng build がエラー・警告なしで完了'],
              ['ST-002', 'Vercelデプロイ', 'Vercel Preview / Production デプロイが成功'],
              ['ST-003', 'レスポンス性能', 'Supabase正常時のAPIレスポンスが2秒以内'],
              ['ST-004', 'ブラウザ互換性', 'Chrome / Safari / Firefox 最新版で全機能が正常動作'],
              ['ST-005', 'セキュリティ動作', 'CORS制限・レート制限（429）・Basic認証（401）が設定通りに機能']
            ]
          }
        },
        {
          label: 'テスト環境',
          content: 'テスト実施に必要な環境情報を定義する。',
          table: {
            headers: ['項目', '値'],
            rows: [
              ['フロントエンドテスト環境', 'ローカル（ng serve） / Vercel Preview URL'],
              ['APIテスト環境', 'ローカル（vercel dev） / Vercel Preview Functions'],
              ['テストデータ', 'Supabase player_rp テーブルの実データ（直近30日分）'],
              ['テストツール', 'ブラウザ DevTools / curl / docs/evidence/api-smoke-test.js'],
              ['証跡保管先', 'docs/evidence/*.txt / *.png（.gitignoreで追跡対象外）']
            ]
          }
        },
        {
          label: '証跡管理',
          content: 'テスト証跡の保管・管理ルールを定義する。',
          subItems: [
            '保管場所: docs/evidence/ ディレクトリ',
            'ファイル形式: テキストログは .txt、スクリーンショットは .png',
            '命名規則: {YYYY-MM-DD}-{テストID}-{結果}.txt（例: 2026-03-07-ST-001-pass.txt）',
            'Git管理: .gitignoreにより証跡ファイルはGit追跡対象外',
            '提出先: PR本文またはIssueコメントに添付して記録'
          ]
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
          content: '現在の実装スコープには含まないが、有用性が高い機能の候補一覧。優先度は実装の容易さとニーズを総合評価。',
          table: {
            headers: ['機能名', '概要', '優先度', '実装コスト'],
            rows: [
              ['目標RPライン', 'グラフに目標RP水平線を追加。入力欄で目標値を設定し「あと何RP」を視覚化', '高', '低（フロントのみ）'],
              ['PWA対応', 'スマートフォンにアプリとしてインストール可能。オフライン対応（キャッシュ）', '中', '中'],
              ['ダークモード', 'Tailwind CSSのdark modeによるUI切替機能', '低', '中'],
              ['グラフ画像保存', 'Canvas APIを使いグラフをPNG形式でダウンロード', '低', '低（フロントのみ）'],
              ['複数プレイヤー対応', 'player_rpテーブルにplayer_idカラムを追加し複数プレイヤーのRP管理', '低', '高（DB変更必要）']
            ]
          }
        },
        {
          label: '廃止・見送り経緯',
          content: '過去に検討したが対応しないと判断した機能の経緯を記録する。',
          subItems: [
            '90日表示オプション: Supabaseのスクレイピング仕様上、30日分のみ蓄積されるため廃止（v1.0で除去）',
            'アラート/プッシュ通知: 個人利用のため複雑性に対してメリットが少ないと判断し見送り'
          ]
        },
        {
          label: 'アーキテクチャ拡張方針',
          content: '将来の機能追加・規模拡大に備えた設計上の指針を示す。',
          subItems: [
            'DBスキーマ変更が必要な機能（複数プレイヤー等）はSupabase Migrationで管理する',
            '新しいAPIエンドポイントはapi/ディレクトリ配下にファイルを追加（Vercelのファイルベースルーティング）',
            '複雑な状態管理が必要になった場合はAngular Signals / NgRx Signalを検討する',
            '認証強化が必要な場合はSupabase Auth / Vercel Authの導入を検討する'
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
}
