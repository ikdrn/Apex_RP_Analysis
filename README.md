# Apex RP Analysis

ApexのRP推移を「グラフ」と「データ一覧」で確認できるアプリです。

## 技術スタック
- Frontend: Angular + Tailwind CSS + ng2-charts (Chart.js)
- Backend: Rust (Vercel Serverless Function)
- Database: Supabase (`player_rp`)
- Deploy: Vercel

## 画面構成
- **Analysis** タブ: `created_at`（横軸）と `rp`（縦軸）の時系列グラフ
- **Data Table** タブ: データ一覧表示

## セットアップ
1. Node.js 20+ をインストール
2. 依存関係をインストール
   ```bash
   npm install
   ```
3. 環境変数を設定
   - `.env.example` を参考に Vercel の Project Settings へ設定
4. 開発サーバー起動
   ```bash
   npm run start
   ```

## Vercel デプロイ
- `vercel.json` 設定済みのため、Vercelへ接続して `main` をデプロイすれば動作します。
