import {
  Download,
  FileCheck2,
  FileClock,
  FileText,
  Landmark,
  Loader2,
  Receipt,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { formatDate } from '../../lib/format'
import type { CaseDocument, DocumentType } from '../../types'

const TYPE_META: Record<
  DocumentType,
  { label: string; icon: LucideIcon; cls: string }
> = {
  contract: {
    label: 'Договор',
    icon: FileCheck2,
    cls: 'bg-navy-50 text-navy-600 dark:bg-navy-700/40 dark:text-navy-100',
  },
  court: {
    label: 'Судебный',
    icon: Landmark,
    cls: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300',
  },
  payment: {
    label: 'Платёжный',
    icon: Receipt,
    cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
  },
  notice: {
    label: 'Уведомление',
    icon: FileClock,
    cls: 'bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300',
  },
}

export function DocumentCard({ doc }: { doc: CaseDocument }) {
  const { markDocumentViewed, getDocumentUrl } = useData()
  const [downloading, setDownloading] = useState(false)
  const meta = TYPE_META[doc.type]
  const Icon = meta.icon
  const isUnread = !doc.viewedAt

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    const target = window.open('', '_blank')
    try {
      if (!doc.url) throw new Error('Файл документа не найден')
      const url = await getDocumentUrl(doc.url)
      if (target) target.location.href = url
      else window.location.assign(url)
      await markDocumentViewed(doc.id)
    } finally {
      if (!doc.url) target?.close()
      setDownloading(false)
    }
  }

  return (
    <div className="card card-hover flex items-center gap-4 p-4">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${meta.cls}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-navy-800 dark:text-white">
            {doc.title}
          </p>
          {isUnread && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-gold-400" title="Новый документ" />
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-400 dark:text-white/40">
          <span className="chip bg-transparent px-0 text-navy-400 dark:text-white/40">
            {meta.label}
          </span>
          <span>·</span>
          <span>{formatDate(doc.date)}</span>
          <span>·</span>
          <span>{doc.sizeKb} КБ</span>
          <span>·</span>
          <span>
            {doc.viewedAt ? 'Просмотрен' : 'Не просмотрен'}
          </span>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-navy-200/60 px-3 py-2 text-xs font-semibold text-navy-700 transition-colors hover:bg-navy-50 hover:text-navy-800 disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {downloading ? 'Готовим…' : 'Скачать PDF'}
        </span>
      </button>
    </div>
  )
}

export { FileText }
