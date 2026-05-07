import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254, 'Email is too long'),
  password: z.string().min(1, 'Password is required').max(72, 'Password is too long'),
  agreed: z.literal(true, { message: 'You must agree to the Terms of Service' }),
})

const twoFASchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
})

type LoginFormData = z.infer<typeof loginSchema>
type TwoFAFormData = z.infer<typeof twoFASchema>

// ─── Terms text ──────────────────────────────────────────────────────────────

const TERMS = `EduPal is a disability support platform for education professionals. By signing in you agree to handle all student and staff data in accordance with applicable privacy regulations, including FERPA and HIPAA where relevant. You agree not to share credentials, access data outside your authorized scope, or use the platform for purposes other than supporting students under your care. EduPal reserves the right to revoke access for violations of these terms.`

// ─── Component ───────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [serverError, setServerError] = useState<string | null>(null)
  const [termsOpen, setTermsOpen] = useState(false)

  // 2FA step
  const [twoFAToken, setTwoFAToken] = useState<string | null>(null)
  const [twoFAError, setTwoFAError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema), mode: 'onBlur' })

  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    formState: { errors: errors2FA, isSubmitting: isSubmitting2FA },
  } = useForm<TwoFAFormData>({ resolver: zodResolver(twoFASchema) })

  const agreed = watch('agreed')

  async function onSubmit(data: LoginFormData) {
    setServerError(null)
    try {
      const result = await authService.login({ email: data.email, password: data.password })

      if ('requires2FA' in result) {
        setTwoFAToken(result.twoFAToken)
        return
      }

      const { token, user } = result
      setAuth(user, token)
      navigate('/dashboard')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  async function onSubmit2FA(data: TwoFAFormData) {
    if (!twoFAToken) return
    setTwoFAError(null)
    try {
      const { token, user } = await authService.completeTwoFA({ twoFAToken, code: data.code })
      setAuth(user, token)
      navigate('/dashboard')
    } catch (err) {
      setTwoFAError(err instanceof Error ? err.message : 'Invalid code')
    }
  }

  // ─── 2FA step ──────────────────────────────────────────────────────────────

  if (twoFAToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm space-y-8 px-4"
        >
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Two-factor authentication</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>

          <form onSubmit={handleSubmit2FA(onSubmit2FA)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="code" className="text-sm font-medium">
                Authentication code
              </label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                aria-invalid={!!errors2FA.code}
                {...register2FA('code')}
              />
              {errors2FA.code && (
                <p className="text-xs text-destructive">{errors2FA.code.message}</p>
              )}
            </div>

            {twoFAError && (
              <p className="text-sm text-destructive text-center">{twoFAError}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting2FA}>
              {isSubmitting2FA ? 'Verifying…' : 'Verify'}
            </Button>

            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setTwoFAToken(null)}
            >
              Back to login
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  // ─── Login step ────────────────────────────────────────────────────────────

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
          <p className="text-sm text-muted-foreground font-medium">Learn. Support. Thrive.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Terms of Service */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <button
              type="button"
              className="flex items-center justify-between w-full text-sm font-medium text-left"
              onClick={() => setTermsOpen((o) => !o)}
              aria-expanded={termsOpen}
            >
              Terms of Service
              <span className="text-muted-foreground text-xs">{termsOpen ? '▲ hide' : '▼ read'}</span>
            </button>

            {termsOpen && (
              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-2">
                {TERMS}
              </p>
            )}

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 accent-primary"
                {...register('agreed')}
              />
              <span className="text-xs text-muted-foreground">
                I agree to the Terms of Service
              </span>
            </label>
            {errors.agreed && (
              <p className="text-xs text-destructive">{errors.agreed.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive text-center">{serverError}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || !agreed}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New to EduPal?{' '}
          <Link to="/signup" className="font-medium text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
