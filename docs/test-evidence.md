# テスト証跡（運用ルール）

`docs/evidence/` 配下の `.txt` / `.png` / `.log` は、実行ごとに変わる生成物です。

## なぜ追跡しないのか
- ブランチごとに内容差分が大きく、**マージ競合の原因**になりやすいため。
- 「消したのに競合する」ケース（modify/delete conflict）を減らすため。

## 実務での扱い
1. テストを実行する。
2. 証跡ファイルは `docs/evidence/` に出力する。
3. Gitには含めず、PR本文やチケットに添付する。

## 代表コマンド
- `node --check api/get-rp.js`
- `npm run build`
- `node docs/evidence/api-smoke-test.js`
