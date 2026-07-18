export type CaseStage =
  | 'diagnostics'
  | 'document-collection'
  | 'filing'
  | 'active-procedure'
  | 'completion'

export interface CaseStageInfo {
  key: CaseStage
  label: string
  description: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  inn: string
  caseNumber: string
  court: string
  caseStatus: CaseStage
  openDate: string // ISO date
  nextHearing: string // ISO date
  totalDebt: number
  contractTotal: number
  remainingPayment: number
  paymentProgress: number // 0-100
  contractNumber: string | null
  contractDate: string | null
  paymentPlan: 'not_set' | 'one_time' | 'installments'
  additionalExpensesNote: string | null
}

export type ClientUpdateTone = 'good' | 'action' | 'attention'

export interface ClientCaseUpdate {
  tone: ClientUpdateTone
  headline: string
  body: string
  actionLabel: string | null
  actionHref: string | null
  updatedAt: string | null
}

export type DocumentType =
  | 'contract'
  | 'court'
  | 'payment'
  | 'notice'

export interface CaseDocument {
  id: string
  title: string
  type: DocumentType
  date: string // ISO date
  sizeKb: number
  viewedAt: string | null // ISO datetime or null (unread)
  url?: string
}

export type PaymentStatus = 'paid' | 'upcoming' | 'overdue'

export interface Payment {
  id: string
  date: string // ISO date
  amount: number
  description: string
  status: PaymentStatus
  method?: string
}

export type NotificationType = 'date' | 'document' | 'message' | 'system'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  date: string // ISO datetime
  read: boolean
}

export interface Curator {
  name: string
  role: string
  arbitrManager: string
  photoInitials: string
  phone: string
  email: string
  officeHours: string
  address: string
}

export interface Message {
  id: string
  from: 'client' | 'curator'
  authorName: string
  text: string
  date: string // ISO datetime
}

export type AppRole = 'admin' | 'manager' | 'client'

export interface Profile {
  id: string
  fullName: string
  role: AppRole
  phone: string | null
  inn: string | null
}
