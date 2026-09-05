import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, TOKEN_KEY } from '../lib/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (token: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setReady(true); return }

    api.get<User>('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setReady(true))
  }, [])

  const login = async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    const me = await api.get<User>('/auth/me')
    setUser(me)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  const refreshUser = async () => {
    const me = await api.get<User>('/auth/me')
    setUser(me)
  }

  if (!ready) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border-default)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'vk-spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}