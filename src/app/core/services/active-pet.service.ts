import { Injectable, signal, computed, inject } from '@angular/core';
import { PetService } from './pet.service';
import { AuthService } from './auth.service';
import type { Pet } from '../models/pet';

export const ACTIVE_PET_ID_KEY = 'smartpet_active_pet_id';

@Injectable({
  providedIn: 'root',
})
export class ActivePetService {
  private readonly petService = inject(PetService);
  private readonly auth = inject(AuthService);

  /** Current active pet id (persisted to localStorage). */
  readonly activePetId = signal<string | null>(this.restoreStoredId());

  /** Full Pet entity for the active id; updated when list loads or id changes. */
  readonly activePet = signal<Pet | null>(null);

  /** All pets owned by the current user (cached). */
  readonly ownedPets = signal<Pet[]>([]);

  /** Whether we have loaded the pets list and resolved activePet. */
  readonly initialized = signal(false);

  constructor() {}

  private restoreStoredId(): string | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(ACTIVE_PET_ID_KEY);
    return raw ?? null;
  }

  private persistId(id: string | null): void {
    if (typeof localStorage === 'undefined') return;
    if (id == null) {
      localStorage.removeItem(ACTIVE_PET_ID_KEY);
    } else {
      localStorage.setItem(ACTIVE_PET_ID_KEY, id);
    }
  }

  /** Call after login or on user layout init: load pets and set active from storage or first pet. */
  refreshPets(): void {
    if (!this.auth.isAuthenticated()) {
      this.ownedPets.set([]);
      this.activePet.set(null);
      this.initialized.set(true);
      return;
    }
    this.petService.findAll().subscribe({
      next: (list) => {
        this.ownedPets.set(list);
        const currentId = this.activePetId();
        const found = list.find((p) => p.id === currentId) ?? list[0] ?? null;
        if (found) {
          this.activePetId.set(found.id);
          this.activePet.set(found);
          this.persistId(found.id);
        } else {
          this.activePetId.set(null);
          this.activePet.set(null);
          this.persistId(null);
        }
        this.initialized.set(true);
      },
      error: () => {
        this.ownedPets.set([]);
        this.activePet.set(null);
        this.initialized.set(true);
      },
    });
  }

  /** Set active pet by entity; updates signals and localStorage. */
  setActivePet(pet: Pet | null): void {
    if (pet == null) {
      this.activePetId.set(null);
      this.activePet.set(null);
      this.persistId(null);
      return;
    }
    this.activePetId.set(pet.id);
    this.activePet.set(pet);
    this.persistId(pet.id);
  }

  /** Set active pet by id; resolves entity from owned list or fetches. */
  setActivePetById(id: string | null): void {
    if (id == null) {
      this.setActivePet(null);
      return;
    }
    const fromList = this.ownedPets().find((p) => p.id === id);
    if (fromList) {
      this.setActivePet(fromList);
      return;
    }
    this.petService.findOne(id).subscribe({
      next: (pet) => this.setActivePet(pet),
      error: () => {
        this.activePetId.set(null);
        this.activePet.set(null);
        this.persistId(null);
      },
    });
  }

  /** Clear active pet (e.g. when logging out). Call from AuthService.logout to avoid stale id. */
  clearActivePet(): void {
    this.activePetId.set(null);
    this.activePet.set(null);
    this.persistId(null);
  }
}
