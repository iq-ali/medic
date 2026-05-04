import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminService } from '@/services/admin.service'
import { sectionContainerVariants, sectionVariants } from '@/lib/animations'
import type { PendingRecordsResponse, PendingStudent, PendingMedicalRecord, PendingAppointment } from '@/services/admin.service'

type RecordType = 'students' | 'medical' | 'appointments'

function submitterLabel(record: { submittedBy: { firstName: string | null; lastName: string | null; email: string; role: string } | null }) {
  if (!record.submittedBy) return null
  const { firstName, lastName, email, role } = record.submittedBy
  const name = firstName && lastName ? `${firstName} ${lastName}` : email
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase()
  return `${name} (${roleLabel})`
}

interface SectionProps {
  title: string
  description: string
  count: number
  children: React.ReactNode
}

function Section({ title, description, count, children }: SectionProps) {
  return (
    <motion.div variants={sectionVariants} className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {count === 0 ? 'Nothing pending' : `${count} awaiting approval`}
        </p>
        {description && count === 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {count === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          All caught up.
        </div>
      ) : (
        <ul className="divide-y divide-border">{children}</ul>
      )}
    </motion.div>
  )
}

export function PendingRecordsPage() {
  const [data, setData] = useState<PendingRecordsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionIds, setActionIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    adminService.getPendingRecords()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  async function handleApprove(type: RecordType, id: string) {
    setActionIds((s) => new Set(s).add(id))
    try {
      await adminService.approveRecord(type, id)
      setData((prev) => prev ? removeRecord(prev, type, id) : prev)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setActionIds((s) => { const n = new Set(s); n.delete(id); return n })
    }
  }

  async function handleReject(type: RecordType, id: string) {
    setActionIds((s) => new Set(s).add(id))
    try {
      await adminService.rejectRecord(type, id)
      setData((prev) => prev ? removeRecord(prev, type, id) : prev)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setActionIds((s) => { const n = new Set(s); n.delete(id); return n })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const students = data?.students ?? []
  const medicalRecords = data?.medicalRecords ?? []
  const appointments = data?.appointments ?? []

  return (
    <motion.div
      variants={sectionContainerVariants}
      initial="initial"
      animate="animate"
      className="max-w-2xl mx-auto space-y-6 p-4 md:p-6"
    >
      <motion.div variants={sectionVariants}>
        <h1 className="text-2xl font-bold tracking-tight">Pending records</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Records submitted by non-admin users awaiting your approval
        </p>
      </motion.div>

      {error && (
        <motion.p variants={sectionVariants} className="text-sm text-destructive">{error}</motion.p>
      )}

      <Section title="Students" description="Student profiles submitted by staff" count={students.length}>
        {students.map((s: PendingStudent) => (
          <RecordRow
            key={s.id}
            id={s.id}
            primary={`${s.firstName} ${s.lastName}`}
            secondary={`ID: ${s.studentId}`}
            meta={submitterLabel(s)}
            date={s.createdAt}
            busy={actionIds.has(s.id)}
            onApprove={() => handleApprove('students', s.id)}
            onReject={() => handleReject('students', s.id)}
          />
        ))}
      </Section>

      <Section title="Medical records" description="Diagnoses submitted by staff" count={medicalRecords.length}>
        {medicalRecords.map((r: PendingMedicalRecord) => (
          <RecordRow
            key={r.id}
            id={r.id}
            primary={r.title}
            secondary={`${r.student.firstName} ${r.student.lastName}`}
            meta={submitterLabel(r)}
            date={r.createdAt}
            busy={actionIds.has(r.id)}
            onApprove={() => handleApprove('medical', r.id)}
            onReject={() => handleReject('medical', r.id)}
          />
        ))}
      </Section>

      <Section title="Appointments" description="Appointments submitted by staff" count={appointments.length}>
        {appointments.map((a: PendingAppointment) => (
          <RecordRow
            key={a.id}
            id={a.id}
            primary={a.title}
            secondary={`${a.student.firstName} ${a.student.lastName}`}
            meta={submitterLabel(a)}
            date={a.scheduledAt}
            busy={actionIds.has(a.id)}
            onApprove={() => handleApprove('appointments', a.id)}
            onReject={() => handleReject('appointments', a.id)}
          />
        ))}
      </Section>
    </motion.div>
  )
}

function removeRecord(prev: PendingRecordsResponse, type: RecordType, id: string): PendingRecordsResponse {
  if (type === 'students') return { ...prev, students: prev.students.filter((s) => s.id !== id) }
  if (type === 'medical') return { ...prev, medicalRecords: prev.medicalRecords.filter((r) => r.id !== id) }
  return { ...prev, appointments: prev.appointments.filter((a) => a.id !== id) }
}

interface RecordRowProps {
  id: string
  primary: string
  secondary?: string
  meta: string | null
  date: string
  busy: boolean
  onApprove: () => void
  onReject: () => void
}

function RecordRow({ primary, secondary, meta, date, busy, onApprove, onReject }: RecordRowProps) {
  return (
    <li className="flex items-center gap-3 px-5 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{primary}</p>
        {secondary && <p className="text-xs text-muted-foreground truncate">{secondary}</p>}
        <p className="text-xs text-muted-foreground">
          {meta && <span>{meta} · </span>}
          {new Date(date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onApprove}
          disabled={busy}
          className="gap-1.5"
        >
          <CheckCircle className="size-3.5" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onReject}
          disabled={busy}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <XCircle className="size-3.5" />
          Reject
        </Button>
      </div>
    </li>
  )
}
