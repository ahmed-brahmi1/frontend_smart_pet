import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  Device,
  ClaimDeviceDto,
  RegisterDeviceDto,
  UpdateDeviceDto,
} from '../models/device';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private readonly apiUrl = environment.apiUrl + '/device';

  constructor(private http: HttpClient) {}

  claim(body: ClaimDeviceDto): Observable<Device> {
    return this.http.post<Device>(`${this.apiUrl}/claim`, body);
  }

  register(body: RegisterDeviceDto): Observable<Device> {
    return this.http.post<Device>(`${this.apiUrl}/register`, body);
  }

  create(body: Record<string, unknown> = {}): Observable<Device> {
    return this.http.post<Device>(this.apiUrl, body);
  }

  findAll(): Observable<Device[]> {
    return this.http.get<Device[]>(this.apiUrl);
  }

  findOne(id: string): Observable<Device> {
    return this.http.get<Device>(`${this.apiUrl}/${id}`);
  }

  update(id: string, body: UpdateDeviceDto): Observable<Device> {
    return this.http.patch<Device>(`${this.apiUrl}/${id}`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
