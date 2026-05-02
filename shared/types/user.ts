export type Role = 'ADMIN' | 'DOCTOR' | 'THERAPIST' | 'TEACHER' | 'PARENT' | 'STUDENT'

export interface AuthUser {
  id: string
  email: string
  role: Role
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}
