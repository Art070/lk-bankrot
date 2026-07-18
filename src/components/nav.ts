import {
  Bell,
  FileText,
  FileUp,
  LayoutDashboard,
  Scale,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Сбор документов', icon: FileUp },
  { to: '/overview', label: 'Обзор', icon: LayoutDashboard },
  { to: '/case', label: 'Статус дела', icon: Scale },
  { to: '/finances', label: 'Финансы', icon: Wallet },
  { to: '/documents', label: 'Документы', icon: FileText },
  { to: '/notifications', label: 'Уведомления', icon: Bell },
  { to: '/contacts', label: 'Контакты', icon: Users },
]
