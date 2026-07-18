import type { LucideIcon } from 'lucide-react'

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'navy',
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  accent?: 'navy' | 'gold' | 'green' | 'red'
}) {
  const accents: Record<string, string> = {
    navy: 'bg-navy-50 text-navy-700 dark:bg-navy-700/40 dark:text-navy-100',
    gold: 'bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
    red: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300',
  }
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-400 dark:text-white/40">
            {label}
          </p>
          <p className="mt-2 text-xl font-bold leading-tight text-navy-800 dark:text-white lg:text-[1.35rem]">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-navy-400 dark:text-white/40">{hint}</p>
          )}
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${accents[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
