import { useLocation } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/medical': 'Medical Records',
  '/appointments': 'Appointments',
  '/staff': 'Staff',
  '/profile': 'Profile',
  '/admin/settings': 'Admin Settings',
}

function roleLabel(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'EduPal'
  const username = user?.email.split('@')[0] ?? ''

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={onMenuClick}>
          <Menu />
        </Button>
        <h1 className="text-sm font-semibold truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium leading-none">{username}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user ? roleLabel(user.role) : ''}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
          <LogOut />
        </Button>
      </div>
    </header>
  )
}
