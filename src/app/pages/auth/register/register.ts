import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  full_name = '';
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onRegister() {
    this.errorMessage = '';
    this.loading = true;
    this.authService
      .register({
        email: this.email,
        password: this.password,
        full_name: this.full_name || undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Registration failed';
          Swal.fire({
            icon: 'error',
            title: 'Registration failed',
            text: this.errorMessage,
          });
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  goToLogin() {
    this.router.navigate(['/']);
  }
}