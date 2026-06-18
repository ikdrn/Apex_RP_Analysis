import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AggregateRow, SortDirection } from '../../../core/rp.model';

/**
 * One table for both the daily and weekly summaries (they share an
 * identical 7-column shape). The container maps DailyRecord /
 * WeeklyRecord into the normalised AggregateRow, eliminating the two
 * near-duplicate table blocks from the old monolith.
 */
@Component({
  selector: 'app-aggregate-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card__head">
        <span class="card__title">{{ title }} <span class="card__count">{{ countLabel }}</span></span>
        <button type="button" class="sort-btn" (click)="toggleSort.emit()">
          {{ sortDir === 'asc' ? '↑ 昇順' : '↓ 降順' }}
        </button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ firstColLabel }}</th>
              <th class="is-right">開始</th>
              <th class="is-right">終了</th>
              <th class="is-right">高値</th>
              <th class="is-right">安値</th>
              <th class="is-right">変化</th>
              <th class="is-right">件数</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows">
              <td class="col-first">
                {{ row.label }}
                <ng-container *ngIf="row.subLabel">
                  <span class="week-range__sep"> 〜 </span>
                  <span class="week-range__end">{{ row.subLabel }}</span>
                </ng-container>
              </td>
              <td class="col-num col-muted">{{ row.firstRp.toLocaleString() }}</td>
              <td class="col-num col-num--strong">{{ row.lastRp.toLocaleString() }}</td>
              <td class="col-num is-pos">{{ row.maxRp.toLocaleString() }}</td>
              <td class="col-num is-neg">{{ row.minRp.toLocaleString() }}</td>
              <td
                class="col-num"
                [class.is-pos]="row.change >= 0"
                [class.is-neg]="row.change < 0"
              >{{ row.change >= 0 ? '+' : '' }}{{ row.change.toLocaleString() }}</td>
              <td class="col-num is-faint">{{ row.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styleUrls: ['./table.shared.scss']
})
export class AggregateTableComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) countLabel!: string;
  @Input({ required: true }) firstColLabel!: string;
  @Input({ required: true }) rows!: AggregateRow[];
  @Input({ required: true }) sortDir!: SortDirection;
  @Output() toggleSort = new EventEmitter<void>();
}
