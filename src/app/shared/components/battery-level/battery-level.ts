import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-battery-level',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './battery-level.html',
  styleUrl: './battery-level.scss',
})
export class BatteryLevel {
  /** Battery percentage 0–100, or null if unknown */
  level = input<number | null>(null);
  /** Show "Battery" label and percentage text */
  showLabel = input<boolean>(true);

  get levelValue(): number {
    const v = this.level();
    return v != null ? Math.min(100, Math.max(0, v)) : 0;
  }

  get isLow(): boolean {
    return this.levelValue > 0 && this.levelValue < 20;
  }

  get isEmpty(): boolean {
    return this.levelValue === 0;
  }
}
