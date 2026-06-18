import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Top bar: product identity, last-updated relative time, theme toggle.
 * Relative-time / ISO formatting lives here (was on the monolith).
 */
@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <div class="brand">
        <span class="brand__title">Apex RP Analysis</span>
        <span class="brand__sub">ぺこんぽ / ランク推移</span>
      </div>

      <div class="header__actions">
        <span *ngIf="lastUpdated" class="updated" [title]="isoText">
          <span class="updated__label">更新</span>
          <span class="updated__time">{{ relativeText }}</span>
        </span>
        <button
          type="button"
          class="icon-btn"
          (click)="toggleTheme.emit()"
          [attr.aria-label]="isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'"
          [title]="isDark ? 'ライトモード' : 'ダークモード'"
        >
          <svg *ngIf="!isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
          <svg *ngIf="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="4" stroke-linecap="round" stroke-linejoin="round" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        </button>
      </div>
    </header>
  `,
  styles: [`
    @use 'variables' as *;
    @use 'utilities' as *;

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: $sp-16;
      padding: $sp-12 0 $sp-16;
      border-bottom: $bd-hair solid var(--color-border);
      margin-bottom: $sp-20;
    }

    .brand { display: flex; flex-direction: column; gap: 2px; }
    .brand__title { @include display(700); font-size: 18px; }
    .brand__sub { font-size: 11.5px; color: var(--color-text-subtle); }

    .header__actions { display: flex; align-items: center; gap: $sp-12; }

    .updated {
      display: inline-flex;
      align-items: baseline;
      gap: $sp-6;
      font-size: 12px;
      color: var(--color-text-muted);
    }
    .updated__label { color: var(--color-text-subtle); }
    .updated__time { @include mono(500); }

    .icon-btn {
      @include control;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      &:hover { color: var(--color-text); border-color: var(--color-text-subtle); }
      svg { width: 18px; height: 18px; }
    }
  `]
})
export class DashboardHeaderComponent {
  @Input() isDark = false;
  @Input() lastUpdated: Date | null = null;
  @Output() toggleTheme = new EventEmitter<void>();

  get relativeText(): string {
    if (!this.lastUpdated) return '';
    const diff = Date.now() - this.lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'いま';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return `${days}日前`;
  }

  get isoText(): string {
    if (!this.lastUpdated) return '';
    const d = this.lastUpdated;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())} JST`;
  }
}
