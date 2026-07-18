import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../hooks/useAuth'
import { Logo } from './Common/Logo'
import { NAV_ITEMS } from './nav'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { logout, user } = useAuth()
  const { unreadCount } = useData()

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-navy-800 text-white transition-all duration-300 dark:bg-charcoal-900 ${
          collapsed ? 'lg:w-[76px]' : 'lg:w-64'
        } w-64 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-4">
          <Logo compact={collapsed} onDark />
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isNotif = item.to === '/notifications'
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/65 hover:bg-white/5 hover:text-white'
                  } ${collapsed ? 'lg:justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 h-6 w-1 rounded-r-full bg-gold-400 transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <Icon
                      className={`h-5 w-5 shrink-0 ${
                        isActive ? 'text-gold-300' : ''
                      }`}
                    />
                    <span className={collapsed ? 'lg:hidden' : ''}>
                      {item.label}
                    </span>
                    {isNotif && unreadCount > 0 && (
                      <span
                        className={`ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-gold-400 px-1.5 text-[11px] font-bold text-navy-900 ${
                          collapsed
                            ? 'lg:absolute lg:right-1 lg:top-1 lg:ml-0'
                            : ''
                        }`}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3">
          <div
            className={`mb-2 flex items-center gap-3 rounded-xl px-2 py-2 ${
              collapsed ? 'lg:justify-center' : ''
            }`}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-400 text-sm font-bold text-navy-900">
              {user?.client.name
                .split(' ')
                .slice(0, 2)
                .map((p) => p[0])
                .join('')}
            </div>
            <div className={`min-w-0 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="truncate text-sm font-semibold">
                {user?.client.name.split(' ').slice(0, 2).join(' ')}
              </div>
              <div className="truncate text-xs text-white/45">
                Дело {user?.client.caseNumber}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white ${
              collapsed ? 'lg:justify-center' : ''
            }`}
            title={collapsed ? 'Выйти' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>Выйти</span>
          </button>

          <button
            onClick={onToggleCollapse}
            className="mt-1 hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/45 transition-colors hover:bg-white/5 hover:text-white lg:flex lg:justify-center"
            title={collapsed ? 'Развернуть' : 'Свернуть'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" />
                <span>Свернуть меню</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
