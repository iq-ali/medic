import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma.js'

const staffSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  specialty: z.string().optional(),
  phone: z.string().optional(),
})

export async function list(req: Request, res: Response): Promise<void> {
  const { search = '' } = req.query as Record<string, string>

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { specialty: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const staff = await prisma.staff.findMany({
    where,
    include: { user: { select: { role: true, email: true } } },
    orderBy: { firstName: 'asc' },
  })

  res.json({ staff })
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { user: { select: { role: true, email: true } } },
  })

  if (!staff) {
    res.status(404).json({ message: 'Staff not found' })
    return
  }

  res.json({ staff })
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = staffSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid data', errors: parsed.error.issues })
    return
  }

  const staff = await prisma.staff.create({ data: parsed.data })
  res.status(201).json({ staff })
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const parsed = staffSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid data', errors: parsed.error.issues })
    return
  }

  const existing = await prisma.staff.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ message: 'Staff not found' })
    return
  }

  const staff = await prisma.staff.update({ where: { id }, data: parsed.data })
  res.json({ staff })
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string

  const existing = await prisma.staff.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ message: 'Staff not found' })
    return
  }

  await prisma.staff.delete({ where: { id } })
  res.status(204).send()
}
