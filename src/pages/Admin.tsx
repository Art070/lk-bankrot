import { AlertCircle, Bell, Check, CheckCircle2, Copy, FileUp, Gavel, MessageCircle, Plus, RotateCcw, Save, UserPlus, Wallet } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getStageUpdate } from '../lib/stages'

type Request = { id: string; title: string; status: string; reviewer_comment: string | null; cases: { case_number: string | null; profiles: { full_name: string } | null } | null; document_request_files: { id: string; file_name: string }[] }
type Created = { caseId: string; documentRequests: { id: string; title: string }[] }
type ClientCase = { id: string; case_status: string; profiles: { full_name: string } | null }
type WorkspaceData = {
  caseRow: Record<string, unknown>
  profile: Record<string, unknown>
  details: Record<string, unknown> | null
  payments: Record<string, unknown>[]
  requests: Record<string, unknown>[]
  notifications: Record<string, unknown>[]
  messages: Record<string, unknown>[]
}

const value = (form: FormData, name: string) => String(form.get(name) ?? '').trim()
const formatDate = (date: string) => date ? new Intl.DateTimeFormat('ru-RU').format(new Date(`${date}T00:00:00`)) : '—'

export function Admin() {
  const { user } = useAuth()
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
    <ClientWorkspace staffId={user?.id ?? ''} />
    <ClientUpdateEditor staffId={user?.id ?? ''} />
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

function ClientWorkspace({ staffId }: { staffId: string }) {
  const [cases, setCases] = useState<ClientCase[]>([])
  const [selected, setSelected] = useState('')
  const [tab, setTab] = useState<'case' | 'documents' | 'finance' | 'communication'>('case')
  const [data, setData] = useState<WorkspaceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const loadCases = async () => {
    const { data: rows, error: loadError } = await supabase.from('cases').select('id, case_status, profiles!cases_client_id_fkey(full_name)').order('created_at', { ascending: false })
    if (loadError) { setError(loadError.message); return }
    setCases(((rows ?? []) as unknown as ClientCase[]).map((row) => ({ ...row, profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles })))
  }
  useEffect(() => { void loadCases() }, [])

  const loadClient = async (caseId: string) => {
    setSelected(caseId); setData(null); setNotice(''); setError('')
    if (!caseId) return
    setLoading(true)
    const { data: caseRow, error: caseError } = await supabase.from('cases').select('*').eq('id', caseId).single()
    if (caseError || !caseRow) { setError(caseError?.message ?? 'Дело не найдено'); setLoading(false); return }
    const [profile, details, payments, requests, notifications, messages] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', caseRow.client_id).single(),
      supabase.from('client_details').select('*').eq('client_id', caseRow.client_id).maybeSingle(),
      supabase.from('payments').select('*').eq('case_id', caseId).order('due_date'),
      supabase.from('document_requests').select('*, document_request_files(id, file_name, size_bytes)').eq('case_id', caseId).order('created_at'),
      supabase.from('notifications').select('*').eq('client_id', caseRow.client_id).order('created_at', { ascending: false }),
      supabase.from('messages').select('*, profiles!messages_author_id_fkey(full_name)').eq('case_id', caseId).order('created_at'),
    ])
    const queryError = profile.error ?? details.error ?? payments.error ?? requests.error ?? notifications.error ?? messages.error
    if (queryError) setError(queryError.message)
    else setData({ caseRow, profile: profile.data ?? {}, details: details.data, payments: payments.data ?? [], requests: requests.data ?? [], notifications: notifications.data ?? [], messages: messages.data ?? [] })
    setLoading(false)
  }
  const saved = (message: string) => { setNotice(message); setError(''); void loadClient(selected); void loadCases() }
  const fail = (cause: unknown) => setError(cause instanceof Error ? cause.message : 'Не удалось сохранить изменения')

  const saveCaseAndProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!data) return
    const form = new FormData(event.currentTarget); setNotice(''); setError('')
    const casePatch = { case_number: value(form, 'caseNumber') || null, court: value(form, 'court') || null, case_status: value(form, 'caseStatus'), open_date: value(form, 'openDate'), next_hearing: value(form, 'nextHearing') || null, total_debt: Number(value(form, 'totalDebt') || 0), contract_total: Number(value(form, 'contractTotal') || 0), remaining_payment: Number(value(form, 'remainingPayment') || 0) }
    const profilePatch = { full_name: value(form, 'fullName'), phone: value(form, 'phone') || null, inn: value(form, 'inn') || null }
    const detailsPatch = { client_id: String(data.caseRow.client_id), birth_date: value(form, 'birthDate'), birth_place: value(form, 'birthPlace'), passport_series: value(form, 'passportSeries'), passport_number: value(form, 'passportNumber'), passport_issued_by: value(form, 'passportIssuedBy'), passport_issued_date: value(form, 'passportIssuedDate'), passport_department_code: value(form, 'passportDepartmentCode') || null, registration_postcode: value(form, 'registrationPostcode') || null, registration_region: value(form, 'registrationRegion'), registration_city: value(form, 'registrationCity') || null, registration_locality: value(form, 'registrationLocality') || null, registration_street: value(form, 'registrationStreet'), registration_building: value(form, 'registrationBuilding'), registration_apartment: value(form, 'registrationApartment') || null, residence_address: value(form, 'residenceAddress') || null, marital_status: value(form, 'maritalStatus') || null, employment_status: value(form, 'employmentStatus') || null, is_individual_entrepreneur: form.get('isIndividualEntrepreneur') === 'on' }
    const stageChanged = casePatch.case_status !== String(data.caseRow.case_status)
    const [caseResult, profileResult, detailsResult] = await Promise.all([supabase.from('cases').update(casePatch).eq('id', selected), supabase.from('profiles').update(profilePatch).eq('id', String(data.caseRow.client_id)), supabase.from('client_details').upsert(detailsPatch, { onConflict: 'client_id' })])
    let saveError = caseResult.error ?? profileResult.error ?? detailsResult.error
    if (!saveError && stageChanged) {
      const update = getStageUpdate(casePatch.case_status)
      const [updateResult, notificationResult] = await Promise.all([
        supabase.from('case_client_updates').upsert({ case_id: selected, tone: update.tone, headline: update.headline, body: update.body, action_label: update.actionLabel, action_href: update.actionHref, updated_by: staffId }, { onConflict: 'case_id' }),
        supabase.from('notifications').insert({ client_id: String(data.caseRow.client_id), notification_type: 'system', title: `Новый этап: ${update.headline}`, body: update.body }),
      ])
      saveError = updateResult.error ?? notificationResult.error
    }
    if (saveError) fail(new Error(saveError.message)); else saved('Карточка, этап и реквизиты обновлены.')
  }

  const updateRequest = async (id: string, status: string, reviewerComment = '') => {
    const { error: updateError } = await supabase.from('document_requests').update({ status, reviewer_comment: reviewerComment || null, reviewed_at: ['accepted', 'returned'].includes(status) ? new Date().toISOString() : null }).eq('id', id)
    if (updateError) fail(new Error(updateError.message)); else saved('Статус документа обновлён.')
  }
  const addRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const { error: insertError } = await supabase.from('document_requests').insert({ case_id: selected, title: value(form, 'title'), description: value(form, 'description'), required: form.get('required') === 'on', max_files: Number(value(form, 'maxFiles') || 15) })
    if (insertError) fail(new Error(insertError.message)); else { event.currentTarget.reset(); saved('Новый запрос документа добавлен.') }
  }
  const addPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const { error: insertError } = await supabase.from('payments').insert({ case_id: selected, due_date: value(form, 'dueDate'), amount: Number(value(form, 'amount')), description: value(form, 'description'), method: value(form, 'method') || null, status: value(form, 'paymentStatus') })
    if (insertError) fail(new Error(insertError.message)); else { event.currentTarget.reset(); saved('Платёж добавлен в график.') }
  }
  const updatePayment = async (id: string, status: string) => { const { error: updateError } = await supabase.from('payments').update({ status }).eq('id', id); if (updateError) fail(new Error(updateError.message)); else saved('Статус платежа обновлён.') }
  const addNotification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!data) return; const form = new FormData(event.currentTarget)
    const { error: insertError } = await supabase.from('notifications').insert({ client_id: data.caseRow.client_id, notification_type: value(form, 'type'), title: value(form, 'title'), body: value(form, 'body') })
    if (insertError) fail(new Error(insertError.message)); else { event.currentTarget.reset(); saved('Уведомление отправлено клиенту.') }
  }
  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const body = value(form, 'body'); if (!body) return
    const { error: insertError } = await supabase.from('messages').insert({ case_id: selected, author_id: staffId, body })
    if (insertError) fail(new Error(insertError.message)); else { event.currentTarget.reset(); saved('Сообщение отправлено в чат клиента.') }
  }

  return <section className="card overflow-hidden"><div className="border-b border-navy-100 bg-gradient-to-r from-navy-800 to-navy-700 p-5 text-white sm:p-6"><p className="text-sm text-gold-300">Рабочее место администратора</p><h3 className="mt-1 text-xl font-bold">Карточка и управление делом клиента</h3><p className="mt-1 max-w-2xl text-sm text-white/70">Выберите клиента: здесь меняются все сведения, которые он видит в кабинете.</p><label className="mt-5 block max-w-xl text-sm font-medium text-white/80">Клиент<select value={selected} onChange={(event) => void loadClient(event.target.value)} className="input-field mt-1.5 text-navy-800"><option value="">Выберите клиента</option>{cases.map((item) => <option key={item.id} value={item.id}>{item.profiles?.full_name ?? 'Без имени'} · {item.case_status}</option>)}</select></label></div>{notice && <p className="mx-5 mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}{error && <p className="mx-5 mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{loading && <p className="p-6 text-sm text-navy-400">Загружаем карточку клиента…</p>}{data && <div><div className="flex overflow-x-auto border-b border-navy-100 px-3 dark:border-white/10">{([{ key: 'case', label: 'Карточка и этап', Icon: Gavel }, { key: 'documents', label: 'Документы', Icon: FileUp }, { key: 'finance', label: 'Финансы', Icon: Wallet }, { key: 'communication', label: 'Связь и события', Icon: MessageCircle }] as const).map(({ key, label, Icon }) => <button key={key} type="button" onClick={() => setTab(key)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold ${tab === key ? 'border-gold-500 text-navy-800 dark:text-white' : 'border-transparent text-navy-400'}`}><Icon className="h-4 w-4" />{label}</button>)}</div><div className="p-5 sm:p-6">{tab === 'case' && <CaseEditor data={data} onSave={saveCaseAndProfile} />}{tab === 'documents' && <DocumentsEditor requests={data.requests} onUpdate={updateRequest} onAdd={addRequest} />}{tab === 'finance' && <FinanceEditor payments={data.payments} onUpdate={updatePayment} onAdd={addPayment} />}{tab === 'communication' && <CommunicationEditor data={data} onNotification={addNotification} onMessage={sendMessage} />}</div></div>}</section>
}

function CaseEditor({ data, onSave }: { data: WorkspaceData; onSave: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  const c = data.caseRow; const p = data.profile; const d = data.details ?? {}
  return <form onSubmit={(event) => void onSave(event)} className="space-y-6"><div><h4 className="font-bold text-navy-800 dark:text-white">Этап, прогресс и реквизиты дела</h4><p className="mt-1 text-sm text-navy-400">При смене этапа клиент автоматически получит новую сводку и уведомление.</p></div><div className="grid gap-4 sm:grid-cols-2"><SelectValue name="caseStatus" label="Текущий этап" initial={String(c.case_status)} options={[['diagnostics', '1. Знакомство с делом'], ['document-collection', '2. Подготовка документов'], ['filing', '3. Подача в суд / МФЦ'], ['mfc-procedure', '4. Ожидание решения — МФЦ'], ['court-restructuring', '4. Ожидание решения — реструктуризация'], ['court-assets', '4. Ожидание решения — реализация имущества'], ['completed', '5. Списание долгов']]} /><FieldValue name="caseNumber" label="Номер дела" initial={String(c.case_number ?? '')} /><FieldValue name="court" label="Суд / МФЦ" initial={String(c.court ?? '')} /><FieldValue name="openDate" label="Дата открытия" type="date" initial={String(c.open_date ?? '')} required /><FieldValue name="nextHearing" label="Следующее событие / заседание" type="date" initial={String(c.next_hearing ?? '')} /><FieldValue name="totalDebt" label="Общая задолженность, ₽" type="number" initial={String(c.total_debt ?? 0)} /><FieldValue name="contractTotal" label="Сумма договора, ₽" type="number" initial={String(c.contract_total ?? 0)} /><FieldValue name="remainingPayment" label="Остаток по договору, ₽" type="number" initial={String(c.remaining_payment ?? 0)} /></div><div className="border-t border-navy-100 pt-6 dark:border-white/10"><h4 className="font-bold text-navy-800 dark:text-white">Данные должника</h4><div className="mt-4 grid gap-4 sm:grid-cols-2"><FieldValue name="fullName" label="ФИО" initial={String(p.full_name ?? '')} required /><FieldValue name="phone" label="Телефон" initial={String(p.phone ?? '')} /><FieldValue name="inn" label="ИНН" initial={String(p.inn ?? '')} /><FieldValue name="birthDate" label="Дата рождения" type="date" initial={String(d.birth_date ?? '')} required /><FieldValue name="birthPlace" label="Место рождения" initial={String(d.birth_place ?? '')} required /><FieldValue name="passportSeries" label="Серия паспорта" initial={String(d.passport_series ?? '')} required /><FieldValue name="passportNumber" label="Номер паспорта" initial={String(d.passport_number ?? '')} required /><FieldValue name="passportIssuedBy" label="Кем выдан" initial={String(d.passport_issued_by ?? '')} required /><FieldValue name="passportIssuedDate" label="Дата выдачи" type="date" initial={String(d.passport_issued_date ?? '')} required /><FieldValue name="passportDepartmentCode" label="Код подразделения" initial={String(d.passport_department_code ?? '')} /><FieldValue name="registrationPostcode" label="Индекс" initial={String(d.registration_postcode ?? '')} /><FieldValue name="registrationRegion" label="Регион" initial={String(d.registration_region ?? '')} required /><FieldValue name="registrationCity" label="Город" initial={String(d.registration_city ?? '')} /><FieldValue name="registrationLocality" label="Населённый пункт" initial={String(d.registration_locality ?? '')} /><FieldValue name="registrationStreet" label="Улица" initial={String(d.registration_street ?? '')} required /><FieldValue name="registrationBuilding" label="Дом" initial={String(d.registration_building ?? '')} required /><FieldValue name="registrationApartment" label="Квартира" initial={String(d.registration_apartment ?? '')} /><FieldValue name="residenceAddress" label="Адрес проживания" initial={String(d.residence_address ?? '')} /><SelectValue name="maritalStatus" label="Семейное положение" initial={String(d.marital_status ?? '')} options={[['', 'Не указано'], ['single', 'Не состоит в браке'], ['married', 'В браке'], ['divorced', 'Разведён(а)'], ['widowed', 'Вдовец / вдова']]} /><SelectValue name="employmentStatus" label="Занятость" initial={String(d.employment_status ?? '')} options={[['', 'Не указано'], ['employed', 'Работает по найму'], ['self_employed', 'Самозанятый'], ['unemployed', 'Не работает'], ['retired', 'Пенсионер'], ['other', 'Другое']]} /><label className="flex items-center gap-2 self-end text-sm font-medium text-navy-700 dark:text-white/70"><input name="isIndividualEntrepreneur" type="checkbox" defaultChecked={Boolean(d.is_individual_entrepreneur)} className="h-4 w-4" />Зарегистрирован как ИП</label></div></div><button className="btn-primary w-full sm:w-auto"><Save className="h-4 w-4" />Сохранить карточку и этап</button></form>
}

function DocumentsEditor({ requests, onUpdate, onAdd }: { requests: Record<string, unknown>[]; onUpdate: (id: string, status: string, comment?: string) => Promise<void>; onAdd: (event: FormEvent<HTMLFormElement>) => Promise<void> }) { const [comments, setComments] = useState<Record<string, string>>({}); return <div className="space-y-6"><div><h4 className="font-bold text-navy-800 dark:text-white">Документы клиента</h4><p className="mt-1 text-sm text-navy-400">Примите файл, верните его с комментарием или добавьте новый запрос.</p></div><div className="space-y-3">{requests.map((item) => <div key={String(item.id)} className="rounded-xl border border-navy-100 p-4 dark:border-white/10"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold text-navy-800 dark:text-white">{String(item.title)}</p><p className="mt-1 text-sm text-navy-500">{String(item.description ?? '')}</p><p className="mt-2 text-xs text-navy-400">Файлы: {Array.isArray(item.document_request_files) ? item.document_request_files.map((file: { file_name: string }) => file.file_name).join(', ') || 'нет' : 'нет'}</p></div><span className="chip bg-navy-50 text-navy-600 dark:bg-white/10 dark:text-white/70">{String(item.status)}</span></div><textarea value={comments[String(item.id)] ?? String(item.reviewer_comment ?? '')} onChange={(event) => setComments((old) => ({ ...old, [String(item.id)]: event.target.value }))} rows={2} className="input-field mt-3 resize-none" placeholder="Комментарий для клиента, если возвращаете документ" /><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void onUpdate(String(item.id), 'accepted')} type="button" className="btn-primary px-4 py-2"><Check className="h-4 w-4" />Принять</button><button onClick={() => void onUpdate(String(item.id), 'returned', comments[String(item.id)] ?? '')} type="button" className="btn-ghost px-4 py-2"><RotateCcw className="h-4 w-4" />Вернуть</button></div></div>)}{requests.length === 0 && <p className="text-sm text-navy-400">Запросов документов пока нет.</p>}</div><form onSubmit={(event) => void onAdd(event)} className="rounded-xl bg-navy-50 p-4 dark:bg-white/5"><p className="font-semibold text-navy-800 dark:text-white">Запросить новый документ</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field name="title" label="Название документа" required /><Field name="maxFiles" label="Максимум файлов" type="number" /><label className="text-sm font-medium text-navy-700 dark:text-white/70 sm:col-span-2">Пояснение<textarea name="description" rows={2} className="input-field mt-1.5 resize-none" /></label><label className="flex items-center gap-2 text-sm font-medium text-navy-700 dark:text-white/70"><input name="required" type="checkbox" defaultChecked className="h-4 w-4" />Обязательный документ</label></div><button className="btn-primary mt-4 px-4 py-2"><Plus className="h-4 w-4" />Добавить запрос</button></form></div> }

function FinanceEditor({ payments, onUpdate, onAdd }: { payments: Record<string, unknown>[]; onUpdate: (id: string, status: string) => Promise<void>; onAdd: (event: FormEvent<HTMLFormElement>) => Promise<void> }) { return <div className="space-y-6"><div><h4 className="font-bold text-navy-800 dark:text-white">График платежей</h4><p className="mt-1 text-sm text-navy-400">Добавляйте платежи и отмечайте поступившие — клиент сразу видит изменения.</p></div><div className="space-y-2">{payments.map((item) => <div key={String(item.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 p-4 dark:border-white/10"><div><p className="font-semibold text-navy-800 dark:text-white">{String(item.description)}</p><p className="text-sm text-navy-400">{String(item.due_date)} · {Number(item.amount).toLocaleString('ru-RU')} ₽ · {String(item.method ?? '—')}</p></div><select defaultValue={String(item.status)} onChange={(event) => void onUpdate(String(item.id), event.target.value)} className="input-field w-auto py-2"><option value="upcoming">Ожидается</option><option value="paid">Оплачен</option><option value="overdue">Просрочен</option></select></div>)}{payments.length === 0 && <p className="text-sm text-navy-400">Платежей пока нет.</p>}</div><form onSubmit={(event) => void onAdd(event)} className="rounded-xl bg-navy-50 p-4 dark:bg-white/5"><p className="font-semibold text-navy-800 dark:text-white">Добавить платёж</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field name="dueDate" label="Дата" type="date" required /><Field name="amount" label="Сумма, ₽" type="number" required /><Field name="description" label="Назначение" required /><Field name="method" label="Способ оплаты" /><Select name="paymentStatus" label="Статус" options={[['upcoming', 'Ожидается'], ['paid', 'Оплачен'], ['overdue', 'Просрочен']]} /></div><button className="btn-primary mt-4 px-4 py-2"><Plus className="h-4 w-4" />Добавить платёж</button></form></div> }

function CommunicationEditor({ data, onNotification, onMessage }: { data: WorkspaceData; onNotification: (event: FormEvent<HTMLFormElement>) => Promise<void>; onMessage: (event: FormEvent<HTMLFormElement>) => Promise<void> }) { return <div className="grid gap-6 lg:grid-cols-2"><div><h4 className="font-bold text-navy-800 dark:text-white">Отправить уведомление</h4><form onSubmit={(event) => void onNotification(event)} className="mt-4 space-y-3 rounded-xl bg-navy-50 p-4 dark:bg-white/5"><Select name="type" label="Тип" options={[['system', 'Системное'], ['document', 'Документ'], ['date', 'Дата / заседание'], ['message', 'Сообщение']]} /><Field name="title" label="Заголовок" required /><label className="text-sm font-medium text-navy-700 dark:text-white/70">Текст<textarea name="body" required rows={3} className="input-field mt-1.5 resize-none" /></label><button className="btn-primary px-4 py-2"><Bell className="h-4 w-4" />Отправить</button></form><p className="mt-5 text-sm font-semibold text-navy-800 dark:text-white">Последние события</p><div className="mt-2 space-y-2">{data.notifications.slice(0, 5).map((item) => <div key={String(item.id)} className="rounded-xl border border-navy-100 p-3 text-sm dark:border-white/10"><p className="font-medium text-navy-800 dark:text-white">{String(item.title)}</p><p className="mt-1 text-navy-500">{String(item.body)}</p></div>)}</div></div><div><h4 className="font-bold text-navy-800 dark:text-white">Чат с клиентом</h4><div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-xl border border-navy-100 p-4 dark:border-white/10">{data.messages.map((item) => <div key={String(item.id)} className="text-sm"><p className="font-semibold text-navy-800 dark:text-white">{String((item.profiles as { full_name?: string } | null)?.full_name ?? 'Сотрудник')}</p><p className="text-navy-500">{String(item.body)}</p></div>)}{data.messages.length === 0 && <p className="text-sm text-navy-400">Сообщений пока нет.</p>}</div><form onSubmit={(event) => void onMessage(event)} className="mt-3 space-y-3"><label className="text-sm font-medium text-navy-700 dark:text-white/70">Новое сообщение<textarea name="body" required rows={3} className="input-field mt-1.5 resize-none" /></label><button className="btn-primary px-4 py-2"><MessageCircle className="h-4 w-4" />Отправить в чат</button></form></div></div> }

function FieldValue({ name, label, initial, type = 'text', required = false }: { name: string; label: string; initial: string; type?: string; required?: boolean }) { return <label className="text-sm font-medium text-navy-700 dark:text-white/70">{label}{required && ' *'}<input name={name} type={type} defaultValue={initial} required={required} className="input-field mt-1.5" /></label> }
function SelectValue({ name, label, initial, options }: { name: string; label: string; initial: string; options: [string, string][] }) { return <label className="text-sm font-medium text-navy-700 dark:text-white/70">{label}<select name={name} defaultValue={initial} className="input-field mt-1.5">{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></label> }

function ClientUpdateEditor({ staffId }: { staffId: string }) {
  const [cases, setCases] = useState<ClientCase[]>([])
  const [caseId, setCaseId] = useState('')
  const [tone, setTone] = useState<'good' | 'action' | 'attention'>('good')
  const [headline, setHeadline] = useState('Делом занимаются юристы')
  const [body, setBody] = useState('С вашей стороны сейчас ничего не требуется. Мы продолжаем работу и сообщим, если понадобится действие.')
  const [actionLabel, setActionLabel] = useState('')
  const [actionHref, setActionHref] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { void (async () => {
    const { data, error: loadError } = await supabase.from('cases').select('id, case_status, profiles!cases_client_id_fkey(full_name)').order('created_at', { ascending: false })
    if (loadError) { setError(loadError.message); return }
    setCases(((data ?? []) as unknown as ClientCase[]).map((row) => ({ ...row, profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles })))
  })() }, [])

  const loadUpdate = async (nextCaseId: string) => {
    setCaseId(nextCaseId); setNotice(''); setError('')
    if (!nextCaseId) return
    const { data, error: loadError } = await supabase.from('case_client_updates').select('tone, headline, body, action_label, action_href').eq('case_id', nextCaseId).maybeSingle()
    if (loadError) { setError(loadError.message); return }
    if (data) { setTone(data.tone as typeof tone); setHeadline(data.headline); setBody(data.body); setActionLabel(data.action_label ?? ''); setActionHref(data.action_href ?? '') }
    else { setTone('good'); setHeadline('Делом занимаются юристы'); setBody('С вашей стороны сейчас ничего не требуется. Мы продолжаем работу и сообщим, если понадобится действие.'); setActionLabel(''); setActionHref('') }
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!caseId) return setError('Выберите клиента.')
    if ((actionLabel && !actionHref) || (!actionLabel && actionHref)) return setError('Для кнопки заполните и текст, и ссылку.')
    if (actionHref && !actionHref.startsWith('/')) return setError('Используйте внутреннюю ссылку, например /documents/collection или /contacts.')
    setSaving(true); setError(''); setNotice('')
    const { error: saveError } = await supabase.from('case_client_updates').upsert({ case_id: caseId, tone, headline: headline.trim(), body: body.trim(), action_label: actionLabel.trim() || null, action_href: actionHref.trim() || null, updated_by: staffId }, { onConflict: 'case_id' })
    setSaving(false)
    if (saveError) setError(saveError.message); else setNotice('Сводка сохранена — клиент увидит её на главном экране.')
  }

  return <section className="card p-5 sm:p-6"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></span><div><h3 className="font-semibold text-navy-800 dark:text-white">Сводка для клиента</h3><p className="mt-1 text-sm text-navy-400">Первое, что клиент увидит в мобильном кабинете. Пишите коротко и простыми словами.</p></div></div>{notice && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-navy-700 dark:text-white/70 sm:col-span-2">Клиент<select value={caseId} onChange={(event) => void loadUpdate(event.target.value)} className="input-field mt-1.5"><option value="">Выберите клиента</option>{cases.map((item) => <option key={item.id} value={item.id}>{item.profiles?.full_name ?? 'Без имени'} · {item.case_status}</option>)}</select></label><label className="text-sm font-medium text-navy-700 dark:text-white/70">Статус<select value={tone} onChange={(event) => setTone(event.target.value as typeof tone)} className="input-field mt-1.5"><option value="good">Всё хорошо</option><option value="action">Нужно действие клиента</option><option value="attention">Нужно внимание</option></select></label><label className="text-sm font-medium text-navy-700 dark:text-white/70">Заголовок<input value={headline} onChange={(event) => setHeadline(event.target.value)} required maxLength={90} className="input-field mt-1.5" /></label><label className="text-sm font-medium text-navy-700 dark:text-white/70 sm:col-span-2">Короткая сводка<textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={360} rows={3} className="input-field mt-1.5 resize-none" /></label><label className="text-sm font-medium text-navy-700 dark:text-white/70">Текст кнопки (необязательно)<input value={actionLabel} onChange={(event) => setActionLabel(event.target.value)} maxLength={40} placeholder="Например: Открыть документы" className="input-field mt-1.5" /></label><label className="text-sm font-medium text-navy-700 dark:text-white/70">Ссылка кнопки<input value={actionHref} onChange={(event) => setActionHref(event.target.value)} placeholder="/documents/collection" className="input-field mt-1.5" /></label><div className="sm:col-span-2"><button disabled={saving} className="btn-primary w-full sm:w-auto">{saving ? 'Сохраняем…' : 'Сохранить сводку для клиента'}</button></div></form></section>
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) { return <fieldset className="space-y-4 border-t border-navy-100 pt-6 dark:border-white/10"><legend className="px-0 text-base font-semibold text-navy-800 dark:text-white">{title}</legend>{children}</fieldset> }
function Field({ name, label, type = 'text', required = false, inputMode }: { name: string; label: string; type?: string; required?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }) { return <label className="text-sm font-medium text-navy-700 dark:text-white/70">{label}{required && ' *'}<input name={name} type={type} required={required} inputMode={inputMode} className="input-field mt-1.5" /></label> }
function Select({ name, label, options }: { name: string; label: string; options: [string, string][] }) { return <label className="text-sm font-medium text-navy-700 dark:text-white/70">{label}<select name={name} className="input-field mt-1.5">{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label> }
function UploadField({ name, label, required = false, multiple = false, capture = false }: { name: string; label: string; required?: boolean; multiple?: boolean; capture?: boolean }) { return <label className="block rounded-xl border border-dashed border-navy-200 p-4 text-sm font-medium text-navy-700 dark:border-white/15 dark:text-white/70"><FileUp className="mb-2 h-5 w-5 text-gold-600" />{label}<input name={name} type="file" required={required} multiple={multiple} capture={capture ? 'environment' : undefined} accept="image/*,.pdf" className="mt-2 block w-full text-xs font-normal text-navy-500" /></label> }
function buildHeader(data: Record<string, string | number | boolean>) { const address = [data.registrationPostcode, data.registrationRegion, data.registrationCity, data.registrationLocality, data.registrationStreet, data.registrationBuilding && `д. ${data.registrationBuilding}`, data.registrationApartment && `кв. ${data.registrationApartment}`].filter(Boolean).join(', '); return `Должник: ${data.fullName}\nДата рождения: ${formatDate(String(data.birthDate))}\nМесто рождения: ${data.birthPlace}\nПаспорт: ${data.passportSeries} ${data.passportNumber}, выдан ${data.passportIssuedBy} ${formatDate(String(data.passportIssuedDate))}${data.passportDepartmentCode ? `, код подразделения ${data.passportDepartmentCode}` : ''}\nАдрес регистрации: ${address}\nТелефон: ${data.phone}\nEmail: ${data.email}` }
