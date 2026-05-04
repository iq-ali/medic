import type { Request, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma.js'

const appointmentSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  scheduledAt: z.coerce.date(),
  durationMin: z.coerce.number().int().min(5).default(60),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED']).default('SCHEDULED'),
  location: z.string().optional(),
  notes: z.string().optional(),
  studentId: z.string().min(1, 'Student required'),
  staffId: z.string().nullable().optional(),
})

const statusValues = ['SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED'] as const

const include = {
  student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
  staff: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.AppointmentInclude

export async function list(req: Request, res: Response): Promise<void> {
  const {
    search = '',
    studentId,
    staffId,
    status,
    page = '1',
    pageSize = '20',
  } = req.query as Record<string, string>

  const skip = (parseInt(page) - 1) * parseInt(pageSize)
  const take = parseInt(pageSize)
  const isAdmin = req.user?.role === 'ADMIN'

  const where: Prisma.AppointmentWhereInput = {}
  if (!isAdmin) where.approvalStatus = 'APPROVED'
  if (studentId) where.studentId = studentId
  if (staffId) where.staffId = staffId
  if (status && (statusValues as readonly string[]).includes(status)) {
    where.status = status as (typeof statusValues)[number]
  }
  if (search) where.title = { contains: search, mode: 'insensitive' }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({ where, skip, take, include, orderBy: { scheduledAt: 'desc' } }),
    prisma.appointment.count({ where }),
  ])

  res.json({ appointments, total, page: parseInt(page), pageSize: parseInt(pageSize) })
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const isAdmin = req.user?.role === 'ADMIN'

  const appointment = await prisma.appointment.findUnique({ where: { id }, include })
  if (!appointment) {
    res.status(404).json({ message: 'Appointment not found' })
    return
  }

  if (!isAdmin && appointment.approvalStatus !== 'APPROVED') {
    res.status(404).json({ message: 'Appointment not found' })
    return
  }

  res.json({ appointment })
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = appointmentSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid data', errors: parsed.error.issues })
    return
  }

  const isAdmin = req.user!.role === 'ADMIN'
  const appointment = await prisma.appointment.create({
    data: {
      ...parsed.data,
      approvalStatus: isAdmin ? 'APPROVED' : 'PENDING',
      submittedById: isAdmin ? null : req.user!.id,
    },
    include,
  })
  res.status(201).json({ appointment, pending: !isAdmin })
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const parsed = appointmentSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid data', errors: parsed.error.issues })
    return
  }

  const existing = await prisma.appointment.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ message: 'Appointment not found' })
    return
  }

  const appointment = await prisma.appointment.update({ where: { id }, data: parsed.data, include })
  res.json({ appointment })
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string

  const existing = await prisma.appointment.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ message: 'Appointment not found' })
    return
  }

  await prisma.appointment.delete({ where: { id } })
  res.status(204).send()
}
