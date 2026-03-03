import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserSidebar } from './user-sidebar/user-sidebar';
import { PetSwitcher } from './pet-switcher/pet-switcher';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, UserSidebar, PetSwitcher],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.scss',
})
export class UserLayout {
  private readonly auth = inject(AuthService);

  get showPetSwitcher(): boolean {
    return this.auth.getCurrentUser()?.role === 'USER';
  }
}
