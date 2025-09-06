import { Router } from 'express'
import { prisma } from '../services/prisma.js'

export const router = Router()

// List tutors, optionally filter by area
router.get('/', async (req, res) => {
  try {
    const { area } = req.query
    const tutors = await prisma.tutor.findMany({
      where: area ? { areas: { some: { name: area } } } : undefined,
      include: { areas: true }
    })
    res.json(tutors)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tutors' })
  }
})

// Get tutor details
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const tutor = await prisma.tutor.findUnique({
      where: { id },
      include: { areas: true, availabilities: true }
    })
    if (!tutor) return res.status(404).json({ error: 'Tutor not found' })
    res.json(tutor)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tutor' })
  }
})

