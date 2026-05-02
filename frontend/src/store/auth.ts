import { create } from 'zustand'
import type { AuthUser } from '../types/auth'

interface AuthState {
  user: AuthUser | null
  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    set({ user })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null })
  },
}))
