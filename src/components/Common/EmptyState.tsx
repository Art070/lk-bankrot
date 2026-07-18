import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-50 text-navy-300 dark:bg-white/5 dark:text-white/30">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-navy-800 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-sm text-navy-400 dark:text-white/40">
          {description}
        </p>
      )}
    </div>
  )
}
