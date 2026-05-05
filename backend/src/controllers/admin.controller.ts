import crypto from 'crypto'
import type { Request, Response } from 'express'
import { prisma } from '../prisma.js'
import { sendSetupEmail } from '../services/email.service.js'

export async function getPendingUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    where: { status: 'PENDING' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ users })
}

export async function approveUser(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] as string

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  const inviteToken = crypto.randomBytes(32).toString('hex')
  const inviteTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id },
    data: { status: 'APPROVED', inviteToken, inviteTokenExpiry },
  })

  if (user.firstName) {
    const appUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:5173'
    const setupUrl = `${appUrl}/setup-account?token=${inviteToken}`
    try {
      await sendSetupEmail(user.email, { firstName: user.firstName, setupUrl })
    } catch (err) {
      console.error('Failed to send setup email:', err)
    }
  }

  res.json({ message: 'User approved' })
}

export async function rejectUser(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] as string

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  await prisma.user.delete({ where: { id } })

  res.json({ message: 'User rejected and removed' })
}

export async function getSettings(_req: Request, res: Response): Promise<void> {
  let settings = await prisma.adminSettings.findFirst()
  if (!settings) {
    settings = await prisma.adminSettings.create({ data: {} })
  }
  res.json({ settings })
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const { autoApproval } = req.body as { autoApproval?: unknown }

  if (typeof autoApproval !== 'boolean') {
    res.status(400).json({ message: 'autoApproval must be a boolean' })
    return
  }

  let settings = await prisma.adminSettings.findFirst()
  if (!settings) {
    settings = await prisma.adminSettings.create({ data: { autoApproval } })
  } else {
    settings = await prisma.adminSettings.update({
      where: { id: settings.id },
      data: { autoApproval },
    })
  }

  res.json({ settings })
}

export async function getPendingRecords(_req: Request, res: Response): Promise<void> {
  const [students, medicalRecords, appointments] = await Promise.all([
    prisma.student.findMany({ where: { approvalStatus: 'PENDING' }, orderBy: { createdAt: 'asc' } }),
    prisma.medicalRecord.findMany({
      where: { approvalStatus: 'PENDING' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.appointment.findMany({
      where: { approvalStatus: 'PENDING' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        staff: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const submitterIds = [
    ...students.map((s) => s.submittedById),
    ...medicalRecords.map((r) => r.submittedById),
    ...appointments.map((a) => a.submittedById),
  ].filter((id): id is string => id !== null)

  const uniqueIds = [...new Set(submitterIds)]
  const submitters =
    uniqueIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueIds } },
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        })
      : []
  const submitterMap = Object.fromEntries(submitters.map((u) => [u.id, u]))

  res.json({
    students: students.map((s) => ({
      ...s,
      submittedBy: s.submittedById ? (submitterMap[s.submittedById] ?? null) : null,
    })),
    medicalRecords: medicalRecords.map((r) => ({
      ...r,
      submittedBy: r.submittedById ? (submitterMap[r.submittedById] ?? null) : null,
    })),
    appointments: appointments.map((a) => ({
      ...a,
      submittedBy: a.submittedById ? (submitterMap[a.submittedById] ?? null) : null,
    })),
  })
}

export async function approveRecord(req: Request, res: Response): Promise<void> {
  const { type, id } = req.params as { type: string; id: string }

  if (type === 'students') {
    const existing = await prisma.student.findUnique({ where: { id } })
    if (!existing) { res.status(404).json({ message: 'Not found' }); return }
    await prisma.student.update({ where: { id }, data: { approvalStatus: 'APPROVED' } })
  } else if (type === 'medical') {
    const existing = await prisma.medicalRecord.findUnique({ where: { id } })
    if (!existing) { res.status(404).json({ message: 'Not found' }); return }
    await prisma.medicalRecord.update({ where: { id }, data: { approvalStatus: 'APPROVED' } })
  } else if (type === 'appointments') {
    const existing = await prisma.appointment.findUnique({ where: { id } })
    if (!existing) { res.status(404).json({ message: 'Not found' }); return }
    await prisma.appointment.update({ where: { id }, data: { approvalStatus: 'APPROVED' } })
  } else {
    res.status(400).json({ message: 'Invalid record type' })
    return
  }

  res.json({ message: 'Approved' })
}

export async function rejectRecord(req: Request, res: Response): Promise<void> {
  const { type, id } = req.params as { type: string; id: string }

  if (type === 'students') {
    await prisma.student.deleteMany({ where: { id, approvalStatus: 'PENDING' } })
  } else if (type === 'medical') {
    await prisma.medicalRecord.deleteMany({ where: { id, approvalStatus: 'PENDING' } })
  } else if (type === 'appointments') {
    await prisma.appointment.deleteMany({ where: { id, approvalStatus: 'PENDING' } })
  } else {
    res.status(400).json({ message: 'Invalid record type' })
    return
  }

  res.status(204).send()
}
