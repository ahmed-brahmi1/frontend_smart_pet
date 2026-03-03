import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PetService } from '../../core/services/pet.service';
import type { Pet, CreatePetDto, UpdatePetDto } from '../../core/models/pet';

@Component({
  selector: 'app-pets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pets.html',
  styleUrl: './pets.scss',
})
export class Pets implements OnInit {
  pets: Pet[] = [];
  loading = true;
  errorMessage = '';
  private readonly auth = inject(AuthService);
  private readonly petService = inject(PetService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  showForm = false;
  editingId: string | null = null;
  form: { name: string; species: string; breed: string; weight: string; calorie_goal: string; owner: string } = {
    name: '',
    species: '',
    breed: '',
    weight: '',
    calorie_goal: '',
    owner: '',
  };

  ngOnInit(): void {
    this.loadPets();
  }
  

  loadPets(): void {
    this.loading = true;
    this.errorMessage = '';
    this.petService.findAll().subscribe({
      next: (list) => {
        this.pets = list;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? err?.message ?? 'Failed to load pets';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openAdd(): void {
    this.editingId = null;
    this.form = { name: '', species: '', breed: '', weight: '', calorie_goal: '', owner: '' };
    this.showForm = true;
  }

  openEdit(pet: Pet): void {
    this.editingId = pet.id;
    this.form = {
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? '',
      weight: pet.weight != null ? String(pet.weight) : '',
      calorie_goal: pet.calorie_goal != null ? String(pet.calorie_goal) : '',
      owner: pet.owner_id ?? '',
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  saveForm(): void {
    if (!this.auth.isAuthenticated()) {
      this.errorMessage = 'You must be logged in to add or edit a pet.';
      return;
    }
    const name = this.form.name.trim();
    const species = this.form.species.trim();
    if (!name || !species) {
      this.errorMessage = 'Name and species are required.';
      return;
    }
    this.errorMessage = '';

    const weightStr = String(this.form.weight ?? '').trim();
    const calorieStr = String(this.form.calorie_goal ?? '').trim();
    const weight = weightStr ? Number(weightStr) : undefined;
    const calorie_goal = calorieStr ? Number(calorieStr) : undefined;
    const breed = String(this.form.breed ?? '').trim() || undefined;
    const owner_id = String(this.form.owner ?? '').trim() || undefined;
    if (this.editingId) {
      const body: UpdatePetDto = { name, species, breed, weight, calorie_goal };
      this.petService.update(this.editingId, body).subscribe({
        next: () => {
          this.loadPets();
          this.cancelForm();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? err?.message ?? 'Failed to update pet';
        },
      });
    } else {
      const body: CreatePetDto = { name, species, breed, weight, calorie_goal, owner_id };
      this.petService.create(body).subscribe({
        next: () => {
          this.loadPets();
          this.cancelForm();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? err?.message ?? 'Failed to add pet';
        },
      });
    }
  }


  deletePet(pet: Pet): void {
    if (!confirm(`Delete "${pet.name}"?`)) return;
    this.errorMessage = '';
    this.petService.remove(pet.id).subscribe({
      next: () => this.loadPets(),
      error: (err) => {
        this.errorMessage = err?.error?.message ?? err?.message ?? 'Failed to delete pet';
      },
    });
  }
}
