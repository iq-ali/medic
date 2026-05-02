import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { appointmentsService } from '@/services/appointments.service'
import { studentsService } from '@/services/students.service'
import { staffService } from '@/services/staff.service'
import type { Student } from '@/types/student'
import type { Staff } from '@/types/staff'

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  scheduledAt: z.string().min(1, 'Date and time required'),
  durationMin: z.coerce.number().int().min(5, 'Minimum 5 minutes'),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED']),
  location: z.string().optional(),
  notes: z.string().optional(),
  studentId: z.string().min(1, 'Student required'),
  staffId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function toDateTimeLocal(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 16)
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

export function AppointmentFormPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const preselectedStudentId = searchParams.get('studentId')

  const [serverError, setServerError] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [staff, setStaff] = useState<Staff[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const now = toDateTimeLocal(new Date().toISOString())

    const loadOptions = Promise.all([
      studentsService.list({ pageSize: 200 }),
      staffService.list(),
    ])

    if (isEdit && id) {
      Promise.all([loadOptions, appointmentsService.getOne(id)])
        .then(([[{ students: s }, { staff: st }], { appointment: a }]) => {
          setStudents(s)
          setStaff(st)
          reset({
            title: a.title,
            description: a.description ?? '',
            scheduledAt: toDateTimeLocal(a.scheduledAt),
            durationMin: a.durationMin,
            status: a.status,
            location: a.location ?? '',
            notes: a.notes ?? '',
            studentId: a.studentId,
            staffId: a.staffId ?? '',
          })
        })
        .catch(() => navigate('/appointments'))
        .finally(() => setLoadingData(false))
    } else {
      loadOptions
        .then(([{ students: s }, { staff: st }]) => {
          setStudents(s)
          setStaff(st)
          reset({
            scheduledAt: now,
            durationMin: 60,
            status: 'SCHEDULED',
            studentId: preselectedStudentId ?? '',
            staffId: '',
          })
        })
        .catch(() => {})
        .finally(() => setLoadingData(false))
    }
  }, [id, isEdit, preselectedStudentId, reset, navigate])

  async function onSubmit(data: FormData) {
    setServerError(null)
    const payload = {
      ...data,
      description: data.description || undefined,
      location: data.location || undefined,
      notes: data.notes || undefined,
      staffId: data.staffId || null,
    }
    try {
      if (isEdit && id) {
        await appointmentsService.update(id, payload)
        navigate(`/appointments/${id}`)
      } else {
        const { appointment } = await appointmentsService.create(payload)
        navigate(`/appointments/${appointment.id}`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <h2 className="text-xl font-semibold tracking-tight">
          {isEdit ? 'Edit Appointment' : 'Schedule Appointment'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title">
          <Input
            placeholder="e.g. Physiotherapy Session"
            aria-invalid={!!errors.title}
            {...register('title')}
          />
          <FieldError message={errors.title?.message} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date & Time">
            <Input
              type="datetime-local"
              aria-invalid={!!errors.scheduledAt}
              {...register('scheduledAt')}
            />
            <FieldError message={errors.scheduledAt?.message} />
          </Field>
          <Field label="Duration (minutes)">
            <Input
              type="number"
              min={5}
              step={5}
              aria-invalid={!!errors.durationMin}
              {...register('durationMin')}
            />
            <FieldError message={errors.durationMin?.message} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Student">
            <Select
              aria-invalid={!!errors.studentId}
              disabled={!!preselectedStudentId && !isEdit}
              {...register('studentId')}
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.studentId})
                </option>
              ))}
            </Select>
            <FieldError message={errors.studentId?.message} />
          </Field>
          <Field label="Staff (optional)">
            <Select {...register('staffId')}>
              <option value="">None</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                  {s.specialty ? ` — ${s.specialty}` : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <Select aria-invalid={!!errors.status} {...register('status')}>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="MISSED">Missed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </Field>
          <Field label="Location (optional)">
            <Input placeholder="e.g. Room 204" {...register('location')} />
          </Field>
        </div>

        <Field label="Description (optional)">
          <Textarea placeholder="Brief description…" rows={3} {...register('description')} />
        </Field>

        <Field label="Notes (optional)">
          <Textarea placeholder="Additional notes…" rows={2} {...register('notes')} />
        </Field>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Schedule'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
