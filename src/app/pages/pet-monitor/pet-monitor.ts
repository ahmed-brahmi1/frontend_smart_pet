import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PetService } from '../../core/services/pet.service';
import { DeviceService } from '../../core/services/device.service';
import type { Pet } from '../../core/models/pet';
import type { Device } from '../../core/models/device';
import type { ClaimDeviceDto } from '../../core/models/device';
import type { LinkDeviceDto } from '../../core/models/pet';

@Component({
  selector: 'app-pet-monitor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pet-monitor.html',
  styleUrl: './pet-monitor.scss',
})
export class PetMonitor implements OnInit {
  pet: Pet | null = null;
  devices: Device[] = [];
  allUserDevices: Device[] = [];
  loading = true;
  errorMessage = '';

  showLinkDialog = false;
  linkMode: 'existing' | 'claim' = 'existing';
  selectedDeviceId = '';
  claimDeviceId = '';
  claimActivationSecret = '';
  linkDialogError = '';
  linkSubmitting = false;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly petService = inject(PetService);
  private readonly deviceService = inject(DeviceService);
  private readonly cdr = inject(ChangeDetectorRef);

  get petId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  /** Devices owned by user that are not yet linked to this pet (for dropdown). */
  get availableToLink(): Device[] {
    const linkedIds = new Set(this.devices.map((d) => d.id));
    return this.allUserDevices.filter((d) => !linkedIds.has(d.id));
  }

  ngOnInit(): void {
    const id = this.petId;
    if (!id) {
      this.errorMessage = 'No pet ID';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    this.loadPetAndDevices();
  }

  loadPetAndDevices(): void {
    const id = this.petId;
    if (!id) return;

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      pet: this.petService.findOne(id).pipe(catchError(() => of(null))),
      devices: this.petService.findDevicesByPetId(id).pipe(catchError(() => of<Device[]>([]))),
      allDevices: this.deviceService.findAll().pipe(catchError(() => of<Device[]>([]))),
    }).subscribe({
      next: ({ pet, devices, allDevices }) => {
        this.pet = pet ?? null;
        this.devices = devices ?? [];
        this.allUserDevices = allDevices ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? err?.message ?? 'Failed to load';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/pets']);
  }

  openLinkDialog(): void {
    this.showLinkDialog = true;
    this.linkMode = 'existing';
    this.selectedDeviceId = '';
    this.claimDeviceId = '';
    this.claimActivationSecret = '';
    this.linkDialogError = '';
    this.linkSubmitting = false;
    this.cdr.detectChanges();
  }

  closeLinkDialog(): void {
    this.showLinkDialog = false;
    this.linkDialogError = '';
    this.cdr.detectChanges();
  }

  submitLink(): void {
    const id = this.petId;
    if (!id) return;

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
      this.petService.linkDevice(id, body).subscribe({
        next: () => {
          this.closeLinkDialog();
          this.loadPetAndDevices();
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

    // claim new device and link
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
      pet_id: id,
    };
    this.deviceService.claim(body).subscribe({
      next: () => {
        this.closeLinkDialog();
        this.loadPetAndDevices();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.linkDialogError = err?.error?.message ?? err?.message ?? 'Claim failed';
        this.linkSubmitting = false;
        this.cdr.detectChanges();
      },
    });
  }

  unlinkDevice(device: Device): void {
    const id = this.petId;
    if (!id || !confirm(`Unlink "${device.mac_address}" from this pet?`)) return;

    this.errorMessage = '';
    this.petService.unlinkDevice(id, device.id).subscribe({
      next: () => this.loadPetAndDevices(),
      error: (err) => {
        this.errorMessage = err?.error?.message ?? err?.message ?? 'Unlink failed';
        this.cdr.detectChanges();
      },
    });
  }
}
