import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { authService } from '@/services/auth.service'

const schema = z
  .object({
    password: z.string().min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function SetupAccountPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3 px-4">
          <p className="text-sm text-destructive">Invalid setup link — no token found.</p>
          <Link to="/login" className="text-sm font-medium hover:underline">Back to sign in</Link>
        </div>
      </div>
    )
  }

  if (done) {
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
            <h1 className="text-2xl font-bold">Account ready</h1>
            <p className="text-sm text-muted-foreground">Your password has been set. You can now sign in.</p>
          </div>
          <Button className="w-full" onClick={() => navigate('/login')}>Sign in</Button>
        </motion.div>
      </div>
    )
  }

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      await authService.setupAccount(token!, data.password)
      setDone(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Setup failed')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm space-y-8 px-4"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">EduPal</h1>
          <p className="text-sm text-muted-foreground font-medium">Set up your account</p>
          <p className="text-xs text-muted-foreground">Choose a password to complete your account setup.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <PasswordInput id="password" placeholder="••••••••" autoFocus aria-invalid={!!errors.password} {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label>
            <PasswordInput id="confirmPassword" placeholder="••••••••" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Setting up…' : 'Set password'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
