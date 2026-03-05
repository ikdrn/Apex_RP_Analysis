import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignDocSection, DesignDocItem } from './design-doc-section.interface';

@Component({
  selector: 'app-design-doc',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './design-doc.component.html'
})
export class DesignDocComponent implements OnInit {
  selectedSectionId: 'requirements' | 'basic-design' | 'detailed-design' | 'testing' = 'requirements';

  sections: DesignDocSection[] = [
    {
      id: 'requirements',
      title: '1. 要件定義書',
      order: 1,
      items: [
        {
          label: '背景・目的',
          content: 'RP推移を誰でも見える化し、日々の変化を早く判断できるようにする。'
        },
        {
          label: 'スコープ',
          content: 'Web画面（グラフ/表/CSV）とAPI（取得・期間指定・基本的な保護）。'
        },
        {
          label: '業務フロー',
          content: 'As-Is=手作業確認、To-Be=画面アクセス→期間選択→確認→必要ならCSV出力。'
        },
        {
          label: '機能要件',
          content: '期間切替、再取得、一覧表示、CSV、エラー表示、設計書閲覧。'
        },
        {
          label: '非機能要件',
          content: 'APIの安定性（レート制限）、可用性（Vercel）、セキュリティ（CORS/任意Basic認証）。'
        },
        {
          label: '外部I/F要件',
          content: 'Supabase REST APIとHTTPS通信。'
        },
        {
          label: 'データ移行要件',
          content: '既存の `player_rp` をそのまま利用（移行処理なし）。'
        },
        {
          label: '導入・運用要件',
          content: 'Vercel環境変数設定とログ監視、必要時に設定更新。'
        }
      ]
    },
    {
      id: 'basic-design',
      title: '2. 基本設計書',
      order: 2,
      items: [
        {
          label: 'システム構成図',
          content: 'Browser → Vercel(Angular + API) → Supabase。'
        },
        {
          label: '画面遷移図',
          content: '同一画面内タブ遷移（Analysis / Data Table / 設計書）。'
        },
        {
          label: '画面レイアウト',
          content: 'ヘッダー、操作ボタン、統計カード、メインタブ領域。'
        },
        {
          label: '帳票レイアウト',
          content: 'CSV（id, rp, created_at）。'
        },
        {
          label: 'テーブル定義/ER',
          content: '`player_rp(id, rp, created_at)` を参照。1テーブル構成。'
        },
        {
          label: '外部連携仕様',
          content: 'GET `/api/get-rp?days=7|30|90` → Supabase REST呼び出し。'
        },
        {
          label: '業務ロジック一覧',
          content: '集計表示（最新/最大/最小/変化量）、期間フィルタ。'
        },
        {
          label: '権限・ロール',
          content: '基本は閲覧者、必要ならBasic認証で保護。'
        }
      ]
    },
    {
      id: 'detailed-design',
      title: '3. 詳細設計書',
      order: 3,
      items: [
        {
          label: 'モジュール/クラス',
          content: '`AppComponent`（UI制御）、`api/get-rp.js`（API処理）。'
        },
        {
          label: 'シーケンス',
          content: '画面起動→AngularがAPI呼び出し→APIがSupabase参照→結果表示。'
        },
        {
          label: '関数仕様',
          content: '`loadRecords`, `onRangeChange`, `refresh`, `downloadCsv`, API `handler`。'
        },
        {
          label: '詳細ロジック',
          content: 'days検証（7/30/90）、失敗時エラー文言、成功時グラフ更新。'
        },
        {
          label: '共通部品',
          content: 'Chart.js / ng2-charts / Angular HttpClient。'
        },
        {
          label: 'DB物理設計',
          content: '既存DB利用。将来は `created_at` インデックス強化を推奨。'
        },
        {
          label: 'エラーハンドリング/ログ',
          content: 'APIで`console.error/warn/info`、画面に説明文表示。'
        },
        {
          label: 'APIリファレンス',
          content: 'GET `/api/get-rp`（query: `days`、response: RPレコード配列）。'
        }
      ]
    },
    {
      id: 'testing',
      title: '4. 各テスト仕様書',
      order: 4,
      items: [
        {
          label: 'UT',
          content: '関数単位（期間切替、CSV生成、エラー分岐、境界値: days不正値→30）。'
        },
        {
          label: 'IT',
          content: '画面→API→DB連携、タブ遷移、連続操作（切替→更新→CSV）。'
        },
        {
          label: 'ST',
          content: '全体動作、ビルド健全性、レスポンス遅延時表示、ログ確認。'
        },
        {
          label: '証跡',
          content: '`docs/test-evidence.md` と `docs/evidence/*.txt` に保存。'
        }
      ]
    }
  ];

  ngOnInit(): void {
    // 初期セクションを設定
  }

  selectSection(sectionId: 'requirements' | 'basic-design' | 'detailed-design' | 'testing'): void {
    this.selectedSectionId = sectionId;
  }

  get selectedSection(): DesignDocSection | undefined {
    return this.sections.find(s => s.id === this.selectedSectionId);
  }
}
