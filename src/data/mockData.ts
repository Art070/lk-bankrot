import type {
  AppNotification,
  CaseDocument,
  CaseStageInfo,
  Client,
  Curator,
  Message,
  Payment,
} from '../types'

export const CASE_STAGES: CaseStageInfo[] = [
  {
    key: 'diagnostics',
    label: 'Диагностика',
    description: 'Уточняем ситуацию и определяем предварительный маршрут',
  },
  {
    key: 'document-collection',
    label: 'Документы',
    description: 'Собираем и проверяем персональный пакет документов',
  },
  {
    key: 'filing',
    label: 'Подача',
    description: 'Готовим заявление, оплаты и передаём пакет',
  },
  {
    key: 'active-procedure',
    label: 'Процедура',
    description: 'Следим за событиями, сроками и задачами по делу',
  },
  {
    key: 'completion',
    label: 'Завершение',
    description: 'Освобождение от обязательств и закрытие дела',
  },
]

export const mockClient: Client = {
  id: '12345',
  name: 'Иван Петрович Сидоров',
  email: 'i.sidorov@example.com',
  phone: '+7 (912) 345-67-89',
  inn: '772345678901',
  caseNumber: 'А40-123456/2024',
  court: 'Арбитражный суд города Москвы',
  caseStatus: 'active-procedure',
  openDate: '2024-03-15',
  nextHearing: '2026-08-20',
  totalDebt: 2500000,
  // Стоимость сопровождения отделена от общей задолженности перед кредиторами.
  // Значения ниже согласованы с графиком платежей.
  contractTotal: 2200000,
  remainingPayment: 350000,
  paymentProgress: 84,
}

export const mockPayments: Payment[] = [
  {
    id: 'p1',
    date: '2024-04-05',
    amount: 250000,
    description: 'Первоначальный взнос по договору',
    status: 'paid',
    method: 'Банковский перевод',
  },
  {
    id: 'p2',
    date: '2024-06-05',
    amount: 300000,
    description: 'Платёж №2',
    status: 'paid',
    method: 'Банковский перевод',
  },
  {
    id: 'p3',
    date: '2024-09-05',
    amount: 300000,
    description: 'Платёж №3',
    status: 'paid',
    method: 'Карта',
  },
  {
    id: 'p4',
    date: '2025-01-05',
    amount: 400000,
    description: 'Платёж №4',
    status: 'paid',
    method: 'Банковский перевод',
  },
  {
    id: 'p5',
    date: '2025-06-05',
    amount: 600000,
    description: 'Платёж №5 (реализация имущества)',
    status: 'paid',
    method: 'Депозит суда',
  },
  {
    id: 'p6',
    date: '2026-08-05',
    amount: 175000,
    description: 'Платёж №6',
    status: 'upcoming',
  },
  {
    id: 'p7',
    date: '2026-11-05',
    amount: 175000,
    description: 'Финальный платёж',
    status: 'upcoming',
  },
]

export const mockDocuments: CaseDocument[] = [
  {
    id: 'd1',
    title: 'Договор оказания юридических услуг №БФЛ-2024/0315',
    type: 'contract',
    date: '2024-03-15',
    sizeKb: 480,
    viewedAt: '2024-03-16T10:12:00',
  },
  {
    id: 'd2',
    title: 'Определение о принятии заявления к производству',
    type: 'court',
    date: '2024-03-28',
    sizeKb: 220,
    viewedAt: '2024-04-01T09:00:00',
  },
  {
    id: 'd3',
    title: 'Реестр требований кредиторов (редакция 2)',
    type: 'court',
    date: '2024-07-11',
    sizeKb: 1340,
    viewedAt: '2024-07-12T14:20:00',
  },
  {
    id: 'd4',
    title: 'Акт финансового анализа должника',
    type: 'court',
    date: '2024-09-02',
    sizeKb: 2100,
    viewedAt: null,
  },
  {
    id: 'd5',
    title: 'Квитанция об оплате платежа №4',
    type: 'payment',
    date: '2025-01-05',
    sizeKb: 90,
    viewedAt: '2025-01-06T08:30:00',
  },
  {
    id: 'd6',
    title: 'Отчёт финансового управляющего за период',
    type: 'court',
    date: '2025-06-20',
    sizeKb: 1780,
    viewedAt: null,
  },
  {
    id: 'd7',
    title: 'Уведомление о дате судебного заседания',
    type: 'notice',
    date: '2026-07-10',
    sizeKb: 65,
    viewedAt: null,
  },
  {
    id: 'd8',
    title: 'График платежей (приложение к договору)',
    type: 'contract',
    date: '2024-03-15',
    sizeKb: 140,
    viewedAt: '2024-03-16T10:15:00',
  },
]

