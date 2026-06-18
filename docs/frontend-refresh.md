# フロントエンド全面刷新 設計書

対象: Apex RP Analysis（Angular 17 / SCSS / ng2-charts）
方針: **フロントエンドのみ刷新。バックエンド・API・データ構造・業務ロジックは一切変更しない。**
確定事項（ユーザー確認済み）: ①ビジュアルは「業務システム調」へ刷新（ゲーム的タクティカルHUDを排除） ②設計書＋実装まで一括。

---

## 1. システム全体レビュー

| 項目 | 現状 | 問題点 | 改善案 | 優先度 |
|---|---|---|---|---|
| UI | タクティカルHUD（角斜めカット・ドットグリッド・ネオン橙） | 業務利用に対し装飾過多・視認性より雰囲気優先 | 装飾を排し、ハイコントラスト・高密度の業務UIへ | 高 |
| UX | 1画面・4タブ・期間切替 | 操作自体は良好。キーボード操作/ショートカット未対応 | タブのキーボード操作・focus管理を追加 | 中 |
| 情報設計 | 統計→操作→タブ→本体 | 統計と操作の優先度が視覚的に均質 | 最新RPを主役化、操作を一列に集約 | 中 |
| 業務フロー | 期間選択→閲覧→CSV | 破壊しない（維持） | 維持 | — |
| コンポーネント設計 | **単一637行コンポーネント** | 責務集中・テスト困難・再利用不可 | 8コンポーネントへ分割、日別/週別表を共通化 | 高 |
| 状態管理 | コンポーネント内プロパティ＋RxJS Subject | 妥当。肥大化が問題 | 状態はコンテナに集約、子は presentational | 高 |
| ディレクトリ構成 | core + 単一component | 機能拡張時に破綻 | features/dashboard 配下に整理 | 中 |
| パフォーマンス | OnPush・メモ化・500点デシメーション・5分キャッシュ | 良好 | 維持（チャート側に閉じる） | 低 |
| アクセシビリティ | aria一部・focus-ring有 | tablistのrole/キーボード欠如、コントラスト | role=tablist、矢印キー、コントラスト確保 | 中 |
| レスポンシブ | breakpoint有 | 維持 | テーブルは横スクロール維持 | 低 |
| 保守性 | 低（モノリス） | 変更影響範囲が広い | 分割で局所化 | 高 |
| 可読性 | 中 | 1ファイルに混在 | 責務単位に分離 | 高 |
| 拡張性 | 低 | タブ/可視化追加が困難 | 子コンポーネント差し替えで拡張可 | 中 |
| セキュリティ | CSV生成はクライアント・XSS面はAngularエスケープで担保 | 大きな問題なし | 維持 | 低 |
| 操作性 | ドラッグ/ホイールズーム | 良好だが発見性低 | ヒント文維持＋ボタン継続 | 低 |

---

## 2. AI感のあるデザイン分析と排除方針

排除する「AIが生成しがちなUI」要素を設計ルールとして明文化する。

| 排除対象 | 理由 | 本設計のルール |
|---|---|---|
| SaaSテンプレ風/Apple風/Linear風/Vercel風 | 没個性・業務効率と無関係 | テンプレ的レイアウトを採らない |
| AIダッシュボード風（巨大カード羅列） | 情報密度が低い | カードは意味単位のみ、余白は機能的に最小化 |
| 情報密度が低い | スクロール量増・一覧性低下 | 1画面で主要KPIと本体を同時表示 |
| 無意味なカードUI/無意味な余白 | 視線移動増 | 区切りはハイラインで、余白は段階的スケールに限定 |
| ガラスモーフィズム/グラデーション乱用 | 可読性低下 | 単色サーフェス・フラット背景 |
| 過度な角丸/大きすぎるボタン | 業務感の喪失 | radius 3–4px、ボタンは標準高さ |
| アイコン過多 | 認知負荷 | アイコンは操作の補助のみ |
| アニメーション過多 | 長時間利用で疲労 | 色/不透明度の微トランジションのみ、チャートは即時描画 |
| 見た目重視 | 意思決定を妨げる | 数値はタブラー等幅で整列、コントラスト優先 |

最優先は**業務効率**。装飾（斜めカット、HUDブラケット、ドットグリッド、上部グロー、ネオン橙）は全廃。

---

## 3. 現行画面一覧

単一ページ・SPA。論理セクションは以下。

