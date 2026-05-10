import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Chart,
  CategoryScale,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  type ChartConfiguration
} from 'chart.js';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { EMPTY, Subject, catchError, switchMap, tap } from 'rxjs';
import { DesignDocComponent } from './components/design-doc/design-doc.component';
import { RpDataService } from './core/rp-data.service';
import { AppTab, DailyRecord, RangeOption, RpRecord, RpSummary, SortDirection, WeeklyRecord } from './core/rp.model';
import { buildChartLabels, buildDailyRecords, buildRecordDiffMap, buildSummary, buildWeeklyRecords, sortRecordsByDate } from './core/rp.utils';


type RankThreshold = {
  minRp: number;
  rank: string;
};

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgChartsModule, DesignDocComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  private readonly dataService = inject(RpDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadTrigger$ = new Subject<{ days: RangeOption; isRefresh: boolean }>();
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  activeTab: AppTab = 'analysis';
  loading = true;
  refreshing = false;
  error = '';
  records: RpRecord[] = [];
  selectedRange: RangeOption = 30;
  readonly rangeOptions: RangeOption[] = [7, 30, 'all'];

  rangeLabel(range: RangeOption): string {
    return range === 'all' ? '全期間' : `${range}日`;
  }

  readonly rankThresholds: RankThreshold[] = [
    { minRp: 16000, rank: 'マスター' },
    { minRp: 15000, rank: 'ダイヤ1' },
    { minRp: 14000, rank: 'ダイヤ2' },
    { minRp: 13000, rank: 'ダイヤ3' },
    { minRp: 12000, rank: 'ダイヤ4' },
  ];


  isDark = false;
  tableSortDir: SortDirection = 'desc';
  dailySortDir: SortDirection = 'desc';
  weeklySortDir: SortDirection = 'desc';
  private summary: RpSummary = buildSummary([]);
  private recordDiffs = new Map<number, number | null>();
  private zoomBounds: { xMin: number; xMax: number; yMin: number; yMax: number } | null = null;
  private zoomState: { xMin: number; xMax: number; yMin: number; yMax: number } | null = null;

  // Memoization caches for aggregations
  private dailyRecordsCache: { records: RpRecord[], sortDir: SortDirection, result: DailyRecord[] } | null = null;
  private weeklyRecordsCache: { records: RpRecord[], sortDir: SortDirection, result: WeeklyRecord[] } | null = null;

  get latestRp(): number | null { return this.summary.latestRp; }
  get maxRp(): number | null { return this.summary.maxRp; }
  get minRp(): number | null { return this.summary.minRp; }
  get rpChange(): number | null { return this.summary.rpChange; }
  get avgRp(): number | null { return this.summary.avgRp; }
  get rpPerDay(): number | null { return this.summary.rpPerDay; }
  get canResetZoom(): boolean {
    if (!this.zoomBounds || !this.zoomState) return false;
    return this.zoomState.xMin !== this.zoomBounds.xMin
      || this.zoomState.xMax !== this.zoomBounds.xMax
      || this.zoomState.yMin !== this.zoomBounds.yMin
      || this.zoomState.yMax !== this.zoomBounds.yMax;
  }


  get latestRank(): string {
    if (this.latestRp === null) {
      return '—';
    }

    const currentRp = this.latestRp;
    const matched = this.rankThresholds.find((threshold) => currentRp >= threshold.minRp);
    return matched ? matched.rank : 'ダイヤ未満';
  }

  get sortedRecords(): RpRecord[] {
    return sortRecordsByDate(this.records, this.tableSortDir);
  }

  get dailyRecords(): DailyRecord[] {
    // Return cached result if inputs haven't changed
    if (this.dailyRecordsCache?.records === this.records && this.dailyRecordsCache?.sortDir === this.dailySortDir) {
      return this.dailyRecordsCache.result;
    }
    // Compute and cache the result
    const result = buildDailyRecords(this.records, this.dailySortDir);
    this.dailyRecordsCache = { records: this.records, sortDir: this.dailySortDir, result };
    return result;
  }

  get weeklyRecords(): WeeklyRecord[] {
    // Return cached result if inputs haven't changed
    if (this.weeklyRecordsCache?.records === this.records && this.weeklyRecordsCache?.sortDir === this.weeklySortDir) {
      return this.weeklyRecordsCache.result;
    }
    // Compute and cache the result
    const result = buildWeeklyRecords(this.records, this.weeklySortDir);
    this.weeklyRecordsCache = { records: this.records, sortDir: this.weeklySortDir, result };
    return result;
  }

  getRecordDiff(record: RpRecord): number | null {
    return this.recordDiffs.get(record.id) ?? null;
  }

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'RP',
        data: [],
        borderColor: '#1e40af',
        backgroundColor: 'rgba(30, 64, 175, 0.08)',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointBackgroundColor: '#1e40af',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        callbacks: { label: (ctx) => ` RP: ${ctx.parsed.y?.toLocaleString() ?? ''}` }
      }
    },
    scales: {
      x: {
        ticks: { color: '#6b7280', font: { size: 11 }, maxRotation: 45 },
        grid: { color: '#e5e7eb' },
        border: { color: '#e5e7eb' }
      },
      y: {
        ticks: { color: '#6b7280', font: { size: 11 }, callback: (value) => value.toLocaleString() },
        grid: { color: '#e5e7eb' },
        border: { color: '#e5e7eb' }
      }
    }
  };

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
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((data) => this.onDataLoaded(data));
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('dark-mode');
    if (saved === 'true') {
      this.isDark = true;
      document.documentElement.classList.add('dark');
    }
    this.loadRecords();
  }

  toggleDark(): void {
    this.isDark = !this.isDark;
    document.documentElement.classList.toggle('dark', this.isDark);
    localStorage.setItem('dark-mode', String(this.isDark));
    this.applyChartTheme();
    this.cdr.markForCheck();
  }

  showDesignDoc(): void {
    this.activeTab = 'design';
  }

  onRangeChange(days: RangeOption): void {
    if (this.selectedRange === days) return;
    this.selectedRange = days;
    this.loadRecords();
  }

  refresh(): void {
    this.loadRecords(true);
  }

  toggleTableSort(): void {
    this.tableSortDir = this.tableSortDir === 'asc' ? 'desc' : 'asc';
    this.cdr.markForCheck();
  }

  toggleDailySort(): void {
    this.dailySortDir = this.dailySortDir === 'asc' ? 'desc' : 'asc';
    this.cdr.markForCheck();
  }

  toggleWeeklySort(): void {
    this.weeklySortDir = this.weeklySortDir === 'asc' ? 'desc' : 'asc';
    this.cdr.markForCheck();
  }

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

  onChartWheel(event: WheelEvent): void {
    event.preventDefault();
    if (!this.zoomBounds || this.records.length < 2) return;
    if (event.shiftKey) {
      this.panChart(0, event.deltaY > 0 ? 0.15 : -0.15);
      return;
    }
    if (event.altKey) {
      this.panChart(event.deltaY > 0 ? 0.15 : -0.15, 0);
      return;
    }
    const zoomIn = event.deltaY < 0;
    this.zoomChart(zoomIn ? 0.85 : 1.15);
  }

  dragState: {
    startX: number;
    startY: number;
    startZoom: { xMin: number; xMax: number; yMin: number; yMax: number };
    chartArea: { left: number; right: number; top: number; bottom: number };
  } | null = null;

  onChartPointerDown(event: PointerEvent): void {
    if (!this.zoomBounds || !this.zoomState || this.records.length < 2) return;
    const chartInstance = this.chart?.chart;
    const area = chartInstance?.chartArea;
    if (!area) return;

    this.dragState = {
      startX: event.clientX,
      startY: event.clientY,
      startZoom: { ...this.zoomState },
      chartArea: { left: area.left, right: area.right, top: area.top, bottom: area.bottom },
    };
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  onChartPointerMove(event: PointerEvent): void {
    if (!this.dragState || !this.zoomBounds) return;
    event.preventDefault();

    const dx = event.clientX - this.dragState.startX;
    const dy = event.clientY - this.dragState.startY;
    const { startZoom, chartArea } = this.dragState;
    const pixelWidth = Math.max(1, chartArea.right - chartArea.left);
    const pixelHeight = Math.max(1, chartArea.bottom - chartArea.top);
    const xSpan = startZoom.xMax - startZoom.xMin;
    const ySpan = startZoom.yMax - startZoom.yMin;

    // Drag right -> data shifts right (view moves left in data terms).
    const xShift = -(dx / pixelWidth) * xSpan;
    const yShift = (dy / pixelHeight) * ySpan;

    this.applyPanFromAbsolute(startZoom, xShift, yShift);
  }

  onChartPointerUp(event: PointerEvent): void {
    if (!this.dragState) return;
    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
    this.dragState = null;
  }

  private applyPanFromAbsolute(
    base: { xMin: number; xMax: number; yMin: number; yMax: number },
    xShift: number,
    yShift: number,
  ): void {
    if (!this.zoomBounds) return;
    const { xMin: bXMin, xMax: bXMax, yMin: bYMin, yMax: bYMax } = this.zoomBounds;

    let nextXMin = base.xMin + xShift;
    let nextXMax = base.xMax + xShift;
    if (nextXMin < bXMin) {
      nextXMax += bXMin - nextXMin;
      nextXMin = bXMin;
    }
    if (nextXMax > bXMax) {
      nextXMin -= nextXMax - bXMax;
      nextXMax = bXMax;
    }

    let nextYMin = base.yMin + yShift;
    let nextYMax = base.yMax + yShift;
    if (nextYMin < bYMin) {
      nextYMax += bYMin - nextYMin;
      nextYMin = bYMin;
    }
    if (nextYMax > bYMax) {
      nextYMin -= nextYMax - bYMax;
      nextYMax = bYMax;
    }

    this.zoomState = { xMin: nextXMin, xMax: nextXMax, yMin: nextYMin, yMax: nextYMax };
    this.applyZoomOptions();
  }

  zoomIn(): void {
    this.zoomChart(0.85);
  }

  zoomOut(): void {
    this.zoomChart(1.15);
  }

  panUp(): void {
    this.panChart(0, -0.15);
  }

  panDown(): void {
    this.panChart(0, 0.15);
  }

  panLeft(): void {
    this.panChart(-0.15, 0);
  }

  panRight(): void {
    this.panChart(0.15, 0);
  }

  resetZoom(): void {
    if (!this.zoomBounds) return;
    this.zoomState = { ...this.zoomBounds };
    this.applyZoomOptions();
  }

  private applyChartTheme(): void {
    const dark = this.isDark;
    const gridColor       = dark ? '#475569' : '#e5e7eb';
    const borderColor     = dark ? '#334155' : '#e5e7eb';
    const tickColor       = dark ? '#cbd5e1' : '#6b7280';
    const lineColor       = dark ? '#3b82f6' : '#1e40af';
    const fillColor       = dark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(30, 64, 175, 0.08)';
    const pointBorderColor = dark ? '#0f172a' : '#ffffff';

    this.lineChartOptions = {
      ...this.lineChartOptions,
      scales: {
        x: {
          ticks: { color: tickColor, font: { size: 11 }, maxRotation: 45 },
          grid: { color: gridColor },
          border: { color: borderColor }
        },
        y: {
          ticks: { color: tickColor, font: { size: 11 }, callback: (value) => value.toLocaleString() },
          grid: { color: gridColor },
          border: { color: borderColor }
        }
      }
    };

    this.lineChartData = {
      ...this.lineChartData,
      datasets: [{
        ...this.lineChartData.datasets[0],
        borderColor: lineColor,
        backgroundColor: fillColor,
        pointBackgroundColor: lineColor,
        pointBorderColor
      }]
    };
  }

  private loadRecords(isRefresh = false): void {
    this.loadTrigger$.next({ days: this.selectedRange, isRefresh });
  }

  private decimateData(records: RpRecord[], maxPoints: number = 500): RpRecord[] {
    if (records.length <= maxPoints) return records;
    const decimateFactor = Math.ceil(records.length / maxPoints);
    return records.filter((_, i) => i % decimateFactor === 0);
  }

  private onDataLoaded(data: RpRecord[]): void {
    this.records = data.filter((record) => record.rp > 0);
    this.summary = buildSummary(this.records);
    this.recordDiffs = buildRecordDiffMap(this.records);

    // Decimate data for rendering to improve performance
    const decimatedRecords = this.decimateData(this.records);

    this.lineChartData = {
      labels: buildChartLabels(decimatedRecords),
      datasets: [{ ...this.lineChartData.datasets[0], data: decimatedRecords.map((record) => record.rp) }]
    };
    this.applyChartTheme();
    this.initializeZoomBounds(decimatedRecords);
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
  }

  private initializeZoomBounds(data: RpRecord[]): void {
    if (data.length === 0) {
      this.zoomBounds = null;
      this.zoomState = null;
      return;
    }

    const yValues = data.map((record) => record.rp);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const yPadding = Math.max(50, Math.round((yMax - yMin) * 0.1));
    this.zoomBounds = {
      xMin: 0,
      xMax: Math.max(1, data.length - 1),
      yMin: yMin - yPadding,
      yMax: yMax + yPadding
    };
    this.zoomState = { ...this.zoomBounds };
    this.applyZoomOptions();
  }

  private zoomChart(zoomFactor: number): void {
    if (!this.zoomBounds || !this.zoomState) return;

    const { xMin: bXMin, xMax: bXMax, yMin: bYMin, yMax: bYMax } = this.zoomBounds;
    const current = this.zoomState;
    const xCenter = (current.xMin + current.xMax) / 2;
    const yCenter = (current.yMin + current.yMax) / 2;
    const nextXHalf = Math.max(1, ((current.xMax - current.xMin + 1) * zoomFactor) / 2);
    const nextYHalf = Math.max(50, ((current.yMax - current.yMin) * zoomFactor) / 2);

    const xMin = Math.max(bXMin, Math.round(xCenter - nextXHalf));
    const xMax = Math.min(bXMax, Math.round(xCenter + nextXHalf));
    const yMin = Math.max(bYMin, Math.round(yCenter - nextYHalf));
    const yMax = Math.min(bYMax, Math.round(yCenter + nextYHalf));

    if (xMax - xMin < 1 || yMax - yMin < 100) return;

    this.zoomState = { xMin, xMax, yMin, yMax };
    this.applyZoomOptions();
  }

  private panChart(xRatio: number, yRatio: number): void {
    if (!this.zoomBounds || !this.zoomState) return;

    const { xMin: bXMin, xMax: bXMax, yMin: bYMin, yMax: bYMax } = this.zoomBounds;
    const current = this.zoomState;
    const xSpan = current.xMax - current.xMin;
    const ySpan = current.yMax - current.yMin;
    const xShift = Math.round(xSpan * xRatio);
    const yShift = Math.round(ySpan * yRatio);

    let nextXMin = current.xMin + xShift;
    let nextXMax = current.xMax + xShift;
    if (nextXMin < bXMin) {
      nextXMax += bXMin - nextXMin;
      nextXMin = bXMin;
    }
    if (nextXMax > bXMax) {
      nextXMin -= nextXMax - bXMax;
      nextXMax = bXMax;
    }

    let nextYMin = current.yMin + yShift;
    let nextYMax = current.yMax + yShift;
    if (nextYMin < bYMin) {
      nextYMax += bYMin - nextYMin;
      nextYMin = bYMin;
    }
    if (nextYMax > bYMax) {
      nextYMin -= nextYMax - bYMax;
      nextYMax = bYMax;
    }

    this.zoomState = { xMin: nextXMin, xMax: nextXMax, yMin: nextYMin, yMax: nextYMax };
    this.applyZoomOptions();
  }

  private applyZoomOptions(): void {
    const nextZoom = this.zoomState;
    const currentScales = (this.lineChartOptions?.scales ?? {}) as NonNullable<ChartConfiguration<'line'>['options']>['scales'];
    this.lineChartOptions = {
      ...this.lineChartOptions,
      scales: {
        x: {
          ...currentScales?.['x'],
          min: nextZoom?.xMin,
          max: nextZoom?.xMax
        },
        y: {
          ...currentScales?.['y'],
          min: nextZoom?.yMin,
          max: nextZoom?.yMax
        }
      }
    };
    this.chart?.update();
    this.cdr.markForCheck();
  }
}
