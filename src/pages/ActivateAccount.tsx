import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Common/Logo'
import { supabase } from '../lib/supabase'

export function ActivateAccount() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const code = new URLSearchParams(window.location.search).get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        }
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Ссылка недействительна или её срок действия истёк. Запросите новое приглашение у администратора.')
        setReady(true)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Не удалось проверить ссылку приглашения.')
      } finally {
        setChecking(false)
      }
    })()
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError('Пароль должен содержать не менее 8 символов.')
    if (password !== repeatPassword) return setError('Пароли не совпадают.')
    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) return setError(updateError.message)
    await supabase.auth.signOut()
    setDone(true)
  }

  if (done) return <ActivationShell><CheckCircle2 className="h-10 w-10 text-emerald-500" /><h1 className="mt-4 text-xl font-bold text-navy-800">Пароль создан</h1><p className="mt-2 text-sm text-navy-500">Теперь войдите в кабинет, используя email и новый пароль.</p><button onClick={() => navigate('/login', { replace: true })} className="btn-primary mt-6 w-full">Перейти ко входу</button></ActivationShell>
  if (checking) return <ActivationShell><Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-500" /><p className="mt-3 text-sm text-navy-500">Проверяем приглашение…</p></ActivationShell>
  if (!ready) return <ActivationShell><AlertCircle className="h-10 w-10 text-rose-500" /><h1 className="mt-4 text-xl font-bold text-navy-800">Не удалось активировать аккаунт</h1><p className="mt-2 text-sm text-navy-500">{error}</p><button onClick={() => navigate('/login', { replace: true })} className="btn-ghost mt-6 w-full">Вернуться ко входу</button></ActivationShell>

  return <ActivationShell><KeyRound className="h-10 w-10 text-gold-600" /><h1 className="mt-4 text-xl font-bold text-navy-800">Создайте пароль</h1><p className="mt-2 text-sm text-navy-500">Он нужен для последующего входа в личный кабинет.</p>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<form onSubmit={submit} className="mt-6 space-y-4"><PasswordField label="Новый пароль" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((value) => !value)} /><PasswordField label="Повторите пароль" value={repeatPassword} onChange={setRepeatPassword} show={showPassword} onToggle={() => setShowPassword((value) => !value)} /><button disabled={saving} className="btn-primary w-full">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />Сохраняем…</> : 'Сохранить пароль'}</button></form></ActivationShell>
}

function ActivationShell({ children }: { children: React.ReactNode }) { return <div className="grid min-h-screen place-items-center bg-[#f7f9fc] px-6"><main className="card w-full max-w-md p-7 text-center"><div className="mb-7 text-left"><Logo /></div>{children}</main></div> }
function PasswordField({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (value: string) => void; show: boolean; onToggle: () => void }) { return <label className="block text-left text-sm font-medium text-navy-700">{label}<div className="relative mt-1.5"><input type={show ? 'text' : 'password'} autoComplete="new-password" value={value} onChange={(event) => onChange(event.target.value)} className="input-field pr-10" /><button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label> }
