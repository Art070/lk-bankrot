import { AlertCircle, Check, CheckCircle2, Copy, FileUp, Plus, RotateCcw, UserPlus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Request = { id: string; title: string; status: string; reviewer_comment: string | null; cases: { case_number: string | null; profiles: { full_name: string } | null } | null; document_request_files: { id: string; file_name: string }[] }
type Created = { caseId: string; documentRequests: { id: string; title: string }[] }

const value = (form: FormData, name: string) => String(form.get(name) ?? '').trim()
const formatDate = (date: string) => date ? new Intl.DateTimeFormat('ru-RU').format(new Date(`${date}T00:00:00`)) : '—'

export function Admin() {
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [header, setHeader] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [requests, setRequests] = useState<Request[]>([])
  const [comments, setComments] = useState<Record<string, string>>({})

  const loadRequests = async () => {
    const { data } = await supabase.from('document_requests').select('id, title, status, reviewer_comment, cases!document_requests_case_id_fkey(case_number, profiles!cases_client_id_fkey(full_name)), document_request_files(id, file_name)').in('status', ['submitted', 'under_review']).order('submitted_at')
    setRequests(((data ?? []) as unknown as Request[]).map((request) => {
      const caseRow = Array.isArray(request.cases) ? request.cases[0] ?? null : request.cases
      return { ...request, cases: caseRow && { ...caseRow, profiles: Array.isArray(caseRow.profiles) ? caseRow.profiles[0] ?? null : caseRow.profiles } }
    }))
  }
  useEffect(() => { void loadRequests() }, [])

  const uploadFiles = async (created: Created, files: Record<string, File[]>) => {
    for (const [title, selected] of Object.entries(files)) {
      const request = created.documentRequests.find((item) => item.title === title)
      if (!request || selected.length === 0) continue
      for (const file of selected) {
        const safeName = file.name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9._-]/g, '_')
        const path = `${request.id}/${crypto.randomUUID()}-${safeName}`
        const { error: storageError } = await supabase.storage.from('case-documents').upload(path, file, { contentType: file.type, upsert: false })
        if (storageError) throw storageError
        const { error: rowError } = await supabase.from('document_request_files').insert({ request_id: request.id, storage_path: path, file_name: file.name, mime_type: file.type || 'application/octet-stream', size_bytes: file.size })
        if (rowError) throw rowError
      }
      const { error: statusError } = await supabase.from('document_requests').update({ status: 'under_review', submitted_at: new Date().toISOString() }).eq('id', request.id)
      if (statusError) throw statusError
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const element = event.currentTarget
    const form = new FormData(element)
    const payload = {
      email: value(form, 'email'), fullName: value(form, 'fullName'), phone: value(form, 'phone'),
      birthDate: value(form, 'birthDate'), birthPlace: value(form, 'birthPlace'), passportSeries: value(form, 'passportSeries'), passportNumber: value(form, 'passportNumber'), passportIssuedBy: value(form, 'passportIssuedBy'), passportIssuedDate: value(form, 'passportIssuedDate'), passportDepartmentCode: value(form, 'passportDepartmentCode'),
      registrationPostcode: value(form, 'registrationPostcode'), registrationRegion: value(form, 'registrationRegion'), registrationCity: value(form, 'registrationCity'), registrationLocality: value(form, 'registrationLocality'), registrationStreet: value(form, 'registrationStreet'), registrationBuilding: value(form, 'registrationBuilding'), registrationApartment: value(form, 'registrationApartment'), residenceAddress: value(form, 'residenceAddress'), maritalStatus: value(form, 'maritalStatus'), employmentStatus: value(form, 'employmentStatus'), isIndividualEntrepreneur: form.get('isIndividualEntrepreneur') === 'on', totalDebt: Number(value(form, 'totalDebt') || 0),
    }
    const files = { 'Паспорт гражданина РФ': Array.from(form.getAll('passportFiles')).filter((item): item is File => item instanceof File && item.size > 0), 'СНИЛС': Array.from(form.getAll('snilsFiles')).filter((item): item is File => item instanceof File && item.size > 0), 'Договор с клиентом': Array.from(form.getAll('contractFiles')).filter((item): item is File => item instanceof File && item.size > 0) }
    if (!files['Договор с клиентом'].length) return setError('Приложите подписанный договор — он обязателен до создания личного кабинета.')
    if (files['Паспорт гражданина РФ'].length > 15) return setError('К паспорту можно приложить не более 15 файлов.')
    if (Object.values(files).flat().some((file) => file.size > 15 * 1024 * 1024)) return setError('Размер одного файла не должен превышать 15 МБ.')
    setSending(true); setError(''); setNotice(''); setHeader('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/.netlify/functions/create-client', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` }, body: JSON.stringify(payload) })
      const rawBody = await response.text()
      const body = (rawBody ? JSON.parse(rawBody) : {}) as ({ error?: string } & Partial<Created>)
      if (!response.ok || !body.caseId || !body.documentRequests) throw new Error(body.error ?? `Не удалось создать клиента (код ${response.status})`)
      await uploadFiles({ caseId: body.caseId, documentRequests: body.documentRequests }, files)
      setHeader(buildHeader(payload)); element.reset(); setBirthDate(''); setNotice('Карточка создана, документы прикреплены и отправлены на проверку. Клиенту направлено приглашение для входа.'); await loadRequests()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось создать клиента') } finally { setSending(false) }
  }

  const review = async (id: string, accepted: boolean) => {
    const comment = comments[id]?.trim(); if (!accepted && !comment) return setError('Укажите клиенту, что нужно исправить.')
    const { error: reviewError } = await supabase.from('document_requests').update({ status: accepted ? 'accepted' : 'returned', reviewer_comment: accepted ? null : comment, reviewed_at: new Date().toISOString() }).eq('id', id)
    if (reviewError) setError(reviewError.message); else { setNotice(accepted ? 'Документ принят.' : 'Документ возвращён клиенту с комментарием.'); await loadRequests() }
  }

  const age = birthDate ? Math.floor((Date.now() - new Date(`${birthDate}T00:00:00`).getTime()) / 31557600000) : null
  return <div className="mx-auto max-w-4xl space-y-6"><div><h2 className="text-xl font-bold text-navy-800 dark:text-white">Управление клиентами</h2><p className="mt-1 text-sm text-navy-400 dark:text-white/40">После подписания договора создайте защищённую карточку. Поля подобраны для шапки будущего заявления; сведения о суде и деле добавляются позже.</p></div>
    <form onSubmit={submit} className="card space-y-7 p-6"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-100 text-gold-700"><UserPlus className="h-5 w-5" /></span><div><h3 className="font-semibold text-navy-800 dark:text-white">Новый клиент</h3><p className="text-sm text-navy-400">Поля со звёздочкой обязательны для создания личного кабинета.</p></div></div>{notice && <p className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 className="h-5 w-5 shrink-0" />{notice}</p>}{error && <p className="flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</p>}
      <FormSection title="Контакты и данные должника"><div className="grid gap-4 sm:grid-cols-2"><Field name="fullName" label="ФИО полностью" required /><Field name="email" label="Email для приглашения" type="email" required /><Field name="phone" label="Телефон" type="tel" required /><label className="text-sm font-medium text-navy-700 dark:text-white/70">Дата рождения *<input name="birthDate" type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="input-field mt-1.5" />{age !== null && <span className="mt-1 block text-xs font-normal text-navy-400">Возраст: {age} лет</span>}</label><Field name="birthPlace" label="Место рождения" required /><Field name="totalDebt" label="Предварительная сумма долга, ₽" type="number" /></div></FormSection>
      <FormSection title="Паспортные данные"><div className="grid gap-4 sm:grid-cols-2"><Field name="passportSeries" label="Серия паспорта" inputMode="numeric" required /><Field name="passportNumber" label="Номер паспорта" inputMode="numeric" required /><Field name="passportIssuedBy" label="Кем выдан" required /><Field name="passportIssuedDate" label="Дата выдачи" type="date" required /><Field name="passportDepartmentCode" label="Код подразделения" /></div></FormSection>
      <FormSection title="Адрес регистрации"><p className="-mt-2 text-xs text-navy-400">Регион и полный адрес помогут определить территориальную подсудность на этапе подачи.</p><div className="grid gap-4 sm:grid-cols-2"><Field name="registrationPostcode" label="Индекс" inputMode="numeric" /><Field name="registrationRegion" label="Регион / область / край / республика" required /><Field name="registrationCity" label="Город" /><Field name="registrationLocality" label="Населённый пункт" /><Field name="registrationStreet" label="Улица / проспект" required /><Field name="registrationBuilding" label="Дом, корпус, строение" required /><Field name="registrationApartment" label="Квартира" /><Field name="residenceAddress" label="Адрес проживания, если отличается" /></div></FormSection>
      <FormSection title="Дополнительная информация"><div className="grid gap-4 sm:grid-cols-2"><Select name="maritalStatus" label="Семейное положение" options={[['', 'Не указано'], ['single', 'Не состоит в браке'], ['married', 'В браке'], ['divorced', 'Разведён(а)'], ['widowed', 'Вдовец / вдова']]} /><Select name="employmentStatus" label="Занятость" options={[['', 'Не указано'], ['employed', 'Работает по найму'], ['self_employed', 'Самозанятый'], ['unemployed', 'Не работает'], ['retired', 'Пенсионер'], ['other', 'Другое']]} /><label className="flex items-center gap-2 text-sm font-medium text-navy-700 dark:text-white/70"><input name="isIndividualEntrepreneur" type="checkbox" className="h-4 w-4" />Зарегистрирован как ИП</label></div></FormSection>
      <FormSection title="Документы до создания ЛК"><p className="-mt-2 text-xs text-navy-400">Файлы хранятся в закрытом хранилище. Договор обязателен, паспорт — до 15 фото или PDF, каждый файл до 15 МБ.</p><div className="grid gap-4 sm:grid-cols-3"><UploadField name="contractFiles" label="Подписанный договор *" required /><UploadField name="passportFiles" label="Паспорт" multiple capture /><UploadField name="snilsFiles" label="СНИЛС" multiple capture /></div></FormSection>
      <button disabled={sending} className="btn-primary"><Plus className="h-4 w-4" />{sending ? 'Создаём и загружаем…' : 'Создать клиента и отправить приглашение'}</button>
    </form>
    {header && <section className="card p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-navy-800 dark:text-white">Шапка заявления: данные должника</h3><p className="mt-1 text-sm text-navy-400">Сформирована по введённым данным. Перед подачей юрист проверяет реквизиты.</p></div><button type="button" onClick={() => void navigator.clipboard.writeText(header)} className="btn-ghost"><Copy className="h-4 w-4" />Копировать</button></div><pre className="mt-4 whitespace-pre-wrap rounded-xl bg-navy-50 p-4 font-sans text-sm leading-6 text-navy-700 dark:bg-white/5 dark:text-white/75">{header}</pre></section>}
    <section className="card p-6"><h3 className="font-semibold text-navy-800 dark:text-white">Документы на проверке</h3>{requests.length === 0 ? <p className="mt-3 text-sm text-navy-400">Новых документов пока нет.</p> : <div className="mt-4 space-y-4">{requests.map((request) => <div key={request.id} className="rounded-xl border border-navy-100 p-4 dark:border-white/10"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium text-navy-800 dark:text-white">{request.title}</p><p className="text-xs text-navy-400">{request.cases?.profiles?.full_name ?? 'Клиент'} · дело {request.cases?.case_number ?? 'ещё не присвоено'}</p></div><span className="chip bg-gold-100 text-gold-700">На проверке</span></div><p className="mt-3 text-sm text-navy-500">Файлы: {request.document_request_files.map((file) => file.file_name).join(', ') || '—'}</p><textarea value={comments[request.id] ?? ''} onChange={(event) => setComments((prev) => ({ ...prev, [request.id]: event.target.value }))} placeholder="Комментарий обязателен, если возвращаете документ" rows={2} className="input-field mt-3 resize-none" /><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void review(request.id, true)} type="button" className="btn-primary px-4 py-2"><Check className="h-4 w-4" />Принять</button><button onClick={() => void review(request.id, false)} type="button" className="btn-ghost px-4 py-2"><RotateCcw className="h-4 w-4" />Вернуть на доработку</button></div></div>)}</div>}</section>
  </div>
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) { return <fieldset className="space-y-4 border-t border-navy-100 pt-6 dark:border-white/10"><legend className="px-0 text-base font-semibold text-navy-800 dark:text-white">{title}</legend>{children}</fieldset> }
function Field({ name, label, type = 'text', required = false, inputMode }: { name: string; label: string; type?: string; required?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }) { return <label className="text-sm font-medium text-navy-700 dark:text-white/70">{label}{required && ' *'}<input name={name} type={type} required={required} inputMode={inputMode} className="input-field mt-1.5" /></label> }
function Select({ name, label, options }: { name: string; label: string; options: [string, string][] }) { return <label className="text-sm font-medium text-navy-700 dark:text-white/70">{label}<select name={name} className="input-field mt-1.5">{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label> }
function UploadField({ name, label, required = false, multiple = false, capture = false }: { name: string; label: string; required?: boolean; multiple?: boolean; capture?: boolean }) { return <label className="block rounded-xl border border-dashed border-navy-200 p-4 text-sm font-medium text-navy-700 dark:border-white/15 dark:text-white/70"><FileUp className="mb-2 h-5 w-5 text-gold-600" />{label}<input name={name} type="file" required={required} multiple={multiple} capture={capture ? 'environment' : undefined} accept="image/*,.pdf" className="mt-2 block w-full text-xs font-normal text-navy-500" /></label> }
function buildHeader(data: Record<string, string | number | boolean>) { const address = [data.registrationPostcode, data.registrationRegion, data.registrationCity, data.registrationLocality, data.registrationStreet, data.registrationBuilding && `д. ${data.registrationBuilding}`, data.registrationApartment && `кв. ${data.registrationApartment}`].filter(Boolean).join(', '); return `Должник: ${data.fullName}\nДата рождения: ${formatDate(String(data.birthDate))}\nМесто рождения: ${data.birthPlace}\nПаспорт: ${data.passportSeries} ${data.passportNumber}, выдан ${data.passportIssuedBy} ${formatDate(String(data.passportIssuedDate))}${data.passportDepartmentCode ? `, код подразделения ${data.passportDepartmentCode}` : ''}\nАдрес регистрации: ${address}\nТелефон: ${data.phone}\nEmail: ${data.email}` }
