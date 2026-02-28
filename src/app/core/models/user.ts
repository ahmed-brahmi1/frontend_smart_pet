/** User entity (snake_case to match backend) */
export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  full_name?: string | null;
}

/** Request body for POST /user */
export interface CreateUserDto {
  email: string;
  role?: string;
}

/** Request body for PATCH /user/:id */
export interface UpdateUserDto {
  email?: string;
  role?: string;
}
