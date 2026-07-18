import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_CREDENTIALS, mockClient } from '../data/mockData'
import type { Client } from '../types'

interface AuthUser {
  login: string
  client: Client
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  login: (login: string, password: string) => Promise<void>
  logout: () => void
}

const STORAGE_KEY = 'lk-bankrot:auth'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { login: string }
        if (parsed?.login) {
          setUser({ login: parsed.login, client: mockClient })
        }
      }
    } catch {
      // ignore corrupted storage
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (loginValue: string, password: string) => {
    // Simulated network latency
    await new Promise((r) => setTimeout(r, 700))
    const ok =
      loginValue.trim().toLowerCase() === DEMO_CREDENTIALS.login &&
      password === DEMO_CREDENTIALS.password
    if (!ok) {
      throw new Error('Неверный логин или пароль')
    }
    const nextUser: AuthUser = { login: loginValue.trim(), client: mockClient }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ login: nextUser.login }))
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
