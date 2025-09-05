import { Router } from 'express'
import { router as tutorsRouter } from './tutors.js'
import { router as availabilityRouter } from './availability.js'
import { router as bookingsRouter } from './bookings.js'

export const router = Router()

router.use('/tutors', tutorsRouter)
router.use('/availability', availabilityRouter)
router.use('/bookings', bookingsRouter)

