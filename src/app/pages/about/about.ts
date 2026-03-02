import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About {

  showPayment = false;
  paymentSuccess = false;

  cardName = '';
  cardNumber = '';
  expiry = '';

  constructor(private router: Router) {}

  openPayment() {
    this.showPayment = true;
  }

  closePayment() {
    this.showPayment = false;
  }

  processPayment() {
    this.paymentSuccess = true;

    setTimeout(() => {
      this.showPayment = false;
      this.router.navigate(['/register']);
    }, 2000);
  }

  toggleVideo(video: HTMLVideoElement) {
  if (video.paused) {
    video.play();
    // Optionnel : masquer le bouton play quand la vidéo tourne
    video.parentElement?.querySelector('.video-overlay')?.classList.add('hidden');
  } else {
    video.pause();
    video.parentElement?.querySelector('.video-overlay')?.classList.remove('hidden');
  }
}
}



