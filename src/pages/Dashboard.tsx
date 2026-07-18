import {
  ArrowRight,
  Bell,
  CalendarClock,
  CircleHelp,
  FileWarning,
  MessageCircle,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { FinanceCard } from '../components/Cards/FinanceCard'
import { StatusCard } from '../components/Cards/StatusCard'
import { StatTile } from '../components/Common/StatTile'
import { useData } from '../context/DataContext'
import { formatCurrency, formatDate, formatDateTime, relativeTime } from '../lib/format'

const NOTIF_ICON = {
  date: CalendarClock,
  document: FileWarning,
  message: Bell,
  system: Bell,
} as const

export function Dashboard() {
  const { client, notifications, documents, payments, unreadCount, loading, error } = useData()
  if (loading) return <p className="text-sm text-navy-400">Загружаем данные дела…</p>
  if (!client) return <p className="text-sm text-rose-600">{error ?? 'Данные дела недоступны'}</p>

  const nextPayment = payments.find((p) => p.status === 'upcoming')
  const unreadDocs = documents.filter((d) => !d.viewedAt).length
  const recentNotifications = [...notifications]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 4)

  const firstName = client.name.split(' ')[0] ?? client.name

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-navy-800 dark:text-white sm:text-2xl">
          Добро пожаловать, {firstName}!
        </h2>
        <p className="mt-1 text-sm text-navy-400 dark:text-white/40">
          Вот краткая сводка по вашему делу на {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Wallet}
          label="Остаток к оплате"
          value={formatCurrency(client.remainingPayment)}
          hint={`Погашено ${client.paymentProgress}% договора`}
          accent="gold"
        />
        <StatTile
          icon={CalendarClock}
          label="Следующее заседание"
          value={formatDate(client.nextHearing)}
          hint={relativeTime(client.nextHearing)}
          accent="navy"
        />
        <StatTile
          icon={Bell}
          label="Непрочитано"
          value={String(unreadCount)}
          hint="уведомлений требуют внимания"
          accent={unreadCount > 0 ? 'red' : 'green'}
        />
        <StatTile
          icon={FileWarning}
          label="Новые документы"
          value={String(unreadDocs)}
          hint="не просмотрено"
          accent={unreadDocs > 0 ? 'gold' : 'green'}
        />
      </div>

      {/* Status card */}
      <StatusCard client={client} />

      <section className="card border-gold-200/70 bg-gradient-to-r from-gold-50 to-white p-5 dark:border-gold-400/15 dark:from-gold-400/10 dark:to-charcoal-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-800 dark:text-white">
              <CircleHelp className="h-4 w-4 text-gold-600" /> Что можно сделать сейчас
            </p>
            <p className="mt-1 text-sm text-navy-500 dark:text-white/55">
              {unreadDocs > 0
                ? `Ознакомьтесь с новыми документами: ${unreadDocs} ${unreadDocs === 1 ? 'файл ожидает' : 'файла ожидают'} вашего внимания.`
                : 'Все новые документы просмотрены. Если есть вопрос — напишите куратору.'}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {unreadDocs > 0 && (
              <Link to="/documents" className="btn-primary px-4 py-2">
                <FileWarning className="h-4 w-4" /> Документы
              </Link>
            )}
            <Link to="/contacts" className="btn-ghost px-4 py-2">
              <MessageCircle className="h-4 w-4" /> Написать куратору
            </Link>
          </div>
        </div>
      </section>

      {/* Two-column: finances + notifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <FinanceCard client={client} />

          {nextPayment && (
            <div className="card p-6">
              <h3 className="font-semibold text-navy-800 dark:text-white">
                Ближайший платёж
              </h3>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-navy-50 p-4 dark:bg-white/5">
                <div>
                  <p className="text-lg font-bold text-navy-800 dark:text-white">
                    {formatCurrency(nextPayment.amount)}
                  </p>
                  <p className="text-xs text-navy-400 dark:text-white/40">
                    {nextPayment.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gold-600 dark:text-gold-300">
                    {formatDate(nextPayment.date)}
                  </p>
                  <p className="text-xs text-navy-400 dark:text-white/40">
                    {relativeTime(nextPayment.date)}
                  </p>
                </div>
              </div>
              <Link
                to="/finances"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:text-navy-900 dark:text-gold-300"
              >
                Смотреть график платежей <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Notifications preview */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-navy-800 dark:text-white">
              Последние уведомления
            </h3>
            <Link
              to="/notifications"
              className="inline-flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-navy-800 dark:text-gold-300"
            >
              Все <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ul className="mt-4 divide-y divide-navy-100 dark:divide-white/5">
            {recentNotifications.map((n) => {
              const Icon = NOTIF_ICON[n.type]
              return (
                <li key={n.id} className="flex gap-3 py-3.5">
                  <div
                    className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                      n.read
                        ? 'bg-navy-50 text-navy-400 dark:bg-white/5 dark:text-white/40'
                        : 'bg-gold-100 text-gold-600 dark:bg-gold-400/15 dark:text-gold-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-navy-800 dark:text-white">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-navy-400 dark:text-white/40">
                      {n.body}
                    </p>
                    <p className="mt-1 text-[11px] text-navy-300 dark:text-white/25">
                      {formatDateTime(n.date)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
