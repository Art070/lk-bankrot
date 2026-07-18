import { Loader2 } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DataProvider } from './context/DataContext'
import { useAuth } from './hooks/useAuth'
import { CasesStatus } from './pages/CasesStatus'
import { Contacts } from './pages/Contacts'
import { Dashboard } from './pages/Dashboard'
import { Documents } from './pages/Documents'
import { Finances } from './pages/Finances'
import { Login } from './pages/Login'
import { Notifications } from './pages/Notifications'
import { Admin } from './pages/Admin'
import { Setup } from './pages/Setup'
import { Onboarding } from './pages/Onboarding'
import { Journey } from './pages/Journey'

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f7f9fc]">
      <div className="flex flex-col items-center gap-3 text-navy-500">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        <p className="text-sm">Загрузка кабинета…</p>
      </div>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, loading, configured, user } = useAuth()

  if (loading) return <FullScreenLoader />
  if (!configured) return <Setup />

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <DataProvider>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route element={<Layout />}>
          {user?.profile.role === 'client' ? <>
            <Route path="/" element={<Journey />} />
            <Route path="/documents/collection" element={<Onboarding />} />
            <Route path="/overview" element={<Dashboard />} />
            <Route path="/case" element={<CasesStatus />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/contacts" element={<Contacts />} />
          </> : <Route path="/" element={<Admin />} />}
          {(user?.profile.role === 'admin' || user?.profile.role === 'manager') && <Route path="/admin" element={<Admin />} />}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  )
}
