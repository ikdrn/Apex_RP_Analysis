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

type RangeOption = 7 | 30 | 90;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DatePipe, NgChartsModule, DesignDocComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  activeTab: 'analysis' | 'table' | 'design' = 'analysis';
  loading = true;
  refreshing = false;
  error = '';
  records: RpRecord[] = [];
  selectedRange: RangeOption = 30;
  readonly rangeOptions: RangeOption[] = [7, 30, 90];
  readonly apiPath = '/api/get-rp';

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
