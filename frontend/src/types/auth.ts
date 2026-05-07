export type Role = 'ADMIN' | 'DOCTOR' | 'THERAPIST' | 'TEACHER' | 'PARENT' | 'STUDENT'

export interface AuthUser {
  id: string
  email: string
  role: Role
  twoFAEnabled: boolean
  firstName?: string
  lastName?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface TwoFARequiredResponse {
  requires2FA: true
  twoFAToken: string
}

export interface SignupRequest {
  firstName: string
  lastName: string
  role: Exclude<Role, 'ADMIN'>
  email: string
  specialty?: string
  phone?: string
  password: string
}

export interface SignupResponse {
  message: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface Setup2FAResponse {
  secret: string
  qrCode: string
}

export interface CompleteTwoFARequest {
  twoFAToken: string
  code: string
}

export interface PendingUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: Role
  createdAt: string
}

export interface AdminSettings {
  id: string
  autoApproval: boolean
  updatedAt: string
}

export interface UpdateProfileRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}
