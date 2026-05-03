import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ShieldCheck, ShieldOff, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth'
import { sectionContainerVariants, sectionVariants } from '@/lib/animations'
import type { Setup2FAResponse } from '@/types/auth'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

const disable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

const verify2FASchema = z.object({
  code: z.string().length(6, 'Must be 6 digits'),
})

type PwFormData = z.infer<typeof pwSchema>
type Disable2FAData = z.infer<typeof disable2FASchema>
type Verify2FAData = z.infer<typeof verify2FASchema>

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const [setup2FAData, setSetup2FAData] = useState<Setup2FAResponse | null>(null)
  const [twoFAActionError, setTwoFAActionError] = useState<string | null>(null)

  const pwForm = useForm<PwFormData>({ resolver: zodResolver(pwSchema) })
  const disable2FAForm = useForm<Disable2FAData>({ resolver: zodResolver(disable2FASchema) })
  const verify2FAForm = useForm<Verify2FAData>({ resolver: zodResolver(verify2FASchema) })

  async function onChangePassword(data: PwFormData) {
    setPwError(null)
    setPwSuccess(false)
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      updateUser({ mustChangePassword: false })
      setPwSuccess(true)
      pwForm.reset()
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function onSetup2FA() {
    setTwoFAActionError(null)
    try {
      const data = await authService.setup2FA()
      setSetup2FAData(data)
      verify2FAForm.reset()
    } catch (err) {
      setTwoFAActionError(err instanceof Error ? err.message : 'Failed to set up 2FA')
    }
  }

  async function onVerify2FA(data: Verify2FAData) {
    setTwoFAActionError(null)
    try {
      await authService.verify2FA(data.code)
      updateUser({ twoFAEnabled: true })
      setSetup2FAData(null)
      verify2FAForm.reset()
    } catch (err) {
      setTwoFAActionError(err instanceof Error ? err.message : 'Invalid code')
    }
  }

  async function onDisable2FA(data: Disable2FAData) {
    setTwoFAActionError(null)
    try {
      await authService.disable2FA(data.password)
      updateUser({ twoFAEnabled: false })
      disable2FAForm.reset()
    } catch (err) {
      setTwoFAActionError(err instanceof Error ? err.message : 'Failed to disable 2FA')
    }
  }

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email ?? ''

  return (
    <motion.div
      variants={sectionContainerVariants}
      initial="initial"
      animate="animate"
      className="max-w-xl mx-auto space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <motion.div variants={sectionVariants}>
        <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
      </motion.div>

      {/* Change Password */}
      <motion.div variants={sectionVariants} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Change password</h2>
        </div>

        <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Current password</label>
            <Input
              type="password"
              placeholder="••••••••"
              aria-invalid={!!pwForm.formState.errors.currentPassword}
              {...pwForm.register('currentPassword')}
            />
            {pwForm.formState.errors.currentPassword && (
              <p className="text-xs text-destructive">
                {pwForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">New password</label>
            <Input
              type="password"
              placeholder="••••••••"
              aria-invalid={!!pwForm.formState.errors.newPassword}
              {...pwForm.register('newPassword')}
            />
            {pwForm.formState.errors.newPassword && (
              <p className="text-xs text-destructive">
                {pwForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm new password</label>
            <Input
              type="password"
              placeholder="••••••••"
              aria-invalid={!!pwForm.formState.errors.confirmPassword}
              {...pwForm.register('confirmPassword')}
            />
            {pwForm.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {pwForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          {pwSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">Password updated successfully.</p>
          )}

          <Button type="submit" disabled={pwForm.formState.isSubmitting}>
            {pwForm.formState.isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </motion.div>

      {/* 2FA */}
      <motion.div variants={sectionVariants} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          {user?.twoFAEnabled ? (
            <ShieldCheck className="size-4 text-green-500" />
          ) : (
            <ShieldOff className="size-4 text-muted-foreground" />
          )}
          <h2 className="text-base font-semibold">Two-factor authentication</h2>
          {user?.twoFAEnabled && (
            <span className="ml-auto text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
              Enabled
            </span>
          )}
        </div>

        {!user?.twoFAEnabled && !setup2FAData && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security with an authenticator app like Google Authenticator or Authy.
            </p>
            {twoFAActionError && <p className="text-sm text-destructive">{twoFAActionError}</p>}
            <Button variant="outline" onClick={onSetup2FA}>
              Set up 2FA
            </Button>
          </div>
        )}

        {!user?.twoFAEnabled && setup2FAData && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.
            </p>
            <div className="flex justify-center">
              <img
                src={setup2FAData.qrCode}
                alt="2FA QR Code"
                className="size-44 rounded-lg border border-border"
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Manual entry key</p>
              <p className="text-xs font-mono break-all">{setup2FAData.secret}</p>
            </div>
            <form onSubmit={verify2FAForm.handleSubmit(onVerify2FA)} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Verification code</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  aria-invalid={!!verify2FAForm.formState.errors.code}
                  {...verify2FAForm.register('code')}
                />
                {verify2FAForm.formState.errors.code && (
                  <p className="text-xs text-destructive">
                    {verify2FAForm.formState.errors.code.message}
                  </p>
                )}
              </div>
              {twoFAActionError && <p className="text-sm text-destructive">{twoFAActionError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={verify2FAForm.formState.isSubmitting}>
                  {verify2FAForm.formState.isSubmitting ? 'Verifying…' : 'Enable 2FA'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSetup2FAData(null)
                    setTwoFAActionError(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {user?.twoFAEnabled && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter your current password to disable two-factor authentication.
            </p>
            <form onSubmit={disable2FAForm.handleSubmit(onDisable2FA)} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Current password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  aria-invalid={!!disable2FAForm.formState.errors.password}
                  {...disable2FAForm.register('password')}
                />
                {disable2FAForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {disable2FAForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              {twoFAActionError && <p className="text-sm text-destructive">{twoFAActionError}</p>}
              <Button
                type="submit"
                variant="destructive"
                disabled={disable2FAForm.formState.isSubmitting}
              >
                {disable2FAForm.formState.isSubmitting ? 'Disabling…' : 'Disable 2FA'}
              </Button>
            </form>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
