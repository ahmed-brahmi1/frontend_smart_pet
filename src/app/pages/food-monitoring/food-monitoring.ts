import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivePetService } from '../../core/services/active-pet.service';
import { PetService } from '../../core/services/pet.service';
import { DeviceService } from '../../core/services/device.service';
import { DeviceDataService, DeviceDatum } from '../../core/services/device-data.service';
import { FeedingScheduleService } from '../../core/services/feeding-schedule.service';
import type { Device } from '../../core/models/device';
import type { ClaimDeviceDto } from '../../core/models/device';
import type { LinkDeviceDto } from '../../core/models/pet';
import type { FeedingSchedule, CreateFeedingScheduleDto } from '../../core/models/feeding-schedule';

@Component({
  selector: 'app-food-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-monitoring.html',
  styleUrl: './food-monitoring.scss',
})
export class FoodMonitoring implements OnInit {
  readonly activePetService = inject(ActivePetService);
  private readonly petService = inject(PetService);
  private readonly deviceService = inject(DeviceService);
  private readonly deviceDataService = inject(DeviceDataService);
  private readonly feedingScheduleService = inject(FeedingScheduleService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly feederDevice = signal<Device | null>(null);
  readonly petDevices = signal<Device[]>([]);
  readonly latestData = signal<DeviceDatum | null>(null);
  readonly schedules = signal<FeedingSchedule[]>([]);
  readonly refillMessage = signal<string | null>(null);
  readonly unlinking = signal(false);

  showLinkDialog = false;
  linkMode: 'existing' | 'claim' = 'existing';
  selectedDeviceId = '';
  claimDeviceId = '';
  claimActivationSecret = '';
  linkDialogError = '';
  linkSubmitting = false;
  readonly availableFeedersToLink = signal<Device[]>([]);

  showScheduleForm = false;
  editingSchedule: FeedingSchedule | null = null;
  scheduleTime = '08:00';
  schedulePortion: number | null = null;
  scheduleEnabled = true;
  scheduleSubmitError = '';

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
      this.feederDevice.set(null);
      this.latestData.set(null);
      this.schedules.set([]);
      this.cdr.detectChanges();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.petService
      .findDevicesByPetId(petId)
      .pipe(catchError(() => of<Device[]>([])))
      .subscribe({
        next: (devices) => {
          this.petDevices.set(devices);
          const feeder = devices.find((d) => d.type === 'FEEDER') ?? null;
          this.feederDevice.set(feeder);
          if (!feeder) {
            this.latestData.set(null);
            this.schedules.set([]);
            this.loading.set(false);
            this.cdr.detectChanges();
            return;
          }
          this.deviceDataService
            .findAll()
            .pipe(catchError(() => of<DeviceDatum[]>([])))
            .subscribe({
              next: (list) => {
                const sorted = list
                  .filter((d) => d.device_id === feeder.id)
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  );
                this.latestData.set(sorted[0] ?? null);
                this.loading.set(false);
                this.cdr.detectChanges();
              },
              error: () => {
                this.latestData.set(null);
                this.loading.set(false);
                this.cdr.detectChanges();
              },
            });
          this.feedingScheduleService
            .findByDevice(feeder.id)
            .pipe(catchError(() => of<FeedingSchedule[]>([])))
            .subscribe({
              next: (s) => {
                this.schedules.set(s);
                this.cdr.detectChanges();
              },
            });
        },
        error: () => {
          this.feederDevice.set(null);
          this.latestData.set(null);
          this.loading.set(false);
          this.errorMessage.set('Failed to load pet devices');
          this.cdr.detectChanges();
        },
      });
  }

  /** Water level 0–100 (%). */
  readonly waterLevel = computed(() => {
    const d = this.latestData();
    const v = d?.water_level;
    return v != null ? Math.min(100, Math.max(0, v)) : null;
  });

  /** Food level: assume max 500g for display if not configured. */
  readonly foodLevelGrams = computed(() => this.latestData()?.food_level_grams ?? null);
  readonly foodLevelPercent = computed(() => {
    const g = this.foodLevelGrams();
    if (g == null) return null;
    const max = 500;
    return Math.min(100, Math.round((g / max) * 100));
  });

  refillWater(): void {
    this.refillMessage.set('Water refill requested. Backend integration can trigger feeder refill.');
    setTimeout(() => this.refillMessage.set(null), 4000);
    this.cdr.detectChanges();
  }

  refillFood(): void {
    this.refillMessage.set('Food refill requested. Backend integration can trigger feeder dispense.');
    setTimeout(() => this.refillMessage.set(null), 4000);
    this.cdr.detectChanges();
  }

  unlinkFeeder(): void {
    const feeder = this.feederDevice();
    const petId = this.activePetService.activePetId();
    if (!feeder || !petId || !confirm(`Unlink feeder "${feeder.mac_address}" from this pet?`)) return;
    this.errorMessage.set('');
    this.unlinking.set(true);
    this.petService.unlinkDevice(petId, feeder.id).subscribe({
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

  openLinkFeederDialog(): void {
    this.showLinkDialog = true;
    this.linkMode = 'existing';
    this.selectedDeviceId = '';
    this.claimDeviceId = '';
    this.claimActivationSecret = '';
    this.linkDialogError = '';
    this.linkSubmitting = false;
    const linkedIds = new Set(this.petDevices().map((d) => d.id));
    this.deviceService.findAll().pipe(catchError(() => of<Device[]>([]))).subscribe({
      next: (devices) => {
        this.availableFeedersToLink.set(
          devices.filter((d) => d.type === 'FEEDER' && !linkedIds.has(d.id))
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

  submitLinkFeeder(): void {
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

  openAddSchedule(): void {
    this.editingSchedule = null;
    this.scheduleTime = '08:00';
    this.schedulePortion = null;
    this.scheduleEnabled = true;
    this.scheduleSubmitError = '';
    this.showScheduleForm = true;
    this.cdr.detectChanges();
  }

  openEditSchedule(schedule: FeedingSchedule): void {
    this.editingSchedule = schedule;
    const [h, m] = schedule.time_of_day.split(':');
    this.scheduleTime = `${(h ?? '08').padStart(2, '0')}:${(m ?? '00').padStart(2, '0')}`;
    this.schedulePortion = schedule.portion_grams ?? null;
    this.scheduleEnabled = schedule.enabled;
    this.scheduleSubmitError = '';
    this.showScheduleForm = true;
    this.cdr.detectChanges();
  }

  cancelScheduleForm(): void {
    this.showScheduleForm = false;
    this.editingSchedule = null;
    this.cdr.detectChanges();
  }

  submitSchedule(): void {
    const feeder = this.feederDevice();
    if (!feeder) return;
    this.scheduleSubmitError = '';
    const timeOfDay =
      this.scheduleTime.length === 5 ? `${this.scheduleTime}:00` : this.scheduleTime;

    if (this.editingSchedule) {
      this.feedingScheduleService
        .update(this.editingSchedule.id, {
          time_of_day: timeOfDay,
          portion_grams: this.schedulePortion ?? undefined,
          enabled: this.scheduleEnabled,
        })
        .subscribe({
          next: (updated) => {
            this.schedules.update((list) => {
              const i = list.findIndex((s) => s.id === updated.id);
              if (i >= 0) {
                const next = [...list];
                next[i] = updated;
                return next;
              }
              return list;
            });
            this.showScheduleForm = false;
            this.editingSchedule = null;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.scheduleSubmitError = err?.message ?? 'Update failed';
            this.cdr.detectChanges();
          },
        });
    } else {
      const body: CreateFeedingScheduleDto = {
        device_id: feeder.id,
        time_of_day: timeOfDay,
        enabled: this.scheduleEnabled,
      };
      if (this.schedulePortion != null) body.portion_grams = this.schedulePortion;

      this.feedingScheduleService.create(body).subscribe({
        next: (created) => {
          this.schedules.update((list) => [...list, created]);
          this.showScheduleForm = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.scheduleSubmitError = err?.message ?? 'Create failed';
          this.cdr.detectChanges();
        },
      });
    }
  }

  deleteSchedule(schedule: FeedingSchedule): void {
    if (!confirm('Delete this feeding schedule?')) return;
    this.feedingScheduleService.remove(schedule.id).subscribe({
      next: () => {
        this.schedules.update((list) => list.filter((s) => s.id !== schedule.id));
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage.set(err?.message ?? 'Delete failed');
        this.cdr.detectChanges();
      },
    });
  }

  formatTime(t: string): string {
    const parts = t.split(':');
    const h = parts[0] ?? '00';
    const m = parts[1] ?? '00';
    return `${h}:${m}`;
  }
}
