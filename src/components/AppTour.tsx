import { Bell, CheckCircle2, FileUp, Landmark, MessageCircle, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

const slides = [
  { icon: Landmark, title: 'Ваше дело — всегда под рукой', text: 'На главной странице видно, на каком этапе находится дело, чем сейчас занимаются юристы и нужно ли что-то от вас.', tip: 'Главная — короткая сводка без сложных юридических формулировок.' },
  { icon: FileUp, title: 'Документы', text: 'Здесь появятся только документы, которые нужны именно по вашему делу. Их можно сфотографировать или загрузить файлом.', tip: 'После проверки принятый документ исчезнет из списка задач.' },
  { icon: Wallet, title: 'Договор и оплата', text: 'В разделе «Финансы» находится договор с нашей компанией: стоимость сопровождения, оплата и график, если он предусмотрен.', tip: 'Если договор оплачен полностью, здесь будет подтверждение — без лишних таблиц.' },
  { icon: Bell, title: 'События по делу', text: 'Здесь хранятся важные сообщения: запросы юриста, новые документы, даты и изменения по процедуре.', tip: 'Новые события отмечаются значком с числом.' },
  { icon: MessageCircle, title: 'Чат с юристом', text: 'Если появились вопросы или изменились обстоятельства, напишите нам прямо в кабинете. Не нужно искать контакты в переписках.', tip: 'Обучение можно повторить в любой момент через пункт меню «Как пользоваться кабинетом».' },
] as const

export function openAppTour() {
  window.dispatchEvent(new Event('open-client-tour'))
}

export function AppTour({ clientId }: { clientId: string | null }) {
  const [visible, setVisible] = useState(false)
  const [slide, setSlide] = useState(0)
  const storageKey = clientId ? `lk-bankrot:client-tour:${clientId}:v1` : ''

  useEffect(() => {
    if (!storageKey) return
    setVisible(!window.localStorage.getItem(storageKey))
    const open = () => { setSlide(0); setVisible(true) }
    window.addEventListener('open-client-tour', open)
    return () => window.removeEventListener('open-client-tour', open)
  }, [storageKey])

  if (!visible || !clientId) return null
  const current = slides[slide]
  const Icon = current.icon
  const finish = () => { window.localStorage.setItem(storageKey, 'seen'); setVisible(false) }
  const next = () => { if (slide === slides.length - 1) finish(); else setSlide((value) => value + 1) }

  return <div role="dialog" aria-modal="true" aria-label="Как пользоваться кабинетом" onClick={next} className="fixed inset-0 z-[60] grid place-items-center bg-navy-950/95 p-5 text-white backdrop-blur-sm">
    <div className="w-full max-w-sm text-center"><div className="mx-auto flex max-w-48 justify-center gap-1.5">{slides.map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= slide ? 'bg-gold-400' : 'bg-white/20'}`} />)}</div><button onClick={(event) => { event.stopPropagation(); finish() }} className="ml-auto mt-5 block text-sm text-white/60 hover:text-white">Пропустить</button><div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-7 shadow-2xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gold-400 text-navy-900"><Icon className="h-8 w-8" /></div><p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">Шаг {slide + 1} из {slides.length}</p><h2 className="mt-2 text-2xl font-bold">{current.title}</h2><p className="mt-4 text-sm leading-6 text-white/75">{current.text}</p><div className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-left text-sm leading-5 text-white/85">{current.tip}</div><p className="mt-6 text-xs text-white/55">Нажмите в любом месте, чтобы продолжить</p></div><button onClick={(event) => { event.stopPropagation(); next() }} className="btn-gold mt-5 w-full">{slide === slides.length - 1 ? <><CheckCircle2 className="h-4 w-4" />Открыть кабинет</> : 'Следующий шаг'}</button></div></div>
}
