import {
  Bell,
  ClipboardList,
  FileUp,
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
  { to: '/', label: 'Главная', icon: ClipboardList },
  { to: '/documents/collection', label: 'Документы', icon: FileUp },
  { to: '/finances', label: 'Финансы', icon: Wallet },
  { to: '/notifications', label: 'События', icon: Bell },
  { to: '/contacts', label: 'Чат с юристом', icon: Users },
]