export const mockNotifications: AppNotification[] = [
  {
    id: 'n1',
    type: 'date',
    title: 'Судебное заседание 20 августа 2026',
    body: 'Назначено заседание по вашему делу А40-123456/2024. Личное присутствие не требуется.',
    date: '2026-07-12T09:00:00',
    read: false,
  },
  {
    id: 'n2',
    type: 'document',
    title: 'Новый документ: Уведомление о дате заседания',
    body: 'В ваш кабинет загружен новый документ. Ознакомьтесь в разделе «Документы».',
    date: '2026-07-10T15:40:00',
    read: false,
  },
  {
    id: 'n3',
    type: 'message',
    title: 'Сообщение от куратора',
    body: 'Анна Комарова: «Иван Петрович, все идёт по плану, отчёт управляющего принят судом».',
    date: '2026-06-22T11:05:00',
    read: false,
  },
  {
    id: 'n4',
    type: 'document',
    title: 'Новый документ: Отчёт финансового управляющего',
    body: 'Загружен отчёт финансового управляющего за отчётный период.',
    date: '2025-06-20T13:00:00',
    read: true,
  },
  {
    id: 'n5',
    type: 'system',
    title: 'Платёж принят',
    body: 'Платёж №5 на сумму 600 000 ₽ успешно зачтён.',
    date: '2025-06-05T18:20:00',
    read: true,
  },
]

export const mockCurator: Curator = {
  name: 'Анна Комарова',
  role: 'Персональный куратор дела',
  arbitrManager: 'Дмитрий Волков (СРО «Ассоциация АУ»)',
  photoInitials: 'АК',
  phone: '+7 (495) 120-45-67',
  email: 'a.komarova@nashmir-legal.ru',
  officeHours: 'Пн–Пт, 09:00–19:00 (МСК)',
  address: 'г. Москва, ул. Тверская, д. 12, офис 405',
}

export const mockMessages: Message[] = [
  {
    id: 'm1',
    from: 'curator',
    authorName: 'Анна Комарова',
    text: 'Здравствуйте, Иван Петрович! Ваше дело принято к производству. Я буду сопровождать вас на всех этапах.',
    date: '2024-03-28T10:00:00',
  },
  {
    id: 'm2',
    from: 'client',
    authorName: 'Иван Петрович Сидоров',
    text: 'Добрый день, Анна! Спасибо. Подскажите, нужно ли мне присутствовать на первом заседании?',
    date: '2024-03-28T12:30:00',
  },
  {
    id: 'm3',
    from: 'curator',
    authorName: 'Анна Комарова',
    text: 'Нет, ваше присутствие не требуется — интересы представляет управляющий. Мы держим вас в курсе через кабинет.',
    date: '2024-03-28T13:10:00',
  },
  {
    id: 'm4',
    from: 'curator',
    authorName: 'Анна Комарова',
    text: 'Иван Петрович, все идёт по плану, отчёт управляющего принят судом. Следующее заседание 20 августа.',
    date: '2026-06-22T11:05:00',
  },
]

// Demo credentials shown on the login screen
export const DEMO_CREDENTIALS = {
  login: 'client',
  password: 'demo123',
}
