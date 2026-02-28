import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MqttStatus {
  connected: boolean;
  clientId: string;
}

/** Request body for POST /mqtt-client/publish */
export interface MqttPublishDto {
  topic: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class MqttClientService {
  private readonly apiUrl = environment.apiUrl + '/mqtt-client';

  constructor(private http: HttpClient) {}

  getStatus(): Observable<MqttStatus> {
    return this.http.get<MqttStatus>(`${this.apiUrl}/status`);
  }

  publish(body: MqttPublishDto): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.apiUrl}/publish`, body);
  }

  getCache(): Observable<unknown> {
    return this.http.get<unknown>(`${this.apiUrl}/cache`);
  }
}
