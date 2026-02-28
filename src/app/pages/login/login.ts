import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.errorMessage = '';
    this.loading = true;
    this.authService
      .login({ email: this.email, password: this.password })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Login failed';
          Swal.fire({
            icon: 'error',
            title: 'Login failed',
            text: this.errorMessage,
          });
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}