import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import type { AuthUser } from '../../../core/models/auth';
import { ADMIN_MENU } from '../admin-menu';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
})
export class AdminSidebar {
  readonly auth = inject(AuthService);
  readonly menu = ADMIN_MENU;

  get currentUser(): AuthUser | null {
    return this.auth.getCurrentUser();
  }
}
