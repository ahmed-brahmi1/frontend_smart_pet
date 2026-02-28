import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Single time-series row from device_data (snake_case to match backend) */
export interface DeviceDatum {
  id: string;
  device_id: string;
  battery_level: number;
  gps_lat?: number | null;
  gps_lng?: number | null;
  food_level_grams?: number | null;
  timestamp: string;
}

/** Request body for POST /device-data/ingest */
export interface IngestDeviceDataDto {
  device_id: string;
  battery_level: number;
  gps_lat?: number;
  gps_lng?: number;
  food_level_grams?: number;
}

@Injectable({
  providedIn: 'root',
})
export class DeviceDataService {
  private readonly apiUrl = environment.apiUrl + '/device-data';

  constructor(private http: HttpClient) {}

  ingest(body: IngestDeviceDataDto): Observable<DeviceDatum> {
    return this.http.post<DeviceDatum>(`${this.apiUrl}/ingest`, body);
  }

  create(body: Record<string, unknown> = {}): Observable<DeviceDatum> {
    return this.http.post<DeviceDatum>(this.apiUrl, body);
  }

  findAll(): Observable<DeviceDatum[]> {
    return this.http.get<DeviceDatum[]>(this.apiUrl);
  }

  findOne(id: string): Observable<DeviceDatum> {
    return this.http.get<DeviceDatum>(`${this.apiUrl}/${id}`);
  }

  update(
    id: string,
    body: Partial<Record<string, unknown>>
  ): Observable<DeviceDatum> {
    return this.http.patch<DeviceDatum>(`${this.apiUrl}/${id}`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
