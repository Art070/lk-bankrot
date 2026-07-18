import { DatabaseZap, ShieldCheck } from 'lucide-react'

export function Setup() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f9fc] p-6 dark:bg-navy-950">
      <section className="card w-full max-w-xl p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300">
          <DatabaseZap className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-navy-800 dark:text-white">Кабинет готов к подключению</h1>
        <p className="mt-3 text-sm leading-6 text-navy-500 dark:text-white/55">
          Добавьте в Netlify переменные <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_ANON_KEY</code>,
          затем запустите SQL-миграцию из папки <code>supabase/migrations</code>.
        </p>
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-navy-400 dark:text-white/40">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Секретный серверный ключ не добавляется в браузер.
        </p>
      </section>
    </main>
  )
}
