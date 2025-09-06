import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import { sendBookingEmails } from '../services/email.js'

export const router = Router()

// Create a booking: validates no double booking, marks availability
router.post('/', async (req, res) => {
  try {
    const { tutorId, startTime, endTime, area, client } = req.body
    if (!tutorId || !startTime || !endTime || !area || !client?.name || !client?.email) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const startDate = new Date(startTime)
    const endDate = new Date(endTime)
    if (!(startDate < endDate)) return res.status(400).json({ error: 'Invalid time range' })

    const overlap = await prisma.booking.findFirst({
      where: {
        tutorId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startTime: { lt: endDate }, endTime: { gt: startDate } }
        ]
      }
    })
    if (overlap) return res.status(409).json({ error: 'Time slot already booked' })

    const availability = await prisma.availability.findFirst({
      where: { tutorId, isBooked: false, startTime: { lte: startDate }, endTime: { gte: endDate } }
    })
    if (!availability) return res.status(400).json({ error: 'Not available' })

    const created = await prisma.$transaction(async (tx) => {
      const clientRecord = await tx.client.upsert({
        where: { email: client.email },
        create: { name: client.name, email: client.email, phone: client.phone ?? null, notes: client.notes ?? null },
        update: { name: client.name, phone: client.phone ?? null, notes: client.notes ?? null }
      })

      const booking = await tx.booking.create({
        data: {
          tutorId,
          clientId: clientRecord.id,
          startTime: startDate,
          endTime: endDate,
          area,
          status: 'PENDING'
        }
      })

      await tx.availability.update({ where: { id: availability.id }, data: { isBooked: true } })
      return booking
    })

    req.app.get('io').emit('booking:created', created)
    await sendBookingEmails(created.id)
    res.status(201).json(created)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' })
  }
})

// List bookings for a tutor
router.get('/tutor/:tutorId', async (req, res) => {
  try {
    const tutorId = Number(req.params.tutorId)
    const bookings = await prisma.booking.findMany({
      where: { tutorId },
      include: { client: true },
      orderBy: { startTime: 'asc' }
    })
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' })
  }
})

// Approve or cancel
router.post('/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { status } = req.body
    if (!['APPROVED', 'CANCELED'].includes(status)) return res.status(400).json({ error: 'Invalid status' })

    const updated = await prisma.booking.update({ where: { id }, data: { status } })
    req.app.get('io').emit('booking:updated', updated)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking' })
  }
})

