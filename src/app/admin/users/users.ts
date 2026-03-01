import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import type { User, CreateUserDto, UpdateUserDto } from '../../core/models/user';
import Swal from 'sweetalert2';

const ROLES = ['USER', 'ADMIN'];

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  @ViewChild('addDialog') addDialogRef!: ElementRef<HTMLDialogElement>;
  @ViewChild('editDialog') editDialogRef!: ElementRef<HTMLDialogElement>;

  private userService = inject(UserService);

  users = signal<User[]>([]);
  loadingList = signal(true);
  email = '';
  role = 'USER';
  submitting = false;
  dialogError = '';

  editingUser: User | null = null;
  edit_email = '';
  edit_role = 'USER';
  editSubmitting = false;
  editDialogError = '';

  readonly roles = ROLES;

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loadingList.set(true);
    this.userService.findAll().subscribe({
      next: (list) => {
        this.users.set(list);
        this.loadingList.set(false);
      },
      error: () => {
        this.users.set([]);
        this.loadingList.set(false);
      },
    });
  }

  openAddDialog(): void {
    this.email = '';
    this.role = 'USER';
    this.dialogError = '';
    this.addDialogRef?.nativeElement?.showModal();
  }

  closeAddDialog(): void {
    this.addDialogRef?.nativeElement?.close();
  }

  onCreate(): void {
    this.dialogError = '';
    const emailVal = this.email?.trim();
    if (!emailVal) {
      this.dialogError = 'Email is required.';
      return;
    }

    this.submitting = true;
    const body: CreateUserDto = {
      email: emailVal,
      role: this.role,
    };

    this.userService.create(body).subscribe({
      next: () => {
        this.submitting = false;
        this.closeAddDialog();
        this.loadUsers();
        Swal.fire({ icon: 'success', title: 'User created' });
      },
      error: (err) => {
        this.submitting = false;
        this.dialogError =
          err?.error?.message ?? err?.message ?? 'Create failed';
        Swal.fire({
          icon: 'error',
          title: 'Create failed',
          text: this.dialogError,
        });
      },
    });
  }

  openEditDialog(u: User): void {
    this.editingUser = u;
    this.edit_email = u.email;
    this.edit_role = u.role ?? 'USER';
    this.editDialogError = '';
    this.editDialogRef?.nativeElement?.showModal();
  }

  closeEditDialog(): void {
    this.editingUser = null;
    this.editDialogRef?.nativeElement?.close();
  }

  onUpdate(): void {
    if (!this.editingUser) return;
    this.editDialogError = '';
    const emailVal = this.edit_email?.trim();
    if (!emailVal) {
      this.editDialogError = 'Email is required.';
      return;
    }

    this.editSubmitting = true;
    const body: UpdateUserDto = {
      email: emailVal,
      role: this.edit_role,
    };

    this.userService.update(this.editingUser.id, body).subscribe({
      next: () => {
        this.editSubmitting = false;
        this.closeEditDialog();
        this.loadUsers();
        Swal.fire({ icon: 'success', title: 'User updated' });
      },
      error: (err) => {
        this.editSubmitting = false;
        this.editDialogError =
          err?.error?.message ?? err?.message ?? 'Update failed';
      },
    });
  }

  deleteUser(u: User): void {
    Swal.fire({
      title: 'Delete user?',
      text: `Remove ${u.email}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.remove(u.id).subscribe({
          next: () => {
            this.loadUsers();
            Swal.fire({ icon: 'success', title: 'User deleted' });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Delete failed',
              text: err?.error?.message ?? err?.message ?? 'Could not delete user',
            });
          },
        });
      }
    });
  }

  formatDate(created_at: string): string {
    if (!created_at) return '—';
    try {
      const d = new Date(created_at);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return created_at;
    }
  }
}