| セクション | 用途 | 利用者 | 主な要素 |
|---|---|---|---|
| ヘッダー | ブランド/更新時刻/テーマ切替 | 閲覧者 | 更新相対時刻、テーマトグル |
| 統計サマリー | RP状況の即時把握 | 閲覧者 | 最新RP+ランク+差分、最高/最低/平均/日次平均、ランク目安 |
| 操作バー | 期間切替・更新・CSV | 閲覧者 | セグメント(7/30/全)、CSV、更新 |
| タブ | 表示切替 | 閲覧者 | グラフ/データ/日別/週別 |
| グラフ | RP時系列の可視化 | 閲覧者 | 折れ線、ズーム/パン、拡大/縮小/リセット |
| データ表 | 明細確認 | 閲覧者 | No/RP/日時/差分、ソート |
| 日別表 | 日次集計 | 閲覧者 | 開始/終了/高値/安値/変化/件数、ソート |
| 週別表 | 週次集計 | 閲覧者 | 週範囲/開始/終了/高値/安値/変化/件数、ソート |
| 状態表示 | 読込/エラー/0件 | 閲覧者 | スピナー・説明文 |

各要素の洗い出し（漏れ防止）:
- ボタン: テーマ切替、期間3種、CSV、更新、各表ソート、拡大、縮小、リセット、ランク目安開閉
- モーダル/ダイアログ: なし（`<details>`のランク目安のみ）
- 入力項目: なし（クエリ検索UIは現行UIに未露出。utilsに`filterRecords`は存在するが未使用）
- テーブル: データ/日別/週別の3種
- 検索/フィルター: UI上なし（期間フィルターはAPI側 days パラメータ）
- ソート: 各表で昇順/降順トグル
- ページネーション: なし（全件表示）
- CSV: 表示中期間を出力。Excel/PDF/印刷: なし
- API: `GET /api/get-rp?days=7|30|all`
- エラー表示/ローディング: 専用stateブロック
- 権限制御: フロントには権限分岐なし（APIにBasic認証オプション）

---

## 4. 画面遷移図

```
[初期ロード] → fetch(days=30)
   ├─ 成功・件数>0 → 統計+操作+タブ表示（既定: グラフタブ）
   ├─ 成功・件数0 → 空状態
   └─ 失敗 → エラー状態

タブ切替: グラフ ⇄ データ ⇄ 日別 ⇄ 週別（再フェッチなし、同一recordsを描画）
期間切替(7/30/全): 再フェッチ（キャッシュ5分）→ 統計/グラフ/各表 再計算
更新: 再フェッチ（キャッシュ有効中はキャッシュ返却）
テーマ切替: 再描画なし、CSS変数＋チャート色のみ更新
CSV: 現在のrecordsをファイル化（遷移なし）
```

## 5. 業務フロー

```
利用者の意思決定フロー:
1. 「今どのRP帯/ランクか」 → 統計サマリー(最新RP+ランク)
2. 「直近で上がった/下がったか」 → 差分・日次平均
3. 「推移の形は」 → グラフ（ズームで局所確認）
4. 「いつ何があったか」 → データ/日別/週別表
5. 「記録を持ち出す」 → CSV
```
刷新後もこの順序（上から下へ）を維持し、視線移動を最小化する。

---

## 6. 機能一覧（機能インベントリ / 最終チェックリスト）

| ID | 画面 | 内容 | API | 入力 | 出力 | 状態 |
|---|---|---|---|---|---|---|
| F01 | ヘッダー | テーマ切替(dark既定/light)・localStorage永続・初回描画前適用 | — | クリック | `.light`トグル | 維持 |
| F02 | ヘッダー | 最終更新の相対時刻＋ISOタイトル | — | — | 「n分前」等 | 維持 |
| F03 | 操作 | 期間切替 7/30/全 → 再取得 | get-rp | クリック | records更新 | 維持 |
| F04 | 操作 | 更新（再取得、5分キャッシュ） | get-rp | クリック | records更新 | 維持 |
| F05 | 操作 | CSVダウンロード（現期間） | — | クリック | csvファイル | 維持 |
| F06 | 統計 | 最新RP/ランク/差分/最高/最低/平均/日次平均 | — | records | 数値表示 | 維持 |
| F07 | 統計 | ランク目安（5段階）開閉 | — | クリック | 一覧 | 維持 |
| F08 | タブ | グラフ/データ/日別/週別 切替 | — | クリック | 表示切替 | 維持 |
| F09 | グラフ | 折れ線、ズーム/パン(ホイール/ドラッグ/Shift縦/Alt横)、拡大/縮小/リセット | — | 操作 | 描画更新 | 維持 |
| F10 | データ表 | No/RP/日時/差分、昇降ソート | — | クリック | 表 | 維持 |
| F11 | 日別表 | 開始/終了/高値/安値/変化/件数、ソート | — | クリック | 表 | 維持 |
| F12 | 週別表 | 週範囲/開始/終了/高値/安値/変化/件数、ソート(日曜始まり) | — | クリック | 表 | 維持 |
| F13 | 状態 | 読込/エラー/0件 表示 | — | — | メッセージ | 維持 |
| F14 | データ | rp>0 のフィルタ | — | records | 整形 | 維持 |
| F15 | グラフ | 500点デシメーション | — | records | 間引き描画 | 維持 |

