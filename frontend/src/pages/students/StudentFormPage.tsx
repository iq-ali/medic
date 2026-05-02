import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { studentsService } from '@/services/students.service'

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  dateOfBirth: z.string().min(1, 'Date of birth required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  grade: z.string().min(1, 'Grade required'),
  disabilityType: z.enum(['PHYSICAL', 'COGNITIVE', 'SENSORY', 'SPEECH', 'EMOTIONAL', 'MULTIPLE', 'OTHER']),
  disabilitySeverity: z.string().optional(),
  diagnosisDate: z.string().optional(),
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

export function StudentFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(isEdit)
  const [existingStudentId, setExistingStudentId] = useState<string>('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!id) return
    studentsService
      .getOne(id)
      .then(({ student: s }) => {
        setExistingStudentId(s.studentId)
        reset({
          firstName: s.firstName,
          lastName: s.lastName,
          dateOfBirth: s.dateOfBirth.split('T')[0],
          gender: s.gender,
          grade: s.grade,
          disabilityType: s.disabilityType,
          disabilitySeverity: s.disabilitySeverity ?? '',
          diagnosisDate: s.diagnosisDate ? s.diagnosisDate.split('T')[0] : '',
        })
        setLoadingData(false)
      })
      .catch(() => {
        navigate('/students')
      })
  }, [id, reset, navigate])

  async function onSubmit(data: FormData) {
    setServerError(null)
    const payload = {
      ...data,
      disabilitySeverity: data.disabilitySeverity || undefined,
      diagnosisDate: data.diagnosisDate || undefined,
    }

    try {
      if (isEdit && id) {
        await studentsService.update(id, payload)
        navigate(`/students/${id}`)
      } else {
        const { student } = await studentsService.create(payload)
        navigate(`/students/${student.id}`)
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(isEdit && id ? `/students/${id}` : '/students')}
        >
          <ArrowLeft />
        </Button>
        <h2 className="text-xl font-semibold tracking-tight">
          {isEdit ? 'Edit Student' : 'New Student'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First Name">
            <Input
              placeholder="John"
              aria-invalid={!!errors.firstName}
              {...register('firstName')}
            />
            <FieldError message={errors.firstName?.message} />
          </Field>
          <Field label="Last Name">
            <Input
              placeholder="Doe"
              aria-invalid={!!errors.lastName}
              {...register('lastName')}
            />
            <FieldError message={errors.lastName?.message} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isEdit && (
            <Field label="Student ID">
              <Input value={existingStudentId} disabled className="font-mono" />
            </Field>
          )}
          <Field label="Grade">
            <Input
              placeholder="Grade 5"
              aria-invalid={!!errors.grade}
              {...register('grade')}
            />
            <FieldError message={errors.grade?.message} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date of Birth">
            <Input
              type="date"
              aria-invalid={!!errors.dateOfBirth}
              {...register('dateOfBirth')}
            />
            <FieldError message={errors.dateOfBirth?.message} />
          </Field>
          <Field label="Gender">
            <Select aria-invalid={!!errors.gender} {...register('gender')}>
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </Select>
            <FieldError message={errors.gender?.message} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Disability Type">
            <Select aria-invalid={!!errors.disabilityType} {...register('disabilityType')}>
              <option value="">Select type</option>
              <option value="PHYSICAL">Physical</option>
              <option value="COGNITIVE">Cognitive</option>
              <option value="SENSORY">Sensory</option>
              <option value="SPEECH">Speech</option>
              <option value="EMOTIONAL">Emotional</option>
              <option value="MULTIPLE">Multiple</option>
              <option value="OTHER">Other</option>
            </Select>
            <FieldError message={errors.disabilityType?.message} />
          </Field>
          <Field label="Severity (optional)">
            <Input placeholder="e.g. Moderate" {...register('disabilitySeverity')} />
          </Field>
        </div>

        <Field label="Diagnosis Date (optional)">
          <Input type="date" {...register('diagnosisDate')} className="w-full sm:w-48" />
        </Field>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <div className="flex gap-3 pt-1 flex-wrap">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Student'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit && id ? `/students/${id}` : '/students')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
