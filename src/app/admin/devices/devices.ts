import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../core/services/device.service';
import type {
  Device,
  DeviceType,
  DeviceStatus,
  RegisterDeviceDto,
  UpdateDeviceDto,
} from '../../core/models/device';
import Swal from 'sweetalert2';

const DEVICE_TYPES: DeviceType[] = ['COLLAR', 'FEEDER'];
const DEVICE_STATUSES: DeviceStatus[] = ['unclaimed', 'claimed'];

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices.html',
  styleUrl: './devices.scss',
})
export class Devices {
  @ViewChild('addDialog') addDialogRef!: ElementRef<HTMLDialogElement>;
  @ViewChild('editDialog') editDialogRef!: ElementRef<HTMLDialogElement>;

  private deviceService = inject(DeviceService);

  devices = signal<Device[]>([]);
  loadingList = signal(true);
  mac_address = '';
  type: DeviceType = 'COLLAR';
  owner_id = '';
  submitting = false;
  dialogError = '';

  editingDevice: Device | null = null;
  edit_mac_address = '';
  edit_type: DeviceType = 'COLLAR';
  edit_status: DeviceStatus = 'unclaimed';
  edit_owner_id = '';
  editSubmitting = false;
  editDialogError = '';

  readonly deviceTypes = DEVICE_TYPES;
  readonly deviceStatuses = DEVICE_STATUSES;

  constructor() {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loadingList.set(true);
    this.deviceService.findAll().subscribe({
      next: (list) => {
        this.devices.set(list);
        this.loadingList.set(false);
      },
      error: () => {
        this.devices.set([]);
        this.loadingList.set(false);
      },
    });
  }

  openAddDialog(): void {
    this.mac_address = '';
    this.type = 'COLLAR';
    this.owner_id = '';
    this.dialogError = '';
    this.addDialogRef?.nativeElement?.showModal();
  }

  closeAddDialog(): void {
    this.addDialogRef?.nativeElement?.close();
  }

  private generateActivationSecret(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  onRegister(): void {
    this.dialogError = '';
    const mac = this.mac_address?.trim();
    if (!mac) {
      this.dialogError = 'MAC address is required.';
      return;
    }

    this.submitting = true;
    const activation_secret = this.generateActivationSecret();
    const body: RegisterDeviceDto = {
      mac_address: mac,
      type: this.type,
      activation_secret,
      ...(this.owner_id?.trim() ? { owner_id: this.owner_id.trim() } : {}),
    };

    this.deviceService.register(body).subscribe({
      next: (device) => {
        this.submitting = false;
        this.closeAddDialog();
        this.loadDevices();
        Swal.fire({
          icon: 'success',
          title: 'Device registered',
          html: `
            <p>Device registered successfully.</p>
            <p><strong>Activation secret</strong> (give this to the owner to claim the device):</p>
            <p class="activation-secret">${activation_secret}</p>
            <p><small>Device ID: ${device.id}</small></p>
          `,
        });
      },
      error: (err) => {
        this.submitting = false;
        this.dialogError =
          err?.error?.message ?? err?.message ?? 'Registration failed';
        Swal.fire({
          icon: 'error',
          title: 'Registration failed',
          text: this.dialogError,
        });
      },
    });
  }

  openEditDialog(d: Device): void {
    this.editingDevice = d;
    this.edit_mac_address = d.mac_address;
    this.edit_type = d.type;
    this.edit_status = d.status;
    this.edit_owner_id = d.owner_id ?? '';
    this.editDialogError = '';
    this.editDialogRef?.nativeElement?.showModal();
  }

  closeEditDialog(): void {
    this.editingDevice = null;
    this.editDialogRef?.nativeElement?.close();
  }

  onUpdate(): void {
    if (!this.editingDevice) return;
    this.editDialogError = '';
    const mac = this.edit_mac_address?.trim();
    if (!mac) {
      this.editDialogError = 'MAC address is required.';
      return;
    }

    this.editSubmitting = true;
    const body: UpdateDeviceDto = {
      mac_address: mac,
      type: this.edit_type,
      status: this.edit_status,
      owner_id: this.edit_owner_id?.trim() || null,
    };

    this.deviceService.update(this.editingDevice.id, body).subscribe({
      next: () => {
        this.editSubmitting = false;
        this.closeEditDialog();
        this.loadDevices();
        Swal.fire({ icon: 'success', title: 'Device updated' });
      },
      error: (err) => {
        this.editSubmitting = false;
        this.editDialogError =
          err?.error?.message ?? err?.message ?? 'Update failed';
      },
    });
  }

  deleteDevice(d: Device): void {
    Swal.fire({
      title: 'Delete device?',
      text: `Remove ${d.mac_address} (${d.type})? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deviceService.remove(d.id).subscribe({
          next: () => {
            this.loadDevices();
            Swal.fire({ icon: 'success', title: 'Device deleted' });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Delete failed',
              text: err?.error?.message ?? err?.message ?? 'Could not delete device',
            });
          },
        });
      }
    });
  }
}
