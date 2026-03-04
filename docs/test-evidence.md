# テスト証跡（Apex RP Analysis）

このファイルは、今回の改修（設計書タブ追加・ヘッダー右上リンク追加）に対するテスト実行記録です。

## 1) 静的チェック
- コマンド: `node --check api/get-rp.js`
- 証跡: `docs/evidence/node-check.txt`
- 結果: 構文エラーなし

## 2) ビルド確認
- コマンド: `npm run build`
- 証跡: `docs/evidence/npm-build.txt`
- 結果: Angularビルド成功

## 3) APIスモークテスト（簡易）
- コマンド: `node docs/evidence/api-smoke-test.js`
- 証跡: `docs/evidence/api-smoke-test.txt`
- 結果:
  - GET: `200`（配列1件）
  - POST: `405 Method Not Allowed`

## 4) 画面ハードコピー
- 実施内容: Angular画面を起動し、「設計書」タブへ遷移してスクリーンショット取得
- 画像: `browser:/tmp/codex_browser_invocations/293bd693fda29428/artifacts/artifacts/design-doc-page.png`

