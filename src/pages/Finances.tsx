import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Loader2,
  Printer,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { ProgressBar } from '../components/Common/ProgressBar'
import { StatTile } from '../components/Common/StatTile'
import { useData } from '../context/DataContext'
import { formatCurrency, formatDate } from '../lib/format'
import { downloadPaymentsPdf } from '../lib/pdf'
import type { PaymentStatus } from '../types'

const STATUS_META: Record<
  PaymentStatus,
  { label: string; cls: string; icon: typeof Clock }
> = {
  paid: {
    label: 'Оплачен',
    cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  upcoming: {
    label: 'Ожидается',
    cls: 'bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300',
    icon: Clock,
  },
  overdue: {
    label: 'Просрочен',
    cls: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300',
    icon: Clock,
  },
}

export function Finances() {
  const { client, payments, loading, error } = useData()
  if (loading) return <p className="text-sm text-navy-400">Загружаем финансы…</p>
  if (!client) return <p className="text-sm text-rose-600">{error ?? 'Данные дела недоступны'}</p>
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      await downloadPaymentsPdf(client, payments)
    } finally {
      setDownloading(false)
    }
  }

  const paidTotal = payments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0)
  const upcomingTotal = payments
    .filter((p) => p.status !== 'paid')
    .reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={CreditCard}
          label="Общий долг"
          value={formatCurrency(client.totalDebt)}
          hint="по реестру требований"
          accent="navy"
        />
        <StatTile
          icon={Wallet}
          label="Сумма договора"
          value={formatCurrency(client.contractTotal)}
          hint="стоимость сопровождения"
          accent="navy"
        />
        <StatTile
          icon={CheckCircle2}
          label="Оплачено"
          value={formatCurrency(paidTotal)}
          hint={`${payments.filter((p) => p.status === 'paid').length} платежей`}
          accent="green"
        />
        <StatTile
          icon={TrendingDown}
          label="Остаток"
          value={formatCurrency(client.remainingPayment)}
          hint={`${upcomingTotal > 0 ? formatCurrency(upcomingTotal) : '—'} по графику`}
          accent="gold"
        />
      </div>

      {/* Progress */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-navy-800 dark:text-white">
            Прогресс погашения по договору
          </h3>
          <span className="text-2xl font-bold text-gold-500">
            {client.paymentProgress}%
          </span>
        </div>
        <ProgressBar value={client.paymentProgress} className="mt-4" />
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-navy-500 dark:text-white/50">
          <span>Оплачено: {formatCurrency(paidTotal)}</span>
          <span>Осталось: {formatCurrency(client.remainingPayment)}</span>
        </div>
      </div>

      {/* Payment schedule / history */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 p-5 dark:border-white/5">
          <div>
            <h3 className="font-semibold text-navy-800 dark:text-white">
              График и история платежей
            </h3>
            <p className="text-xs text-navy-400 dark:text-white/40">
              Все начисления и поступления по вашему договору
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="btn-ghost">
              <Printer className="h-4 w-4" /> Печать
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="btn-primary"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloading ? 'Готовим…' : 'Скачать PDF'}
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400 dark:border-white/5 dark:text-white/40">
                <th className="px-5 py-3 font-medium">Дата</th>
                <th className="px-5 py-3 font-medium">Назначение</th>
                <th className="px-5 py-3 font-medium">Способ</th>
                <th className="px-5 py-3 text-right font-medium">Сумма</th>
                <th className="px-5 py-3 text-right font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100 dark:divide-white/5">
              {payments.map((p) => {
                const meta = STATUS_META[p.status]
                const Icon = meta.icon
                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-navy-50/50 dark:hover:bg-white/5"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-navy-600 dark:text-white/60">
                      {formatDate(p.date)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-navy-800 dark:text-white">
                      {p.description}
                    </td>
                    <td className="px-5 py-3.5 text-navy-500 dark:text-white/50">
                      {p.method ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-bold text-navy-800 dark:text-white">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`chip ${meta.cls}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="divide-y divide-navy-100 dark:divide-white/5 md:hidden">
          {payments.map((p) => {
            const meta = STATUS_META[p.status]
            const Icon = meta.icon
            return (
              <div key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-800 dark:text-white">
                      {p.description}
                    </p>
                    <p className="text-xs text-navy-400 dark:text-white/40">
                      {formatDate(p.date)} · {p.method ?? '—'}
                    </p>
                  </div>
                  <span className={`chip shrink-0 ${meta.cls}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </span>
                </div>
                <p className="mt-2 text-right font-bold text-navy-800 dark:text-white">
                  {formatCurrency(p.amount)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
