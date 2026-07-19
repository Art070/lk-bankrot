import { CheckCircle2, FileUp, Loader2, RotateCcw, ShieldCheck, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { supabase } from '../lib/supabase'

type RequestStatus = 'requested' | 'submitted' | 'under_review' | 'accepted' | 'returned'
type RequestItem = { id: string; title: string; description: string; required: boolean; max_files: number; status: RequestStatus; reviewer_comment: string | null; files: { id: string; file_name: string; size_bytes: number }[] }

const STATUS: Record<RequestStatus, string> = { requested: 'Нужно загрузить', submitted: 'Отправлено юристу', under_review: 'На проверке', accepted: 'Принято', returned: 'Нужно исправить' }

export function Onboarding() {
  const { caseId, loading: caseLoading } = useData()
  const [items, setItems] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    if (!caseId) return
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('document_requests')
      .select('id, title, description, required, max_files, status, reviewer_comment, document_request_files(id, file_name, size_bytes)')
      .eq('case_id', caseId)
      .order('created_at')
    if (loadError) setError(loadError.message)
    else setItems((data ?? []).map((row) => ({ ...row, files: row.document_request_files ?? [] })))
    setLoading(false)
  }
  useEffect(() => { void load() }, [caseId])

  const pending = useMemo(() => items.filter((item) => item.required && item.status !== 'accepted').length, [items])
  if (caseLoading || loading) return <p className="text-sm text-navy-400">Готовим список документов…</p>
  if (!caseId) return <p className="text-sm text-rose-600">Дело пока не создано.</p>
  if (error) return <p className="text-sm text-rose-600">{error}</p>

  return <div className="mx-auto max-w-4xl space-y-6">
    <section className="relative overflow-hidden rounded-[28px] bg-navy-900 p-6 text-white shadow-card sm:p-8">
      <div aria-hidden className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-gold-300/20 blur-3xl" />
      <div className="relative"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-gold-200"><ShieldCheck className="h-4 w-4" /> Ваш ближайший ориентир</p><h2 className="mt-3 text-2xl font-bold sm:text-3xl">Соберём документы вместе</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Юрист запросил только то, что действительно нужно делу. Добавляйте фото или PDF по одному пункту — проверим и подскажем, если что-то потребуется уточнить.</p></div>
      <div className="relative mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.08] p-4"><div><p className="text-xs font-medium uppercase tracking-wider text-white/45">На этом этапе</p><p className="mt-1 text-sm font-semibold text-white">{pending === 0 ? 'Все обязательные документы приняты' : `Осталось пройти ${pending} ${pending === 1 ? 'пункт' : 'пункта'} чек-листа`}</p></div><span className="rounded-full bg-gold-300/15 px-3 py-1.5 text-xs font-bold text-gold-200">Шаг 1 из 5</span>{pending === 0 && <Link to="/overview" className="btn-gold px-4 py-2">Перейти к делу</Link>}</div>
    </section>
    <section className="rounded-2xl border border-navy-100 bg-white p-4 text-sm text-navy-600 shadow-card sm:p-5"><p className="font-semibold text-navy-800">Как это работает</p><p className="mt-1 leading-6">Добавьте файл → нажмите «Отправить юристу» → дождитесь статуса «Принято». Мы не потеряем ни один документ и напишем, если потребуется исправление.</p></section>
    <div className="space-y-3">
      {items.filter((item) => item.status !== 'accepted').map((item) => <RequestCard key={item.id} item={item} onChange={load} />)}
      {items.length > 0 && items.every((item) => item.status === 'accepted') && <div className="card p-8 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" /><h3 className="mt-3 font-bold text-navy-800 dark:text-white">Документы собраны и приняты</h3><p className="mt-1 text-sm text-navy-500">Юрист продолжает подготовку дела. Все дальнейшие события будут в кабинете.</p></div>}
    </div>
  </div>
}

function RequestCard({ item, onChange }: { item: RequestItem; onChange: () => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const canUpload = item.status === 'requested' || item.status === 'returned'
  const upload = async (files: FileList | null) => {
    if (!files?.length || !canUpload) return
    const selected = Array.from(files)
    if (item.files.length + selected.length > item.max_files) return alert(`Можно добавить не более ${item.max_files} файлов.`)
    if (selected.some((file) => file.size > 15 * 1024 * 1024)) return alert('Размер одного файла не должен превышать 15 МБ.')
    setBusy(true)
    try {
      for (const file of selected) {
        const safeName = file.name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9._-]/g, '_')
        const path = `${item.id}/${crypto.randomUUID()}-${safeName}`
        const { error: storageError } = await supabase.storage.from('case-documents').upload(path, file, { contentType: file.type, upsert: false })
        if (storageError) throw storageError
        const { error: fileError } = await supabase.from('document_request_files').insert({ request_id: item.id, storage_path: path, file_name: file.name, mime_type: file.type || 'application/octet-stream', size_bytes: file.size })
        if (fileError) throw fileError
      }
      await onChange()
    } catch (error) { alert(error instanceof Error ? error.message : 'Не удалось загрузить файл') } finally { setBusy(false) }
  }
  const submit = async () => {
    if (!item.files.length) return alert('Сначала добавьте хотя бы один файл.')
    setBusy(true)
    const { error } = await supabase.from('document_requests').update({ status: 'submitted', submitted_at: new Date().toISOString(), reviewer_comment: null }).eq('id', item.id)
    if (error) alert(error.message)
    await onChange(); setBusy(false)
  }
  return <article className="card p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-navy-800 dark:text-white">{item.title}{item.required && <span className="ml-1 text-rose-500">*</span>}</h3><p className="mt-1 max-w-2xl text-sm text-navy-500 dark:text-white/55">{item.description}</p></div><span className="chip bg-navy-50 text-navy-600 dark:bg-white/10 dark:text-white/70">{STATUS[item.status]}</span></div>
    {item.reviewer_comment && <p className="mt-4 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><RotateCcw className="h-4 w-4 shrink-0" />{item.reviewer_comment}</p>}
    {item.files.length > 0 && <ul className="mt-4 space-y-1 text-sm text-navy-600 dark:text-white/60">{item.files.map((file) => <li key={file.id}>• {file.file_name} · {Math.ceil(file.size_bytes / 1024)} КБ</li>)}</ul>}
    {canUpload && <div className="mt-4 flex flex-wrap items-center gap-3"><input ref={input} onChange={(event) => void upload(event.target.files)} type="file" accept="image/*,.pdf" capture="environment" multiple className="hidden" /><button onClick={() => input.current?.click()} disabled={busy} className="btn-ghost"><FileUp className="h-4 w-4" />Добавить фото или PDF</button><span className="text-xs text-navy-400">До {item.max_files} файлов, по 15 МБ</span>{item.files.length > 0 && <button onClick={() => void submit()} disabled={busy} className="btn-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Отправить юристу</button>}</div>}
  </article>
}
