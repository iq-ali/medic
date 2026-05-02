import { api } from './api'
import type { AuthUser, LoginRequest, LoginResponse } from '../types/auth'

export const authService = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  me: () => api.get<{ user: AuthUser }>('/auth/me'),
}
