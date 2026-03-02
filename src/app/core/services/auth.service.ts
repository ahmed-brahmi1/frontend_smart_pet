import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RegisterResponse,
  CurrentUserValue,
  AuthUser,
} from '../models/auth';
import { ACTIVE_PET_ID_KEY } from './active-pet.service';

const CURRENT_USER_KEY = 'currentUser';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl + '/auth';

  private readonly currentUserSubject = new BehaviorSubject<CurrentUserValue | null>(
    this.getStoredCurrentUser()
  );

  get currentUserValue(): CurrentUserValue | null {
    return this.currentUserSubject.value;
  }

  readonly currentUser: Observable<CurrentUserValue | null> =
    this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.restoreSession();
  }

  private getStoredCurrentUser(): CurrentUserValue | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as CurrentUserValue;
      if (parsed.access_token || (parsed as { token?: string }).token) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  private restoreSession(): void {
    const stored = this.getStoredCurrentUser();
    if (stored) {
      this.currentUserSubject.next(stored);
    }
  }

  getToken(): string | null {
    const v = this.currentUserValue;
    return v?.access_token ?? v?.token ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue && !!this.getToken();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserValue?.user ?? null;
  }

  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.id ?? user?._id ?? null;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => this.setSession(res))
    );
  }

  register(body: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, body);
  }

  setSession(auth: AuthResponse): void {
    const toStore: CurrentUserValue = {
      user: auth.user,
      access_token: auth.access_token,
      refresh_token: auth.refresh_token,
      expires_at: auth.expires_at,
      token: auth.access_token,
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(toStore));
    }
    this.currentUserSubject.next(toStore);
  }

  logout(): void {
    this.currentUserSubject.next(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(ACTIVE_PET_ID_KEY);
    }
    this.router.navigate(['/']);
  }

  clearSession(): void {
    this.currentUserSubject.next(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }
}
