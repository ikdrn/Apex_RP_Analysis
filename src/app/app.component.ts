import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
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

type RangeOption = 7 | 30;

type DailySummary = {
  date: string;
  maxRp: number;
  minRp: number;
  change: number;
  lastRp: number;
};

type RankInfo = {
  name: string;
  tier: string;
  colorClass: string;
};

// Diamond以上はユーザー確認済み。下位ランクは一般仕様に基づく近似値。
const RANK_THRESHOLDS: { min: number; name: string; tier: string; colorClass: string }[] = [
  { min: 16000, name: 'Master',    tier: '',    colorClass: 'bg-purple-100 text-purple-800' },
  { min: 15000, name: 'Diamond',   tier: 'I',   colorClass: 'bg-cyan-100 text-cyan-800' },
  { min: 14000, name: 'Diamond',   tier: 'II',  colorClass: 'bg-cyan-100 text-cyan-800' },
  { min: 13000, name: 'Diamond',   tier: 'III', colorClass: 'bg-cyan-100 text-cyan-800' },
  { min: 12000, name: 'Diamond',   tier: 'IV',  colorClass: 'bg-cyan-100 text-cyan-800' },
  { min: 11000, name: 'Platinum',  tier: 'I',   colorClass: 'bg-teal-100 text-teal-800' },
  { min: 10000, name: 'Platinum',  tier: 'II',  colorClass: 'bg-teal-100 text-teal-800' },
  { min: 9000,  name: 'Platinum',  tier: 'III', colorClass: 'bg-teal-100 text-teal-800' },
  { min: 8000,  name: 'Platinum',  tier: 'IV',  colorClass: 'bg-teal-100 text-teal-800' },
  { min: 7000,  name: 'Gold',      tier: 'I',   colorClass: 'bg-yellow-100 text-yellow-800' },
  { min: 6000,  name: 'Gold',      tier: 'II',  colorClass: 'bg-yellow-100 text-yellow-800' },
  { min: 5000,  name: 'Gold',      tier: 'III', colorClass: 'bg-yellow-100 text-yellow-800' },
  { min: 4000,  name: 'Gold',      tier: 'IV',  colorClass: 'bg-yellow-100 text-yellow-800' },
  { min: 3000,  name: 'Silver',    tier: 'I',   colorClass: 'bg-slate-100 text-slate-600' },
  { min: 2500,  name: 'Silver',    tier: 'II',  colorClass: 'bg-slate-100 text-slate-600' },
  { min: 2000,  name: 'Silver',    tier: 'III', colorClass: 'bg-slate-100 text-slate-600' },
  { min: 1500,  name: 'Silver',    tier: 'IV',  colorClass: 'bg-slate-100 text-slate-600' },
  { min: 1000,  name: 'Bronze',    tier: 'I',   colorClass: 'bg-orange-100 text-orange-800' },
  { min: 750,   name: 'Bronze',    tier: 'II',  colorClass: 'bg-orange-100 text-orange-800' },
  { min: 500,   name: 'Bronze',    tier: 'III', colorClass: 'bg-orange-100 text-orange-800' },
  { min: 250,   name: 'Bronze',    tier: 'IV',  colorClass: 'bg-orange-100 text-orange-800' },
  { min: 0,     name: 'Rookie',    tier: '',    colorClass: 'bg-gray-100 text-gray-600' }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DatePipe, NgChartsModule, DesignDocComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  activeTab: 'analysis' | 'table' | 'daily' | 'design' = 'analysis';
  loading = true;
  refreshing = false;
  error = '';
  records: RpRecord[] = [];
  selectedRange: RangeOption = 30;
  readonly rangeOptions: RangeOption[] = [7, 30];
  readonly apiPath = '/api/get-rp';

  // RP統計ゲッター
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

  // 平均RP/日
  get rpPerDay(): number | null {
    if (this.records.length < 2) return null;
    const first = this.records[0];
    const last = this.records[this.records.length - 1];
    const daysDiff =
      (new Date(last.created_at).getTime() - new Date(first.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysDiff <= 0) return null;
    return Math.round((last.rp - first.rp) / daysDiff);
  }

  // ランク関連ゲッター
  get rankLabel(): string {
    if (this.latestRp === null) return '—';
    const info = this.getRankInfo(this.latestRp);
    return info.tier ? `${info.name} ${info.tier}` : info.name;
  }

  get rankColorClass(): string {
    if (this.latestRp === null) return 'bg-gray-100 text-gray-600';
    return this.getRankInfo(this.latestRp).colorClass;
  }

  // 日次集計
  get dailySummary(): DailySummary[] {
    const grouped = new Map<string, RpRecord[]>();

    for (const record of this.records) {
      const date = new Date(record.created_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Tokyo'
      });
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(record);
    }

    const result: DailySummary[] = [];
    grouped.forEach((recs, date) => {
      const rps = recs.map((r) => r.rp);
      result.push({
        date,
        maxRp: Math.max(...rps),
        minRp: Math.min(...rps),
        change: recs[recs.length - 1].rp - recs[0].rp,
        lastRp: recs[recs.length - 1].rp
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
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
    this.loadRecords();
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

  getRankInfo(rp: number): RankInfo {
    const rank = RANK_THRESHOLDS.find((r) => rp >= r.min);
    return rank ?? RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
  }

  private loadRecords(isRefresh = false): void {
    this.error = '';
    this.loading = !isRefresh;
    this.refreshing = isRefresh;

    this.http.get<RpRecord[]>(this.apiPath, { params: { days: String(this.selectedRange) } }).subscribe({
      next: (data) => {
        this.records = data;
        this.lineChartData = {
          labels: data.map((item) =>
            new Date(item.created_at).toLocaleDateString('ja-JP', {
              month: 'numeric',
              day: 'numeric',
              timeZone: 'Asia/Tokyo'
            })
          ),
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
