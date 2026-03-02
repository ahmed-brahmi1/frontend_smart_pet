import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusKind = 'online' | 'offline' | 'claimed' | 'unclaimed';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  /** Status type: online/offline or claimed/unclaimed */
  status = input<StatusKind>('offline');
  /** Optional custom label (defaults to status text) */
  label = input<string | null>(null);

  get displayLabel(): string {
    const l = this.label();
    if (l != null && l !== '') return l;
    const s = this.status();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  get isPositive(): boolean {
    const s = this.status();
    return s === 'online' || s === 'claimed';
  }
}
