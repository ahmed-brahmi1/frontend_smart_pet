import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';  // ← 1. Ajoute cet import
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  email: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router  // ← 2. Ajoute Router dans le constructeur
  ) {}

  onLogin() {
    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res: any) => {  // ← 3. Redirige vers dashboard
        console.log('Login réussi', res);
        this.router.navigate(['/dashboard']);  // ← Redirection
      },
      error: (err: any) => {
        console.error('Erreur login', err);
        alert('Login failed');
      }
    });
  }
}