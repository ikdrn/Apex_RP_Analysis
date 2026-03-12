import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { DesignDocComponent } from './components/design-doc/design-doc.component';
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

type RpRecord = {
  id: number;
  rp: number;
  created_at: string;
};

type RangeOption = 7 | 30 | 90;

type DailyRecord = {
  date: string;
  firstRp: number;
  lastRp: number;
  maxRp: number;
  minRp: number;
  change: number;
  count: number;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, NgChartsModule, DesignDocComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  activeTab: 'analysis' | 'table' | 'daily' | 'design' = 'analysis';
  loading = true;
  refreshing = false;
  error = '';
  records: RpRecord[] = [];
  selectedRange: RangeOption = 30;
  readonly rangeOptions: RangeOption[] = [7, 30, 90];
  readonly apiPath = '/api/get-rp';

  // Dark mode
  isDark = false;

  // Data Table sort & filter
  tableSortDir: 'asc' | 'desc' = 'asc';
  tableFilter = '';

  // Daily tab sort
  dailySortDir: 'asc' | 'desc' = 'desc';

  get latestRp(): number | null {
    if (this.records.length === 0) return null;
    return this.records[this.records.length - 1].rp;
  }

  get maxRp(): number | null {
    if (this.records.length === 0) return null;
    return Math.max(...this.records.map((r) => r.rp));
  }

  get minRp(): number | null {
    if (this.records.length === 0) return null;
    return Math.min(...this.records.map((r) => r.rp));
  }

  get rpChange(): number | null {
    if (this.records.length < 2) return null;
    return this.records[this.records.length - 1].rp - this.records[0].rp;
  }

  get avgRp(): number | null {
    if (this.records.length === 0) return null;
    return Math.round(
      this.records.reduce((sum, r) => sum + r.rp, 0) / this.records.length
    );
  }

  get rpPerDay(): number | null {
    if (this.records.length < 2) return null;
    const first = new Date(this.records[0].created_at).getTime();
    const last = new Date(this.records[this.records.length - 1].created_at).getTime();
    const days = (last - first) / (1000 * 60 * 60 * 24);
    if (days < 0.01) return null;
    const change = this.records[this.records.length - 1].rp - this.records[0].rp;
    return Math.round((change / days) * 10) / 10;
  }

  get sortedRecords(): RpRecord[] {
    const copy = [...this.records];
    copy.sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return this.tableSortDir === 'asc' ? diff : -diff;
    });
    return copy;
  }

  get filteredSortedRecords(): RpRecord[] {
    const q = this.tableFilter.trim().toLowerCase();
    if (!q) return this.sortedRecords;
    return this.sortedRecords.filter((r) => {
      const dateStr = new Date(r.created_at)
        .toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        .toLowerCase();
      return (
        String(r.rp).includes(q) ||
        dateStr.includes(q)
      );
    });
  }

  get dailyRecords(): DailyRecord[] {
    const map = new Map<string, RpRecord[]>();
    for (const r of this.records) {
      const dateKey = new Date(r.created_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Tokyo'
      });
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(r);
    }

    const result: DailyRecord[] = [];
    for (const [date, recs] of map.entries()) {
      const rps = recs.map(r => r.rp);
      result.push({
        date,
        firstRp: recs[0].rp,
        lastRp: recs[recs.length - 1].rp,
        maxRp: Math.max(...rps),
        minRp: Math.min(...rps),
        change: recs[recs.length - 1].rp - recs[0].rp,
        count: recs.length
      });
    }

    result.sort((a, b) => {
      const diff = a.date.localeCompare(b.date);
      return this.dailySortDir === 'asc' ? diff : -diff;
    });
    return result;
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

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: false
      },
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
        ticks: {
          color: '#6b7280',
          font: { size: 11 },
          maxRotation: 45
        },
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

  constructor(private readonly http: HttpClient) {}

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
    if (this.selectedRange === days) {
      return;
    }

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
    if (this.records.length === 0) {
      return;
    }

    const header = ['id', 'rp', 'created_at'];
    const rows = this.records.map((row) => [row.id, row.rp, row.created_at]);
    const csv = [header, ...rows]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
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
    this.error = '';
    this.loading = !isRefresh;
    this.refreshing = isRefresh;

    this.http.get<RpRecord[]>(this.apiPath, { params: { days: String(this.selectedRange) } }).subscribe({
      next: (data) => {
        this.records = data;

        const dateOnlyStrings = data.map((item) =>
          new Date(item.created_at).toLocaleDateString('ja-JP', {
            month: 'numeric',
            day: 'numeric',
            timeZone: 'Asia/Tokyo'
          })
        );

        const dateCount = new Map<string, number>();
        for (const d of dateOnlyStrings) {
          dateCount.set(d, (dateCount.get(d) ?? 0) + 1);
        }

        const labels = data.map((item, i) => {
          const dateStr = dateOnlyStrings[i];
          if ((dateCount.get(dateStr) ?? 0) > 1) {
            const hh = new Date(item.created_at).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Tokyo'
            });
            return `${dateStr} ${hh}`;
          }
          return dateStr;
        });

        this.lineChartData = {
          labels,
          datasets: [
            {
              ...this.lineChartData.datasets[0],
              data: data.map((item) => item.rp)
            }
          ]
        };
        this.loading = false;
        this.refreshing = false;
      },
      error: (err) => {
        const detail = err?.error?.error ?? err?.message ?? '';
        this.error = `データの取得に失敗しました。${detail ? ` (${detail})` : ' 時間をおいて再試行してください。'}`;
        this.loading = false;
        this.refreshing = false;
      }
    });
  }
}
