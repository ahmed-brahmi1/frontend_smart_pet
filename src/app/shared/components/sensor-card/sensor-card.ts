import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sensor-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sensor-card.html',
  styleUrl: './sensor-card.scss',
})
export class SensorCard {
  label = input.required<string>();
  value = input<string | number | null>(null);
  unit = input<string>('');
  /** Optional icon class (e.g. icon font class) */
  icon = input<string | null>(null);

  get displayValue(): string {
    const v = this.value();
    if (v == null) return '--';
    return String(v);
  }
}
