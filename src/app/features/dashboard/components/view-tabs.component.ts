import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AppTab } from '../../../core/rp.model';

type TabDef = { id: AppTab; label: string };

/**
 * View switcher implemented as an ARIA tablist with roving-arrow
 * keyboard navigation (← →), an accessibility gain over the old plain
 * buttons. Holds no state; emits the chosen tab.
 */
@Component({
  selector: 'app-view-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="tabs" role="tablist" aria-label="表示切り替え">
      <button
        type="button"
        *ngFor="let tab of tabs; let i = index"
        class="tabs__tab"
        role="tab"
        [id]="'tab-' + tab.id"
        [class.is-active]="activeTab === tab.id"
        [attr.aria-selected]="activeTab === tab.id"
        [attr.tabindex]="activeTab === tab.id ? 0 : -1"
        (click)="tabChange.emit(tab.id)"
        (keydown)="onKeydown($event, i)"
      >{{ tab.label }}</button>
    </nav>
  `,
  styles: [`
    @use 'variables' as *;
    @use 'utilities' as *;

    .tabs {
      display: flex;
      gap: $sp-3;
      border-bottom: $bd-hair solid var(--color-border);
      margin-bottom: $sp-16;
    }
    .tabs__tab {
      @include display(600);
      font-size: 13px;
      padding: $sp-8 $sp-16;
      color: var(--color-text-muted);
      border-bottom: $bd-thick solid transparent;
      margin-bottom: -$bd-hair;
      transition: color $fade $ease, border-color $fade $ease;
      @include focus-ring;
      &:hover { color: var(--color-text); }
      &.is-active { color: var(--color-text); border-bottom-color: var(--color-accent); }
    }
  `]
})
export class ViewTabsComponent {
  @Input({ required: true }) activeTab!: AppTab;
  @Input({ required: true }) tabs!: TabDef[];
  @Output() tabChange = new EventEmitter<AppTab>();

  onKeydown(event: KeyboardEvent, index: number): void {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % this.tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + this.tabs.length) % this.tabs.length;
    else return;

    event.preventDefault();
    const target = this.tabs[next];
    this.tabChange.emit(target.id);
    const el = document.getElementById('tab-' + target.id);
    el?.focus();
  }
}
