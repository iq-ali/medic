import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { generateSecret, verifySync as otpVerifySync, generateURI } from 'otplib'
import qrcode from 'qrcode'
import { prisma } from '../prisma.js'
import { sendWelcomeEmail } from '../services/email.service.js'

// ─── Helpers ────────────────────────────────────────────────────────────────

function signToken(
  payload: Record<string, unknown>,
  expiresIn: string | number = '7d'
): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn } as jwt.SignOptions)
}

function userPayload(user: { id: string; email: string; role: string; firstName: string | null; lastName: string | null; twoFAEnabled: boolean }) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    twoFAEnabled: user.twoFAEnabled,
  }
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const signupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['DOCTOR', 'THERAPIST', 'TEACHER', 'PARENT', 'STUDENT']),
  email: z.string().email(),
  specialty: z.string().optional(),
  phone: z.string().optional(),
})

const setupAccountSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

const completeTwoFASchema = z.object({
  twoFAToken: z.string().min(1),
  code: z.string().min(1),
})

const verify2FASchema = z.object({
  code: z.string().min(1),
})

const disable2FASchema = z.object({
  password: z.string().min(1),
})

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password is required to confirm changes'),
})

// ─── Handlers ────────────────────────────────────────────────────────────────

export async function signup(req: Request, res: Response): Promise<void> {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request', errors: parsed.error.flatten() })
    return
  }

  const { firstName, lastName, role, email, specialty, phone } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ message: 'An account with this email already exists' })
    return
  }

  let settings = await prisma.adminSettings.findFirst()
  if (!settings) settings = await prisma.adminSettings.create({ data: {} })
  const autoApproved = settings.autoApproval

  const staffRoles = ['DOCTOR', 'THERAPIST', 'TEACHER'] as const
  const needsStaff = (staffRoles as readonly string[]).includes(role)

  await prisma.user.create({
    data: {
      email,
      password: null,
      role,
      firstName,
      lastName,
      status: autoApproved ? 'APPROVED' : 'PENDING',
      ...(needsStaff
        ? {
            staff: {
              create: {
                firstName,
                lastName,
                specialty: specialty ?? null,
                phone: phone ?? null,
              },
            },
          }
        : {}),
    },
  })

  const appUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:5173'

  try {
    await sendWelcomeEmail(email, { firstName, appUrl })
  } catch (err) {
    console.error('Failed to send welcome email:', err)
  }

  res.status(201).json({ message: 'Account request submitted', autoApproved })
}

export async function setupAccount(req: Request, res: Response): Promise<void> {
  const parsed = setupAccountSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return
  }

  const { token, password } = parsed.data

  const user = await prisma.user.findFirst({ where: { inviteToken: token } })
  if (!user || !user.inviteTokenExpiry || user.inviteTokenExpiry < new Date()) {
    res.status(400).json({ message: 'Invalid or expired setup link' })
    return
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, inviteToken: null, inviteTokenExpiry: null },
  })

  res.json({ message: 'Account set up — you can now sign in' })
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request' })
    return
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  if (user.status === 'PENDING') {
    res.status(401).json({ message: 'Your account is pending administrator approval' })
    return
  }

  if (!user.password) {
    res.status(401).json({ message: 'Account setup incomplete — check your email for a setup link' })
    return
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  if (user.twoFAEnabled && user.twoFASecret) {
    const twoFAToken = signToken({ id: user.id, type: '2fa' }, '15m')
    res.json({ requires2FA: true, twoFAToken })
    return
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role })
  res.json({ token, user: userPayload(user) })
}

export async function completeTwoFA(req: Request, res: Response): Promise<void> {
  const parsed = completeTwoFASchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request' })
    return
  }

  const { twoFAToken, code } = parsed.data

  let payload: { id: string; type: string }
  try {
    payload = jwt.verify(twoFAToken, process.env.JWT_SECRET!) as { id: string; type: string }
  } catch {
    res.status(401).json({ message: 'Invalid or expired 2FA token' })
    return
  }

  if (payload.type !== '2fa') {
    res.status(401).json({ message: 'Invalid token type' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user || !user.twoFASecret) {
    res.status(401).json({ message: 'Invalid token' })
    return
  }

  const valid = otpVerifySync({ token: code, secret: user.twoFASecret })
  if (!valid) {
    res.status(401).json({ message: 'Invalid 2FA code' })
    return
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role })
  res.json({ token, user: userPayload(user) })
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }
  res.json({ user: userPayload(user) })
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return
  }

  const { currentPassword, newPassword } = parsed.data
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user || !user.password) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    res.status(401).json({ message: 'Current password is incorrect' })
    return
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

  res.json({ message: 'Password changed' })
}

export async function setup2FA(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const secret = generateSecret()
  const otpauthUrl = generateURI({ label: `EduPal:${user.email}`, secret, issuer: 'EduPal' })
  const qrCode = await qrcode.toDataURL(otpauthUrl)

  await prisma.user.update({ where: { id: user.id }, data: { twoFASecret: secret } })

  res.json({ secret, qrCode })
}

export async function verify2FA(req: Request, res: Response): Promise<void> {
  const parsed = verify2FASchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user || !user.twoFASecret) {
    res.status(400).json({ message: '2FA setup not initiated' })
    return
  }

  const valid = otpVerifySync({ token: parsed.data.code, secret: user.twoFASecret })
  if (!valid) {
    res.status(401).json({ message: 'Invalid 2FA code' })
    return
  }

  await prisma.user.update({ where: { id: user.id }, data: { twoFAEnabled: true } })

  res.json({ message: '2FA enabled' })
}

export async function disable2FA(req: Request, res: Response): Promise<void> {
  const parsed = disable2FASchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user || !user.password) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password)
  if (!valid) {
    res.status(401).json({ message: 'Incorrect password' })
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFAEnabled: false, twoFASecret: null },
  })

  res.json({ message: '2FA disabled' })
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  if (req.user!.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden' })
    return
  }

  const parsed = updateProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return
  }

  const { firstName, lastName, email, password } = parsed.data
  const userId = req.user!.id

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing || !existing.password) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const valid = await bcrypt.compare(password, existing.password)
  if (!valid) {
    res.status(401).json({ message: 'Incorrect password' })
    return
  }

  const taken = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } })
  if (taken) {
    res.status(409).json({ message: 'Email already in use' })
    return
  }

  const user = await prisma.user.update({ where: { id: userId }, data: { firstName, lastName, email } })

  res.json({ user: userPayload(user) })
}

export async function verifyPassword(req: Request, res: Response): Promise<void> {
  const { password } = req.body as { password?: string }
  if (!password) {
    res.status(400).json({ message: 'Password required' })
    return
  }
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user || !user.password) {
    res.status(404).json({ message: 'User not found' })
    return
  }
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    res.status(401).json({ message: 'Incorrect password' })
    return
  }
  res.json({ verified: true })
}
