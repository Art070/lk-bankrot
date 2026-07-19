import { CheckCircle2, ClipboardCheck, FileText, Gavel, Landmark, type LucideIcon } from 'lucide-react'
import type { ClientCaseUpdate, ClientUpdateTone } from '../types'

export type CaseStatus = 'diagnostics' | 'document-collection' | 'filing' | 'mfc-procedure' | 'court-restructuring' | 'court-assets' | 'active-procedure' | 'completed' | 'completion'

export type StageDefinition = {
  key: CaseStatus
  title: string
  shortTitle: string
  text: string
  icon: LucideIcon
  tone: ClientUpdateTone
  headline: string
  body: string
  actionLabel: string | null
  actionHref: string | null
  duration: string
  reassuringText: string
}

export const STAGES: StageDefinition[] = [
  { key: 'diagnostics', title: 'Знакомство с делом', shortTitle: 'Знакомство', text: 'Изучаем ситуацию и выбираем маршрут', icon: ClipboardCheck, tone: 'good', headline: 'Юрист знакомится с вашим делом', body: 'Мы изучаем вашу ситуацию, договор и первичные документы, чтобы выбрать оптимальный маршрут процедуры. Если потребуется уточнение, напишем в чат.', actionLabel: 'Открыть чат с юристом', actionHref: '/contacts', duration: 'Обычно 1–3 рабочих дня', reassuringText: 'Первые шаги уже сделаны. Сейчас мы аккуратно раскладываем всё по полочкам — вам не нужно разбираться в юридических тонкостях.' },
  { key: 'document-collection', title: 'Подготовка документов', shortTitle: 'Документы', text: 'Собираем и проверяем полный пакет', icon: FileText, tone: 'action', headline: 'Нужно подготовить документы', body: 'Загрузите документы из персонального списка. Юрист проверит каждый файл и сообщит, когда пакет будет готов к подаче.', actionLabel: 'Открыть список документов', actionHref: '/documents/collection', duration: 'Чаще всего 1–4 недели', reassuringText: 'Двигаемся в вашем темпе. Загружайте документы по одному, а мы проверим каждый и подскажем, если что-то понадобится.' },
  { key: 'filing', title: 'Подача в суд / МФЦ', shortTitle: 'Подача', text: 'Заявление готовится или уже направлено', icon: Gavel, tone: 'good', headline: 'Заявление подаётся в суд или МФЦ', body: 'Юристы готовят и направляют заявление. Следите за событиями в кабинете — мы сообщим, если понадобится ваше согласование или документ.', actionLabel: 'Открыть события', actionHref: '/notifications', duration: 'Обычно от нескольких дней до 2 недель', reassuringText: 'Самое ответственное мы берём на себя: проверяем пакет, готовим заявление и держим вас в курсе без лишней тревоги.' },
  { key: 'active-procedure', title: 'Ожидание решения', shortTitle: 'Процедура', text: 'Идёт официальная процедура банкротства', icon: Landmark, tone: 'attention', headline: 'Процедура идёт, делом занимаются специалисты', body: 'Финансовый управляющий и юристы ведут дело. Не совершайте крупных сделок и сообщайте нам об изменениях дохода, имущества или контактов.', actionLabel: 'Написать юристу', actionHref: '/contacts', duration: 'Срок зависит от сценария: МФЦ — 6 месяцев, суд — индивидуально', reassuringText: 'Это этап спокойного ожидания. Мы отслеживаем события и сами напишем, когда от вас потребуется действие.' },
  { key: 'completion', title: 'Списание долгов', shortTitle: 'Завершение', text: 'Сохраняем итоговые документы и памятку', icon: CheckCircle2, tone: 'good', headline: 'Процедура завершена', body: 'Долги списаны или процедура завершена. Сохраните итоговые документы и ознакомьтесь с памяткой об ограничениях после банкротства.', actionLabel: 'Открыть документы', actionHref: '/documents', duration: 'Финальные документы — после решения или окончания срока процедуры', reassuringText: 'Финиш уже рядом или наступил. Сохраним все важные документы в кабинете и поможем уверенно начать новый финансовый этап.' },
]

export const STATUS_TO_STAGE: Record<string, number> = {
  diagnostics: 0,
  'document-collection': 1,
  filing: 2,
  'mfc-procedure': 3,
  'court-restructuring': 3,
  'court-assets': 3,
  'active-procedure': 3,
  completed: 4,
  completion: 4,
}

export function getStage(status: string) {
  return STAGES[STATUS_TO_STAGE[status] ?? 0]
}

export function getStageUpdate(status: string): ClientCaseUpdate {
  const stage = getStage(status)
  return { tone: stage.tone, headline: stage.headline, body: stage.body, actionLabel: stage.actionLabel, actionHref: stage.actionHref, updatedAt: null }
}
