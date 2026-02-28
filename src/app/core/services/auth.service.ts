import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RegisterResponse,
  AuthUser,
} from '../models/auth';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'auth_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl + '/auth';

  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  private readonly userSignal = signal<AuthUser | null>(this.getStoredUser());

  readonly accessToken = this.tokenSignal.asReadonly();
  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.restoreSession();
  }

  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private getStoredUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private restoreSession(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    this.tokenSignal.set(token);
    this.userSignal.set(user);
  }

  /** Returns the current access token for use by the HTTP interceptor. */
  getAccessToken(): string | null {
    return this.tokenSignal();
  }

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, body).pipe(
      tap((res) => this.setSession(res))
    );
  }

  register(body: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, body);
  }

  /** Call after login to store token and user. */
  setSession(auth: AuthResponse): void {
    if (auth.access_token) {
      localStorage.setItem(TOKEN_KEY, auth.access_token);
      this.tokenSignal.set(auth.access_token);
    }
    if (auth.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
      this.userSignal.set(auth.user);
    }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.router.navigate(['/']);
  }

  /** Clear token and user (e.g. on 401). Does not navigate. */
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }
}
