import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { UserSidebar } from './user-sidebar/user-sidebar';
import { PetSwitcher } from './pet-switcher/pet-switcher';
import { AuthService } from '../../core/services/auth.service';
import { WebsocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, UserSidebar, PetSwitcher],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.scss',
})
export class UserLayout implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly websocket = inject(WebsocketService);
  private authSub?: Subscription;

  get showPetSwitcher(): boolean {
    return this.auth.getCurrentUser()?.role === 'USER';
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.websocket.connect();
    }
    this.authSub = this.auth.currentUser
      .pipe(filter((user) => user === null))
      .subscribe(() => this.websocket.disconnect());
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }
}
