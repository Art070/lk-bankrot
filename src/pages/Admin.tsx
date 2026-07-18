import { AlertCircle, CheckCircle2, Plus, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function Admin() {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

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
          <Field name="caseNumber" label="Номер дела" required />
          <Field name="court" label="Суд" required />
          <Field name="openDate" label="Дата открытия" type="date" required />
          <Field name="nextHearing" label="Следующее заседание" type="date" />
          <Field name="totalDebt" label="Долг перед кредиторами, ₽" type="number" />
          <Field name="contractTotal" label="Сумма договора, ₽" type="number" />
          <Field name="remainingPayment" label="Остаток по договору, ₽" type="number" />
        </div>
        <button disabled={sending} className="btn-primary"><Plus className="h-4 w-4" />{sending ? 'Создаём…' : 'Создать клиента и отправить приглашение'}</button>
      </form>
    </div>
  )
}

function Field({ name, label, type = 'text', required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return <label className="text-sm font-medium text-navy-700 dark:text-white/70">{label}<input name={name} type={type} required={required} className="input-field mt-1.5" /></label>
}
