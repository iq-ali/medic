import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { studentsService } from '@/services/students.service'
import { useAuth } from '@/hooks/useAuth'
import { usePasswordGate } from '@/hooks/usePasswordGate'
import { DISABILITY_LABELS, GENDER_LABELS } from '@/types/student'
import { STATUS_LABELS, STATUS_CLASSES } from '@/types/appointment'
import { sectionContainerVariants, sectionVariants } from '@/lib/animations'
import type { StudentWithRelations } from '@/types/student'
import type { AppointmentStatus } from '@/types/appointment'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function calcAge(dateStr: string): number {
  const dob = new Date(dateStr)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 grid grid-cols-1 gap-0.5 sm:grid-cols-3 sm:gap-4 border-b border-border last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm sm:col-span-2">{value ?? '—'}</dd>
    </div>
  )
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { gateAction, modal } = usePasswordGate()
  const [student, setStudent] = useState<StudentWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    studentsService
      .getOne(id)
      .then(({ student: s }) => setStudent(s))
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

  if (notFound || !student) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Student not found.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/students')}>
            Back to Students
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
    <motion.div
      variants={sectionContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-3xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/students')}>
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight truncate">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-xs font-mono text-muted-foreground">{student.studentId}</p>
          </div>
        </div>
        {user?.role === 'ADMIN' && (
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={gateAction(async () => navigate(`/students/${id}/edit`))}>
              <Pencil />
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={gateAction(async () => {
              await studentsService.remove(id!)
              navigate('/students')
            })}>
              <Trash2 />
              Delete
            </Button>
          </div>
        )}
      </div>

      <motion.div variants={sectionVariants} className="rounded-xl border border-border px-4 sm:px-5">
        <h3 className="text-sm font-semibold pt-4 pb-2">Personal Information</h3>
        <dl>
          <InfoRow label="Full Name" value={`${student.firstName} ${student.lastName}`} />
          <InfoRow label="Student ID" value={<span className="font-mono text-xs">{student.studentId}</span>} />
          <InfoRow
            label="Date of Birth"
            value={`${formatDate(student.dateOfBirth)} (age ${calcAge(student.dateOfBirth)})`}
          />
          <InfoRow label="Gender" value={GENDER_LABELS[student.gender]} />
          <InfoRow label="Grade" value={student.grade} />
          <InfoRow label="Disability Type" value={DISABILITY_LABELS[student.disabilityType]} />
          <InfoRow label="Severity" value={student.disabilitySeverity} />
          <InfoRow label="Diagnosis Date" value={formatDate(student.diagnosisDate)} />
        </dl>
      </motion.div>

      <motion.div variants={sectionVariants} className="rounded-xl border border-border px-4 sm:px-5">
        <div className="flex items-center justify-between pt-4 pb-2 gap-2 flex-wrap">
          <h3 className="text-sm font-semibold">
            Medical Records{' '}
            <span className="font-normal text-muted-foreground">
              ({student.medicalRecords.length}{student.medicalRecords.length === 5 ? '+' : ''})
            </span>
          </h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/medical?studentId=${id}`)}>
              View all
            </Button>
            {user?.role === 'ADMIN' || user?.role === 'DOCTOR' ? (
              <Button size="sm" onClick={() => navigate(`/medical/new?studentId=${id}`)}>
                Add record
              </Button>
            ) : null}
          </div>
        </div>
        {student.medicalRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground pb-4">No medical records.</p>
        ) : (
          <div className="divide-y divide-border pb-2">
            {student.medicalRecords.map((r) => (
              <div
                key={r.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 -mx-4 sm:-mx-5 px-4 sm:px-5 transition-colors cursor-pointer"
                onClick={() => navigate(`/medical/${r.id}`)}
              >
                <p className="text-sm font-medium truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.recordDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div variants={sectionVariants} className="rounded-xl border border-border px-4 sm:px-5">
        <div className="flex items-center justify-between pt-4 pb-2 gap-2 flex-wrap">
          <h3 className="text-sm font-semibold">
            Appointments{' '}
            <span className="font-normal text-muted-foreground">
              ({student.appointments.length}{student.appointments.length === 5 ? '+' : ''})
            </span>
          </h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/appointments?studentId=${id}`)}>
              View all
            </Button>
            {(user?.role === 'ADMIN' || user?.role === 'DOCTOR' || user?.role === 'THERAPIST') && (
              <Button size="sm" onClick={() => navigate(`/appointments/new?studentId=${id}`)}>
                Schedule
              </Button>
            )}
          </div>
        </div>
        {student.appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground pb-4">No appointments scheduled.</p>
        ) : (
          <div className="divide-y divide-border pb-2">
            {student.appointments.map((a) => (
              <div
                key={a.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 -mx-4 sm:-mx-5 px-4 sm:px-5 transition-colors cursor-pointer"
                onClick={() => navigate(`/appointments/${a.id}`)}
              >
                <p className="text-sm font-medium truncate">{a.title}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[a.status as AppointmentStatus]}`}
                  >
                    {STATUS_LABELS[a.status as AppointmentStatus]}
                  </span>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(a.scheduledAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div variants={sectionVariants} className="rounded-xl border border-border px-4 sm:px-5">
        <h3 className="text-sm font-semibold pt-4 pb-2">
          Guardians{' '}
          <span className="font-normal text-muted-foreground">({student.guardians.length})</span>
        </h3>
        {student.guardians.length === 0 ? (
          <p className="text-sm text-muted-foreground pb-4">No guardians recorded.</p>
        ) : (
          <div className="divide-y divide-border pb-2">
            {student.guardians.map((g) => (
              <div key={g.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {g.firstName} {g.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{g.relationship}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm">{g.phone}</p>
                  {g.email && <p className="text-xs text-muted-foreground">{g.email}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
    {modal}
    </>
  )
}
