import { Router } from 'express'
import { prisma } from '../services/prisma.js'

export const router = Router()

// Public: list availability, filter by area and date range
router.get('/', async (req, res) => {
  try {
    const { area, start, end } = req.query
    const startTime = start ? new Date(start) : undefined
    const endTime = end ? new Date(end) : undefined

    const availabilities = await prisma.availability.findMany({
      where: {
        isBooked: false,
        ...(startTime && endTime ? { startTime: { gte: startTime }, endTime: { lte: endTime } } : {}),
        ...(area
          ? { tutor: { areas: { some: { name: area } } } }
          : {})
      },
      include: { tutor: { include: { areas: true } } },
      orderBy: { startTime: 'asc' }
    })
    res.json(availabilities)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch availability' })
  }
})

// Tutors: create availability slot
router.post('/', async (req, res) => {
  try {
    const { tutorId, startTime, endTime } = req.body
    if (!tutorId || !startTime || !endTime) return res.status(400).json({ error: 'Missing fields' })
    const startDate = new Date(startTime)
    const endDate = new Date(endTime)
    if (!(startDate < endDate)) return res.status(400).json({ error: 'Invalid time range' })

    const created = await prisma.availability.create({
      data: { tutorId, startTime: startDate, endTime: endDate }
    })

    req.app.get('io').emit('availability:created', created)
    res.status(201).json(created)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create availability' })
  }
})

// Tutors: delete availability slot if not booked
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.availability.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.isBooked) return res.status(400).json({ error: 'Slot already booked' })

    const deleted = await prisma.availability.delete({ where: { id } })
    req.app.get('io').emit('availability:deleted', deleted)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete availability' })
  }
})

