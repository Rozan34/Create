import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { prisma } from './prisma.js'

dotenv.config()

let transporter
export function getTransporter() {
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  })
  return transporter
}

export async function sendBookingEmails(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { tutor: true, client: true }
  })
  if (!booking) return

  const mailer = getTransporter()
  const subject = `Tutoring Booking ${booking.status} - ${booking.startTime.toISOString()}`
  const timeRange = `${booking.startTime.toLocaleString()} - ${booking.endTime.toLocaleString()}`

  const clientMail = {
    from: process.env.EMAIL_FROM,
    to: booking.client.email,
    subject,
    text: `Your booking with ${booking.tutor.name} in ${booking.area} for ${timeRange} is ${booking.status}.`
  }
  const tutorMail = {
    from: process.env.EMAIL_FROM,
    to: booking.tutor.email,
    subject,
    text: `New booking from ${booking.client.name} (${booking.client.email}) in ${booking.area} for ${timeRange}. Status: ${booking.status}.`
  }

  await Promise.allSettled([
    mailer.sendMail(clientMail),
    mailer.sendMail(tutorMail)
  ])
}

