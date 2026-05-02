import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  UserCog,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/auth'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  roles: Role[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'DOCTOR', 'THERAPIST', 'TEACHER', 'PARENT', 'STUDENT'],
  },
  {
    label: 'Students',
    to: '/students',
    icon: Users,
    roles: ['ADMIN', 'DOCTOR', 'THERAPIST', 'TEACHER'],
  },
  {
    label: 'Medical Records',
    to: '/medical',
    icon: FileText,
    roles: ['ADMIN', 'DOCTOR'],
  },
  {
    label: 'Appointments',
    to: '/appointments',
    icon: CalendarDays,
    roles: ['ADMIN', 'DOCTOR', 'THERAPIST', 'PARENT', 'STUDENT'],
  },
  {
    label: 'Staff',
    to: '/staff',
    icon: UserCog,
    roles: ['ADMIN'],
  },
]

export function Sidebar() {
  const { user } = useAuth()
  const visible = navItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <aside className="w-56 shrink-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <span className="text-base font-bold tracking-tight text-sidebar-foreground">
          Medic
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )
            }
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
