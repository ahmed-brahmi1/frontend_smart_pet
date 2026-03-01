import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Pet, CreatePetDto, UpdatePetDto, LinkDeviceDto } from '../models/pet';
import type { Device } from '../models/device';

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

  /** Devices linked to this pet (for monitor page). */
  findDevicesByPetId(petId: string): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.apiUrl}/${petId}/devices`);
  }

  /** Link an existing device to this pet. */
  linkDevice(petId: string, body: LinkDeviceDto): Observable<Device> {
    return this.http.post<Device>(`${this.apiUrl}/${petId}/devices/link`, body);
  }

  /** Unlink a device from this pet. */
  unlinkDevice(petId: string, deviceId: string): Observable<Device> {
    return this.http.delete<Device>(`${this.apiUrl}/${petId}/devices/${deviceId}`);
  }

  update(id: string, body: UpdatePetDto): Observable<Pet> {
    return this.http.patch<Pet>(`${this.apiUrl}/${id}`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
