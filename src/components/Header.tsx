import { Bell, Menu, MessageCircle, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'

interface HeaderProps {
  title: string
  subtitle?: string
  onOpenMobile: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Header({
  title,
  subtitle,
  onOpenMobile,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const { unreadCount } = useData()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 border-b border-navy-100/60 bg-white/80 backdrop-blur-md dark:border-white/5 dark:bg-charcoal-900/80">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-navy-600 hover:bg-navy-50 dark:text-white/70 dark:hover:bg-white/5 lg:hidden"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-navy-800 dark:text-white sm:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden truncate text-xs text-navy-400 dark:text-white/40 sm:block">
              {subtitle}
            </p>
          )}
        </div>

        <button
          onClick={() => navigate('/contacts')}
          className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50 dark:text-white/70 dark:hover:bg-white/5 md:inline-flex"
        >
          <MessageCircle className="h-4 w-4" /> Помощь
        </button>

        <button
          onClick={onToggleTheme}
          className="rounded-xl p-2.5 text-navy-600 transition-colors hover:bg-navy-50 dark:text-white/70 dark:hover:bg-white/5"
          aria-label="Переключить тему"
          aria-pressed={theme === 'dark'}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={() => navigate('/notifications')}
          className="relative rounded-xl p-2.5 text-navy-600 transition-colors hover:bg-navy-50 dark:text-white/70 dark:hover:bg-white/5"
          aria-label="Уведомления"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-navy-900">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
