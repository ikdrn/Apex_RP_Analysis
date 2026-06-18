import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RangeOption } from '../../../core/rp.model';

/**
 * Operations row: range segment (7 / 30 / all), CSV export, refresh.
 * Collapses the old `.controls` block; emits intent, holds no state.
 */
@Component({
  selector: 'app-dashboard-toolbar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="controls">
      <div class="segment" role="group" aria-label="表示期間">
        <button
          type="button"
          *ngFor="let range of ranges"
          class="segment__btn"
          [class.is-active]="selectedRange === range"
          [attr.aria-pressed]="selectedRange === range"
          (click)="rangeChange.emit(range)"
        >{{ rangeLabel(range) }}</button>
      </div>

      <div class="controls__actions">
        <button
          type="button"
          class="btn"
          (click)="download.emit()"
          [disabled]="!canDownload || loading"
          aria-label="CSV をダウンロード"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
          </svg>
          CSV
        </button>
        <button
          type="button"
          class="btn btn--accent"
          (click)="refresh.emit()"
          [disabled]="loading || refreshing"
          aria-label="最新データに更新"
        >
          <svg class="btn__spin" [class.is-spinning]="refreshing" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-2.64-6.36M21 4v5h-5" />
          </svg>
          {{ refreshing ? '更新中…' : '更新' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    @use 'variables' as *;
    @use 'utilities' as *;

    .controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: $sp-12;
      flex-wrap: wrap;
      margin-bottom: $sp-12;
    }

    .segment {
      display: inline-flex;
      border: $bd-hair solid var(--color-border);
      border-radius: $r-md;
      overflow: hidden;
    }
    .segment__btn {
      @include display(600);
      font-size: 12.5px;
      padding: $sp-6 $sp-16;
      color: var(--color-text-muted);
      background: var(--color-surface);
      border-right: $bd-hair solid var(--color-border);
      transition: background-color $fade $ease, color $fade $ease;
      @include focus-ring;
      &:last-child { border-right: none; }
      &:hover { color: var(--color-text); }
      &.is-active { background: var(--color-accent); color: var(--color-on-accent); }
    }

    .controls__actions { display: flex; gap: $sp-8; }

    .btn {
      @include control;
      @include display(600);
      display: inline-flex;
      align-items: center;
      gap: $sp-6;
      font-size: 12.5px;
      padding: $sp-6 $sp-12;
      color: var(--color-text);
      &:hover:not(:disabled) { border-color: var(--color-text-subtle); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      svg { width: 15px; height: 15px; }
    }
    .btn--accent {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: var(--color-on-accent);
      &:hover:not(:disabled) { background: var(--color-accent-strong); border-color: var(--color-accent-strong); }
    }

    .btn__spin.is-spinning { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class DashboardToolbarComponent {
  @Input({ required: true }) ranges!: RangeOption[];
  @Input({ required: true }) selectedRange!: RangeOption;
  @Input() loading = false;
  @Input() refreshing = false;
  @Input() canDownload = false;

  @Output() rangeChange = new EventEmitter<RangeOption>();
  @Output() refresh = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();

  rangeLabel(range: RangeOption): string {
    return range === 'all' ? '全期間' : `${range}日`;
  }
}
