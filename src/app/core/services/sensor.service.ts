import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  private apiUrl = environment.apiUrl + '/sensor';

  constructor(private http: HttpClient) {}

  getLatest(): Observable<Sensor> {
    return this.http.get<Sensor>(`${this.apiUrl}/latest`);
  }
}
