import type { Request, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma.js'

const studentSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  grade: z.string().min(1, 'Grade required'),
  disabilityType: z.enum(['PHYSICAL', 'COGNITIVE', 'SENSORY', 'SPEECH', 'EMOTIONAL', 'MULTIPLE', 'OTHER']),
  disabilitySeverity: z.string().optional(),
  diagnosisDate: z.coerce.date().nullable().optional(),
})

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

async function generateStudentId(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
    const id = `STU-${suffix}`
    const existing = await prisma.student.findUnique({ where: { studentId: id } })
    if (!existing) return id
  }
  throw new Error('Failed to generate unique student ID')
}

export async function list(req: Request, res: Response): Promise<void> {
  const { search = '', page = '1', pageSize = '20' } = req.query as Record<string, string>
  const skip = (parseInt(page) - 1) * parseInt(pageSize)
  const take = parseInt(pageSize)
  const isAdmin = req.user?.role === 'ADMIN'

  let where: Prisma.StudentWhereInput = isAdmin ? {} : { approvalStatus: 'APPROVED' }

  if (search) {
    where = {
      ...where,
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
      ],
    }
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.student.count({ where }),
  ])

  res.json({ students, total, page: parseInt(page), pageSize: parseInt(pageSize) })
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const isAdmin = req.user?.role === 'ADMIN'

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      guardians: true,
      medicalRecords: {
        where: isAdmin ? {} : { approvalStatus: 'APPROVED' },
        include: { doctor: { select: { firstName: true, lastName: true } } },
        orderBy: { recordDate: 'desc' },
        take: 5,
      },
      appointments: {
        where: isAdmin ? {} : { approvalStatus: 'APPROVED' },
        include: { staff: { select: { firstName: true, lastName: true } } },
        orderBy: { scheduledAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!student) {
    res.status(404).json({ message: 'Student not found' })
    return
  }

  if (!isAdmin && student.approvalStatus !== 'APPROVED') {
    res.status(404).json({ message: 'Student not found' })
    return
  }

  res.json({ student })
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = studentSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid data', errors: parsed.error.issues })
    return
  }

  const isAdmin = req.user!.role === 'ADMIN'
  const studentId = await generateStudentId()
  const student = await prisma.student.create({
    data: {
      ...parsed.data,
      studentId,
      approvalStatus: isAdmin ? 'APPROVED' : 'PENDING',
      submittedById: isAdmin ? null : req.user!.id,
    },
  })
  res.status(201).json({ student, pending: !isAdmin })
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const parsed = studentSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid data', errors: parsed.error.issues })
    return
  }

  const existing = await prisma.student.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ message: 'Student not found' })
    return
  }

  const student = await prisma.student.update({ where: { id }, data: parsed.data })
  res.json({ student })
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string

  const existing = await prisma.student.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ message: 'Student not found' })
    return
  }

  await prisma.student.delete({ where: { id } })
  res.status(204).send()
}
