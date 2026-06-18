import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RpRecord, SortDirection } from '../../../core/rp.model';
import { buildRecordDiffMap, sortRecordsByDate } from '../../../core/rp.utils';

/**
 * Raw record table: No / RP / timestamp / step-diff, with a sort
 * toggle. Sorted rows and the diff map are memoised so a sort flip or
 * change-detection pass doesn't recompute when inputs are unchanged.
 */
@Component({
  selector: 'app-record-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card__head">
        <span class="card__title">データ <span class="card__count">{{ sortedRecords.length }} 件</span></span>
        <button type="button" class="sort-btn" (click)="toggleSort.emit()">
          {{ sortDir === 'asc' ? '↑ 昇順' : '↓ 降順' }}
        </button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th class="is-right">RP</th>
              <th>日時</th>
              <th class="is-right">差分</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of sortedRecords; let i = index">
              <td class="col-id">{{ sortDir === 'asc' ? (i + 1) : (sortedRecords.length - i) }}</td>
              <td class="col-num col-num--strong">{{ row.rp.toLocaleString() }}</td>
              <td class="col-date">{{ row.created_at | date:'MM/dd HH:mm':'UTC' }}</td>
              <td
                class="col-num"
                [class.is-pos]="diff(row) !== null && (diff(row) ?? 0) >= 0"
                [class.is-neg]="diff(row) !== null && (diff(row) ?? 0) < 0"
                [class.is-faint]="diff(row) === null"
              >
                <ng-container *ngIf="diff(row) !== null">
                  {{ (diff(row) ?? 0) >= 0 ? '+' : '' }}{{ (diff(row) ?? 0).toLocaleString() }}
                </ng-container>
                <ng-container *ngIf="diff(row) === null">—</ng-container>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styleUrls: ['./table.shared.scss']
})
export class RecordTableComponent {
  private _records: RpRecord[] = [];
  private _sortDir: SortDirection = 'desc';

  private sortedCache: { records: RpRecord[]; dir: SortDirection; result: RpRecord[] } | null = null;
  private diffCache: { records: RpRecord[]; map: Map<number, number | null> } | null = null;

  @Input({ required: true }) set records(value: RpRecord[]) { this._records = value ?? []; }
  @Input({ required: true }) set sortDir(value: SortDirection) { this._sortDir = value; }
  get sortDir(): SortDirection { return this._sortDir; }

  @Output() toggleSort = new EventEmitter<void>();

  get sortedRecords(): RpRecord[] {
    if (this.sortedCache?.records === this._records && this.sortedCache.dir === this._sortDir) {
      return this.sortedCache.result;
    }
    const result = sortRecordsByDate(this._records, this._sortDir);
    this.sortedCache = { records: this._records, dir: this._sortDir, result };
    return result;
  }

  diff(record: RpRecord): number | null {
    if (this.diffCache?.records !== this._records) {
      this.diffCache = { records: this._records, map: buildRecordDiffMap(this._records) };
    }
    return this.diffCache.map.get(record.id) ?? null;
  }
}
