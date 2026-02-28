/** Pet entity (snake_case to match backend) */
export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed?: string | null;
  weight?: number | null;
  calorie_goal?: number | null;
}

/** Request body for POST /pet */
export interface CreatePetDto {
  owner_id: string;
  name: string;
  species: string;
  breed?: string;
  weight?: number;
  calorie_goal?: number;
}

/** Request body for PATCH /pet/:id */
export interface UpdatePetDto {
  owner_id?: string;
  name?: string;
  species?: string;
  breed?: string;
  weight?: number;
  calorie_goal?: number;
}
