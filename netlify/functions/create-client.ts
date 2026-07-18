import { createClient } from '@supabase/supabase-js'

interface CreateClientPayload {
  email: string
  fullName: string
  phone?: string
  inn?: string
  caseNumber: string
  court: string
  openDate: string
  nextHearing?: string
  totalDebt?: number
  contractTotal?: number
  remainingPayment?: number
}

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export default async (request: Request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !serviceKey || !anonKey) return json(500, { error: 'Server is not configured' })

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json(401, { error: 'Authentication required' })

  const authClient = createClient(url, anonKey)
  const { data: authData } = await authClient.auth.getUser(token)
  if (!authData.user) return json(401, { error: 'Invalid session' })

  const admin = createClient(url, serviceKey)
  const { data: caller } = await admin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()
  if (!caller || !['admin', 'manager'].includes(caller.role)) return json(403, { error: 'Forbidden' })

  const payload = await request.json() as CreateClientPayload
  if (!payload.email || !payload.fullName || !payload.openDate) {
    return json(400, { error: 'Fill in all required fields' })
  }

  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(payload.email, {
    data: { full_name: payload.fullName, role: 'client' },
    redirectTo: process.env.SITE_URL,
  })
  if (inviteError || !invitation.user) return json(400, { error: inviteError?.message ?? 'Unable to invite client' })

  const { error: profileError } = await admin.from('profiles').update({ phone: payload.phone ?? null, inn: payload.inn ?? null }).eq('id', invitation.user.id)
  if (profileError) return json(400, { error: profileError.message })

  const { data: createdCase, error: caseError } = await admin.from('cases').insert({
    client_id: invitation.user.id,
    case_number: payload.caseNumber || null,
    court: payload.court || null,
    case_status: 'diagnostics',
    open_date: payload.openDate,
    next_hearing: payload.nextHearing || null,
    total_debt: payload.totalDebt ?? 0,
    contract_total: payload.contractTotal ?? 0,
    remaining_payment: payload.remainingPayment ?? 0,
  }).select('id').single()
  if (caseError) return json(400, { error: caseError.message })

  const { error: requestsError } = await admin.from('document_requests').insert([
    { case_id: createdCase.id, title: 'Паспорт гражданина РФ', description: 'Сфотографируйте или загрузите читаемые развороты и страницы с отметками. Можно добавить до 15 фото или один PDF.', max_files: 15, required: true },
    { case_id: createdCase.id, title: 'СНИЛС', description: 'Загрузите фото или скан СНИЛС с обеих сторон, если данные есть на документе.', max_files: 4, required: true },
    { case_id: createdCase.id, title: 'Справка о доходах', description: 'Пришлите последнюю доступную справку или выписку. Если документа нет — напишите об этом юристу в комментарии.', max_files: 10, required: true },
  ])
  if (requestsError) return json(400, { error: requestsError.message })

  return json(201, { clientId: invitation.user.id })
}
