import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const areas = ['Augustine Heights', 'Deebing Heights', 'Ripley']
  for (const name of areas) {
    await prisma.area.upsert({ where: { name }, update: {}, create: { name } })
  }

  const tutor1 = await prisma.tutor.upsert({
    where: { email: 'tutor1@example.com' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'tutor1@example.com',
      phone: '0400000001',
      areas: {
        connect: [{ name: 'Augustine Heights' }, { name: 'Ripley' }]
      }
    }
  })

  const tutor2 = await prisma.tutor.upsert({
    where: { email: 'tutor2@example.com' },
    update: {},
    create: {
      name: 'Bob Smith',
      email: 'tutor2@example.com',
      phone: '0400000002',
      areas: {
        connect: [{ name: 'Deebing Heights' }]
      }
    }
  })

  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000
  const slots = [1, 2, 3].flatMap((d) => {
    const base = new Date(now.getTime() + d * dayMs)
    const start1 = new Date(base)
    start1.setHours(15, 0, 0, 0)
    const end1 = new Date(base)
    end1.setHours(16, 0, 0, 0)
    const start2 = new Date(base)
    start2.setHours(16, 30, 0, 0)
    const end2 = new Date(base)
    end2.setHours(17, 30, 0, 0)
    return [
      { startTime: start1, endTime: end1 },
      { startTime: start2, endTime: end2 }
    ]
  })

  for (const s of slots) {
    await prisma.availability.create({ data: { tutorId: tutor1.id, ...s } })
    await prisma.availability.create({ data: { tutorId: tutor2.id, ...s } })
  }

  // Sample client and booking
  const client = await prisma.client.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: { name: 'Parent Example', email: 'parent@example.com', phone: '0400111222', notes: 'Year 8 Maths' }
  })

  const avail = await prisma.availability.findFirst({ where: { tutorId: tutor1.id, isBooked: false } })
  if (avail) {
    await prisma.booking.create({
      data: {
        tutorId: tutor1.id,
        clientId: client.id,
        startTime: avail.startTime,
        endTime: avail.endTime,
        area: 'Augustine Heights',
        status: 'PENDING'
      }
    })
    await prisma.availability.update({ where: { id: avail.id }, data: { isBooked: true } })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    // eslint-disable-next-line no-console
    console.log('Seed complete')
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

