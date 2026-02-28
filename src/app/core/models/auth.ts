/** Request body for POST /auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Request body for POST /auth/register */
export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

/** User object returned in auth responses (backend may use id or _id) */
export interface AuthUser {
  id?: string;
  _id?: string;
  email: string;
  role?: string;
}

/** Response from POST /auth/login – stored as-is under localStorage key "currentUser" */
export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: AuthUser;
}

/** Stored value: full login response. Use token (alias) or access_token for Authorization header. */
export type CurrentUserValue = AuthResponse & { token?: string };

/** Response from POST /auth/register */
export interface RegisterResponse {
  message: string;
  user: AuthUser;
}
