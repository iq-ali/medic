import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { staffService } from '@/services/staff.service'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/types/staff'
import type { Staff } from '@/types/staff'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 grid grid-cols-1 gap-0.5 sm:grid-cols-3 sm:gap-4 border-b border-border last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm sm:col-span-2">{value ?? '—'}</dd>
    </div>
  )
}

export function StaffDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    staffService
      .getOne(id)
      .then(({ staff: s }) => setStaff(s))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (notFound || !staff) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Staff member not found.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/staff')}>
            Back to Staff
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/staff')}>
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight truncate">
              {staff.firstName} {staff.lastName}
            </h2>
            {staff.user && (
              <p className="text-xs text-muted-foreground truncate">{staff.user.email}</p>
            )}
          </div>
        </div>
        {user?.role === 'ADMIN' && (
          <Button size="sm" className="shrink-0" onClick={() => navigate(`/staff/${id}/edit`)}>
            <Pencil />
            Edit
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border px-4 sm:px-5">
        <h3 className="text-sm font-semibold pt-4 pb-2">Staff Information</h3>
        <dl>
          <InfoRow
            label="Role"
            value={
              staff.user ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                  {ROLE_LABELS[staff.user.role]}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">No account linked</span>
              )
            }
          />
          <InfoRow label="Email" value={staff.user?.email} />
          <InfoRow label="Specialty" value={staff.specialty} />
          <InfoRow label="Phone" value={staff.phone} />
        </dl>
      </div>
    </div>
  )
}
