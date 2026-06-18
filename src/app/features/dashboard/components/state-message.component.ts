import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type StateVariant = 'loading' | 'error' | 'empty';

/**
 * Presentational full-width status block: loading spinner, error
 * message, or empty-state. Replaces the three inline `.state` blocks
 * in the old monolith.
 */
@Component({
  selector: 'app-state-message',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="state"
      [class.state--error]="variant === 'error'"
      [attr.role]="variant === 'error' ? 'alert' : null"
    >
      <span *ngIf="variant === 'loading'" class="spinner" aria-hidden="true"></span>

      <svg
        *ngIf="variant === 'empty'"
        class="state__icon"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M6 40h36" stroke-linecap="round" />
        <path d="M8 32l10-9 7 6 13-15" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

      <p class="state__title">{{ title }}</p>
      <p *ngIf="hint" class="state__hint">{{ hint }}</p>
    </div>
  `,
  styles: [`
    @use 'variables' as *;

    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: $sp-10;
      padding: $sp-56 $sp-20;
      text-align: center;
      color: var(--color-text-muted);
    }

    .state__icon { width: 40px; height: 40px; color: var(--color-text-subtle); }

    .state__title { font-size: 14.5px; color: var(--color-text); }

    .state--error .state__title { color: var(--color-negative); }

    .state__hint { font-size: 12.5px; color: var(--color-text-subtle); }

    .spinner {
      width: 26px;
      height: 26px;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: $r-pill;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class StateMessageComponent {
  @Input({ required: true }) variant!: StateVariant;
  @Input({ required: true }) title!: string;
  @Input() hint = '';
}