実装後、全15機能が100%実装済みであることを §19 対応表で証明する。

---

## 7. 情報設計レビュー

- 情報の優先順位: 最新RP（最重要）→ 変化/日次平均 → 補助統計 → 推移 → 明細。最新RPをheroとして拡大。
- ボタン配置: 期間（左・主操作）／CSV・更新（右・アクション）を一列に。テーマは右上固定。
- 検索/フィルター: 現行UIに無いため新設しない（仕様変更禁止）。
- 一覧/詳細/編集: 編集機能なし。一覧のみ。タブで切替。
- タブ: role=tablist + 矢印キー対応で操作性向上。
- パンくず: 単一画面のため不要。
- ショートカット: 過剰追加しない（タブ矢印キーのみ）。
- 固定ヘッダー/固定アクション: 画面が短いため固定化は行わず、スクロール量を抑える設計で代替。

---

## 8. UI/UX改善提案（仕様非変更の範囲）

| 観点 | 改善 |
|---|---|
| 操作回数 | 期間・更新・CSVを1行に集約しクリック到達距離を短縮 |
| マウス移動/視線移動 | 上から「状況→推移→明細」の単一カラム視線誘導 |
| 入力回数 | 変更なし（入力UIなし） |
| 画面遷移 | タブ内切替のみ（再フェッチ削減＝現行維持） |
| 情報密度 | カード余白縮小・テーブル行高圧縮・等幅数値整列 |
| 学習コスト | 業務システム標準の見た目で初見負荷を低減 |

---

## 9. グラフ・可視化改善提案

「利用者が何を判断したいか」＝**RPの時系列推移と直近トレンド**。

| 候補 | 採否 | 理由 |
|---|---|---|
| 折れ線（時系列） | ✅採用 | RP推移の把握に最適。現行を踏襲（仕様維持） |
| KPIカード | ✅採用済 | 最新/最高/最低/平均/日次平均の即時把握 |
| 棒/積み上げ/円/散布/ヒートマップ/サンキー/ガント 等 | ❌不採用 | 単一系列の連続値推移には不適。装飾的グラフ追加は禁止方針に反する |
| 日別/週別テーブル | ✅採用済 | 集計値の精読に最適 |

結論: 可視化は現行構成（折れ線＋KPI＋集計表）が目的に合致。**新規グラフは追加しない**。改善はチャートの可読性（フラットなグリッド、業務配色、即時描画）に限定。

---

## 10. コンポーネント設計

単一637行コンポーネントを責務単位で分割（重複排除・共通化）。

| コンポーネント | 種別 | 責務 | 主なInput | 主なOutput |
|---|---|---|---|---|
| `AppComponent` | smart(container) | データ取得・状態保持・子の orchestration・CSV | — | — |
| `DashboardHeaderComponent` | presentational | ブランド/更新時刻/テーマ切替 | isDark, lastUpdated | toggleTheme |
| `SummaryStatsComponent` | presentational | KPI＋ランク＋ランク目安 | summary, rangeLabel, latestRank, rankThresholds | — |
| `DashboardToolbarComponent` | presentational | 期間/CSV/更新 | ranges, selectedRange, loading, refreshing, canDownload | rangeChange, refresh, download |
| `ViewTabsComponent` | presentational | タブ切替(role=tablist) | activeTab, tabs | tabChange |
| `RpTrendChartComponent` | presentational | チャート構築・ズーム/パン・デシメーション | records, themeVersion | — |
| `RecordTableComponent` | presentational | 明細表＋差分＋ソート | records, sortDir | toggleSort |
| `AggregateTableComponent` | presentational | **日別/週別を共通化**した集計表 | rows, title, countLabel, firstColLabel, sortDir | toggleSort |
| `StateMessageComponent` | presentational | loading/error/empty | variant, message, hint | — |

DRYの要点: 日別表と週別表は7列構造が同一 → `AggregateRow` 型に正規化し `AggregateTableComponent` 1つで賄う（重複329行HTML→1コンポーネント）。

---

## 11. ディレクトリ構成

```
src/app/
  core/                       # 変更なし（ロジック層）
    rp.model.ts               # 型定義（AggregateRow/RankThreshold 追加）
    rp.utils.ts
    rp-data.service.ts
  features/dashboard/
    app は root のまま container として利用
    components/
      dashboard-header/
      summary-stats/
      dashboard-toolbar/
      view-tabs/
      rp-trend-chart/
      record-table/
      aggregate-table/
      state-message/
  app.component.*             # smart container（大幅縮小）
```

