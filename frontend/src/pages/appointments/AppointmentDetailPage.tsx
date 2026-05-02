import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { appointmentsService } from '@/services/appointments.service'
import { useAuth } from '@/hooks/useAuth'
import { STATUS_LABELS, STATUS_CLASSES } from '@/types/appointment'
import { sectionContainerVariants, sectionVariants } from '@/lib/animations'
import type { Appointment, AppointmentStatus } from '@/types/appointment'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<AppointmentStatus | ''>('')
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    if (!id) return
    appointmentsService
      .getOne(id)
      .then(({ appointment: a }) => {
        setAppointment(a)
        setPendingStatus(a.status)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  async function handleStatusSave() {
    if (!id || !pendingStatus || pendingStatus === appointment?.status) return
    setSavingStatus(true)
    try {
      const { appointment: updated } = await appointmentsService.update(id, {
        status: pendingStatus as AppointmentStatus,
      })
      setAppointment(updated)
      setPendingStatus(updated.status)
    } catch {
      setPendingStatus(appointment?.status ?? 'SCHEDULED')
    } finally {
      setSavingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (notFound || !appointment) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Appointment not found.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/appointments')}>
            Back to Appointments
          </Button>
        </div>
      </div>
    )
  }

  const canWrite =
    user?.role === 'ADMIN' || user?.role === 'DOCTOR' || user?.role === 'THERAPIST'
  const statusChanged = pendingStatus !== appointment.status

  return (
    <motion.div
      variants={sectionContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-3xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight truncate">{appointment.title}</h2>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(appointment.scheduledAt)}
            </p>
          </div>
        </div>
        {canWrite && (
          <Button size="sm" className="shrink-0" onClick={() => navigate(`/appointments/${id}/edit`)}>
            <Pencil />
            Edit
          </Button>
        )}
      </div>

      <motion.div variants={sectionVariants} className="rounded-xl border border-border px-4 sm:px-5">
        <h3 className="text-sm font-semibold pt-4 pb-2">Details</h3>
        <dl>
          <InfoRow label="Date & Time" value={formatDateTime(appointment.scheduledAt)} />
          <InfoRow label="Duration" value={`${appointment.durationMin} minutes`} />
          <InfoRow label="Location" value={appointment.location} />
          <InfoRow
            label="Student"
            value={
              <button
                className="hover:underline text-left"
                onClick={() => navigate(`/students/${appointment.student.id}`)}
              >
                {appointment.student.firstName} {appointment.student.lastName}
                <span className="text-muted-foreground font-mono text-xs ml-1.5">
                  ({appointment.student.studentId})
                </span>
              </button>
            }
          />
          <InfoRow
            label="Staff"
            value={
              appointment.staff
                ? `${appointment.staff.firstName} ${appointment.staff.lastName}`
                : null
            }
          />
          <InfoRow
            label="Status"
            value={
              canWrite ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={pendingStatus}
                    onChange={(e) => setPendingStatus(e.target.value as AppointmentStatus)}
                    className="w-36 h-7 text-xs"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="MISSED">Missed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                  {statusChanged && (
                    <Button size="sm" onClick={handleStatusSave} disabled={savingStatus}>
                      {savingStatus ? 'Saving…' : 'Save'}
                    </Button>
                  )}
                </div>
              ) : (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[appointment.status]}`}
                >
                  {STATUS_LABELS[appointment.status]}
                </span>
              )
            }
          />
        </dl>
      </motion.div>

      {appointment.description && (
        <motion.div variants={sectionVariants} className="rounded-xl border border-border px-4 sm:px-5 pb-5">
          <h3 className="text-sm font-semibold pt-4 pb-3">Description</h3>
          <p className="text-sm whitespace-pre-line leading-relaxed">{appointment.description}</p>
        </motion.div>
      )}

      {appointment.notes && (
        <motion.div variants={sectionVariants} className="rounded-xl border border-border px-4 sm:px-5 pb-5">
          <h3 className="text-sm font-semibold pt-4 pb-3">Notes</h3>
          <p className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground">
            {appointment.notes}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
