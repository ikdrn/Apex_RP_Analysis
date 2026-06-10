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
  imports: [CommonModule, NgChartsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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
  lastUpdatedTime: Date | null = null;
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

  getLastUpdatedText(): string {
    if (!this.lastUpdatedTime) return '';
    const now = Date.now();
    const diff = now - this.lastUpdatedTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'いま';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return `${days}日前`;
  }

  getLastUpdatedISO(): string {
    if (!this.lastUpdatedTime) return '';
    const date = new Date(this.lastUpdatedTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes} JST`;
  }

  // Chart.js can't read CSS custom properties, so the font stacks are
  // restated here. Colours are pulled from the theme variables at
  // runtime in applyChartTheme() so the chart tracks the active theme.
  private static readonly CHART_FONT_SANS = '"Chakra Petch", "Noto Sans JP", system-ui, sans-serif';
  private static readonly CHART_FONT_MONO = '"JetBrains Mono", ui-monospace, monospace';

  // Initial values match the dark (default) theme; applyChartTheme()
  // replaces them with the live CSS variables once data arrives.
  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'RP',
        data: [],
        borderColor: '#ff4d24',
        backgroundColor: 'rgba(255, 77, 36, 0.13)',
        borderWidth: 2,
        // Straight segments (no smoothing) with a flat area fill.
        tension: 0,
        fill: 'origin',
        pointStyle: 'circle',
        pointBackgroundColor: '#ff4d24',
        pointBorderColor: '#ff4d24',
        pointBorderWidth: 0,
        pointRadius: 0,
        pointHoverRadius: 4
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    // No entry / update animation — data snaps into place.
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#11141b',
        titleColor: '#e9edf3',
        bodyColor: '#e9edf3',
        borderColor: '#232936',
        borderWidth: 1,
        padding: 11,
        cornerRadius: 4,
        displayColors: false,
        titleFont: { family: AppComponent.CHART_FONT_MONO, size: 11 },
        bodyFont: { family: AppComponent.CHART_FONT_MONO, size: 13, weight: 600 },
        callbacks: { label: (ctx) => ` RP ${ctx.parsed.y?.toLocaleString() ?? ''}` }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#5f6b7e',
          font: { family: AppComponent.CHART_FONT_SANS, size: 11 },
          maxRotation: 45
        },
        grid: { display: false },
        border: { color: '#232936', width: 1 }
      },
      y: {
        ticks: {
          color: '#5f6b7e',
          font: { family: AppComponent.CHART_FONT_MONO, size: 11 },
          callback: (value) => value.toLocaleString()
        },
        grid: { color: '#1a1f29', lineWidth: 1 },
        border: { display: false }
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
    // Dark is the default; `.light` on <html> is the override. The same
    // check runs inline in index.html before first paint — this keeps
    // the component state in sync with it.
    this.isDark = localStorage.getItem('dark-mode') !== 'false';
    document.documentElement.classList.toggle('light', !this.isDark);
    this.loadRecords();
  }

  toggleDark(): void {
    this.isDark = !this.isDark;
    document.documentElement.classList.toggle('light', !this.isDark);
    localStorage.setItem('dark-mode', String(this.isDark));
    this.applyChartTheme();
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

  resetZoom(): void {
    if (!this.zoomBounds) return;
    this.zoomState = { ...this.zoomBounds };
    this.applyZoomOptions();
  }

  // Reads a CSS custom property from the document root so the chart
  // colours always match the active (light / dark) theme.
  private cssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private applyChartTheme(): void {
    const accent  = this.cssVar('--color-accent');
    const fill    = this.cssVar('--color-accent-soft');
    const grid    = this.cssVar('--color-grid');
    const line    = this.cssVar('--color-border');
    const tick    = this.cssVar('--color-text-subtle');
    const surface = this.cssVar('--color-surface');
    const text    = this.cssVar('--color-text');
    const sansFont = AppComponent.CHART_FONT_SANS;
    const monoFont = AppComponent.CHART_FONT_MONO;

    this.lineChartOptions = {
      ...this.lineChartOptions,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: surface,
          titleColor: text,
          bodyColor: text,
          borderColor: line,
          borderWidth: 1,
          padding: 11,
          cornerRadius: 4,
          displayColors: false,
          titleFont: { family: monoFont, size: 11 },
          bodyFont: { family: monoFont, size: 13, weight: 600 },
          callbacks: { label: (ctx) => ` RP ${ctx.parsed.y?.toLocaleString() ?? ''}` }
        }
      },
      scales: {
        x: {
          ticks: { color: tick, font: { family: sansFont, size: 11 }, maxRotation: 45 },
          grid: { display: false },
          border: { color: line, width: 1 }
        },
        y: {
          ticks: {
            color: tick,
            font: { family: monoFont, size: 11 },
            callback: (value) => value.toLocaleString()
          },
          grid: { color: grid, lineWidth: 1 },
          border: { display: false }
        }
      }
    };

    this.lineChartData = {
      ...this.lineChartData,
      datasets: [{
        ...this.lineChartData.datasets[0],
        borderColor: accent,
        backgroundColor: fill,
        fill: 'origin',
        pointBackgroundColor: accent,
        pointBorderColor: accent
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
    this.lastUpdatedTime = this.dataService.getLastUpdatedTime(this.selectedRange);

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
