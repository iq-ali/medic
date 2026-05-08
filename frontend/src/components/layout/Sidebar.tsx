import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  UserCog,
  User,
  Settings,
  ClipboardList,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { adminService } from '@/services/admin.service'
import type { Role } from '@/types/auth'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  roles: Role[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard',       to: '/dashboard',             icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'THERAPIST', 'TEACHER', 'PARENT', 'STUDENT'] },
  { label: 'Students',        to: '/students',              icon: Users,           roles: ['ADMIN', 'DOCTOR', 'THERAPIST', 'TEACHER'] },
  { label: 'Medical Records', to: '/medical',               icon: FileText,        roles: ['ADMIN', 'DOCTOR'] },
  { label: 'Appointments',    to: '/appointments',          icon: CalendarDays,    roles: ['ADMIN', 'DOCTOR', 'THERAPIST', 'PARENT', 'STUDENT'] },
  { label: 'Staff',           to: '/staff',                 icon: UserCog,         roles: ['ADMIN'] },
  { label: 'Profile',         to: '/profile',               icon: User,            roles: ['ADMIN', 'DOCTOR', 'THERAPIST', 'TEACHER', 'PARENT', 'STUDENT'] },
  { label: 'Pending records', to: '/admin/pending-records', icon: ClipboardList,   roles: ['ADMIN'] },
  { label: 'Settings',        to: '/admin/settings',        icon: Settings,        roles: ['ADMIN'] },
]

function playNotificationTone() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
    ctx.close()
  } catch {
    // AudioContext unavailable (e.g. server-side render)
  }
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const springTransition = { type: 'spring', stiffness: 340, damping: 32 } as const

const sidebarVariants = {
  open:   { x: 0,      transition: springTransition },
  closed: { x: '-100%', transition: springTransition },
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth()
  const visible = navItems.filter((item) => user && item.roles.includes(user.role))

  const [pendingCount, setPendingCount] = useState(0)
  const prevCountRef = useRef(0)
  const initialised = useRef(false)

  useEffect(() => {
    if (user?.role !== 'ADMIN') return

    async function checkPending() {
      try {
        const res = await adminService.getPendingUsers()
        const count = res.users.length
        // Play tone only when new users arrive after the first load
        if (initialised.current && count > prevCountRef.current) {
          playNotificationTone()
        }
        prevCountRef.current = count
        setPendingCount(count)
        initialised.current = true
      } catch {
        // ignore network errors
      }
    }

    checkPending()
    const id = setInterval(checkPending, 30_000)
    return () => clearInterval(id)
  }, [user?.role])

  const inner = (
    <>
      <div className="px-4 py-5 border-b border-sidebar-border flex items-center justify-between">
        <span className="text-base font-bold tracking-tight text-sidebar-foreground">EduPal</span>
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visible.map((item) => {
          const showBadge = item.to === '/admin/settings' && pendingCount > 0
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 rounded-lg bg-sidebar-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    />
                  )}
                  <item.icon className="relative size-4 shrink-0" />
                  <span className="relative flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="relative ml-auto min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      <aside className="w-56 shrink-0 h-screen bg-sidebar border-r border-sidebar-border flex-col hidden md:flex">
        {inner}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="mobile-sidebar"
            className={cn(
              'w-56 shrink-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col',
              'fixed inset-y-0 left-0 z-30 md:hidden'
            )}
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            {inner}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
