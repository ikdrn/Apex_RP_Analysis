import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap, tap } from 'rxjs';
import { RpDataService } from './core/rp-data.service';
import {
  AggregateRow,
  AppTab,
  RangeOption,
  RankThreshold,
  RpRecord,
  RpSummary,
  SortDirection,
} from './core/rp.model';
import { buildDailyRecords, buildSummary, buildWeeklyRecords } from './core/rp.utils';
import { AggregateTableComponent } from './features/dashboard/components/aggregate-table.component';
import { DashboardHeaderComponent } from './features/dashboard/components/dashboard-header.component';
import { DashboardToolbarComponent } from './features/dashboard/components/dashboard-toolbar.component';
import { RecordTableComponent } from './features/dashboard/components/record-table.component';
import { RpTrendChartComponent } from './features/dashboard/components/rp-trend-chart.component';
import { StateMessageComponent } from './features/dashboard/components/state-message.component';
import { SummaryStatsComponent } from './features/dashboard/components/summary-stats.component';
import { ViewTabsComponent } from './features/dashboard/components/view-tabs.component';

/**
 * Dashboard container (smart component): owns data loading and all
 * view state, and orchestrates the presentational child components.
 * Chart machinery and the data tables live in their own components.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DashboardHeaderComponent,
    SummaryStatsComponent,
    DashboardToolbarComponent,
    ViewTabsComponent,
    RpTrendChartComponent,
    RecordTableComponent,
    AggregateTableComponent,
    StateMessageComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly dataService = inject(RpDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadTrigger$ = new Subject<{ days: RangeOption; isRefresh: boolean }>();

  activeTab: AppTab = 'analysis';
  loading = true;
  refreshing = false;
  error = '';
  records: RpRecord[] = [];
  selectedRange: RangeOption = 30;
  lastUpdatedTime: Date | null = null;
  isDark = false;
  /** Bumped on theme toggle so the chart re-tints (CSS handles the rest). */
  themeVersion = 0;

  tableSortDir: SortDirection = 'desc';
  dailySortDir: SortDirection = 'desc';
  weeklySortDir: SortDirection = 'desc';

  readonly rangeOptions: RangeOption[] = [7, 30, 'all'];
  readonly tabs: { id: AppTab; label: string }[] = [
    { id: 'analysis', label: 'グラフ' },
    { id: 'table', label: 'データ' },
    { id: 'daily', label: '日別' },
    { id: 'weekly', label: '週別' },
  ];

  readonly rankThresholds: RankThreshold[] = [
    { minRp: 16000, rank: 'マスター' },
    { minRp: 15000, rank: 'ダイヤ1' },
    { minRp: 14000, rank: 'ダイヤ2' },
    { minRp: 13000, rank: 'ダイヤ3' },
    { minRp: 12000, rank: 'ダイヤ4' },
  ];

  summary: RpSummary = buildSummary([]);

  // Memoised aggregate rows — recomputed only when records / sort change.
  private dailyCache: { records: RpRecord[]; dir: SortDirection; rows: AggregateRow[] } | null = null;
  private weeklyCache: { records: RpRecord[]; dir: SortDirection; rows: AggregateRow[] } | null = null;

  constructor() {
    this.loadTrigger$
      .pipe(
        tap(({ isRefresh }) => {
          this.error = '';
          this.loading = !isRefresh;
          this.refreshing = isRefresh;
        }),
        switchMap(({ days }) =>
          this.dataService.fetchRecords(days).pipe(
            catchError((err: unknown) => {
              this.onLoadError(err);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((data) => this.onDataLoaded(data));
  }

  ngOnInit(): void {
    this.isDark = localStorage.getItem('dark-mode') !== 'false';
    document.documentElement.classList.toggle('light', !this.isDark);
    this.loadRecords();
  }

  get latestRank(): string {
    if (this.summary.latestRp === null) return '—';
    const rp = this.summary.latestRp;
    const matched = this.rankThresholds.find((t) => rp >= t.minRp);
    return matched ? matched.rank : 'ダイヤ未満';
  }

  get rangeLabel(): string {
    return this.selectedRange === 'all' ? '全期間' : `過去 ${this.selectedRange} 日間`;
  }

  get dailyRows(): AggregateRow[] {
    if (this.dailyCache?.records === this.records && this.dailyCache.dir === this.dailySortDir) {
      return this.dailyCache.rows;
    }
    const rows = buildDailyRecords(this.records, this.dailySortDir).map((d) => ({
      label: d.date,
      firstRp: d.firstRp,
      lastRp: d.lastRp,
      maxRp: d.maxRp,
      minRp: d.minRp,
      change: d.change,
      count: d.count,
    }));
    this.dailyCache = { records: this.records, dir: this.dailySortDir, rows };
    return rows;
  }

  get weeklyRows(): AggregateRow[] {
    if (this.weeklyCache?.records === this.records && this.weeklyCache.dir === this.weeklySortDir) {
      return this.weeklyCache.rows;
    }
    const rows = buildWeeklyRecords(this.records, this.weeklySortDir).map((w) => ({
      label: w.weekStart,
      subLabel: w.weekEnd,
      firstRp: w.firstRp,
      lastRp: w.lastRp,
      maxRp: w.maxRp,
      minRp: w.minRp,
      change: w.change,
      count: w.count,
    }));
    this.weeklyCache = { records: this.records, dir: this.weeklySortDir, rows };
    return rows;
  }

  toggleDark(): void {
    this.isDark = !this.isDark;
    document.documentElement.classList.toggle('light', !this.isDark);
    localStorage.setItem('dark-mode', String(this.isDark));
    this.themeVersion += 1;
    this.cdr.markForCheck();
  }

  onRangeChange(days: RangeOption): void {
    if (this.selectedRange === days) return;
    this.selectedRange = days;
    this.loadRecords();
  }

  refresh(): void {
    this.loadRecords(true);
  }

  setActiveTab(tab: AppTab): void {
    this.activeTab = tab;
  }

  toggleTableSort(): void { this.tableSortDir = this.tableSortDir === 'asc' ? 'desc' : 'asc'; this.cdr.markForCheck(); }
  toggleDailySort(): void { this.dailySortDir = this.dailySortDir === 'asc' ? 'desc' : 'asc'; this.cdr.markForCheck(); }
  toggleWeeklySort(): void { this.weeklySortDir = this.weeklySortDir === 'asc' ? 'desc' : 'asc'; this.cdr.markForCheck(); }

  downloadCsv(): void {
    if (this.records.length === 0) return;
    const header = ['id', 'rp', 'created_at'];
    const rows = this.records.map((r) => [r.id, r.rp, r.created_at]);
    const csv = [header, ...rows]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `apex-rp-${this.selectedRange}days.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private loadRecords(isRefresh = false): void {
    this.loadTrigger$.next({ days: this.selectedRange, isRefresh });
  }

  private onDataLoaded(data: RpRecord[]): void {
    this.records = data.filter((record) => record.rp > 0);
    this.summary = buildSummary(this.records);
    this.lastUpdatedTime = this.dataService.getLastUpdatedTime(this.selectedRange);
    this.loading = false;
    this.refreshing = false;
    this.cdr.markForCheck();
  }

  private onLoadError(err: unknown): void {
    const apiErr = err as { error?: { error?: string }; message?: string };
    const detail = apiErr?.error?.error ?? apiErr?.message ?? '';
    this.error = `データの取得に失敗しました。${detail ? ` (${detail})` : ' 時間をおいて再試行してください。'}`;
    this.loading = false;
    this.refreshing = false;
    this.cdr.markForCheck();
  }
}
