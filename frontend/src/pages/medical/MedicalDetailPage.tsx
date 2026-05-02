import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { medicalService } from '@/services/medical.service'
import { useAuth } from '@/hooks/useAuth'
import type { MedicalRecord } from '@/types/medical'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 grid grid-cols-1 gap-0.5 sm:grid-cols-3 sm:gap-4 border-b border-border last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm sm:col-span-2">{value ?? '—'}</dd>
    </div>
  )
}

export function MedicalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    medicalService
      .getOne(id)
      .then(({ record: r }) => setRecord(r))
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

  if (notFound || !record) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Medical record not found.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/medical')}>
            Back to Medical Records
          </Button>
        </div>
      </div>
    )
  }

  const canWrite = user?.role === 'ADMIN' || user?.role === 'DOCTOR'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight truncate">{record.title}</h2>
            <p className="text-xs text-muted-foreground">{formatDate(record.recordDate)}</p>
          </div>
        </div>
        {canWrite && (
          <Button size="sm" className="shrink-0" onClick={() => navigate(`/medical/${id}/edit`)}>
            <Pencil />
            Edit
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border px-4 sm:px-5">
        <h3 className="text-sm font-semibold pt-4 pb-2">Record Details</h3>
        <dl>
          <InfoRow label="Date" value={formatDate(record.recordDate)} />
          <InfoRow label="Hospital" value={record.hospital} />
          <InfoRow
            label="Student"
            value={
              <button
                className="hover:underline text-left"
                onClick={() => navigate(`/students/${record.student.id}`)}
              >
                {record.student.firstName} {record.student.lastName}
                <span className="text-muted-foreground font-mono text-xs ml-1.5">
                  ({record.student.studentId})
                </span>
              </button>
            }
          />
          <InfoRow
            label="Doctor"
            value={
              record.doctor
                ? `${record.doctor.firstName} ${record.doctor.lastName}`
                : null
            }
          />
        </dl>
      </div>

      <div className="rounded-xl border border-border px-4 sm:px-5 pb-5">
        <h3 className="text-sm font-semibold pt-4 pb-3">Description</h3>
        <p className="text-sm whitespace-pre-line leading-relaxed">{record.description}</p>
      </div>

      {record.notes && (
        <div className="rounded-xl border border-border px-4 sm:px-5 pb-5">
          <h3 className="text-sm font-semibold pt-4 pb-3">Notes</h3>
          <p className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground">
            {record.notes}
          </p>
        </div>
      )}
    </div>
  )
}
