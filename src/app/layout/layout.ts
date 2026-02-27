import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule], // 👈 IMPORTANT
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {}
