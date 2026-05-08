import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  ADMIN_EMAIL and ADMIN_PASSWORD env vars are required. Skipping admin seed.')
  } else {
    const adminFirstName = process.env.ADMIN_FIRST_NAME ?? 'System'
    const adminLastName = process.env.ADMIN_LAST_NAME ?? 'Admin'

    const hashed = await bcrypt.hash(adminPassword, 10)
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: hashed,
        role: 'ADMIN',
        firstName: adminFirstName,
        lastName: adminLastName,
        status: 'APPROVED',
      },
    })
    console.log(`Seeded admin: ${adminEmail}`)
  }

  // Remove any Staff records linked to ADMIN users (cleanup for bad seed data)
  const deleted = await prisma.staff.deleteMany({
    where: { user: { role: 'ADMIN' } },
  })
  if (deleted.count > 0) {
    console.log(`Cleaned up ${deleted.count} admin-linked staff record(s)`)
  }

  // Upsert AdminSettings
  const existing = await prisma.adminSettings.findFirst()
  if (!existing) {
    await prisma.adminSettings.create({ data: { autoApproval: false } })
    console.log('Created AdminSettings (autoApproval=false)')
  } else {
    console.log('AdminSettings already exists, skipping.')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
