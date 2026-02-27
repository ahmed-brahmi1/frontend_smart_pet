import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  name = '';
  email = '';
  password = '';

  constructor(private router: Router) {}

  onRegister() {
    console.log('User created:', this.name);
    this.router.navigate(['/dashboard']);
  }

  goToLogin() {
    this.router.navigate(['/']);
  }
}