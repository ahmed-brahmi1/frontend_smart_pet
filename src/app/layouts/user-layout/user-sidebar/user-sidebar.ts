import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import type { AuthUser } from '../../../core/models/auth';
import { USER_MENU } from '../user-menu';
import { ADMIN_MENU } from '../../admin-layout/admin-menu';

@Component({
  selector: 'app-user-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-sidebar.html',
  styleUrl: './user-sidebar.scss',
})
export class UserSidebar {
  readonly auth = inject(AuthService);
  readonly menu = USER_MENU;
  readonly adminMenu = ADMIN_MENU;

  get currentUser(): AuthUser | null {
    return this.auth.getCurrentUser();
  }

  get isAdmin(): boolean {
    const user = this.currentUser;
    const role = user?.role ?? '';
    return String(role).toUpperCase() === 'ADMIN';
  }
}
