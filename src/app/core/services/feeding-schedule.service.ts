import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  FeedingSchedule,
  CreateFeedingScheduleDto,
  UpdateFeedingScheduleDto,
} from '../models/feeding-schedule';

@Injectable({
  providedIn: 'root',
})
export class FeedingScheduleService {
  private readonly apiUrl = environment.apiUrl + '/feeding-schedule';

  constructor(private http: HttpClient) {}

  create(body: CreateFeedingScheduleDto): Observable<FeedingSchedule> {
    return this.http.post<FeedingSchedule>(this.apiUrl, body);
  }

  findAll(): Observable<FeedingSchedule[]> {
    return this.http.get<FeedingSchedule[]>(this.apiUrl);
  }

  findByDevice(deviceId: string): Observable<FeedingSchedule[]> {
    return this.http.get<FeedingSchedule[]>(
      `${this.apiUrl}/device/${encodeURIComponent(deviceId)}`
    );
  }

  findOne(id: string): Observable<FeedingSchedule> {
    return this.http.get<FeedingSchedule>(`${this.apiUrl}/${id}`);
  }

  update(id: string, body: UpdateFeedingScheduleDto): Observable<FeedingSchedule> {
    return this.http.patch<FeedingSchedule>(`${this.apiUrl}/${id}`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
