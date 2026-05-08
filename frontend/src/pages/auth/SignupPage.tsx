import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'
import { useState } from 'react'

const ROLES = ['DOCTOR', 'THERAPIST', 'TEACHER', 'PARENT', 'STUDENT'] as const

const NAME_RE = /^[\p{L}\s'.\-]+$/u
const PHONE_RE = /^[+\d\s\-()\[\]]+$/

const schema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name is required')
      .max(50, 'Too long')
      .regex(NAME_RE, 'Letters, spaces, hyphens and apostrophes only'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .max(50, 'Too long')
      .regex(NAME_RE, 'Letters, spaces, hyphens and apostrophes only'),
    role: z.enum(ROLES, { error: 'Please select a role' }),
    email: z.string().trim().email('Enter a valid email address').max(254, 'Email is too long'),
    phone: z
      .string()
      .trim()
      .max(20, 'Too long')
      .refine((val) => !val || PHONE_RE.test(val), 'Digits, spaces, +, -, ( ) only')
      .optional(),
    password: z.string().min(8, 'Must be at least 8 characters').max(72, 'Too long'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function SignupPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur' })

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const result = await authService.signup({
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
      })
      if (result.autoApproved) {
        navigate('/login')
      } else {
        setPendingApproval(true)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Signup failed')
    }
  }

  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm space-y-6 px-4 text-center"
        >
          <div className="size-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
            <span className="text-2xl">⏳</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Awaiting approval</h1>
            <p className="text-sm text-muted-foreground">
              Your account has been submitted and is pending administrator approval.
              You will be able to sign in once your account is approved.
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
              <Input id="firstName" placeholder="Jane" autoComplete="given-name" aria-invalid={!!errors.firstName} {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
              <Input id="lastName" placeholder="Smith" autoComplete="family-name" aria-invalid={!!errors.lastName} {...register('lastName')} />
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
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input id="phone" type="tel" placeholder="+1 555 000 0000" autoComplete="tel" inputMode="tel" aria-invalid={!!errors.phone} {...register('phone')} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
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
