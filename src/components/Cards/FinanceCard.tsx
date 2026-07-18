import { TrendingDown } from 'lucide-react'
import { formatCurrency } from '../../lib/format'
import type { Client } from '../../types'
import { ProgressBar } from '../Common/ProgressBar'

export function FinanceCard({ client }: { client: Client }) {
  const paid = client.contractTotal - client.remainingPayment
  return (
    <div className="card card-hover p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy-800 dark:text-white">
          Погашение по договору
        </h3>
        <span className="chip bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300">
          <TrendingDown className="h-3.5 w-3.5" />
          {client.paymentProgress}%
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-navy-400 dark:text-white/40">Оплачено</p>
            <p className="text-xl font-bold text-navy-800 dark:text-white">
              {formatCurrency(paid)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-navy-400 dark:text-white/40">Из</p>
            <p className="text-sm font-semibold text-navy-500 dark:text-white/60">
              {formatCurrency(client.contractTotal)}
            </p>
          </div>
        </div>
        <ProgressBar value={client.paymentProgress} className="mt-3" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-navy-100 pt-4 dark:border-white/5">
        <div>
          <p className="text-xs text-navy-400 dark:text-white/40">Остаток к оплате</p>
          <p className="mt-0.5 font-bold text-rose-600 dark:text-rose-300">
            {formatCurrency(client.remainingPayment)}
          </p>
        </div>
        <div>
          <p className="text-xs text-navy-400 dark:text-white/40">Общий долг</p>
          <p className="mt-0.5 font-bold text-navy-700 dark:text-white/80">
            {formatCurrency(client.totalDebt)}
          </p>
        </div>
      </div>
    </div>
  )
}
