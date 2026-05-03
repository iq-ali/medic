import type { Request, Response } from 'express'
import { prisma } from '../prisma.js'
import { sendApprovalEmail } from '../services/email.service.js'

export async function getPendingUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    where: { status: 'PENDING' },
    select: {
      id: true,
      email: true,
      personalEmail: true,
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

  await prisma.user.update({ where: { id }, data: { status: 'APPROVED' } })

  if (user.personalEmail && user.firstName) {
    const appUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:5173'
    try {
      await sendApprovalEmail(user.personalEmail, {
        firstName: user.firstName,
        orgEmail: user.email,
        appUrl,
      })
    } catch (err) {
      console.error('Failed to send approval email:', err)
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
