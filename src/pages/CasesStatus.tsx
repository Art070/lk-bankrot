import {
  BadgeInfo,
  Building2,
  CalendarClock,
  CreditCard,
  Download,
  Hash,
  Loader2,
  Mail,
  Phone,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { StageStepper } from '../components/Common/StageStepper'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency, formatDate, relativeTime } from '../lib/format'
import { downloadCaseSummaryPdf } from '../lib/pdf'

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-500 dark:bg-white/5 dark:text-white/50">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400 dark:text-white/40">{label}</p>
        <p className="text-sm font-semibold text-navy-800 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  )
}

export function CasesStatus() {
  const { user } = useAuth()
  const client = user!.client
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      await downloadCaseSummaryPdf(client)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Stepper */}
      <div className="card p-6 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-navy-800 dark:text-white">
              <BadgeInfo className="h-5 w-5 text-gold-500" />
              Этапы процедуры банкротства
            </h3>
            <p className="mt-1 text-sm text-navy-400 dark:text-white/40">
              Ваше дело проходит следующие стадии. Текущий этап отмечен ниже.
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-ghost"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? 'Готовим…' : 'Справка PDF'}
          </button>
        </div>
        <div className="mt-6">
          <StageStepper current={client.caseStatus} orientation="vertical" />
        </div>

        <div className="mt-4 rounded-xl border border-gold-200 bg-gold-50 p-4 dark:border-gold-400/20 dark:bg-gold-400/5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gold-700 dark:text-gold-300">
            <CalendarClock className="h-4 w-4" />
            Следующее судебное заседание
          </div>
          <p className="mt-1 text-sm text-navy-700 dark:text-white/70">
            {formatDate(client.nextHearing)} · {relativeTime(client.nextHearing)}.
            Личное присутствие не требуется — интересы представляет финансовый
            управляющий.
          </p>
        </div>
      </div>

      {/* Case details */}
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="font-semibold text-navy-800 dark:text-white">
            Должник и реквизиты
          </h3>
          <div className="mt-2 divide-y divide-navy-100 dark:divide-white/5">
            <InfoRow icon={User} label="ФИО должника" value={client.name} />
            <InfoRow icon={Hash} label="ИНН" value={client.inn} />
            <InfoRow icon={Phone} label="Телефон" value={client.phone} />
            <InfoRow icon={Mail} label="E-mail" value={client.email} />
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-navy-800 dark:text-white">
            Судебное дело
          </h3>
          <div className="mt-2 divide-y divide-navy-100 dark:divide-white/5">
            <InfoRow icon={Hash} label="Номер дела" value={client.caseNumber} />
            <InfoRow icon={Building2} label="Суд" value={client.court} />
            <InfoRow
              icon={CalendarClock}
              label="Дата открытия"
              value={formatDate(client.openDate)}
            />
            <InfoRow
              icon={CreditCard}
              label="Общая задолженность"
              value={formatCurrency(client.totalDebt)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
