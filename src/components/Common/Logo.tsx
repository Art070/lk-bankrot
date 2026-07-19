import { ShieldCheck } from 'lucide-react'

export function Logo({
  compact = false,
  onDark = false,
}: {
  compact?: boolean
  onDark?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-400 shadow-sm">
        <ShieldCheck className="h-5 w-5 text-navy-900" strokeWidth={2.2} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div
            className={`font-semibold tracking-tight ${
              onDark ? 'text-white' : 'text-navy-800 dark:text-white'
            }`}
            style={{ fontFamily: 'Poppins, Inter, sans-serif' }}
          >
            Заshitим
          </div>
          <div
            className={`text-[11px] font-medium ${
              onDark ? 'text-gold-300' : 'text-navy-400 dark:text-gold-300'
            }`}
          >
            Личный кабинет
          </div>
        </div>
      )}
    </div>
  )
}
