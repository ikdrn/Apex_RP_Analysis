import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { RpRecord } from '../../../core/rp.model';
import { buildChartLabels } from '../../../core/rp.utils';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

type Bounds = { xMin: number; xMax: number; yMin: number; yMax: number };

/**
 * RP time-series line chart with self-contained zoom / pan
 * (wheel zoom, drag pan, Shift+wheel vertical, Alt+wheel horizontal,
 * and zoom-in / out / reset buttons) plus 500-point decimation. All
 * the chart machinery that used to bloat the root component lives here.
 */
@Component({
  selector: 'app-rp-trend-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card__head">
        <span class="card__title">RP 推移 <span class="card__count">{{ pointCount }} 件</span></span>
        <div class="card__tools">
          <button type="button" class="tool-btn" (click)="zoomOut()" aria-label="縮小">縮小</button>
          <button type="button" class="tool-btn" (click)="zoomIn()" aria-label="拡大">拡大</button>
          <button type="button" class="tool-btn" [disabled]="!canResetZoom" (click)="resetZoom()" aria-label="表示をリセット">リセット</button>
        </div>
      </div>
      <div
        class="chart-plot"
        [class.is-dragging]="!!dragState"
        (wheel)="onWheel($event)"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp($event)"
        (pointercancel)="onPointerUp($event)"
      >
        <canvas baseChart [data]="data" [options]="options" [type]="'line'"></canvas>
      </div>
      <p class="chart-hint">ドラッグで移動 · ホイールで拡大縮小 / Shift+上下 / Alt+左右</p>
    </div>
  `,
  styles: [`
    @use 'variables' as *;
    @use 'utilities' as *;

    .card { @include card; overflow: hidden; }
    .card__head {
      display: flex; align-items: center; justify-content: space-between;
      gap: $sp-12; padding: $sp-10 $sp-12;
      border-bottom: $bd-hair solid var(--color-border);
    }
    .card__title { @include display(700); font-size: 14px; }
    .card__count { @include mono(500); font-size: 12px; color: var(--color-text-subtle); margin-left: $sp-6; }

    .card__tools { display: flex; gap: $sp-6; }
    .tool-btn {
      @include control;
      @include display(600);
      font-size: 11.5px; padding: $sp-3 $sp-10; color: var(--color-text-muted);
      &:hover:not(:disabled) { color: var(--color-text); border-color: var(--color-text-subtle); }
      &:disabled { opacity: 0.45; cursor: not-allowed; }
    }

    .chart-plot {
      position: relative;
      height: 360px;
      padding: $sp-12;
      cursor: grab;
      touch-action: none;
      &.is-dragging { cursor: grabbing; }
    }

    .chart-hint {
      padding: 0 $sp-12 $sp-10;
      font-size: 11.5px;
      color: var(--color-text-subtle);
    }
  `]
})
export class RpTrendChartComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  @Input({ required: true }) records: RpRecord[] = [];
  /** Bumped by the container on theme toggle to re-tint the chart. */
  @Input() themeVersion = 0;

  pointCount = 0;
  dragState: {
    startX: number; startY: number; startZoom: Bounds;
    chartArea: { left: number; right: number; top: number; bottom: number };
  } | null = null;

  private zoomBounds: Bounds | null = null;
  private zoomState: Bounds | null = null;

  // Chart.js can't read CSS custom properties, so the font stacks are
  // restated here; colours are pulled from the live theme variables.
  private static readonly FONT_SANS = '"Noto Sans JP", system-ui, sans-serif';
  private static readonly FONT_MONO = '"JetBrains Mono", ui-monospace, monospace';

  data: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      label: 'RP',
      data: [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.14)',
      borderWidth: 2,
      tension: 0,
      fill: 'origin',
      pointStyle: 'circle',
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#3b82f6',
      pointBorderWidth: 0,
      pointRadius: 0,
      pointHoverRadius: 4,
    }]
  };

  options: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 45 } },
      y: {},
    }
  };

  get canResetZoom(): boolean {
    if (!this.zoomBounds || !this.zoomState) return false;
    return this.zoomState.xMin !== this.zoomBounds.xMin
      || this.zoomState.xMax !== this.zoomBounds.xMax
      || this.zoomState.yMin !== this.zoomBounds.yMin
      || this.zoomState.yMax !== this.zoomBounds.yMax;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['records']) {
      this.rebuild();
    } else if (changes['themeVersion']) {
      this.applyTheme();
      this.chart?.update();
      this.cdr.markForCheck();
    }
  }

  private rebuild(): void {
    const decimated = this.decimate(this.records);
    this.pointCount = decimated.length;
    this.data = {
      labels: buildChartLabels(decimated),
      datasets: [{ ...this.data.datasets[0], data: decimated.map((r) => r.rp) }],
    };
    this.applyTheme();
    this.initZoomBounds(decimated);
    this.cdr.markForCheck();
  }

  private decimate(records: RpRecord[], maxPoints = 500): RpRecord[] {
    if (records.length <= maxPoints) return records;
    const factor = Math.ceil(records.length / maxPoints);
    return records.filter((_, i) => i % factor === 0);
  }

  private cssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private applyTheme(): void {
    const accent = this.cssVar('--color-accent');
    const fill = this.cssVar('--color-accent-soft');
    const grid = this.cssVar('--color-grid');
    const line = this.cssVar('--color-border');
    const tick = this.cssVar('--color-text-subtle');
    const surface = this.cssVar('--color-surface');
    const text = this.cssVar('--color-text');
    const sans = RpTrendChartComponent.FONT_SANS;
    const mono = RpTrendChartComponent.FONT_MONO;

    const currentScales = (this.options?.scales ?? {}) as NonNullable<ChartConfiguration<'line'>['options']>['scales'];

    this.options = {
      ...this.options,
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
          titleFont: { family: mono, size: 11 },
          bodyFont: { family: mono, size: 13, weight: 600 },
          callbacks: { label: (ctx) => ` RP ${ctx.parsed.y?.toLocaleString() ?? ''}` },
        }
      },
      scales: {
        x: {
          ...currentScales?.['x'],
          ticks: { color: tick, font: { family: sans, size: 11 }, maxRotation: 45 },
          grid: { display: false },
          border: { color: line, width: 1 },
        },
        y: {
          ...currentScales?.['y'],
          ticks: { color: tick, font: { family: mono, size: 11 }, callback: (v) => v.toLocaleString() },
          grid: { color: grid, lineWidth: 1 },
          border: { display: false },
        }
      }
    };

    this.data = {
      ...this.data,
      datasets: [{
        ...this.data.datasets[0],
        borderColor: accent,
        backgroundColor: fill,
        fill: 'origin',
        pointBackgroundColor: accent,
        pointBorderColor: accent,
      }]
    };
  }

  // ── Zoom / pan ─────────────────────────────────────────────

  private initZoomBounds(data: RpRecord[]): void {
    if (data.length === 0) {
      this.zoomBounds = null;
      this.zoomState = null;
      return;
    }
    const ys = data.map((r) => r.rp);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const pad = Math.max(50, Math.round((yMax - yMin) * 0.1));
    this.zoomBounds = { xMin: 0, xMax: Math.max(1, data.length - 1), yMin: yMin - pad, yMax: yMax + pad };
    this.zoomState = { ...this.zoomBounds };
    this.applyZoom();
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (!this.zoomBounds || this.pointCount < 2) return;
    if (event.shiftKey) { this.pan(0, event.deltaY > 0 ? 0.15 : -0.15); return; }
    if (event.altKey) { this.pan(event.deltaY > 0 ? 0.15 : -0.15, 0); return; }
    this.zoom(event.deltaY < 0 ? 0.85 : 1.15);
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.zoomBounds || !this.zoomState || this.pointCount < 2) return;
    const area = this.chart?.chart?.chartArea;
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

  onPointerMove(event: PointerEvent): void {
    if (!this.dragState || !this.zoomBounds) return;
    event.preventDefault();
    const dx = event.clientX - this.dragState.startX;
    const dy = event.clientY - this.dragState.startY;
    const { startZoom, chartArea } = this.dragState;
    const pw = Math.max(1, chartArea.right - chartArea.left);
    const ph = Math.max(1, chartArea.bottom - chartArea.top);
    const xShift = -(dx / pw) * (startZoom.xMax - startZoom.xMin);
    const yShift = (dy / ph) * (startZoom.yMax - startZoom.yMin);
    this.applyPanFromAbsolute(startZoom, xShift, yShift);
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.dragState) return;
    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
    this.dragState = null;
  }

  zoomIn(): void { this.zoom(0.85); }
  zoomOut(): void { this.zoom(1.15); }
  resetZoom(): void {
    if (!this.zoomBounds) return;
    this.zoomState = { ...this.zoomBounds };
    this.applyZoom();
  }

  private applyPanFromAbsolute(base: Bounds, xShift: number, yShift: number): void {
    if (!this.zoomBounds) return;
    const b = this.zoomBounds;
    let xMin = base.xMin + xShift;
    let xMax = base.xMax + xShift;
    if (xMin < b.xMin) { xMax += b.xMin - xMin; xMin = b.xMin; }
    if (xMax > b.xMax) { xMin -= xMax - b.xMax; xMax = b.xMax; }
    let yMin = base.yMin + yShift;
    let yMax = base.yMax + yShift;
    if (yMin < b.yMin) { yMax += b.yMin - yMin; yMin = b.yMin; }
    if (yMax > b.yMax) { yMin -= yMax - b.yMax; yMax = b.yMax; }
    this.zoomState = { xMin, xMax, yMin, yMax };
    this.applyZoom();
  }

  private zoom(factor: number): void {
    if (!this.zoomBounds || !this.zoomState) return;
    const b = this.zoomBounds;
    const cur = this.zoomState;
    const xCenter = (cur.xMin + cur.xMax) / 2;
    const yCenter = (cur.yMin + cur.yMax) / 2;
    const xHalf = Math.max(1, ((cur.xMax - cur.xMin + 1) * factor) / 2);
    const yHalf = Math.max(50, ((cur.yMax - cur.yMin) * factor) / 2);
    const xMin = Math.max(b.xMin, Math.round(xCenter - xHalf));
    const xMax = Math.min(b.xMax, Math.round(xCenter + xHalf));
    const yMin = Math.max(b.yMin, Math.round(yCenter - yHalf));
    const yMax = Math.min(b.yMax, Math.round(yCenter + yHalf));
    if (xMax - xMin < 1 || yMax - yMin < 100) return;
    this.zoomState = { xMin, xMax, yMin, yMax };
    this.applyZoom();
  }

  private pan(xRatio: number, yRatio: number): void {
    if (!this.zoomBounds || !this.zoomState) return;
    const b = this.zoomBounds;
    const cur = this.zoomState;
    const xShift = Math.round((cur.xMax - cur.xMin) * xRatio);
    const yShift = Math.round((cur.yMax - cur.yMin) * yRatio);
    let xMin = cur.xMin + xShift;
    let xMax = cur.xMax + xShift;
    if (xMin < b.xMin) { xMax += b.xMin - xMin; xMin = b.xMin; }
    if (xMax > b.xMax) { xMin -= xMax - b.xMax; xMax = b.xMax; }
    let yMin = cur.yMin + yShift;
    let yMax = cur.yMax + yShift;
    if (yMin < b.yMin) { yMax += b.yMin - yMin; yMin = b.yMin; }
    if (yMax > b.yMax) { yMin -= yMax - b.yMax; yMax = b.yMax; }
    this.zoomState = { xMin, xMax, yMin, yMax };
    this.applyZoom();
  }

  private applyZoom(): void {
    const z = this.zoomState;
    const scales = (this.options?.scales ?? {}) as NonNullable<ChartConfiguration<'line'>['options']>['scales'];
    this.options = {
      ...this.options,
      scales: {
        x: { ...scales?.['x'], min: z?.xMin, max: z?.xMax },
        y: { ...scales?.['y'], min: z?.yMin, max: z?.yMax },
      }
    };
    this.chart?.update();
    this.cdr.markForCheck();
  }
}
