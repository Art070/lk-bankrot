import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  mockDocuments,
  mockMessages,
  mockNotifications,
  mockPayments,
} from '../data/mockData'
import { useAuth } from '../hooks/useAuth'
import type { AppNotification, CaseDocument, Message, Payment } from '../types'

interface DataContextValue {
  notifications: AppNotification[]
  documents: CaseDocument[]
  messages: Message[]
  payments: Payment[]
  unreadCount: number
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  markDocumentViewed: (id: string) => void
  sendMessage: (text: string) => void
}

const NOTIF_KEY = 'lk-bankrot:notifications'
const DOCS_KEY = 'lk-bankrot:documents'
const MSG_KEY = 'lk-bankrot:messages'
const PAYMENTS_KEY = 'lk-bankrot:payments'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    // ignore
  }
  return fallback
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    load(NOTIF_KEY, mockNotifications),
  )
  const [documents, setDocuments] = useState<CaseDocument[]>(() =>
    load(DOCS_KEY, mockDocuments),
  )
  const [messages, setMessages] = useState<Message[]>(() =>
    load(MSG_KEY, mockMessages),
  )
  const [payments] = useState<Payment[]>(() => load(PAYMENTS_KEY, mockPayments))

  useEffect(() => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications))
  }, [notifications])
  useEffect(() => {
    localStorage.setItem(DOCS_KEY, JSON.stringify(documents))
  }, [documents])
  useEffect(() => {
    localStorage.setItem(MSG_KEY, JSON.stringify(messages))
  }, [messages])
  useEffect(() => {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
  }, [payments])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const markDocumentViewed = useCallback((id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id && !d.viewedAt
          ? { ...d, viewedAt: new Date().toISOString() }
          : d,
      ),
    )
  }, [])

  const sendMessage = useCallback((text: string) => {
    const msg: Message = {
      id: `m${Date.now()}`,
      from: 'client',
      authorName: user?.client.name ?? 'Клиент',
      text,
      date: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, msg])
    // Simulated curator auto-reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m${Date.now() + 1}`,
          from: 'curator',
          authorName: 'Анна Комарова',
          text: 'Спасибо за сообщение! Я получила ваш вопрос и отвечу в ближайшее рабочее время.',
          date: new Date().toISOString(),
        },
      ])
    }, 1600)
  }, [user])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      notifications,
      documents,
      messages,
      payments,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      markDocumentViewed,
      sendMessage,
    }),
    [
      notifications,
      documents,
      messages,
      payments,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      markDocumentViewed,
      sendMessage,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}
