import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { staffService } from '@/services/staff.service'

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  specialty: z.string().optional(),
  phone: z.string().optional(),
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

export function StaffFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(isEdit)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!id) return
    staffService
      .getOne(id)
      .then(({ staff: s }) => {
        reset({
          firstName: s.firstName,
          lastName: s.lastName,
          specialty: s.specialty ?? '',
          phone: s.phone ?? '',
        })
        setLoadingData(false)
      })
      .catch(() => navigate('/staff'))
  }, [id, reset, navigate])

  async function onSubmit(data: FormData) {
    setServerError(null)
    const payload = {
      ...data,
      specialty: data.specialty || undefined,
      phone: data.phone || undefined,
    }
    try {
      if (isEdit && id) {
        await staffService.update(id, payload)
        navigate(`/staff/${id}`)
      } else {
        const { staff } = await staffService.create(payload)
        navigate(`/staff/${staff.id}`)
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
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(isEdit && id ? `/staff/${id}` : '/staff')}
        >
          <ArrowLeft />
        </Button>
        <h2 className="text-xl font-semibold tracking-tight">
          {isEdit ? 'Edit Staff Member' : 'New Staff Member'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name">
            <Input
              placeholder="Jane"
              aria-invalid={!!errors.firstName}
              {...register('firstName')}
            />
            <FieldError message={errors.firstName?.message} />
          </Field>
          <Field label="Last Name">
            <Input
              placeholder="Smith"
              aria-invalid={!!errors.lastName}
              {...register('lastName')}
            />
            <FieldError message={errors.lastName?.message} />
          </Field>
        </div>

        <Field label="Specialty (optional)">
          <Input placeholder="e.g. Physiotherapy" {...register('specialty')} />
        </Field>

        <Field label="Phone (optional)">
          <Input placeholder="+1 234 567 8900" {...register('phone')} />
        </Field>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Staff Member'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit && id ? `/staff/${id}` : '/staff')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
