import { AlertCircle, CheckCircle2, Check, Plus, RotateCcw, UserPlus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function Admin() {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [requests, setRequests] = useState<{ id: string; title: string; status: string; reviewer_comment: string | null; cases: { case_number: string; profiles: { full_name: string } | null } | null; document_request_files: { id: string; file_name: string }[] }[]>([])
  const [comments, setComments] = useState<Record<string, string>>({})

  const loadRequests = async () => {
    const { data } = await supabase
      .from('document_requests')
      .select('id, title, status, reviewer_comment, cases!document_requests_case_id_fkey(case_number, profiles!cases_client_id_fkey(full_name)), document_request_files(id, file_name)')
      .in('status', ['submitted', 'under_review'])
      .order('submitted_at')
    setRequests(((data ?? []) as unknown as typeof requests).map((request) => {
      const caseRow = Array.isArray((request as any).cases) ? (request as any).cases[0] ?? null : request.cases
      return { ...request, cases: caseRow && { ...caseRow, profiles: Array.isArray(caseRow.profiles) ? caseRow.profiles[0] ?? null : caseRow.profiles } }
    }))
  }
  useEffect(() => { void loadRequests() }, [])

  const review = async (id: string, accepted: boolean) => {
    const comment = comments[id]?.trim()
    if (!accepted && !comment) return setError('Укажите клиенту, что нужно исправить.')
    const { error: reviewError } = await supabase.from('document_requests').update({
      status: accepted ? 'accepted' : 'returned',
      reviewer_comment: accepted ? null : comment,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    if (reviewError) setError(reviewError.message)
    else { setNotice(accepted ? 'Документ принят.' : 'Документ возвращён клиенту с комментарием.'); await loadRequests() }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form.entries())
    setSending(true)
    setError('')
    setNotice('')
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('/.netlify/functions/create-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({
        email: payload.email,
        fullName: payload.fullName,
        phone: payload.phone,
        inn: payload.inn,
        caseNumber: payload.caseNumber,
        court: payload.court,
        openDate: payload.openDate,
        nextHearing: payload.nextHearing,
        totalDebt: Number(payload.totalDebt || 0),
        contractTotal: Number(payload.contractTotal || 0),
        remainingPayment: Number(payload.remainingPayment || 0),
      }),
    })
    const body = await response.json() as { error?: string }
    setSending(false)
    if (!response.ok) {
      setError(body.error ?? 'Не удалось создать клиента')
      return
    }
    event.currentTarget.reset()
    setNotice('Клиент создан. На его email отправлено приглашение для входа.')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy-800 dark:text-white">Управление клиентами</h2>
        <p className="mt-1 text-sm text-navy-400 dark:text-white/40">Создайте дело и отправьте клиенту безопасное приглашение на email.</p>
      </div>
      <form onSubmit={submit} className="card space-y-5 p-6">
        <h3 className="flex items-center gap-2 font-semibold text-navy-800 dark:text-white"><UserPlus className="h-5 w-5 text-gold-500" /> Новый клиент</h3>
        {notice && <p className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 className="h-5 w-5 shrink-0" />{notice}</p>}
        {error && <p className="flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="fullName" label="ФИО клиента" required />
          <Field name="email" label="Email для приглашения" type="email" required />
          <Field name="phone" label="Телефон" />
          <Field name="inn" label="ИНН" />
          <Field name="caseNumber" label="Номер дела (если уже есть)" />
          <Field name="court" label="Суд (если уже известен)" />
          <Field name="openDate" label="Дата открытия" type="date" required />
          <Field name="nextHearing" label="Следующее заседание" type="date" />
          <Field name="totalDebt" label="Долг перед кредиторами, ₽" type="number" />
          <Field name="contractTotal" label="Сумма договора, ₽" type="number" />
          <Field name="remainingPayment" label="Остаток по договору, ₽" type="number" />
        </div>
        <button disabled={sending} className="btn-primary"><Plus className="h-4 w-4" />{sending ? 'Создаём…' : 'Создать клиента и отправить приглашение'}</button>
      </form>
      <section className="card p-6">
        <h3 className="font-semibold text-navy-800 dark:text-white">Документы на проверке</h3>
        {requests.length === 0 ? <p className="mt-3 text-sm text-navy-400">Новых документов пока нет.</p> : <div className="mt-4 space-y-4">{requests.map((request) => <div key={request.id} className="rounded-xl border border-navy-100 p-4 dark:border-white/10"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium text-navy-800 dark:text-white">{request.title}</p><p className="text-xs text-navy-400">{request.cases?.profiles?.full_name ?? 'Клиент'} · дело {request.cases?.case_number}</p></div><span className="chip bg-gold-100 text-gold-700">На проверке</span></div><p className="mt-3 text-sm text-navy-500">Файлы: {request.document_request_files.map((file) => file.file_name).join(', ') || '—'}</p><textarea value={comments[request.id] ?? ''} onChange={(event) => setComments((prev) => ({ ...prev, [request.id]: event.target.value }))} placeholder="Комментарий обязателен, если возвращаете документ" rows={2} className="input-field mt-3 resize-none" /><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void review(request.id, true)} type="button" className="btn-primary px-4 py-2"><Check className="h-4 w-4" />Принять</button><button onClick={() => void review(request.id, false)} type="button" className="btn-ghost px-4 py-2"><RotateCcw className="h-4 w-4" />Вернуть на доработку</button></div></div>)}</div>}
      </section>
    </div>
  )
}

function Field({ name, label, type = 'text', required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return <label className="text-sm font-medium text-navy-700 dark:text-white/70">{label}<input name={name} type={type} required={required} className="input-field mt-1.5" /></label>
}
