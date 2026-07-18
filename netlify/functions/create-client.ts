import { createClient } from '@supabase/supabase-js'

interface CreateClientPayload {
  email: string
  fullName: string
  phone: string
  birthDate: string
  birthPlace: string
  passportSeries: string
  passportNumber: string
  passportIssuedBy: string
  passportIssuedDate: string
  passportDepartmentCode?: string
  registrationPostcode?: string
  registrationRegion: string
  registrationCity?: string
  registrationLocality?: string
  registrationStreet: string
  registrationBuilding: string
  registrationApartment?: string
  residenceAddress?: string
  maritalStatus?: string
  employmentStatus?: string
  isIndividualEntrepreneur?: boolean
  totalDebt?: number
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
})

export default async (request: Request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' })

  // VITE_ variables are already configured for the client build. Reuse their
  // values inside this function so only the service-role key stays server-only.
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
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
  if (!payload.email || !payload.fullName || !payload.phone || !payload.birthDate || !payload.birthPlace || !payload.passportSeries || !payload.passportNumber || !payload.passportIssuedBy || !payload.passportIssuedDate || !payload.registrationRegion || !payload.registrationStreet || !payload.registrationBuilding) {
    return json(400, { error: 'Fill in all required fields' })
  }

  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(payload.email, {
    data: { full_name: payload.fullName, role: 'client' },
    redirectTo: process.env.SITE_URL,
  })
  if (inviteError || !invitation.user) return json(400, { error: inviteError?.message ?? 'Unable to invite client' })

  const { error: profileError } = await admin.from('profiles').update({ phone: payload.phone }).eq('id', invitation.user.id)
  if (profileError) return json(400, { error: profileError.message })

  const { data: createdCase, error: caseError } = await admin.from('cases').insert({
    client_id: invitation.user.id,
    case_status: 'diagnostics',
    open_date: new Date().toISOString().slice(0, 10),
    total_debt: payload.totalDebt ?? 0,
    contract_total: 0,
    remaining_payment: 0,
  }).select('id').single()
  if (caseError) return json(400, { error: caseError.message })

  const { error: detailsError } = await admin.from('client_details').insert({
    client_id: invitation.user.id,
    birth_date: payload.birthDate,
    birth_place: payload.birthPlace,
    passport_series: payload.passportSeries,
    passport_number: payload.passportNumber,
    passport_issued_by: payload.passportIssuedBy,
    passport_issued_date: payload.passportIssuedDate,
    passport_department_code: payload.passportDepartmentCode || null,
    registration_postcode: payload.registrationPostcode || null,
    registration_region: payload.registrationRegion,
    registration_city: payload.registrationCity || null,
    registration_locality: payload.registrationLocality || null,
    registration_street: payload.registrationStreet,
    registration_building: payload.registrationBuilding,
    registration_apartment: payload.registrationApartment || null,
    residence_address: payload.residenceAddress || null,
    marital_status: payload.maritalStatus || null,
    employment_status: payload.employmentStatus || null,
    is_individual_entrepreneur: Boolean(payload.isIndividualEntrepreneur),
  })
  if (detailsError) return json(400, { error: detailsError.message })

  const { data: requests, error: requestsError } = await admin.from('document_requests').insert([
    { case_id: createdCase.id, title: 'Паспорт гражданина РФ', description: 'Сфотографируйте или загрузите читаемые развороты и страницы с отметками. Можно добавить до 15 фото или один PDF.', max_files: 15, required: true },
    { case_id: createdCase.id, title: 'СНИЛС', description: 'Загрузите фото или скан СНИЛС с обеих сторон, если данные есть на документе.', max_files: 4, required: true },
    { case_id: createdCase.id, title: 'Договор с клиентом', description: 'Подписанный договор на сопровождение процедуры.', max_files: 3, required: true },
    { case_id: createdCase.id, title: 'Справка о доходах', description: 'Пришлите последнюю доступную справку или выписку. Если документа нет — напишите об этом юристу в комментарии.', max_files: 10, required: true },
  ]).select('id, title')
  if (requestsError) return json(400, { error: requestsError.message })

  return json(201, { clientId: invitation.user.id, caseId: createdCase.id, documentRequests: requests ?? [] })
}
