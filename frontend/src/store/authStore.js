import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: (user, token) => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user, token, isAuthenticated: true } }))
    set({ user, token, isAuthenticated: true })
  },
  
  logout: () => {
    localStorage.removeItem('auth-storage')
    set({ user: null, token: null, isAuthenticated: false })
  },
  
  updateUser: (user) => {
    const current = JSON.parse(localStorage.getItem('auth-storage') || '{}')
    localStorage.setItem('auth-storage', JSON.stringify({ 
      ...current, 
      state: { ...current.state, user } 
    }))
    set({ user })
  },
  
  // Restaurar estado desde localStorage
  restore: () => {
    try {
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        const { state } = JSON.parse(stored)
        if (state) {
          set(state)
        }
      }
    } catch (error) {
      console.error('Error restoring auth state:', error)
    }
  }
}))

// Restaurar estado al iniciar
useAuthStore.getState().restore()
