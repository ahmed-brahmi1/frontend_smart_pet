import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DeviceDatum {
  id?: string;
  device_id: string;
  battery_level: number;
  gps_lat?: number | null;
  gps_lng?: number | null;
  temperature?: number | null;
  food_level_grams?: number | null;
  water_level?: number | null;
  steps?: number | null;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class DeviceDataService {
  private readonly apiUrl = environment.apiUrl + '/device-data';

  constructor(private http: HttpClient) {}

  findAll(): Observable<DeviceDatum[]> {
    return this.http.get<DeviceDatum[]>(this.apiUrl);
  }
}
