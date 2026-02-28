import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Pet, CreatePetDto, UpdatePetDto } from '../models/pet';

@Injectable({
  providedIn: 'root',
})
export class PetService {
  private readonly apiUrl = environment.apiUrl + '/pet';

  constructor(private http: HttpClient) {}

  create(body: CreatePetDto): Observable<Pet> {
    return this.http.post<Pet>(this.apiUrl, body);
  }

  findAll(): Observable<Pet[]> {
    return this.http.get<Pet[]>(this.apiUrl);
  }

  findOne(id: string): Observable<Pet> {
    return this.http.get<Pet>(`${this.apiUrl}/${id}`);
  }

  update(id: string, body: UpdatePetDto): Observable<Pet> {
    return this.http.patch<Pet>(`${this.apiUrl}/${id}`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
