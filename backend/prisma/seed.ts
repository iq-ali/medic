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
    const adminPersonalEmail = process.env.ADMIN_PERSONAL_EMAIL ?? adminEmail

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
        personalEmail: adminPersonalEmail,
        status: 'APPROVED',
        mustChangePassword: false,
        staff: {
          create: {
            firstName: adminFirstName,
            lastName: adminLastName,
          },
        },
      },
    })
    console.log(`Seeded admin: ${adminEmail}`)
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
