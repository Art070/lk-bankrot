import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthUser {
  id: string
  email: string
  profile: Profile
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  configured: boolean
  login: (login: string, password: string) => Promise<void>
  logout: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setLoading(false)
        return
      }
      try {
        setUser(await loadProfile(session.user.id, session.user.email ?? ''))
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    void loadUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(async (loginValue: string, password: string) => {
    if (!isSupabaseConfigured) throw new Error('Кабинет ещё не подключён к серверу данных')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginValue.trim(),
      password,
    })
    if (error || !data.user) throw new Error(error?.message ?? 'Не удалось войти')
    setUser(await loadProfile(data.user.id, data.user.email ?? loginValue.trim()))
  }, [])

  const logout = useCallback(() => {
    void supabase.auth.signOut()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      configured: isSupabaseConfigured,
      login,
      logout,
    }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

async function loadProfile(id: string, email: string): Promise<AuthUser> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, inn')
    .eq('id', id)
    .single()
  if (error || !profile) {
    await supabase.auth.signOut()
    throw new Error('Профиль пользователя не найден. Обратитесь к администратору.')
  }
  return {
    id,
    email,
    profile: {
      id: profile.id,
      fullName: profile.full_name,
      role: profile.role,
      phone: profile.phone,
      inn: profile.inn,
    },
  }
}
