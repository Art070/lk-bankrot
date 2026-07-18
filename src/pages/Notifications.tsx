import {
  BellOff,
  CalendarClock,
  Check,
  CheckCheck,
  FileWarning,
  Info,
  MessageSquare,
  Printer,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../components/Common/EmptyState'
import { useData } from '../context/DataContext'
import { formatDateTime } from '../lib/format'
import type { NotificationType } from '../types'

const TYPE_META: Record<
  NotificationType,
  { label: string; icon: typeof Info; cls: string }
> = {
  date: {
    label: 'Дата',
    icon: CalendarClock,
    cls: 'bg-navy-50 text-navy-600 dark:bg-navy-700/40 dark:text-navy-100',
  },
  document: {
    label: 'Документ',
    icon: FileWarning,
    cls: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300',
  },
  message: {
    label: 'Сообщение',
    icon: MessageSquare,
    cls: 'bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300',
  },
  system: {
    label: 'Система',
    icon: Info,
    cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
  },
}

export function Notifications() {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useData()
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const list = useMemo(() => {
    return [...notifications]
      .filter((n) => (showUnreadOnly ? !n.read : true))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
  }, [notifications, showUnreadOnly])

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUnreadOnly(false)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
              !showUnreadOnly
                ? 'bg-navy-800 text-white dark:bg-navy-700'
                : 'bg-white text-navy-600 hover:bg-navy-50 dark:bg-charcoal-800 dark:text-white/60'
            }`}
          >
            Все ({notifications.length})
          </button>
          <button
            onClick={() => setShowUnreadOnly(true)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
              showUnreadOnly
                ? 'bg-navy-800 text-white dark:bg-navy-700'
                : 'bg-white text-navy-600 hover:bg-navy-50 dark:bg-charcoal-800 dark:text-white/60'
            }`}
          >
            Непрочитанные ({unreadCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="btn-ghost">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Печать</span>
          </button>
          <button
            onClick={markAllNotificationsRead}
            disabled={unreadCount === 0}
            className="btn-primary"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Прочитать все</span>
          </button>
        </div>
      </div>

      {/* List */}
      {list.length > 0 ? (
        <div className="space-y-3">
          {list.map((n) => {
            const meta = TYPE_META[n.type]
            const Icon = meta.icon
            return (
              <div
                key={n.id}
                className={`card flex items-start gap-4 p-4 transition-colors ${
                  n.read ? '' : 'ring-1 ring-gold-200 dark:ring-gold-400/20'
                }`}
              >
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${meta.cls}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-navy-800 dark:text-white">
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="chip bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300">
                        Новое
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-navy-500 dark:text-white/50">
                    {n.body}
                  </p>
                  <p className="mt-1.5 text-xs text-navy-300 dark:text-white/30">
                    {formatDateTime(n.date)}
                  </p>
                </div>

                {!n.read && (
                  <button
                    onClick={() => markNotificationRead(n.id)}
                    className="shrink-0 rounded-lg p-2 text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700 dark:hover:bg-white/5"
                    title="Отметить прочитанным"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={BellOff}
            title={showUnreadOnly ? 'Нет непрочитанных' : 'Уведомлений пока нет'}
            description="Здесь будут появляться важные даты, новые документы и сообщения от куратора."
          />
        </div>
      )}
    </div>
  )
}
