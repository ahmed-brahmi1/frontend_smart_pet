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

/** User object returned in auth responses */
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

/** Response from POST /auth/login */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

/** Response from POST /auth/register */
export interface RegisterResponse {
  message: string;
  user: AuthUser;
}
