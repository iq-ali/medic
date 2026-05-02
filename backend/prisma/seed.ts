import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const users = [
  {
    email: 'admin@medic.local',
    password: 'Admin@1234',
    role: 'ADMIN' as const,
    firstName: 'System',
    lastName: 'Admin',
  },
  {
    email: 'doctor@medic.local',
    password: 'Doctor@1234',
    role: 'DOCTOR' as const,
    firstName: 'Sarah',
    lastName: 'Chen',
    specialty: 'Pediatric Neurology',
  },
  {
    email: 'therapist@medic.local',
    password: 'Therapist@1234',
    role: 'THERAPIST' as const,
    firstName: 'James',
    lastName: 'Okafor',
    specialty: 'Occupational Therapy',
  },
  {
    email: 'teacher@medic.local',
    password: 'Teacher@1234',
    role: 'TEACHER' as const,
    firstName: 'Maria',
    lastName: 'Santos',
  },
]

async function main() {
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10)
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashed,
        role: u.role,
        staff: {
          create: {
            firstName: u.firstName,
            lastName: u.lastName,
            specialty: u.specialty,
          },
        },
      },
    })
    console.log(`Seeded: ${u.email} (${u.role})`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
