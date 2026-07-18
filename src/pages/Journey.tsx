import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, FileText, Gavel, MessageCircle, ShieldAlert, Sparkles } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { supabase } from '../lib/supabase'
import type { ClientCaseUpdate } from '../types'
import { formatDate } from '../lib/format'
import { getStageUpdate, STAGES, STATUS_TO_STAGE } from '../lib/stages'

type Route = 'mfc' | 'court' | 'consultation'
type Diagnostic = { id: string; total_debt: number; creditor_count: number; has_only_home: boolean; has_car: boolean; monthly_income: number | null; enforcement_closed: boolean; route: Route; submitted_at: string }

export function Journey() {
  const { caseId, client, clientUpdate, loading, error, refresh } = useData()
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null)
  const [diagnosticError, setDiagnosticError] = useState('')
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(true)

  useEffect(() => {
    if (!caseId) return
    void (async () => {
      const { data, error: queryError } = await supabase.from('client_diagnostics').select('*').eq('case_id', caseId).maybeSingle()
      if (queryError) setDiagnosticError(queryError.message)
      else setDiagnostic(data as Diagnostic | null)
      setLoadingDiagnostic(false)
    })()
  }, [caseId])

  if (loading || loadingDiagnostic) return <p className="text-sm text-navy-400">Готовим ваш маршрут…</p>
  if (!caseId || !client) return <p className="text-sm text-rose-600">{error ?? 'Для аккаунта пока не создано дело.'}</p>
  if (diagnosticError) return <div className="card max-w-2xl p-6"><p className="font-semibold text-navy-800 dark:text-white">Маршрут подключается</p><p className="mt-2 text-sm text-navy-500">Нужно применить обновление базы данных в Supabase, чтобы сохранить анкету и этапы.</p></div>

  const current = STATUS_TO_STAGE[client.caseStatus] ?? (diagnostic ? 1 : 0)
  const greeting = greetingName(client.name)
  return <div className="mx-auto max-w-5xl space-y-6">
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 p-5 text-white shadow-card sm:p-8">
      <p className="flex items-center gap-2 text-sm text-gold-300"><Sparkles className="h-4 w-4" /> Коротко о вашем деле</p>
      <p className="mt-3 text-xs text-white/60">Сегодня, {formatDate(new Date().toISOString())}</p>
      <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Здравствуйте, {greeting}!</h2>
      <ClientStatusCard update={clientUpdate} current={current} />
      <div className="mt-6 grid grid-cols-5 gap-2 sm:mt-7 sm:gap-3">
        {STAGES.map((step, index) => { const Icon = step.icon; const active = index === current; const done = index < current; return <div key={step.key} className={`rounded-xl border p-2 sm:p-3 ${active ? 'border-gold-300 bg-white/15' : done ? 'border-emerald-300/40 bg-emerald-400/10' : 'border-white/10 bg-white/5'}`}><div className="flex items-center justify-center gap-2 sm:justify-start"><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${done ? 'bg-emerald-400 text-navy-900' : active ? 'bg-gold-400 text-navy-900' : 'bg-white/10 text-white/60'}`}>{done ? '✓' : index + 1}</span><Icon className="hidden h-4 w-4 text-white/75 sm:block" /></div><p className="mt-2 hidden text-xs font-semibold sm:block">{step.shortTitle}</p></div> })}
      </div>
      <p className="mt-3 text-center text-xs text-white/60">Этап {current + 1} из 5 · {STAGES[current].title}</p>
    </section>

    {current === 0 && !diagnostic && <DiagnosticForm caseId={caseId} onDone={(value) => { setDiagnostic(value); void refresh() }} />}
    {current === 0 && diagnostic && <DiagnosticResult diagnostic={diagnostic} />}
    {current === 1 && <DocumentStage />}
    {current === 2 && <FilingStage />}
    {current === 3 && <ActiveStage status={client.caseStatus} />}
    {current === 4 && <CompletionStage />}
  </div>
}

function ClientStatusCard({ update, current }: { update: ClientCaseUpdate | null; current: number }) {
  const defaultUpdate = getStageUpdate(STAGES[current].key)
  const status = update ?? defaultUpdate
  const color = status.tone === 'good' ? 'border-emerald-300/30 bg-emerald-400/10' : status.tone === 'attention' ? 'border-rose-300/30 bg-rose-400/10' : 'border-gold-300/35 bg-gold-400/10'
  const actionHref = status.actionHref || (status.actionLabel === 'Пройти анкету' ? '#diagnostic' : null)
  const contents = <><p className="text-sm font-bold">{status.headline}</p><p className="mt-1 text-sm leading-5 text-white/75">{status.body}</p>{status.actionLabel && <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-200">{status.actionLabel}<ArrowRight className="h-4 w-4" /></span>}</>
  return <div className={`mt-5 rounded-xl border p-4 ${color}`}>{actionHref ? actionHref.startsWith('/') ? <Link to={actionHref}>{contents}</Link> : <a href={actionHref}>{contents}</a> : contents}</div>
}

function greetingName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return parts.length >= 3 ? `${parts[1]} ${parts[2]}` : parts[0] ?? 'клиент'
}

function DiagnosticForm({ caseId, onDone }: { caseId: string; onDone: (value: Diagnostic) => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(''); const form = new FormData(event.currentTarget)
    const debt = Number(form.get('debt')); const creditors = Number(form.get('creditors')); const onlyHome = form.get('onlyHome') === 'yes'; const car = form.get('car') === 'yes'; const income = Number(form.get('income') || 0); const enforcement = form.get('enforcement') === 'yes'
    const route: Route = debt >= 25000 && debt <= 1000000 && enforcement && !car ? 'mfc' : debt > 0 ? 'court' : 'consultation'
    const { data, error: saveError } = await supabase.from('client_diagnostics').upsert({ case_id: caseId, total_debt: debt, creditor_count: creditors, has_only_home: onlyHome, has_car: car, monthly_income: income || null, enforcement_closed: enforcement, route }).select('*').single()
    setBusy(false); if (saveError) setError(saveError.message); else onDone(data as Diagnostic)
  }
  return <form id="diagnostic" onSubmit={submit} className="card max-w-3xl p-5 sm:p-7"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-100 text-gold-700"><ClipboardCheck className="h-5 w-5" /></span><div><h3 className="font-bold text-navy-800 dark:text-white">Первичная консультация</h3><p className="mt-1 text-sm text-navy-500">Ответьте на несколько вопросов. Это займёт около трёх минут.</p></div></div>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="mt-6 grid gap-5 sm:grid-cols-2"><NumberField name="debt" label="Общая сумма долгов, ₽" min="0" required /><NumberField name="creditors" label="Количество кредиторов" min="0" required /><NumberField name="income" label="Ежемесячный доход, ₽" min="0" /><Choice name="onlyHome" label="Есть единственное жильё?" /><Choice name="car" label="Есть автомобиль или другое ценное имущество?" /><Choice name="enforcement" label="Исполнительные производства завершены?" /></div><div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center"><button disabled={busy} className="btn-primary w-full sm:w-auto">{busy ? 'Сохраняем…' : 'Получить предварительный маршрут'}<ArrowRight className="h-4 w-4" /></button><p className="text-xs text-navy-400">Результат предварительный и требует проверки юриста.</p></div></form>
}

function NumberField({ name, label, min, required }: { name: string; label: string; min: string; required?: boolean }) { return <label className="text-sm font-medium text-navy-700 dark:text-white/75">{label}<input className="input-field mt-1.5" name={name} type="number" min={min} required={required} /></label> }
function Choice({ name, label }: { name: string; label: string }) { return <fieldset><legend className="text-sm font-medium text-navy-700 dark:text-white/75">{label}</legend><div className="mt-2 flex gap-3"><label className="text-sm"><input className="mr-1.5" type="radio" name={name} value="yes" required />Да</label><label className="text-sm"><input className="mr-1.5" type="radio" name={name} value="no" />Нет</label></div></fieldset> }

function DiagnosticResult({ diagnostic }: { diagnostic: Diagnostic }) { const info: Record<Route, { title: string; text: string }> = { mfc: { title: 'Предварительно: можно рассмотреть внесудебный порядок', text: 'Юрист проверит условия, состав долгов и сведения об исполнительных производствах.' }, court: { title: 'Предварительно: требуется рассмотреть судебную процедуру', text: 'Юрист уточнит обстоятельства, имущество и подготовит персональный план.' }, consultation: { title: 'Нужна консультация юриста', text: 'Необходимо уточнить исходные сведения, чтобы выбрать корректный маршрут.' } }; const result = info[diagnostic.route]; return <section className="card max-w-3xl p-7"><ShieldAlert className="h-9 w-9 text-gold-500" /><h3 className="mt-4 text-xl font-bold text-navy-800 dark:text-white">{result.title}</h3><p className="mt-2 text-sm leading-6 text-navy-500">{result.text}</p><div className="mt-6 flex flex-wrap gap-3"><Link to="/contacts" className="btn-primary"><MessageCircle className="h-4 w-4" />Задать вопрос юристу</Link><Link to="/documents/collection" className="btn-ghost">Перейти к документам</Link></div></section> }
function DocumentStage() { return <section className="card max-w-3xl p-7"><FileText className="h-9 w-9 text-gold-500" /><h3 className="mt-4 text-xl font-bold text-navy-800 dark:text-white">Собираем документы</h3><p className="mt-2 text-sm leading-6 text-navy-500">Загрузите только документы из вашего персонального списка. Юрист проверит каждый файл и при необходимости объяснит, что исправить.</p><Link to="/documents/collection" className="btn-primary mt-6">Открыть список документов <ArrowRight className="h-4 w-4" /></Link></section> }
function FilingStage() { return <section className="card max-w-3xl p-7"><Gavel className="h-9 w-9 text-gold-500" /><h3 className="mt-4 text-xl font-bold text-navy-800 dark:text-white">Подготовка и подача заявления</h3><p className="mt-2 text-sm leading-6 text-navy-500">Юрист готовит пакет, проверяет реквизиты и сообщит, когда понадобится согласование или оплата. Все ключевые события появятся в уведомлениях.</p><Link to="/notifications" className="btn-primary mt-6">Открыть события дела <ArrowRight className="h-4 w-4" /></Link></section> }
function ActiveStage({ status }: { status: string }) { const mfc = status === 'mfc-procedure'; return <section className="card max-w-3xl p-7"><CalendarDays className="h-9 w-9 text-gold-500" /><h3 className="mt-4 text-xl font-bold text-navy-800 dark:text-white">{mfc ? 'Внесудебная процедура через МФЦ' : 'Активная стадия процедуры'}</h3><p className="mt-2 text-sm leading-6 text-navy-500">{mfc ? 'Кабинет будет показывать дату публикации, обратный отсчёт и важные уведомления.' : 'Здесь отображаются судебные события, платежи, запросы юриста и сведения по процедуре.'}</p><div className="mt-6 flex gap-3"><Link to="/case" className="btn-primary">Статус дела</Link><Link to="/finances" className="btn-ghost">Платежи</Link></div></section> }
function CompletionStage() { return <section className="card max-w-3xl p-7"><CheckCircle2 className="h-9 w-9 text-emerald-500" /><h3 className="mt-4 text-xl font-bold text-navy-800 dark:text-white">Дело завершено</h3><p className="mt-2 text-sm leading-6 text-navy-500">Здесь сохранены документы и решения по делу. Перед финансовыми действиями сверяйтесь с персональной памяткой от юриста.</p><div className="mt-6 flex gap-3"><Link to="/documents" className="btn-primary">Открыть архив</Link><Link to="/contacts" className="btn-ghost">Задать вопрос</Link></div></section> }
