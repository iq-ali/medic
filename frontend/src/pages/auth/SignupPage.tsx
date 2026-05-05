import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'

const ROLES = ['DOCTOR', 'THERAPIST', 'TEACHER', 'PARENT', 'STUDENT'] as const

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(ROLES, { error: 'Please select a role' }),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function SignupPage() {
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      await authService.signup(data)
      setSuccess(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Signup failed')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm space-y-6 px-4 text-center"
        >
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-2xl text-primary font-bold">✓</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Request submitted</h1>
            <p className="text-sm text-muted-foreground">
              Your account is pending admin approval. Once approved, you'll receive an email with a link to set up your password.
            </p>
          </div>
          <Link to="/login" className="inline-block text-sm font-medium text-foreground hover:underline">
            Back to sign in
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm space-y-8 px-4"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">EduPal</h1>
          <p className="text-sm text-muted-foreground font-medium">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className="text-sm font-medium">First name</label>
              <Input id="firstName" placeholder="Jane" aria-invalid={!!errors.firstName} {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
              <Input id="lastName" placeholder="Smith" aria-invalid={!!errors.lastName} {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="role" className="text-sm font-medium">Role</label>
            <select
              id="role"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              {...register('role')}
            >
              <option value="">Select a role…</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input id="phone" type="tel" placeholder="+1 555 000 0000" {...register('phone')} />
          </div>

          {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Request account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
