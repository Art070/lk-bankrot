import { CalendarClock, Gavel, Hash } from 'lucide-react'
import { CASE_STAGES } from '../../data/mockData'
import { formatDate, relativeTime } from '../../lib/format'
import type { Client } from '../../types'
import { StageStepper } from '../Common/StageStepper'

export function StatusCard({ client }: { client: Client }) {
  const stage = CASE_STAGES.find((s) => s.key === client.caseStatus)

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-navy-800 to-navy-900 p-6 text-white dark:from-charcoal-800 dark:to-charcoal-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="chip bg-white/10 text-gold-300">
              <Gavel className="h-3.5 w-3.5" />
              Текущий этап
            </span>
            <h2 className="mt-3 text-2xl font-bold">{stage?.label}</h2>
            <p className="mt-1 max-w-md text-sm text-white/60">
              {stage?.description}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <div className="flex items-center gap-1.5 text-white/50">
                <Hash className="h-3.5 w-3.5" /> Номер дела
              </div>
              <div className="mt-0.5 font-semibold">{client.caseNumber}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-white/50">
                <CalendarClock className="h-3.5 w-3.5" /> Открыто
              </div>
              <div className="mt-0.5 font-semibold">
                {formatDate(client.openDate)}
              </div>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-1.5 text-white/50">
                <CalendarClock className="h-3.5 w-3.5" /> Следующее заседание
              </div>
              <div className="mt-0.5 font-semibold text-gold-300">
                {formatDate(client.nextHearing)} · {relativeTime(client.nextHearing)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <StageStepper current={client.caseStatus} />
      </div>
    </div>
  )
}
