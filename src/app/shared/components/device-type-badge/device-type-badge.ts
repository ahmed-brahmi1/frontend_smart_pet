import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { DeviceType } from '../../../core/models/device';

@Component({
  selector: 'app-device-type-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-type-badge.html',
  styleUrl: './device-type-badge.scss',
})
export class DeviceTypeBadge {
  type = input<DeviceType>('COLLAR');
}
