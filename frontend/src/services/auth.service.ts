import { api } from './api'
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  TwoFARequiredResponse,
  SignupRequest,
  SignupResponse,
  ChangePasswordRequest,
  Setup2FAResponse,
  CompleteTwoFARequest,
  UpdateProfileRequest,
} from '../types/auth'

export const authService = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse | TwoFARequiredResponse>('/auth/login', data),

  me: () => api.get<{ user: AuthUser }>('/auth/me'),

  signup: (data: SignupRequest) => api.post<SignupResponse>('/auth/signup', data),

  changePassword: (data: ChangePasswordRequest) =>
    api.post<{ message: string }>('/auth/change-password', data),

  setup2FA: () => api.post<Setup2FAResponse>('/auth/2fa/setup', {}),

  verify2FA: (code: string) =>
    api.post<{ message: string }>('/auth/2fa/verify', { code }),

  disable2FA: (password: string) =>
    api.post<{ message: string }>('/auth/2fa/disable', { password }),

  completeTwoFA: (data: CompleteTwoFARequest) =>
    api.post<LoginResponse>('/auth/2fa/complete', data),

  updateProfile: (data: UpdateProfileRequest) =>
    api.patch<{ user: AuthUser }>('/auth/profile', data),

  verifyPassword: (password: string) =>
    api.post<{ verified: true }>('/auth/verify-password', { password }),

  setupAccount: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/setup-account', { token, password }),
}
