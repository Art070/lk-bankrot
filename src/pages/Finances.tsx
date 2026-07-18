import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Printer,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
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
  const paidByContract = Math.max(paidTotal, client.contractTotal - client.remainingPayment, 0)
  const isPaid = client.contractTotal > 0 && client.remainingPayment <= 0
  const hasInstallments = client.paymentPlan === 'installments' || payments.length > 1
  const nextPayment = payments.find((payment) => payment.status === 'upcoming')

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-br from-navy-800 to-navy-950 p-5 text-white sm:p-6">
          <p className="flex items-center gap-2 text-sm text-gold-300"><Wallet className="h-4 w-4" /> Ваш договор с компанией</p>
          <h2 className="mt-2 text-xl font-bold sm:text-2xl">Юридическое сопровождение процедуры</h2>
          <p className="mt-2 text-sm text-white/70">{client.contractNumber ? `Договор № ${client.contractNumber}` : 'Номер договора уточняется'}{client.contractDate ? ` · от ${formatDate(client.contractDate)}` : ''}</p>
        </div>
        {client.contractTotal > 0 ? <div className="grid gap-4 p-5 sm:grid-cols-3"><StatTile icon={Wallet} label="Стоимость сопровождения" value={formatCurrency(client.contractTotal)} hint={hasInstallments ? 'Оплата по графику' : 'По условиям договора'} accent="navy" /><StatTile icon={CheckCircle2} label="Оплачено" value={formatCurrency(paidByContract)} hint={isPaid ? 'Договор оплачен' : `${client.paymentProgress}% от стоимости`} accent="green" /><StatTile icon={Clock} label="Осталось к оплате" value={formatCurrency(Math.max(client.remainingPayment, 0))} hint={isPaid ? 'Оплата завершена' : nextPayment ? `Ближайший платёж: ${formatDate(nextPayment.date)}` : 'Ожидайте график от юриста'} accent={isPaid ? 'green' : 'gold'} /></div> : <div className="p-5 text-sm text-navy-500">Условия оплаты будут добавлены в карточку договора сотрудником компании.</div>}
      </section>

      {isPaid ? <section className="card border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-400/20 dark:bg-emerald-400/10"><div className="flex gap-3"><CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-600" /><div><h3 className="font-bold text-emerald-800 dark:text-emerald-200">Договор полностью оплачен</h3><p className="mt-1 text-sm leading-6 text-emerald-700 dark:text-emerald-100/75">Спасибо! С вашей стороны по оплате сейчас ничего не требуется. Юристы продолжают работу по делу и сообщат о важных событиях в кабинете.</p></div></div></section> : client.contractTotal > 0 && <section className="card p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-navy-800 dark:text-white">Оплата по договору</h3><p className="mt-1 text-sm text-navy-400">{hasInstallments ? 'Ниже указан ваш персональный график. Отмечайте дату ближайшего платежа.' : 'Оплата по договору ещё не завершена.'}</p></div><span className="text-2xl font-bold text-gold-500">{client.paymentProgress}%</span></div><ProgressBar value={client.paymentProgress} className="mt-4" /><div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-navy-500 dark:text-white/50"><span>Оплачено: {formatCurrency(paidByContract)}</span><span>Осталось: {formatCurrency(client.remainingPayment)}</span></div></section>}

      {hasInstallments && <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 p-5 dark:border-white/5">
          <div>
            <h3 className="font-semibold text-navy-800 dark:text-white">График платежей</h3>
            <p className="text-xs text-navy-400 dark:text-white/40">
              Платежи по договору с компанией
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
      </div>}

      <section className="grid gap-4 lg:grid-cols-2"><div className="card p-5"><div className="flex gap-3"><FileText className="h-5 w-5 shrink-0 text-gold-600" /><div><h3 className="font-semibold text-navy-800 dark:text-white">Документы по договору</h3><p className="mt-1 text-sm text-navy-500">Подписанный договор, квитанции и другие документы хранятся в архиве дела.</p><Link to="/documents" className="mt-3 inline-flex text-sm font-semibold text-navy-700 underline-offset-4 hover:underline dark:text-gold-300">Открыть архив документов</Link></div></div></div><div className="card p-5"><div className="flex gap-3"><CalendarDays className="h-5 w-5 shrink-0 text-gold-600" /><div><h3 className="font-semibold text-navy-800 dark:text-white">Дополнительные расходы</h3><p className="mt-1 text-sm leading-6 text-navy-500">{client.additionalExpensesNote || 'Если по процедуре появятся обязательные расходы, юрист заранее объяснит их назначение и порядок оплаты.'}</p></div></div></div></section>
    </div>
  )
}
