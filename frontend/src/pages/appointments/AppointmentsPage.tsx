import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { appointmentsService } from '@/services/appointments.service'
import { useAuth } from '@/hooks/useAuth'
import { STATUS_LABELS, STATUS_CLASSES } from '@/types/appointment'
import type { Appointment, AppointmentStatus } from '@/types/appointment'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AppointmentsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const studentId = searchParams.get('studentId') ?? undefined

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const pageSize = 20

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, studentId])

  useEffect(() => {
    setLoading(true)
    appointmentsService
      .list({
        search: debouncedSearch,
        studentId,
        status: statusFilter || undefined,
        page,
        pageSize,
      })
      .then(({ appointments: a, total: t }) => {
        setAppointments(a)
        setTotal(t)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [debouncedSearch, statusFilter, studentId, page])

  const totalPages = Math.ceil(total / pageSize)
  const canWrite =
    user?.role === 'ADMIN' || user?.role === 'DOCTOR' || user?.role === 'THERAPIST'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search appointments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          >
            <option value="">All statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
        {canWrite && (
          <Button
            size="sm"
            onClick={() =>
              navigate(studentId ? `/appointments/new?studentId=${studentId}` : '/appointments/new')
            }
          >
            <Plus />
            Schedule Appointment
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date & Time</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Staff</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  No appointments found.
                </td>
              </tr>
            ) : (
              appointments.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">
                    {formatDateTime(a.scheduledAt)}
                  </td>
                  <td className="py-3 px-4 font-medium">{a.title}</td>
                  <td className="py-3 px-4">
                    <button
                      className="hover:underline text-left"
                      onClick={() => navigate(`/students/${a.student.id}`)}
                    >
                      {a.student.firstName} {a.student.lastName}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {a.staff ? `${a.staff.firstName} ${a.staff.lastName}` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[a.status as AppointmentStatus]}`}
                    >
                      {STATUS_LABELS[a.status as AppointmentStatus]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/appointments/${a.id}`)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
