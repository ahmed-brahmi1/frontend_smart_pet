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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { DeviceService } from '../../core/services/device.service';
import { DeviceDataService, DeviceDatum } from '../../core/services/device-data.service';
import { ActivePetService } from '../../core/services/active-pet.service';
import { PetService } from '../../core/services/pet.service';
import { WebsocketService, type DeviceDataEvent } from '../../core/services/websocket.service';
import type { Device } from '../../core/models/device';
import type { Pet } from '../../core/models/pet';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  private readonly sanitizer = inject(DomSanitizer);

  devices: Device[] = [];
  deviceData: DeviceDatum[] = [];
  pets: Pet[] = [];
  charts: Chart[] = [];
  isBrowser: boolean;
  loading = true;
  errorMessage = '';

  /** Latest battery level (0–100) from most recent device_data across any device, or null. */
  latestBattery: number | null = null;

  /** Whether at least one device has reported data in the recent window (pet online/offline). */
  isOnline = false;

  /** OpenStreetMap embed URL for the pet's most recent GPS location, or null when not available. */
  mapUrl: SafeResourceUrl | null = null;

  /** Derived recent alerts such as temperature out of range, low battery, or no recent data. */
  recentAlerts: {
    type: 'temperature' | 'battery' | 'connection';
    message: string;
    timestamp: string;
  }[] = [];

  /** Whether any of the filtered device data rows contain steps (exposed for template labels). */
  hasStepsMetric = false;

  /** Time window in minutes for considering a device as "online". */
  private readonly ONLINE_WINDOW_MINUTES = 10;

  private static readonly TEMP_TREND_CACHE_KEY = 'smartpet_temp_trend';
  private static readonly TEMP_TREND_CACHE_SIZE = 10;

  private readonly destroy$ = new Subject<void>();

  private getTemperatureTrendCache(petId: string): { timestamp: string; temperature: number }[] {
    if (typeof localStorage === 'undefined' || !petId) return [];
    try {
      const raw = localStorage.getItem(`${Dashboard.TEMP_TREND_CACHE_KEY}_${petId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { timestamp: string; temperature: number }[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveTemperatureTrendCache(
    petId: string,
    values: { timestamp: string; temperature: number }[]
  ): void {
    if (typeof localStorage === 'undefined' || !petId || values.length === 0) return;
    const toSave = values.slice(-Dashboard.TEMP_TREND_CACHE_SIZE);
    try {
      localStorage.setItem(
        `${Dashboard.TEMP_TREND_CACHE_KEY}_${petId}`,
        JSON.stringify(toSave)
      );
    } catch {
      // ignore
    }
  }

  constructor(
    private authService: AuthService,
    private deviceService: DeviceService,
    private deviceDataService: DeviceDataService,
    private petService: PetService,
    private websocket: WebsocketService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    effect(() => {
      this.activePetService.activePetId();
      this.loadData();
    });
  }

  ngOnInit(): void {
    this.websocket.deviceData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((events) => this.applyWebSocketEvents(events));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyAllCharts();
  }

  /** Merge WebSocket device-data events into dashboard state for current pet's devices. */
  private applyWebSocketEvents(events: DeviceDataEvent[]): void {
    const petId = this.activePetService.activePetId();
    if (!petId || this.devices.length === 0 || events.length === 0) return;

    const deviceIdSet = new Set(this.devices.map((d) => d.id));
    const existingKeys = new Set(
      this.deviceData.map((d) => `${d.device_id}\t${d.timestamp}`)
    );
    const newRows: DeviceDatum[] = events
      .filter(
        (e) =>
          deviceIdSet.has(e.device_id) &&
          !existingKeys.has(`${e.device_id}\t${e.timestamp}`)
      )
      .map((e) => ({
        device_id: e.device_id,
        timestamp: e.timestamp,
        battery_level: e.data.battery_level,
        gps_lat: e.data.gps_lat ?? null,
        gps_lng: e.data.gps_lng ?? null,
        temperature: e.data.temperature ?? null,
        food_level_grams: e.data.food_level_grams ?? null,
        water_level: e.data.water_level ?? null,
      }));

    if (newRows.length === 0) return;

    const merged = [...this.deviceData, ...newRows];
    this.deviceData = this.sortByTimestampDesc(merged);
    this.latestBattery = this.getLatestBattery(this.deviceData);
    this.updateOnlineStatus();
    this.updateMapUrl();
    this.buildAlerts();
    if (this.isBrowser) {
      setTimeout(() => this.buildCharts(), 100);
    }
    this.cdr.detectChanges();
  }

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
      this.isOnline = false;
      this.mapUrl = null;
      this.recentAlerts = [];
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
        this.hasStepsMetric = this.deviceData.some((d) => d.steps != null);
        this.latestBattery = this.getLatestBattery(this.deviceData);
        this.updateOnlineStatus();
        this.updateMapUrl();
        this.buildAlerts();
        
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

  private updateOnlineStatus(): void {
    if (this.deviceData.length === 0) {
      this.isOnline = false;
      return;
    }
    const latest = this.deviceData[0];
    const latestTs = new Date(latest.timestamp).getTime();
    const now = Date.now();
    const diffMinutes = (now - latestTs) / (1000 * 60);
    this.isOnline = diffMinutes <= this.ONLINE_WINDOW_MINUTES;
  }

  private updateMapUrl(): void {
    const withGps = this.deviceData.find(
      (d) => d.gps_lat != null && d.gps_lng != null
    );
    if (!withGps) {
      this.mapUrl = null;
      return;
    }
    const lat = withGps.gps_lat as number;
    const lng = withGps.gps_lng as number;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private buildAlerts(): void {
    const alerts: {
      type: 'temperature' | 'battery' | 'connection';
      message: string;
      timestamp: string;
    }[] = [];

    if (this.deviceData.length === 0) {
      this.recentAlerts = [];
      return;
    }

    const latest = this.deviceData[0];
    const latestTs = new Date(latest.timestamp).getTime();
    const now = Date.now();
    const diffMinutes = (now - latestTs) / (1000 * 60);
    if (diffMinutes > this.ONLINE_WINDOW_MINUTES) {
      alerts.push({
        type: 'connection',
        message: `Device appears offline (no data in the last ${this.ONLINE_WINDOW_MINUTES} minutes).`,
        timestamp: latest.timestamp,
      });
    }

    const lowBattery = this.deviceData.find(
      (d) => d.battery_level != null && d.battery_level <= 20
    );
    if (lowBattery) {
      alerts.push({
        type: 'battery',
        message: `Low battery (${lowBattery.battery_level}%). Consider charging the device soon.`,
        timestamp: lowBattery.timestamp,
      });
    }

    const collarIds = new Set(
      this.devices.filter((d) => d.type === 'COLLAR').map((d) => d.id)
    );
    const tempRows = this.deviceData
      .filter(
        (d) =>
          (collarIds.size === 0 || collarIds.has(d.device_id)) &&
          d.temperature != null
      )
      .slice(0, 50);

    for (const row of tempRows) {
      const temp = row.temperature as number;
      if (temp < 37) {
        alerts.push({
          type: 'temperature',
          message: `Temperature low (${temp.toFixed(1)}°C, normal is ~37–39°C).`,
          timestamp: row.timestamp,
        });
      } else if (temp > 39) {
        alerts.push({
          type: 'temperature',
          message: `Temperature high (${temp.toFixed(1)}°C, normal is ~37–39°C).`,
          timestamp: row.timestamp,
        });
      }
    }

    this.recentAlerts = alerts.slice(0, 8);
  }

  private buildCharts(): void {
    this.destroyAllCharts();
    if (!this.isBrowser || this.deviceData.length === 0) {
      this.cdr.detectChanges();
      return;
    }

    this.buildDailyActivityChart();
    this.buildWeeklyActivityChart();
    this.buildTemperatureChart();

    this.cdr.detectChanges();
  }

  /** Daily activity chart for today: steps when available, otherwise count of readings per hour. */
  private buildDailyActivityChart(): void {
    const canvas = document.getElementById('dailyActivityChart') as HTMLCanvasElement;
    if (!canvas) return;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todaysRows = this.deviceData.filter((d) => {
      const t = new Date(d.timestamp);
      return t >= startOfDay && t < endOfDay;
    });

    const hours = Array.from({ length: 24 }).map((_, i) => i);
    const labels = hours.map((h) => h.toString().padStart(2, '0') + ':00');

    const data = hours.map((h) => {
      const inHour = todaysRows.filter(
        (d) => new Date(d.timestamp).getHours() === h
      );
      if (inHour.length === 0) return 0;
      if (this.hasStepsMetric) {
        const latest = inHour.reduce((acc, cur) =>
          new Date(cur.timestamp).getTime() > new Date(acc.timestamp).getTime()
            ? cur
            : acc
        );
        return latest.steps ?? 0;
      }
      return inHour.length;
    });

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: this.hasStepsMetric ? 'Steps per hour' : 'Readings per hour',
            data,
            backgroundColor: 'rgba(47, 91, 213, 0.5)',
            borderColor: '#2f5bd5',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });

    this.charts.push(chart);
  }

  /** Weekly activity chart for the last 7 days: steps or fallback to count of readings per day. */
  private buildWeeklyActivityChart(): void {
    const canvas = document.getElementById('weeklyActivityChart') as HTMLCanvasElement;
    if (!canvas) return;

    const now = new Date();
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }

    const labels = days.map((d) =>
      d.toLocaleDateString('en-US', { weekday: 'short' })
    );

    const data = days.map((dayStart) => {
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const rows = this.deviceData.filter((d) => {
        const t = new Date(d.timestamp);
        return t >= dayStart && t < dayEnd;
      });
      if (rows.length === 0) return 0;
      if (this.hasStepsMetric) {
        const latest = rows.reduce((acc, cur) =>
          new Date(cur.timestamp).getTime() > new Date(acc.timestamp).getTime()
            ? cur
            : acc
        );
        return latest.steps ?? 0;
      }
      return rows.length;
    });

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: this.hasStepsMetric ? 'Daily steps' : 'Readings per day',
            data,
            backgroundColor: 'rgba(47, 91, 213, 0.5)',
            borderColor: '#2f5bd5',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });

    this.charts.push(chart);
  }

  /** Temperature line chart using collar devices; uses cache when no live data. */
  private buildTemperatureChart(): void {
    const canvas = document.getElementById('temperatureChart') as HTMLCanvasElement;
    if (!canvas) return;

    const petId = this.activePetService.activePetId();
    const collarIds = new Set(
      this.devices.filter((d) => d.type === 'COLLAR').map((d) => d.id)
    );

    const tempsFromData = this.deviceData
      .filter(
        (d) =>
          (collarIds.size === 0 || collarIds.has(d.device_id)) &&
          d.temperature != null
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .slice(-30);

    let labels: string[];
    let data: number[];
    let pointsForCache: { timestamp: string; temperature: number }[];

    if (tempsFromData.length > 0) {
      labels = tempsFromData.map((d) =>
        new Date(d.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      data = tempsFromData.map((d) => d.temperature as number);
      pointsForCache = tempsFromData.slice(-Dashboard.TEMP_TREND_CACHE_SIZE).map((d) => ({
        timestamp: d.timestamp,
        temperature: d.temperature as number,
      }));
      if (petId) this.saveTemperatureTrendCache(petId, pointsForCache);
    } else {
      const cached = petId ? this.getTemperatureTrendCache(petId) : [];
      if (cached.length === 0) return;
      labels = cached.map((d) =>
        new Date(d.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      data = cached.map((d) => d.temperature);
    }

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperature (°C)',
            data,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
        },
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: '°C' },
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
}
