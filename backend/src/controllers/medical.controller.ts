import type { Request, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma.js'

const medicalSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().min(1, 'Description required'),
  recordDate: z.coerce.date(),
  hospital: z.string().optional(),
  notes: z.string().optional(),
  studentId: z.string().min(1, 'Student required'),
  doctorId: z.string().nullable().optional(),
})

const include = {
  student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
  doctor: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.MedicalRecordInclude

export async function list(req: Request, res: Response): Promise<void> {
  const { search = '', studentId, page = '1', pageSize = '20' } = req.query as Record<string, string>
  const skip = (parseInt(page) - 1) * parseInt(pageSize)
  const take = parseInt(pageSize)
  const isAdmin = req.user?.role === 'ADMIN'

  const where: Prisma.MedicalRecordWhereInput = {}
  if (!isAdmin) where.approvalStatus = 'APPROVED'
  if (studentId) where.studentId = studentId
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { hospital: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [records, total] = await Promise.all([
    prisma.medicalRecord.findMany({ where, skip, take, include, orderBy: { recordDate: 'desc' } }),
    prisma.medicalRecord.count({ where }),
  ])

  res.json({ records, total, page: parseInt(page), pageSize: parseInt(pageSize) })
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const isAdmin = req.user?.role === 'ADMIN'

  const record = await prisma.medicalRecord.findUnique({ where: { id }, include })
  if (!record) {
    res.status(404).json({ message: 'Medical record not found' })
    return
  }

  if (!isAdmin && record.approvalStatus !== 'APPROVED') {
    res.status(404).json({ message: 'Medical record not found' })
    return
  }

  res.json({ record })
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = medicalSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid data', errors: parsed.error.issues })
    return
  }

  const isAdmin = req.user!.role === 'ADMIN'
  const record = await prisma.medicalRecord.create({
    data: {
      ...parsed.data,
      approvalStatus: isAdmin ? 'APPROVED' : 'PENDING',
      submittedById: isAdmin ? null : req.user!.id,
    },
    include,
  })
  res.status(201).json({ record, pending: !isAdmin })
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const parsed = medicalSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid data', errors: parsed.error.issues })
    return
  }

  const existing = await prisma.medicalRecord.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ message: 'Medical record not found' })
    return
  }

  const record = await prisma.medicalRecord.update({ where: { id }, data: parsed.data, include })
  res.json({ record })
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string

  const existing = await prisma.medicalRecord.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ message: 'Medical record not found' })
    return
  }

  await prisma.medicalRecord.delete({ where: { id } })
  res.status(204).send()
}
