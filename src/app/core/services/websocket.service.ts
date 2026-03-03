import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Payload sent from backend when MQTT device data is received (event "device-data"). */
export interface DeviceDataEvent {
  device_id: string;
  topic: string;
  timestamp: string;
  data: {
    battery_level: number;
    gps_lat?: number;
    gps_lng?: number;
    food_level_grams?: number;
    temperature?: number;
    water_level?: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private socket: Socket | null = null;

  private readonly deviceDataSubject = new BehaviorSubject<DeviceDataEvent[]>([]);
  readonly deviceData$: Observable<DeviceDataEvent[]> = this.deviceDataSubject.asObservable();
  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  readonly connected$: Observable<boolean> = this.connectedSubject.asObservable();
  private readonly maxDeviceDataEvents = 200;

  connect(): void {
    if (this.socket?.connected) return;

    let token = this.auth.getToken();
    if (!token) {
      return;
    }
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    this.socket = io(environment.apiUrl, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    });

    this.socket.on('connect', () => this.connectedSubject.next(true));
    this.socket.on('disconnect', () => this.connectedSubject.next(false));
    this.socket.on('connect_error', () => this.connectedSubject.next(false));
    this.listenForDeviceData();
  }

  private listenForDeviceData(): void {
    if (!this.socket) return;

    this.socket.on('device-data', (payload: DeviceDataEvent) => {
      const current = this.deviceDataSubject.value;
      const next = [...current, payload].slice(-this.maxDeviceDataEvents);
      this.deviceDataSubject.next(next);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectedSubject.next(false);
    this.deviceDataSubject.next([]);
  }

  getDeviceData(): DeviceDataEvent[] {
    return this.deviceDataSubject.value;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
