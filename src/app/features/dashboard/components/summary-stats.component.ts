import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RankThreshold, RpSummary } from '../../../core/rp.model';

/**
 * KPI summary: latest RP (hero) with rank + delta, then max / min /
 * avg / per-day figures, plus the collapsible rank guide.
 */
@Component({
  selector: 'app-summary-stats',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="stats-section" [class.is-refreshing]="refreshing">
      <div class="stats">
        <div class="stat stat--hero">
          <div class="stat__head">
            <span class="stat__label">最新 RP</span>
            <span class="rank-chip" *ngIf="summary.latestRp !== null">{{ latestRank }}</span>
          </div>
          <div class="stat__figure">
            <span class="stat__value">{{ summary.latestRp !== null ? summary.latestRp.toLocaleString() : '—' }}</span>
            <span
              *ngIf="summary.rpChange !== null"
              class="stat__delta"
              [class.is-pos]="summary.rpChange >= 0"
              [class.is-neg]="summary.rpChange < 0"
            >
              <span aria-hidden="true">{{ summary.rpChange >= 0 ? '▲' : '▼' }}</span>
              {{ summary.rpChange >= 0 ? '+' : '' }}{{ summary.rpChange.toLocaleString() }}
            </span>
          </div>
          <p class="stat__caption">{{ rangeLabel }}</p>
        </div>

        <div class="stat">
          <span class="stat__label">最高</span>
          <span class="stat__num">{{ summary.maxRp !== null ? summary.maxRp.toLocaleString() : '—' }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">最低</span>
          <span class="stat__num">{{ summary.minRp !== null ? summary.minRp.toLocaleString() : '—' }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">平均</span>
          <span class="stat__num">{{ summary.avgRp !== null ? summary.avgRp.toLocaleString() : '—' }}</span>
        </div>
        <div class="stat">
          <span class="stat__label">日次平均</span>
          <span
            class="stat__num"
            [class.is-pos]="(summary.rpPerDay ?? 0) >= 0"
            [class.is-neg]="(summary.rpPerDay ?? 0) < 0"
          >{{ summary.rpPerDay !== null ? ((summary.rpPerDay >= 0 ? '+' : '') + summary.rpPerDay.toFixed(1)) : '—' }}</span>
        </div>
      </div>

      <details class="rank-guide">
        <summary class="rank-guide__summary">ランク目安を表示</summary>
        <ul class="rank-guide__list">
          <li class="rank-guide__item" *ngFor="let threshold of rankThresholds">
            <span class="rank-guide__name">{{ threshold.rank }}</span>
            <span class="rank-guide__rp">{{ threshold.minRp.toLocaleString() }}+</span>
          </li>
        </ul>
      </details>
    </section>
  `,
  styles: [`
    @use 'variables' as *;
    @use 'utilities' as *;

    .stats-section { margin-bottom: $sp-16; transition: opacity $fade $ease; }
    .is-refreshing { opacity: 0.55; }

    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $sp-8;
      @include respond-to($bp-sm) { grid-template-columns: 2fr repeat(4, 1fr); }
    }

    .stat {
      @include card;
      display: flex;
      flex-direction: column;
      gap: $sp-3;
      padding: $sp-10 $sp-12;
    }

    .stat--hero { grid-column: 1 / -1; gap: $sp-6; @include respond-to($bp-sm) { grid-column: auto; } }

    .stat__head { display: flex; align-items: center; justify-content: space-between; gap: $sp-8; }
    .stat__label { @include eyebrow; }

    .rank-chip {
      @include display(600);
      font-size: 11px;
      padding: 2px $sp-8;
      border-radius: $r-sm;
      background: var(--color-accent-soft);
      color: var(--color-accent-strong);
    }

    .stat__figure { display: flex; align-items: baseline; gap: $sp-10; flex-wrap: wrap; }
    .stat__value { @include mono(600); font-size: 30px; color: var(--color-text); }
    .stat__num { @include mono(600); font-size: 17px; }
    .stat__delta { @include mono(600); font-size: 13px; }
    .stat__caption { font-size: 11.5px; color: var(--color-text-subtle); }

    .is-pos { color: var(--color-positive); }
    .is-neg { color: var(--color-negative); }

    .rank-guide { margin-top: $sp-8; }
    .rank-guide__summary {
      cursor: pointer;
      font-size: 12px;
      color: var(--color-text-muted);
      @include focus-ring;
      &:hover { color: var(--color-text); }
    }
    .rank-guide__list {
      display: flex;
      flex-wrap: wrap;
      gap: $sp-8;
      margin-top: $sp-8;
    }
    .rank-guide__item {
      display: inline-flex;
      align-items: baseline;
      gap: $sp-6;
      padding: $sp-3 $sp-8;
      border: $bd-hair solid var(--color-border);
      border-radius: $r-sm;
      font-size: 12px;
    }
    .rank-guide__name { color: var(--color-text-muted); }
    .rank-guide__rp { @include mono(500); color: var(--color-text); }
  `]
})
export class SummaryStatsComponent {
  @Input({ required: true }) summary!: RpSummary;
  @Input({ required: true }) latestRank!: string;
  @Input({ required: true }) rangeLabel!: string;
  @Input({ required: true }) rankThresholds!: RankThreshold[];
  @Input() refreshing = false;
}
