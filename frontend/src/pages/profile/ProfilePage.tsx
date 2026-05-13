import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ShieldCheck, ShieldOff, KeyRound, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth'
import { sectionContainerVariants, sectionVariants } from '@/lib/animations'
import type { Setup2FAResponse } from '@/types/auth'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
})

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

type ProfileFormData = z.infer<typeof profileSchema>
type PwFormData = z.infer<typeof pwSchema>
type Disable2FAData = z.infer<typeof disable2FASchema>
type Verify2FAData = z.infer<typeof verify2FASchema>

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const isAdmin = user?.role === 'ADMIN'

  // Profile editing state
  const [pendingProfile, setPendingProfile] = useState<ProfileFormData | null>(null)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [confirmingProfile, setConfirmingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Password change state
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  // 2FA state
  const [setup2FAData, setSetup2FAData] = useState<Setup2FAResponse | null>(null)
  const [twoFAActionError, setTwoFAActionError] = useState<string | null>(null)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
    },
  })

  const pwForm = useForm<PwFormData>({ resolver: zodResolver(pwSchema) })
  const disable2FAForm = useForm<Disable2FAData>({ resolver: zodResolver(disable2FASchema) })
  const verify2FAForm = useForm<Verify2FAData>({ resolver: zodResolver(verify2FASchema) })

  // Profile: store pending data and show modal
  function onProfileFormSubmit(data: ProfileFormData) {
    setProfileSuccess(false)
    setConfirmError(null)
    setConfirmPassword('')
    setPendingProfile(data)
  }

  // Profile: called when user confirms with password in the modal
  async function onConfirmProfile() {
    if (!pendingProfile) return
    setConfirmError(null)
    setConfirmingProfile(true)
    try {
      const { user: updated } = await authService.updateProfile({
        ...pendingProfile,
        password: confirmPassword,
      })
      updateUser({ firstName: updated.firstName, lastName: updated.lastName, email: updated.email })
      setPendingProfile(null)
      setConfirmPassword('')
      setProfileSuccess(true)
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setConfirmingProfile(false)
    }
  }

  async function onChangePassword(data: PwFormData) {
    setPwError(null)
    setPwSuccess(false)
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
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
    <>
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

        {/* Personal Information — admin only */}
        {isAdmin && (
          <motion.div variants={sectionVariants} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Personal information</h2>
            </div>

            <form onSubmit={profileForm.handleSubmit(onProfileFormSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">First name</label>
                  <Input
                    placeholder="First name"
                    aria-invalid={!!profileForm.formState.errors.firstName}
                    {...profileForm.register('firstName')}
                  />
                  {profileForm.formState.errors.firstName && (
                    <p className="text-xs text-destructive">
                      {profileForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Last name</label>
                  <Input
                    placeholder="Last name"
                    aria-invalid={!!profileForm.formState.errors.lastName}
                    {...profileForm.register('lastName')}
                  />
                  {profileForm.formState.errors.lastName && (
                    <p className="text-xs text-destructive">
                      {profileForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="admin@edupal.org"
                  aria-invalid={!!profileForm.formState.errors.email}
                  {...profileForm.register('email')}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Must remain on the @edupal.org domain</p>
              </div>

              {profileSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">Profile updated.</p>
              )}

              <Button type="submit">Save changes</Button>
            </form>
          </motion.div>
        )}

        {/* Change Password */}
        <motion.div variants={sectionVariants} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Change password</h2>
          </div>

          <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Current password</label>
              <PasswordInput
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
              <PasswordInput
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
              <PasswordInput
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

      {/* Password confirmation modal */}
      {pendingProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPendingProfile(null)
              setConfirmPassword('')
              setConfirmError(null)
            }
          }}
        >
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm space-y-4 shadow-xl">
            <div>
              <h3 className="text-base font-semibold">Confirm your identity</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your current password to save these changes.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Current password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                autoFocus
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onConfirmProfile()
                }}
              />
              {confirmError && <p className="text-xs text-destructive">{confirmError}</p>}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setPendingProfile(null)
                  setConfirmPassword('')
                  setConfirmError(null)
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={confirmingProfile || !confirmPassword}
                onClick={onConfirmProfile}
              >
                {confirmingProfile ? 'Saving…' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
