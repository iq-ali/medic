import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { staffService } from '@/services/staff.service'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/types/staff'
import type { Staff } from '@/types/staff'

export function StaffPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [staff, setStaff] = useState<Staff[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    staffService
      .list(debouncedSearch)
      .then(({ staff: s }) => setStaff(s))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [debouncedSearch])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or specialty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        {user?.role === 'ADMIN' && (
          <Button size="sm" onClick={() => navigate('/staff/new')}>
            <Plus />
            Add Staff
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Role</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Specialty</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium whitespace-nowrap">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      {s.user ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {ROLE_LABELS[s.user.role]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{s.specialty ?? '—'}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{s.phone ?? '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/staff/${s.id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
