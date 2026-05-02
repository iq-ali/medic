import type { Request, Response } from 'express'
import { prisma } from '../prisma.js'

export async function stats(_req: Request, res: Response): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [students, appointmentsToday, staff, medicalRecords] = await Promise.all([
    prisma.student.count(),
    prisma.appointment.count({
      where: {
        scheduledAt: { gte: today, lt: tomorrow },
        status: 'SCHEDULED',
      },
    }),
    prisma.staff.count(),
    prisma.medicalRecord.count(),
  ])

  res.json({ students, appointmentsToday, staff, medicalRecords })
}
