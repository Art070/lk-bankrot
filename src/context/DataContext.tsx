import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { AppNotification, CaseDocument, Client, Message, Payment } from '../types'

interface DataContextValue {
  client: Client | null
  caseId: string | null
  notifications: AppNotification[]
  documents: CaseDocument[]
  messages: Message[]
  payments: Payment[]
  unreadCount: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  markDocumentViewed: (id: string) => Promise<void>
  getDocumentUrl: (path: string) => Promise<string>
  sendMessage: (text: string) => Promise<void>
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [client, setClient] = useState<Client | null>(null)
  const [caseId, setCaseId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      if (user.profile.role !== 'client') {
        setClient(null)
        setCaseId(null)
        setNotifications([])
        setDocuments([])
        setMessages([])
        setPayments([])
        return
      }

      const { data: caseRow, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (caseError) throw caseError
      if (!caseRow) {
        setError('Для вашего аккаунта ещё не создано дело.')
        return
      }

      setCaseId(caseRow.id)
      setClient({
        id: user.id,
        name: user.profile.fullName,
        email: user.email,
        phone: user.profile.phone ?? '—',
        inn: user.profile.inn ?? '—',
        caseNumber: caseRow.case_number ?? '—',
        court: caseRow.court ?? '—',
        caseStatus: caseRow.case_status,
        openDate: caseRow.open_date,
        nextHearing: caseRow.next_hearing ?? caseRow.open_date,
        totalDebt: Number(caseRow.total_debt),
        contractTotal: Number(caseRow.contract_total),
        remainingPayment: Number(caseRow.remaining_payment),
        paymentProgress: caseRow.contract_total > 0
          ? Math.round(((Number(caseRow.contract_total) - Number(caseRow.remaining_payment)) / Number(caseRow.contract_total)) * 100)
          : 0,
      })

      const [docs, notifs, paymentRows, messageRows] = await Promise.all([
        supabase.from('documents').select('*').eq('case_id', caseRow.id).order('document_date', { ascending: false }),
        supabase.from('notifications').select('*').eq('client_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('case_id', caseRow.id).order('due_date'),
        supabase.from('messages').select('*, profiles!messages_author_id_fkey(full_name)').eq('case_id', caseRow.id).order('created_at'),
      ])
      if (docs.error || notifs.error || paymentRows.error || messageRows.error) {
        throw docs.error ?? notifs.error ?? paymentRows.error ?? messageRows.error
      }

      setDocuments((docs.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        type: row.document_type,
        date: row.document_date,
        sizeKb: row.size_kb,
        viewedAt: row.viewed_at,
        url: row.storage_path,
      })))
      setNotifications((notifs.data ?? []).map((row) => ({
        id: row.id,
        type: row.notification_type,
        title: row.title,
        body: row.body,
        date: row.created_at,
        read: Boolean(row.read_at),
      })))
      setPayments((paymentRows.data ?? []).map((row) => ({
        id: row.id,
        date: row.due_date,
        amount: Number(row.amount),
        description: row.description,
        status: row.status,
        method: row.method ?? undefined,
      })))
      setMessages((messageRows.data ?? []).map((row) => ({
        id: row.id,
        from: row.author_id === user.id ? 'client' : 'curator',
        authorName: row.profiles?.full_name ?? 'Сотрудник',
        text: row.body,
        date: row.created_at,
      })))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить данные кабинета')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void refresh() }, [refresh])

  const markNotificationRead = useCallback(async (id: string) => {
    const { error: updateError } = await supabase.rpc('mark_notification_read', { notification_id: id })
    if (updateError) throw updateError
    setNotifications((previous) => previous.map((item) => item.id === id ? { ...item, read: true } : item))
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    const { error: updateError } = await supabase.rpc('mark_notifications_read')
    if (updateError) throw updateError
    setNotifications((previous) => previous.map((item) => ({ ...item, read: true })))
  }, [])

  const markDocumentViewed = useCallback(async (id: string) => {
    const { error: updateError } = await supabase.rpc('mark_document_viewed', { document_id: id })
    if (updateError) throw updateError
    setDocuments((previous) => previous.map((item) => item.id === id ? { ...item, viewedAt: new Date().toISOString() } : item))
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !caseId) throw new Error('Дело не найдено')
    const { error: insertError } = await supabase.from('messages').insert({ case_id: caseId, author_id: user.id, body: text })
    if (insertError) throw insertError
    await refresh()
  }, [caseId, refresh, user])

  const getDocumentUrl = useCallback(async (path: string) => {
    const { data, error: signedUrlError } = await supabase.storage.from('case-documents').createSignedUrl(path, 60)
    if (signedUrlError || !data?.signedUrl) throw signedUrlError ?? new Error('Не удалось подготовить документ')
    return data.signedUrl
  }, [])

  const value = useMemo<DataContextValue>(() => ({
    client, caseId, notifications, documents, messages, payments,
    unreadCount: notifications.filter((item) => !item.read).length,
    loading, error, refresh, markNotificationRead, markAllNotificationsRead, markDocumentViewed, getDocumentUrl, sendMessage,
  }), [caseId, client, documents, error, getDocumentUrl, loading, markAllNotificationsRead, markDocumentViewed, markNotificationRead, messages, notifications, payments, refresh, sendMessage])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within a DataProvider')
  return context
}
