import { create } from 'zustand'
import type { AuthUser } from '../types/auth'

const USER_KEY = 'edupal_user'

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

interface AuthState {
  user: AuthUser | null
  setAuth: (user: AuthUser, token: string) => void
  updateUser: (updates: Partial<AuthUser>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: loadUser(),
  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user })
  },
  updateUser: (updates) => {
    set((state) => {
      const next = state.user ? { ...state.user, ...updates } : null
      if (next) localStorage.setItem(USER_KEY, JSON.stringify(next))
      return { user: next }
    })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem(USER_KEY)
    set({ user: null })
  },
}))
