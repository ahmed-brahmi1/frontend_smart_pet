import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  inject,
  effect,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { DeviceService } from '../../core/services/device.service';
import { DeviceDataService, DeviceDatum } from '../../core/services/device-data.service';
import { ActivePetService } from '../../core/services/active-pet.service';
import { PetService } from '../../core/services/pet.service';
import type { Device } from '../../core/models/device';
import type { Pet } from '../../core/models/pet';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  readonly activePetService = inject(ActivePetService);

  devices: Device[] = [];
  deviceData: DeviceDatum[] = [];
  pets: Pet[] = [];
  charts: Chart[] = [];
  isBrowser: boolean;
  loading = true;
  errorMessage = '';

  /** Latest battery level (0–100) from most recent device_data, or null */
  latestBattery: number | null = null;
  /** Latest food level in grams from most recent device_data, or null */
  latestFoodLevel: number | null = null;

  get hasFoodLevelData(): boolean {
    return this.deviceData.some(
      (d) => d.food_level_grams != null && d.food_level_grams > 0
    );
  }

  constructor(
    private authService: AuthService,
    private deviceService: DeviceService,
    private deviceDataService: DeviceDataService,
    private petService: PetService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    effect(() => {
      this.activePetService.activePetId();
      this.loadData();
    });
  }

  ngOnInit(): void {}

  loadData(): void {
    if (!this.authService.isAuthenticated()) {
      this.loading = false;
      return;
    }
    const petId = this.activePetService.activePetId();
    if (!petId) {
      this.devices = [];
      this.deviceData = [];
      this.pets = [];
      this.latestBattery = null;
      this.latestFoodLevel = null;
      this.destroyAllCharts();
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const deviceIds$ = this.petService.findDevicesByPetId(petId).pipe(
      catchError(() => of<Device[]>([]))
    );
    forkJoin({
      devices: deviceIds$,
      deviceData: this.deviceDataService.findAll().pipe(catchError(() => of<DeviceDatum[]>([]))),
      pets: this.petService.findAll().pipe(catchError(() => of<Pet[]>([]))),
    }).subscribe({
      next: ({ devices, deviceData, pets }) => {
        this.devices = devices;
        this.pets = pets;
        const deviceIdSet = new Set(devices.map((d) => d.id));
        const filtered = deviceData.filter((d) => deviceIdSet.has(d.device_id));
        this.deviceData = this.sortByTimestampDesc(filtered);
        this.latestBattery = this.getLatestBattery(this.deviceData);
        this.latestFoodLevel = this.getLatestFoodLevel(this.deviceData);
        if (this.isBrowser) {
          setTimeout(() => this.buildCharts(), 100);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.message ?? 'Failed to load data';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private sortByTimestampDesc(list: DeviceDatum[]): DeviceDatum[] {
    return [...list].sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return tB - tA;
    });
  }

  private getLatestBattery(list: DeviceDatum[]): number | null {
    const withBattery = list.find((d) => d.battery_level != null);
    return withBattery != null ? withBattery.battery_level : null;
  }

  private getLatestFoodLevel(list: DeviceDatum[]): number | null {
    const withFood = list.find((d) => d.food_level_grams != null);
    return withFood != null ? withFood.food_level_grams ?? null : null;
  }

  private buildCharts(): void {
    this.destroyAllCharts();
    const recent = this.deviceData.slice(0, 30).reverse();

    if (recent.length > 0) {
      const labels = recent.map((d) => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      });

      const batteryData = recent.map((d) => d.battery_level);
      this.createLineChart('batteryChart', 'Battery level (%)', batteryData, labels, '%', 100);

      const foodData = recent.map((d) => d.food_level_grams ?? 0);
      if (foodData.some((v) => v > 0)) {
        this.createLineChart('foodChart', 'Food level (g)', foodData, labels, 'g');
      }
    }

    this.cdr.detectChanges();
  }

  private createLineChart(
    canvasId: string,
    label: string,
    data: number[],
    labels: string[],
    unit: string,
    max?: number
  ): void {
    const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            borderColor: '#2f5bd5',
            backgroundColor: 'rgba(47, 91, 213, 0.1)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => `${label}: ${c.parsed.y}${unit}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ...(max != null && { max }),
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });
    this.charts.push(chart);
  }

  private destroyAllCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }
}
