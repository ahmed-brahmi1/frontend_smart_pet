import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Sensor {
  temperature: number;
  heartRate: number;
  steps: number;
  healthScore: number;
}

@Injectable({
  providedIn: 'root'
})
export class SensorService {

  private apiUrl = 'http://localhost:8081/api/sensor';

  constructor(private http: HttpClient) {}

  getLatest(): Observable<Sensor> {
    return this.http.get<Sensor>(`${this.apiUrl}/latest`);
  }
}
