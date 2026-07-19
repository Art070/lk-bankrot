import { FileSearch, FolderOpen, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DocumentCard } from '../components/Cards/DocumentCard'
import { EmptyState } from '../components/Common/EmptyState'
import { useData } from '../context/DataContext'
import type { DocumentType } from '../types'

type Filter = 'all' | DocumentType

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'contract', label: 'Контрактные' },
  { key: 'court', label: 'Судебные' },
  { key: 'payment', label: 'Платёжные' },
  { key: 'notice', label: 'Уведомления' },
]

export function Documents() {
  const { documents } = useData()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: documents.length }
    for (const d of documents) c[d.type] = (c[d.type] ?? 0) + 1
    return c
  }, [documents])

  const filtered = useMemo(() => {
    return documents
      .filter((d) => filter === 'all' || d.type === filter)
      .filter((d) =>
        query.trim()
          ? d.title.toLowerCase().includes(query.trim().toLowerCase())
          : true,
      )
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
  }, [documents, filter, query])

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[26px] bg-navy-900 px-5 py-6 text-white shadow-card sm:px-7 sm:py-7">
        <div aria-hidden className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gold-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-gold-200"><FolderOpen className="h-4 w-4" /> Архив вашего дела</p><h2 className="mt-3 text-2xl font-bold tracking-tight">Документы — всегда под рукой</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Сохраняем здесь важные файлы, чтобы вы в любой момент могли вернуться к договору, судебным материалам и уведомлениям.</p></div>
          <div className="flex gap-3"><div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"><p className="text-xl font-bold text-gold-200">{documents.length}</p><p className="text-xs text-white/55">всего файлов</p></div><div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"><p className="text-xl font-bold text-gold-200">{documents.filter((item) => !item.viewedAt).length}</p><p className="text-xs text-white/55">новых</p></div></div>
        </div>
      </section>
      {documents.some((item) => !item.viewedAt) && <section className="flex flex-col gap-3 rounded-2xl border border-gold-200 bg-gold-50 p-4 text-gold-800 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-3 text-sm"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-gold-600"><Sparkles className="h-4 w-4" /></span>Есть новые документы — просмотрите их, когда будет удобно.</span><button onClick={() => setFilter('all')} className="text-left text-sm font-bold text-gold-700 hover:text-gold-800">Показать все</button></section>}
      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key
            const count = counts[f.key] ?? 0
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                  active
                    ? 'bg-navy-800 text-white shadow-sm dark:bg-navy-700'
                    : 'border border-navy-100 bg-white text-navy-600 hover:bg-navy-50 dark:bg-charcoal-800 dark:text-white/60 dark:hover:bg-white/5'
                }`}
              >
                {f.label}
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-navy-100 text-navy-500 dark:bg-white/10 dark:text-white/50'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск документов…"
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={FileSearch}
            title="Документы не найдены"
            description="Попробуйте изменить фильтр или поисковый запрос."
          />
        </div>
      )}
    </div>
  )
}