## 12. 状態管理設計

- 状態は `AppComponent` に集約（records, summary, recordDiffs, selectedRange, activeTab, 各sortDir, isDark, themeVersion, loading/refreshing/error）。
- 子は `@Input`/`@Output` の純粋 presentational（OnPush）。副作用を持たない＝テスト容易。
- データ取得は既存 `loadTrigger$`(RxJS) を維持。サービス層・キャッシュは無変更。
- テーマ変更はチャートに `themeVersion` カウンタで伝播（再フェッチ不要）。

## 13. API利用一覧

| API | メソッド | パラメータ | 呼出元 | 変更 |
|---|---|---|---|---|
| `/api/get-rp` | GET | `days=7\|30\|all` | `RpDataService.fetchRecords` | **無変更** |

リクエスト/レスポンス/認証/エンドポイントは一切変更しない。

## 14. デザインシステム（業務システム調）

- 配色: ニュートラルなスレート基調 + 単一アクセント（ブルー）。gain=緑 / loss=赤。背景はフラット（ドットグリッド/グロー廃止）。
- 角丸: 3–4px。装飾カット/HUDブラケット全廃。
- タイポ: 見出し/ラベルは Noto Sans JP 系、数値は JetBrains Mono（タブラー整列）。
- 余白: 4pxスケールを機能的に最小使用。テーブルは高密度。
- モーション: 色/不透明度の150ms微遷移のみ。チャートはアニメ無し（即時）。
- フォーカス: アクセント色の明確なfocus-ringを全操作に。

## 15. 実装計画

1. デザイントークン刷新（_variables/_dark/_light/_typography/_utilities/global）
2. `core/rp.model.ts` に `RankThreshold` / `AggregateRow` 追加
3. presentational 8コンポーネント実装（OnPush・inline template）
4. `AppComponent` を container へ縮小（ロジック委譲）
5. ビルド確認・セルフレビュー・対応表検証

---

## 16. 画面単位の実装

各セクションを §10 の各コンポーネントとして実装（コード参照）。チャートのズーム/パン全ロジックは `RpTrendChartComponent` に閉じ込め、日別/週別は `AggregateTableComponent` に統合。

## 17. セルフレビュー観点

- API I/O・パラメータが現行と完全一致しているか
- 全15機能の挙動（特にズーム/パン境界、差分null初行、週の日曜始まり、JST表示=UTC指定）が不変か
- OnPush下で `markForCheck`/Input変化検知が機能するか

## 18. テスト項目（§下部）

→ 末尾「テスト項目」参照。

## 19. 現行機能と新UIの対応表

| 機能ID | 現行(単一component) | 新UI(担当コンポーネント) | 実装 |
|---|---|---|---|
| F01 | app.component | DashboardHeaderComponent | ✅ |
| F02 | app.component | DashboardHeaderComponent | ✅ |
| F03 | app.component | DashboardToolbarComponent + container | ✅ |
| F04 | app.component | DashboardToolbarComponent + container | ✅ |
| F05 | app.component | DashboardToolbarComponent + container.downloadCsv | ✅ |
| F06 | app.component | SummaryStatsComponent | ✅ |
| F07 | app.component | SummaryStatsComponent | ✅ |
| F08 | app.component | ViewTabsComponent | ✅ |
| F09 | app.component(250行) | RpTrendChartComponent | ✅ |
| F10 | app.component | RecordTableComponent | ✅ |
| F11 | app.component | AggregateTableComponent(daily) | ✅ |
| F12 | app.component | AggregateTableComponent(weekly) | ✅ |
| F13 | app.component | StateMessageComponent | ✅ |
| F14 | app.component | container.onDataLoaded | ✅ |
| F15 | app.component | RpTrendChartComponent | ✅ |

## 20. 最終品質チェック

- [ ] 機能漏れなし（F01–F15）
- [ ] API互換100%（get-rp の I/O 不変）
- [ ] 表示崩れなし／レスポンシブ
- [ ] エラー/空/読込の各状態
- [ ] 権限制御（フロント分岐なし＝不変）
- [ ] アクセシビリティ（tablist/aria/focus）
- [ ] キーボード操作（タブ矢印）
- [ ] パフォーマンス（OnPush/メモ化/デシメーション維持）
- [ ] 保守性（責務分離・DRY）
- [ ] `ng build` 成功

## 確認事項（推測で補完しない事項）

1. アクセント色は業務標準のブルーを採用したが、ブランド指定色があれば差し替える。
2. `utils.filterRecords` は現行UI未使用のため、検索UIは新設しない（仕様維持）。検索機能を露出させたい場合は別途指示が必要。
3. CSVの列・ファイル名・日時表記は現行仕様を厳密維持（変更要否があれば指示）。
</content>
</invoke>
