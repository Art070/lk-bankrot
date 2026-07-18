import { Bell, ClipboardList, FileUp, MessageCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../context/DataContext'

const items = [
  { to: '/', label: 'Главная', icon: ClipboardList },
  { to: '/documents/collection', label: 'Документы', icon: FileUp },
  { to: '/notifications', label: 'События', icon: Bell },
  { to: '/contacts', label: 'Связь', icon: MessageCircle },
]

export function MobileNav() {
  const { user } = useAuth()
  const { unreadCount } = useData()
  if (user?.profile.role !== 'client') return null

  return <nav aria-label="Основная навигация" className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-100/80 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-white/10 dark:bg-charcoal-900/95 lg:hidden">
    <div className="mx-auto grid max-w-lg grid-cols-4">
      {items.map((item) => { const Icon = item.icon; const isNotifications = item.to === '/notifications'; return <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium ${isActive ? 'bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-gold-200' : 'text-navy-400 dark:text-white/50'}`}><span className="relative"><Icon className="h-5 w-5" />{isNotifications && unreadCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-gold-400 px-1 text-[9px] font-bold text-navy-900">{unreadCount}</span>}</span><span>{item.label}</span></NavLink> })}
    </div>
  </nav>
}
