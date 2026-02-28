import {
  Component,
  OnInit,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DeviceService } from '../../core/services/device.service';
import { DeviceDataService, DeviceDatum } from '../../core/services/device-data.service';
import { FeedingScheduleService } from '../../core/services/feeding-schedule.service';
import type { Device } from '../../core/models/device';
import type { FeedingSchedule, CreateFeedingScheduleDto } from '../../core/models/feeding-schedule';

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './device-detail.html',
  styleUrl: './device-detail.scss',
})
export class DeviceDetail implements OnInit {
  device: Device | null = null;
  latestData: DeviceDatum | null = null;
  schedules: FeedingSchedule[] = [];
  loading = true;
  errorMessage = '';
  isCollar = false;
  isFeeder = false;

  /** Feeding schedule form */
  showScheduleForm = false;
  editingSchedule: FeedingSchedule | null = null;
  scheduleTime = '08:00';
  schedulePortion: number | null = null;
  scheduleEnabled = true;
  scheduleSubmitError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deviceService: DeviceService,
    private deviceDataService: DeviceDataService,
    private feedingScheduleService: FeedingScheduleService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  get id(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** OpenStreetMap embed URL for collar GPS (or null if no coords) */
  get mapUrl(): SafeResourceUrl | null {
    if (!this.isBrowser || !this.latestData?.gps_lat || !this.latestData?.gps_lng) return null;
    const lat = this.latestData.gps_lat;
    const lng = this.latestData.gps_lng;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit(): void {
    const deviceId = this.id;
    if (!deviceId) {
      this.errorMessage = 'No device ID';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.deviceService
      .findOne(deviceId)
      .pipe(
        catchError((err) => {
          this.errorMessage = err?.message ?? 'Device not found';
          return of(null);
        })
      )
      .subscribe((device) => {
        this.device = device ?? null;
        if (!device) {
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        this.isCollar = device.type === 'COLLAR';
        this.isFeeder = device.type === 'FEEDER';

        const data$ = this.deviceDataService.findAll().pipe(
          map((list) => {
            const forDevice = list
              .filter((d) => d.device_id === deviceId)
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return forDevice[0] ?? null;
          }),
          catchError(() => of(null))
        );

        const schedules$ = this.isFeeder
          ? this.feedingScheduleService.findByDevice(deviceId).pipe(catchError(() => of<FeedingSchedule[]>([])))
          : of<FeedingSchedule[]>([]);

        forkJoin({ data: data$, schedules: schedules$ }).subscribe({
          next: ({ data, schedules }) => {
            this.latestData = data;
            this.schedules = schedules;
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
      });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
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
    this.scheduleTime = `${h.padStart(2, '0')}:${(m ?? '00').padStart(2, '0')}`;
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
    const deviceId = this.device?.id;
    if (!deviceId) return;

    this.scheduleSubmitError = '';
    const timeOfDay = this.scheduleTime.length === 5 ? `${this.scheduleTime}:00` : this.scheduleTime;

    if (this.editingSchedule) {
      this.feedingScheduleService
        .update(this.editingSchedule.id, {
          time_of_day: timeOfDay,
          portion_grams: this.schedulePortion ?? undefined,
          enabled: this.scheduleEnabled,
        })
        .subscribe({
          next: (updated) => {
            const i = this.schedules.findIndex((s) => s.id === updated.id);
            if (i >= 0) this.schedules[i] = updated;
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
        device_id: deviceId,
        time_of_day: timeOfDay,
        enabled: this.scheduleEnabled,
      };
      if (this.schedulePortion != null) body.portion_grams = this.schedulePortion;

      this.feedingScheduleService.create(body).subscribe({
        next: (created) => {
          this.schedules.push(created);
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
        this.schedules = this.schedules.filter((s) => s.id !== schedule.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.message ?? 'Delete failed';
        this.cdr.detectChanges();
      },
    });
  }

  /** Placeholder for real-time audio (Talk/Listen) */
  startTalk(): void {
    console.log('Talk – real-time audio not implemented');
    // TODO: integrate WebRTC or backend stream
  }

  startListen(): void {
    console.log('Listen – real-time audio not implemented');
    // TODO: integrate WebRTC or backend stream
  }

  formatTime(t: string): string {
    const parts = t.split(':');
    const h = parts[0] ?? '00';
    const m = parts[1] ?? '00';
    return `${h}:${m}`;
  }
}
