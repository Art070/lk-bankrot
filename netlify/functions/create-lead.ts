import { createClient } from '@supabase/supabase-js'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })

export default async (request: Request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' })
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return json(500, { error: 'Сервис временно недоступен. Попробуйте позже.' })
  const payload = await request.json() as { name?: string; phone?: string; consent?: boolean }
  const phone = String(payload.phone ?? '').trim()
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return json(400, { error: 'Введите номер телефона в понятном формате.' })
  if (!payload.consent) return json(400, { error: 'Нужно согласие на обработку данных для обратной связи.' })
  const admin = createClient(url, serviceKey)
  const { error } = await admin.from('leads').insert({ name: String(payload.name ?? '').trim() || null, phone, source: 'landing' })
  if (error) return json(500, { error: 'Не удалось отправить заявку. Попробуйте ещё раз.' })
  return json(201, { ok: true })
}
