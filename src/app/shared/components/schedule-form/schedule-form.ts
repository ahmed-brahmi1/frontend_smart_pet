import { Component, input, output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedingScheduleService } from '../../../core/services/feeding-schedule.service';
import type { FeedingSchedule } from '../../../core/models/feeding-schedule';

@Component({
  selector: 'app-schedule-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-form.html',
  styleUrl: './schedule-form.scss',
})
export class ScheduleForm {
  private readonly feedingScheduleService = inject(FeedingScheduleService);

  deviceId = input.required<string>();
  /** When set, form is in edit mode */
  schedule = input<FeedingSchedule | null>(null);

  saved = output<FeedingSchedule>();
  cancelled = output<void>();

  scheduleTime = signal('08:00');
  schedulePortion = signal<number | null>(null);
  scheduleEnabled = signal(true);
  submitError = signal('');
  submitting = signal(false);

  constructor() {
    effect(() => {
      const s = this.schedule();
      if (s) {
        const [h, m] = s.time_of_day.split(':');
        this.scheduleTime.set(`${(h ?? '00').padStart(2, '0')}:${(m ?? '00').padStart(2, '0')}`);
        this.schedulePortion.set(s.portion_grams ?? null);
        this.scheduleEnabled.set(s.enabled);
      } else {
        this.scheduleTime.set('08:00');
        this.schedulePortion.set(null);
        this.scheduleEnabled.set(true);
      }
    });
  }

  get isEditMode(): boolean {
    return this.schedule() != null;
  }

  get title(): string {
    return this.isEditMode ? 'Edit schedule' : 'New schedule';
  }

  cancel(): void {
    this.submitError.set('');
    this.cancelled.emit();
  }

  submit(): void {
    this.submitError.set('');
    const deviceId = this.deviceId();
    const timeOfDay =
      this.scheduleTime().length === 5
        ? `${this.scheduleTime()}:00`
        : this.scheduleTime();

    if (this.isEditMode) {
      const schedule = this.schedule()!;
      this.submitting.set(true);
      this.feedingScheduleService
        .update(schedule.id, {
          time_of_day: timeOfDay,
          portion_grams: this.schedulePortion() ?? undefined,
          enabled: this.scheduleEnabled(),
        })
        .subscribe({
          next: (updated: FeedingSchedule) => {
            this.submitting.set(false);
            this.saved.emit(updated);
          },
          error: (err: { message?: string }) => {
            this.submitError.set(err?.message ?? 'Update failed');
            this.submitting.set(false);
          },
        });
    } else {
      this.submitting.set(true);
      this.feedingScheduleService
        .create({
          device_id: deviceId,
          time_of_day: timeOfDay,
          portion_grams: this.schedulePortion() ?? undefined,
          enabled: this.scheduleEnabled(),
        })
        .subscribe({
          next: (created: FeedingSchedule) => {
            this.submitting.set(false);
            this.saved.emit(created);
          },
          error: (err: { message?: string }) => {
            this.submitError.set(err?.message ?? 'Create failed');
            this.submitting.set(false);
          },
        });
    }
  }

  formatTime(t: string): string {
    const parts = t.split(':');
    const h = parts[0] ?? '00';
    const m = parts[1] ?? '00';
    return `${h}:${m}`;
  }
}
