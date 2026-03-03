import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  CategoryScale,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartConfiguration
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

type RpRecord = {
  id: number;
  rp: number;
  created_at: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  activeTab: 'analysis' | 'table' = 'analysis';
  loading = true;
  error = '';
  records: RpRecord[] = [];

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'RP',
        data: [],
        borderColor: '#1e3a8a',
        backgroundColor: '#1e3a8a',
        tension: 0.2,
        fill: false
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#1f2937'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#374151' },
        grid: { color: '#e5e7eb' }
      },
      y: {
        ticks: { color: '#374151' },
        grid: { color: '#e5e7eb' }
      }
    }
  };

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<RpRecord[]>('/api/get-rp').subscribe({
      next: (data) => {
        this.records = data;
        this.lineChartData = {
          labels: data.map((item) => new Date(item.created_at).toLocaleDateString('ja-JP')),
          datasets: [
            {
              ...this.lineChartData.datasets[0],
              data: data.map((item) => item.rp)
            }
          ]
        };
        this.loading = false;
      },
      error: () => {
        this.error = 'データの取得に失敗しました。時間をおいて再試行してください。';
        this.loading = false;
      }
    });
  }
}
