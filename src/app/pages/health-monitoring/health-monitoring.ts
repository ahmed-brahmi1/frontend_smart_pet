import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ActivePetService } from '../../core/services/active-pet.service';
import { PetService } from '../../core/services/pet.service';
import { DeviceService } from '../../core/services/device.service';
import { DeviceDataService, DeviceDatum } from '../../core/services/device-data.service';
import type { Device } from '../../core/models/device';
import type { ClaimDeviceDto } from '../../core/models/device';
import type { LinkDeviceDto } from '../../core/models/pet';

Chart.register(...registerables);

@Component({
  selector: 'app-health-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './health-monitoring.html',
  styleUrl: './health-monitoring.scss',
})
export class HealthMonitoring implements OnInit, OnDestroy {
  readonly activePetService = inject(ActivePetService);
  private readonly petService = inject(PetService);
  private readonly deviceService = inject(DeviceService);
  private readonly deviceDataService = inject(DeviceDataService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly collarDevice = signal<Device | null>(null);
  readonly deviceData = signal<DeviceDatum[]>([]);
  private chart: Chart | null = null;

  showLinkDialog = false;
  linkMode: 'existing' | 'claim' = 'existing';
  selectedDeviceId = '';
  claimDeviceId = '';
  claimActivationSecret = '';
  linkDialogError = '';
  linkSubmitting = false;
  readonly availableCollarsToLink = signal<Device[]>([]);
  readonly unlinking = signal(false);

  readonly isBrowser = typeof window !== 'undefined';

  /** Temperature values from collar device data (this pet's collars only), sorted newest first. */
  readonly temperatureValues = computed(() => {
    const data = this.deviceData();
    const collarIds = new Set(this.collarDevice() ? [this.collarDevice()!.id] : []);
    return data
      .filter((d) => collarIds.has(d.device_id) && d.temperature != null)
      .map((d) => d.temperature as number)
      .slice(0, 30)
      .reverse();
  });

  /** Last 10 temperature readings for the line chart (oldest to newest for chart). */
  readonly last10Temperatures = computed(() => this.temperatureValues().slice(-10));

  /** Average of last 10 temperatures, or null. */
  readonly averageTemperature = computed(() => {
    const vals = this.last10Temperatures();
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  /** Temperature status for color coding: normal ~37–39°C, low <37, high >39. */
  readonly temperatureStatus = computed(() => {
    const avg = this.averageTemperature();
    if (avg == null) return 'unknown';
    if (avg < 37) return 'low';
    if (avg > 39) return 'high';
    return 'normal';
  });

  /** Steps: use optional steps from device data; average daily or latest. Backend may not have steps yet. */
  readonly stepsValues = computed(() => {
    const data = this.deviceData();
    const collarIds = new Set(this.collarDevice() ? [this.collarDevice()!.id] : []);
    return data
      .filter((d) => collarIds.has(d.device_id) && d.steps != null)
      .map((d) => d.steps as number);
  });

  readonly averageDailySteps = computed(() => {
    const vals = this.stepsValues();
    if (vals.length === 0) return null;
    return Math.round(
      vals.reduce((a, b) => a + b, 0) / vals.length
    );
  });

  constructor() {
    effect(() => {
      this.activePetService.activePetId();
      this.loadData();
    });
  }

  ngOnInit(): void {}

  loadData(): void {
    const petId = this.activePetService.activePetId();
    if (!petId) {
      this.loading.set(false);
      this.errorMessage.set('');
      this.collarDevice.set(null);
      this.deviceData.set([]);
      this.rebuildChart();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.petService
      .findDevicesByPetId(petId)
      .pipe(
        catchError(() => of<Device[]>([])),
        map((devices) => devices.filter((d) => d.type === 'COLLAR'))
      )
      .subscribe({
        next: (collars) => {
          this.collarDevice.set(collars[0] ?? null);
          const collarIds = new Set(collars.map((d) => d.id));
          this.deviceDataService
            .findAll()
            .pipe(
              catchError(() => of<DeviceDatum[]>([])),
              map((list) =>
                list
                  .filter((d) => collarIds.has(d.device_id))
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  )
              )
            )
            .subscribe({
              next: (data) => {
                this.deviceData.set(data);
                this.loading.set(false);
                if (this.isBrowser) setTimeout(() => this.rebuildChart(), 50);
              },
              error: () => {
                this.deviceData.set([]);
                this.loading.set(false);
                this.errorMessage.set('Failed to load device data');
              },
            });
        },
        error: () => {
          this.collarDevice.set(null);
          this.loading.set(false);
          this.errorMessage.set('Failed to load pet devices');
        },
      });
  }

  openLinkCollarDialog(): void {
    this.showLinkDialog = true;
    this.linkMode = 'existing';
    this.selectedDeviceId = '';
    this.claimDeviceId = '';
    this.claimActivationSecret = '';
    this.linkDialogError = '';
    this.linkSubmitting = false;
    const linkedIds = new Set(this.collarDevice() ? [this.collarDevice()!.id] : []);
    this.deviceService.findAll().pipe(catchError(() => of<Device[]>([]))).subscribe({
      next: (devices) => {
        this.availableCollarsToLink.set(
          devices.filter((d) => d.type === 'COLLAR' && !linkedIds.has(d.id))
        );
        this.cdr.detectChanges();
      },
    });
    this.cdr.detectChanges();
  }

  closeLinkDialog(): void {
    this.showLinkDialog = false;
    this.linkDialogError = '';
    this.cdr.detectChanges();
  }

  unlinkCollar(device: Device): void {
    const petId = this.activePetService.activePetId();
    if (!petId || !confirm(`Unlink collar "${device.mac_address}" from this pet?`)) return;
    this.errorMessage.set('');
    this.unlinking.set(true);
    this.petService.unlinkDevice(petId, device.id).subscribe({
      next: () => {
        this.unlinking.set(false);
        this.loadData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.unlinking.set(false);
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Unlink failed');
        this.cdr.detectChanges();
      },
    });
  }

  submitLinkCollar(): void {
    const petId = this.activePetService.activePetId();
    if (!petId) return;
    this.linkDialogError = '';
    this.linkSubmitting = true;

    if (this.linkMode === 'existing') {
      if (!this.selectedDeviceId) {
        this.linkDialogError = 'Select a device.';
        this.linkSubmitting = false;
        this.cdr.detectChanges();
        return;
      }
      const body: LinkDeviceDto = { device_id: this.selectedDeviceId };
      this.petService.linkDevice(petId, body).subscribe({
        next: () => {
          this.closeLinkDialog();
          this.loadData();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.linkDialogError = err?.error?.message ?? err?.message ?? 'Link failed';
          this.linkSubmitting = false;
          this.cdr.detectChanges();
        },
      });
      return;
    }

    const secret = this.claimActivationSecret?.trim();
    if (!this.claimDeviceId?.trim() || !secret) {
      this.linkDialogError = 'Device ID and activation secret are required.';
      this.linkSubmitting = false;
      this.cdr.detectChanges();
      return;
    }
    const body: ClaimDeviceDto = {
      device_id: this.claimDeviceId.trim(),
      activation_secret: secret,
      pet_id: petId,
    };
    this.deviceService.claim(body).subscribe({
      next: () => {
        this.closeLinkDialog();
        this.loadData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.linkDialogError = err?.error?.message ?? err?.message ?? 'Claim failed';
        this.linkSubmitting = false;
        this.cdr.detectChanges();
      },
    });
  }

  private rebuildChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (!this.isBrowser) return;

    const temps = this.last10Temperatures();
    if (temps.length === 0) return;

    const labels = temps.map((_, i) => `#${i + 1}`);
    const canvas = document.getElementById('healthTempChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temps,
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
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
