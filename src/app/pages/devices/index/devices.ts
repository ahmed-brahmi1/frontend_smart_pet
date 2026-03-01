import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DeviceService } from '../../../core/services/device.service';
import type { Device } from '../../../core/models/device';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './devices.html',
  styleUrl: './devices.scss',
})
export class Devices implements OnInit {
  devices: Device[] = [];
  loading = true;
  errorMessage = '';
  private readonly deviceService = inject(DeviceService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loading = true;
    this.errorMessage = '';
    this.deviceService
      .findAll()
      .pipe(catchError((err) => {
        this.errorMessage = err?.error?.message ?? err?.message ?? 'Failed to load devices';
        return of<Device[]>([]);
      }))
      .subscribe((list) => {
        this.devices = list;
        this.loading = false;
        this.cdr.detectChanges();
      });
  }
}
