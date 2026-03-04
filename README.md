# Apex RP Analysis

ApexのRP推移を「グラフ」と「データ一覧」で確認できるアプリです。

## 技術スタック
- Frontend: Angular + Tailwind CSS + ng2-charts (Chart.js)
- Backend: Vercel Serverless Function (Node.js / CommonJS)
- Database: Supabase (`player_rp`)
- Deploy: Vercel

## 画面の主な機能
- **期間切り替え**: 7日 / 30日 / 90日
- **Analysisタブ**: `created_at`（横軸）と `rp`（縦軸）の時系列グラフ
- **Data Tableタブ**: データ一覧表示
- **最新データに更新**: APIを再取得
- **CSVダウンロード**: 表示中期間のデータを保存
- **0件時のメッセージ表示** / **エラー時の説明表示**

## APIの運用機能
- CORS対応（`ALLOWED_ORIGIN` で制限可能）
- レート制限（1IPあたり 1分間 60リクエスト）
- 失敗時・成功時のログ出力
- （任意）Basic認証（`BASIC_AUTH_USER` / `BASIC_AUTH_PASS`）

## セットアップ
1. Node.js 20+ をインストール
2. 依存関係をインストール
   ```bash
   npm install
   ```
3. 環境変数を設定（Vercel Project Settings > Environment Variables）
4. 開発サーバー起動
   ```bash
   npm run start
   ```

## 必須環境変数
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 任意環境変数
- `ALLOWED_ORIGIN`
  - 例: `https://your-app.vercel.app`
  - 未設定なら `*`
- `BASIC_AUTH_USER`
- `BASIC_AUTH_PASS`


## 設計書（アプリ内）
- ヘッダー右上の **「設計書を見る」** から、要件定義・基本設計・詳細設計・テスト仕様を確認できます。
- 非エンジニア向けに、専門用語をできるだけ平易な表現にしています。

## Vercel デプロイ
`vercel.json` 設定済みのため、Vercelへ接続してデプロイすれば動作します。
