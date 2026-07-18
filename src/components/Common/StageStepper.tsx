import { Check } from 'lucide-react'
import { CASE_STAGES } from '../../data/mockData'
import type { CaseStage } from '../../types'

export function StageStepper({
  current,
  orientation = 'horizontal',
}: {
  current: CaseStage
  orientation?: 'horizontal' | 'vertical'
}) {
  const currentIndex = CASE_STAGES.findIndex((s) => s.key === current)

  if (orientation === 'vertical') {
    return (
      <ol className="relative">
        {CASE_STAGES.map((stage, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          return (
            <li key={stage.key} className="flex gap-4 pb-6 last:pb-0">
              <div className="relative flex flex-col items-center">
                <span
                  className={`z-10 grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-semibold transition-colors ${
                    done
                      ? 'border-gold-400 bg-gold-400 text-navy-900'
                      : active
                        ? 'border-navy-800 bg-navy-800 text-white dark:border-gold-400 dark:bg-navy-700'
                        : 'border-navy-200 bg-white text-navy-300 dark:border-white/15 dark:bg-charcoal-900 dark:text-white/30'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                {i < CASE_STAGES.length - 1 && (
                  <span
                    className={`absolute top-9 h-full w-0.5 ${
                      done ? 'bg-gold-400' : 'bg-navy-200 dark:bg-white/10'
                    }`}
                  />
                )}
              </div>
              <div className="pt-1">
                <div
                  className={`text-sm font-semibold ${
                    active
                      ? 'text-navy-800 dark:text-white'
                      : 'text-navy-600 dark:text-white/70'
                  }`}
                >
                  {stage.label}
                  {active && (
                    <span className="ml-2 chip bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300">
                      Текущий этап
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-navy-400 dark:text-white/40">
                  {stage.description}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <div className="flex items-center">
      {CASE_STAGES.map((stage, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <div key={stage.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className={`grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-semibold ${
                  done
                    ? 'border-gold-400 bg-gold-400 text-navy-900'
                    : active
                      ? 'border-navy-800 bg-navy-800 text-white dark:border-gold-400 dark:bg-navy-700'
                      : 'border-navy-200 bg-white text-navy-300 dark:border-white/15 dark:bg-charcoal-900 dark:text-white/30'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={`hidden max-w-[110px] text-xs font-medium sm:block ${
                  active
                    ? 'text-navy-800 dark:text-white'
                    : 'text-navy-400 dark:text-white/40'
                }`}
              >
                {stage.label}
              </span>
            </div>
            {i < CASE_STAGES.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 rounded ${
                  i < currentIndex ? 'bg-gold-400' : 'bg-navy-200 dark:bg-white/10'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
