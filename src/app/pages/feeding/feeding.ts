import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedingService, FeedingData } from '../../services/feeding';

@Component({
  selector: 'app-feeding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feeding.html',
  styleUrl: './feeding.scss',
})
export class Feeding implements OnInit {
  status: FeedingData | null = null;
  loading = true;

  constructor(private feedingService: FeedingService) {}

  ngOnInit(): void {
    this.feedingService.getLatestStatus().subscribe({
      next: (data) => {
        // On prend le premier élément du tableau (le plus récent)
        this.status = data[0]; 
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur API Feeding:', err);
        this.loading = false;
      }
    });
  }

  onFill(): void {
    console.log("Clic détecté !");
  this.loading = true; // Optionnel : montrer un petit spinner sur le bouton
  this.feedingService.fillStation().subscribe({
    next: (newData) => {
      this.status = newData; // Les jauges vont monter toutes seules grâce au binding
      this.loading = false;
    },
    error: (err) => {
      console.error('Erreur lors du remplissage:', err);
      this.loading = false;
    }
  });
}
  
}