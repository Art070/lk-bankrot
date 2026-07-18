import {
  Building,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useData } from '../context/DataContext'
import { mockCurator } from '../data/mockData'
import { formatDateTime } from '../lib/format'

export function Contacts() {
  const { messages, sendMessage } = useData()
  const [text, setText] = useState('')
  const [subject, setSubject] = useState('')
  const [touched, setTouched] = useState(false)
  const [sent, setSent] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const textError =
    touched && text.trim().length < 5 ? 'Введите не менее 5 символов' : ''

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (text.trim().length < 5) return
    const full = subject.trim() ? `${subject.trim()}: ${text.trim()}` : text.trim()
    sendMessage(full)
    setText('')
    setSubject('')
    setTouched(false)
    setSent(true)
    setTimeout(() => setSent(false), 2500)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Curator card */}
      <div className="space-y-6">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-navy-800 to-navy-900 p-6 text-center text-white dark:from-charcoal-800 dark:to-charcoal-900">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold-400 text-2xl font-bold text-navy-900 shadow-lg">
              {mockCurator.photoInitials}
            </div>
            <h3 className="mt-4 text-lg font-bold">{mockCurator.name}</h3>
            <p className="text-sm text-white/60">{mockCurator.role}</p>
          </div>
          <div className="space-y-1 p-5">
            <a
              href={`tel:${mockCurator.phone.replace(/[^+\d]/g, '')}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-navy-50 dark:hover:bg-white/5"
            >
              <Phone className="h-4 w-4 text-gold-500" />
              <span className="font-medium text-navy-700 dark:text-white/80">
                {mockCurator.phone}
              </span>
            </a>
            <a
              href={`mailto:${mockCurator.email}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-navy-50 dark:hover:bg-white/5"
            >
              <Mail className="h-4 w-4 text-gold-500" />
              <span className="font-medium text-navy-700 dark:text-white/80">
                {mockCurator.email}
              </span>
            </a>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm">
              <Clock className="h-4 w-4 text-gold-500" />
              <span className="text-navy-600 dark:text-white/70">
                {mockCurator.officeHours}
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm">
              <Building className="h-4 w-4 text-gold-500" />
              <span className="text-navy-600 dark:text-white/70">
                {mockCurator.address}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-800 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-gold-500" />
            Финансовый управляющий
          </div>
          <p className="mt-2 text-sm text-navy-500 dark:text-white/50">
            {mockCurator.arbitrManager}
          </p>
        </div>
      </div>

      {/* Chat + form */}
      <div className="card flex flex-col lg:col-span-2">
        <div className="flex items-center gap-2 border-b border-navy-100 p-5 dark:border-white/5">
          <MessageCircle className="h-5 w-5 text-gold-500" />
          <h3 className="font-semibold text-navy-800 dark:text-white">
            Переписка с куратором
          </h3>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="max-h-[420px] min-h-[280px] flex-1 space-y-4 overflow-y-auto p-5"
        >
          {messages.map((m) => {
            const mine = m.from === 'client'
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${mine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                      mine
                        ? 'rounded-br-md bg-navy-800 text-white dark:bg-navy-700'
                        : 'rounded-bl-md bg-navy-50 text-navy-800 dark:bg-white/5 dark:text-white/80'
                    }`}
                  >
                    {m.text}
                  </div>
                  <p
                    className={`mt-1 text-[11px] text-navy-300 dark:text-white/25 ${
                      mine ? 'text-right' : 'text-left'
                    }`}
                  >
                    {m.authorName} · {formatDateTime(m.date)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Feedback form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-3 border-t border-navy-100 p-5 dark:border-white/5"
        >
          {sent && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Сообщение отправлено куратору
            </div>
          )}
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Тема (необязательно)"
            className="input-field"
          />
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={3}
              placeholder="Напишите сообщение куратору…"
              className={`input-field resize-none ${
                textError ? 'border-rose-300 focus:ring-rose-100' : ''
              }`}
            />
            {textError && (
              <p className="mt-1 text-xs text-rose-600">{textError}</p>
            )}
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-gold">
              <Send className="h-4 w-4" />
              Отправить
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
