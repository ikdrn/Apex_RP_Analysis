import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
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
import { NgChartsModule } from 'ng2-charts';
import { EMPTY, Subject, catchError, switchMap, tap } from 'rxjs';
import { DesignDocComponent } from './components/design-doc/design-doc.component';
import { RpDataService } from './core/rp-data.service';
import { AppTab, DailyRecord, RangeOption, RpRecord, RpSummary, SortDirection } from './core/rp.model';
import { buildChartLabels, buildDailyRecords, buildSummary, filterRecords, sortRecordsByDate } from './core/rp.utils';

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
  imports: [CommonModule, FormsModule, NgChartsModule, DesignDocComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  private readonly dataService = inject(RpDataService);
  private readonly loadTrigger$ = new Subject<{ days: RangeOption; isRefresh: boolean }>();

  activeTab: AppTab = 'analysis';
  loading = true;
  refreshing = false;
  error = '';
  records: RpRecord[] = [];
  selectedRange: RangeOption = 30;
  readonly rangeOptions: RangeOption[] = [7, 30];

  isDark = false;
  tableSortDir: SortDirection = 'asc';
  tableFilter = '';
  dailySortDir: SortDirection = 'desc';
  private summary: RpSummary = buildSummary([]);

  get latestRp(): number | null {
    return this.summary.latestRp;
  }

  get maxRp(): number | null {
    return this.summary.maxRp;
  }

  get minRp(): number | null {
    return this.summary.minRp;
  }

  get rpChange(): number | null {
    return this.summary.rpChange;
  }

  get avgRp(): number | null {
    return this.summary.avgRp;
  }

  get rpPerDay(): number | null {
    return this.summary.rpPerDay;
  }

  get sortedRecords(): RpRecord[] {
    return sortRecordsByDate(this.records, this.tableSortDir);
  }

  get filteredSortedRecords(): RpRecord[] {
    return filterRecords(this.sortedRecords, this.tableFilter);
  }

  get dailyRecords(): DailyRecord[] {
    return buildDailyRecords(this.records, this.dailySortDir);
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
        fill: true,
        pointBackgroundColor: '#1e40af',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  readonly lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (ctx) => ` RP: ${ctx.parsed.y?.toLocaleString() ?? ''}`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#6b7280', font: { size: 11 }, maxRotation: 45 },
        grid: { color: '#f3f4f6' },
        border: { color: '#e5e7eb' }
      },
      y: {
        ticks: {
          color: '#6b7280',
          font: { size: 11 },
          callback: (value) => value.toLocaleString()
        },
        grid: { color: '#f3f4f6' },
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
  }

  toggleDailySort(): void {
    this.dailySortDir = this.dailySortDir === 'asc' ? 'desc' : 'asc';
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

  private loadRecords(isRefresh = false): void {
    this.loadTrigger$.next({ days: this.selectedRange, isRefresh });
  }

  private onDataLoaded(data: RpRecord[]): void {
    this.records = data;
    this.summary = buildSummary(data);
    this.lineChartData = {
      labels: buildChartLabels(data),
      datasets: [{ ...this.lineChartData.datasets[0], data: data.map((record) => record.rp) }]
    };
    this.loading = false;
    this.refreshing = false;
  }

  private onLoadError(err: unknown): void {
    const apiErr = err as { error?: { error?: string }; message?: string };
    const detail = apiErr?.error?.error ?? apiErr?.message ?? '';
    this.error = `データの取得に失敗しました。${detail ? ` (${detail})` : ' 時間をおいて再試行してください。'}`;
    this.loading = false;
    this.refreshing = false;
  }
}
