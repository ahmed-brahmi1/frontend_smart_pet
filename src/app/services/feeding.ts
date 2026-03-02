import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FeedingData {
  id: number;
  foodLevel: number;
  waterLevel: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class FeedingService {
  private apiUrl = 'http://localhost:8081/api/feeding';

  constructor(private http: HttpClient) {}

  getLatestStatus(): Observable<FeedingData[]> {
    return this.http.get<FeedingData[]>(this.apiUrl);
  }
  // Dans FeedingService
fillStation(): Observable<FeedingData> {
  return this.http.post<FeedingData>(`${this.apiUrl}/remplissage`, {});
}
}