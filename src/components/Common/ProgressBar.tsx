export function ProgressBar({
  value,
  className = '',
  showLabel = false,
}: {
  value: number
  className?: string
  showLabel?: boolean
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={className}>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-navy-100 dark:bg-white/10"
        role="progressbar"
        aria-label="Прогресс оплаты"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-300 transition-[width] duration-700 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1.5 text-right text-xs font-semibold text-navy-500 dark:text-gold-300">
          {clamped}%
        </div>
      )}
    </div>
  )
}
