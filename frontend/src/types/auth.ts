export type Role = 'ADMIN' | 'DOCTOR' | 'THERAPIST' | 'TEACHER' | 'PARENT' | 'STUDENT'

export interface AuthUser {
  id: string
  email: string
  role: Role
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}
