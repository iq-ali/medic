import { useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/medical': 'Medical Records',
  '/appointments': 'Appointments',
  '/staff': 'Staff',
}

function roleLabel(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

export function Header() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'Medic'
  const username = user?.email.split('@')[0] ?? ''

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
      <h1 className="text-sm font-semibold">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="text-right">
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
