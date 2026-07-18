const MOSCOW_TIME_ZONE = 'Europe/Moscow'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function formatDate(iso: string): string {
  const d = parseDate(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: MOSCOW_TIME_ZONE,
  }).format(d)
}

export function formatDateShort(iso: string): string {
  const d = parseDate(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: MOSCOW_TIME_ZONE,
  }).format(d)
}

export function formatDateTime(iso: string): string {
  const d = parseDate(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MOSCOW_TIME_ZONE,
  }).format(d)
}

export function daysUntil(iso: string): number {
  const target = dateOnlyTimestamp(iso)
  if (target === null) return Number.NaN
  return Math.round((target - todayInMoscowTimestamp()) / 86_400_000)
}

export function relativeTime(iso: string): string {
  const diff = daysUntil(iso)
  if (Number.isNaN(diff)) return ''
  if (diff === 0) return 'сегодня'
  if (diff === 1) return 'завтра'
  if (diff === -1) return 'вчера'
  if (diff > 1) return `через ${diff} дн.`
  return `${Math.abs(diff)} дн. назад`
}

function parseDate(value: string): Date {
  // Date-only values represent a calendar date in Moscow, not midnight UTC.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? dateOnlyTimestamp(value)
    : null
  return dateOnly === null ? new Date(value) : new Date(dateOnly)
}

function dateOnlyTimestamp(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value)
  if (!match) return null
  const [, year, month, day] = match
  return Date.UTC(Number(year), Number(month) - 1, Number(day))
}

function todayInMoscowTimestamp(): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MOSCOW_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return Date.UTC(value('year'), value('month') - 1, value('day'))
}
