import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { DeviceService } from '../../core/services/device.service';
import { DeviceDataService, DeviceDatum } from '../../core/services/device-data.service';
import type { Device } from '../../core/models/device';

Chart.register(...registerables);

const LOW_FOOD_THRESHOLD_GRAMS = 100;
const RECENT_MS = 24 * 60 * 60 * 1000; // 24h

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './system-health.html',
  styleUrl: './system-health.scss',
})
export class SystemHealth implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceDataService = inject(DeviceDataService);

  devices = signal<Device[]>([]);
  deviceData = signal<DeviceDatum[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  /** Devices with at least one datum in the last 24h */
  connectedCount = computed(() => {
    const data = this.deviceData();
    const recent = Date.now() - RECENT_MS;
    const deviceIds = new Set(
      data.filter((d) => new Date(d.timestamp).getTime() > recent).map((d) => d.device_id)
    );
    return deviceIds.size;
  });

  connectivityRate = computed(() => {
    const devs = this.devices();
    const connected = this.connectedCount();
    if (devs.length === 0) return 0;
    return Math.round((connected / devs.length) * 100);
  });

  /** Low food alerts: feeder devices with food_level_grams &lt; threshold or no data */
  lowFoodAlerts = computed(() => {
    const devs = this.devices().filter((d) => d.type === 'FEEDER');
    const data = this.deviceData();
    const byDevice = new Map<string, DeviceDatum>();
    const sorted = [...data].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    for (const d of sorted) {
      if (!byDevice.has(d.device_id)) byDevice.set(d.device_id, d);
    }
    return devs.map((device) => {
      const latest = byDevice.get(device.id);
      const grams = latest?.food_level_grams ?? null;
      const isLow =
        grams !== null
          ? grams < LOW_FOOD_THRESHOLD_GRAMS
          : true; /* no data = treat as alert */
      return {
        device,
        latest,
        grams,
        isLow,
      };
    }).filter((a) => a.isLow);
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.deviceService.findAll().subscribe({
      next: (devices) => {
        this.devices.set(devices);
        this.deviceDataService.findAll().subscribe({
          next: (data) => {
            this.deviceData.set(
              [...data].sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              )
            );
            this.loading.set(false);
            if (this.isBrowser) {
              setTimeout(() => this.buildConnectivityChart(), 50);
            } else {
              this.loading.set(false);
            }
          },
          error: (err) => {
            this.errorMessage.set(err?.message ?? 'Failed to load device data');
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.errorMessage.set(err?.message ?? 'Failed to load devices');
        this.loading.set(false);
      },
    });
  }

  private chartInstance: Chart | null = null;

  private buildConnectivityChart(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    const canvas = document.getElementById('connectivityChart') as HTMLCanvasElement;
    if (!canvas) return;
    const connected = this.connectedCount();
    const total = this.devices().length;
    const disconnected = total - connected;
    this.chartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Connected (recent data)', 'No recent data'],
        datasets: [
          {
            data: [connected, disconnected],
            backgroundColor: ['#22c55e', '#e2e8f0'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (c) => `${c.label}: ${c.raw} device(s)`,
            },
          },
        },
      },
    });
  }
}
