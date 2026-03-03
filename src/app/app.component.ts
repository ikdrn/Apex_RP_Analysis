import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DatePipe, NgChartsModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  activeTab: 'analysis' | 'table' = 'analysis';
  loading = true;
  error = '';
  records: RpRecord[] = [];

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
    this.http.get<RpRecord[]>('/api/get-rp').subscribe({
      next: (data) => {
        this.records = data;
        this.lineChartData = {
          labels: data.map((item) =>
            new Date(item.created_at).toLocaleDateString('ja-JP', {
              month: 'numeric',
              day: 'numeric'
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
      },
      error: (err) => {
        const detail = err?.error?.error ?? err?.message ?? '';
        this.error = `データの取得に失敗しました。${detail ? '(' + detail + ')' : '時間をおいて再試行してください。'}`;
        this.loading = false;
      }
    });
  }
}
