import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  constructor(public auth: AuthService) {}
  logout(): void {
    this.auth.logout();
  }
}
