import {
  Component,
  inject,
  OnInit,
  signal,
  HostListener,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivePetService } from '../../../core/services/active-pet.service';
import { PetService } from '../../../core/services/pet.service';
import type { Pet, CreatePetDto } from '../../../core/models/pet';

@Component({
  selector: 'app-pet-switcher',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pet-switcher.html',
  styleUrl: './pet-switcher.scss',
})
export class PetSwitcher implements OnInit {
  readonly activePetService = inject(ActivePetService);
  private readonly petService = inject(PetService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isOpen = signal(false);

  // Add‑pet dialog state
  readonly showAddDialog = signal(false);
  readonly addSubmitting = signal(false);
  readonly addError = signal('');
  addForm = {
    name: '',
    species: '',
    breed: '',
    weight: '',
    calorie_goal: '',
  };

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (this.el.nativeElement.contains(event.target as Node)) return;
    this.close();
  }

  get activePet(): Pet | null {
    return this.activePetService.activePet();
  }

  get ownedPets(): Pet[] {
    return this.activePetService.ownedPets();
  }

  ngOnInit(): void {
    this.activePetService.refreshPets();
  }

  toggle(): void {
    const next = !this.isOpen();
    this.isOpen.set(next);
    if (next) this.activePetService.refreshPets();
  }

  close(): void {
    this.isOpen.set(false);
  }

  selectPet(pet: Pet): void {
    this.activePetService.setActivePet(pet);
    this.close();
  }

  // Called from the dropdown “Add New Pet”
  addNewPet(): void {
    this.openAddPetDialog();
  }

  openAddPetDialog(): void {
    this.close(); // close dropdown
    this.addError.set('');
    this.addForm = { name: '', species: '', breed: '', weight: '', calorie_goal: '' };
    this.showAddDialog.set(true);
    this.cdr.detectChanges();
  }

  closeAddPetDialog(): void {
    this.showAddDialog.set(false);
    this.addError.set('');
    this.cdr.detectChanges();
  }

  submitAddPet(): void {
    const name = this.addForm.name.trim();
    const species = this.addForm.species.trim();
    if (!name || !species) {
      this.addError.set('Name and species are required.');
      return;
    }

    const weightStr = String(this.addForm.weight ?? '').trim();
    const calorieStr = String(this.addForm.calorie_goal ?? '').trim();
    const weight = weightStr ? Number(weightStr) : undefined;
    const calorie_goal = calorieStr ? Number(calorieStr) : undefined;
    const breed = String(this.addForm.breed ?? '').trim() || undefined;

    const body: CreatePetDto = { name, species };
    if (breed) body.breed = breed;
    if (weight != null) body.weight = weight;
    if (calorie_goal != null) body.calorie_goal = calorie_goal;

    this.addSubmitting.set(true);
    this.addError.set('');

    this.petService.create(body).subscribe({
      next: (pet) => {
        // Set new pet as active and refresh list
        this.activePetService.setActivePet(pet);
        this.activePetService.refreshPets();
        this.addSubmitting.set(false);
        this.showAddDialog.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addSubmitting.set(false);
        this.addError.set(
          err?.error?.message ?? err?.message ?? 'Failed to add pet'
        );
        this.cdr.detectChanges();
      },
    });
  }
}