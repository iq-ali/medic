import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { medicalService } from '@/services/medical.service'
import { studentsService } from '@/services/students.service'
import { staffService } from '@/services/staff.service'
import { fadeUpVariants } from '@/lib/animations'
import type { Student } from '@/types/student'
import type { Staff } from '@/types/staff'

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().min(1, 'Description required'),
  recordDate: z.string().min(1, 'Date required'),
  hospital: z.string().optional(),
  notes: z.string().optional(),
  studentId: z.string().min(1, 'Student required'),
  doctorId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

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

export function MedicalFormPage() {
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
    const today = new Date().toISOString().split('T')[0]

    const loadOptions = Promise.all([
      studentsService.list({ pageSize: 200 }),
      staffService.list(),
    ])

    if (isEdit && id) {
      Promise.all([loadOptions, medicalService.getOne(id)])
        .then(([[{ students: s }, { staff: st }], { record }]) => {
          setStudents(s)
          setStaff(st)
          reset({
            title: record.title,
            description: record.description,
            recordDate: record.recordDate.split('T')[0],
            hospital: record.hospital ?? '',
            notes: record.notes ?? '',
            studentId: record.studentId,
            doctorId: record.doctorId ?? '',
          })
        })
        .catch(() => navigate('/medical'))
        .finally(() => setLoadingData(false))
    } else {
      loadOptions
        .then(([{ students: s }, { staff: st }]) => {
          setStudents(s)
          setStaff(st)
          reset({
            recordDate: today,
            studentId: preselectedStudentId ?? '',
            doctorId: '',
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
      hospital: data.hospital || undefined,
      notes: data.notes || undefined,
      doctorId: data.doctorId || null,
    }
    try {
      if (isEdit && id) {
        await medicalService.update(id, payload)
        navigate(`/medical/${id}`)
      } else {
        const { record } = await medicalService.create(payload)
        navigate(`/medical/${record.id}`)
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
    <motion.div variants={fadeUpVariants} initial="initial" animate="animate" className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <h2 className="text-xl font-semibold tracking-tight">
          {isEdit ? 'Edit Medical Record' : 'New Medical Record'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title">
          <Input
            placeholder="e.g. Annual Checkup"
            aria-invalid={!!errors.title}
            {...register('title')}
          />
          <FieldError message={errors.title?.message} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Record Date">
            <Input type="date" aria-invalid={!!errors.recordDate} {...register('recordDate')} />
            <FieldError message={errors.recordDate?.message} />
          </Field>
          <Field label="Hospital (optional)">
            <Input placeholder="e.g. City General Hospital" {...register('hospital')} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Field label="Doctor (optional)">
            <Select {...register('doctorId')}>
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

        <Field label="Description">
          <Textarea
            placeholder="Describe the medical record…"
            rows={4}
            aria-invalid={!!errors.description}
            {...register('description')}
          />
          <FieldError message={errors.description?.message} />
        </Field>

        <Field label="Notes (optional)">
          <Textarea placeholder="Additional notes…" rows={3} {...register('notes')} />
        </Field>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <div className="flex gap-3 pt-1 flex-wrap">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Record'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
