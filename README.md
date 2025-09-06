## Tutoring Booking Tool (React + Node.js/Express + PostgreSQL + Prisma + Socket.IO)

This is a full-stack, web-based booking tool for a tutoring business. It enables clients to see tutor availability by area, book sessions, and receive email confirmations, while tutors manage schedules in a dashboard with real-time updates.

### Features
- Clients can browse availability in Augustine Heights, Deebing Heights, and Ripley
- Real-time updates to availability and bookings via Socket.IO
- Booking flow with client details and notes
- Email confirmations to clients and notifications to tutors (Nodemailer)
- Tutor dashboard for approving/canceling and viewing upcoming sessions
- PostgreSQL database via Prisma ORM
- Input validation and conflict detection (no double-booking)
- Mobile-friendly React UI with calendar-style display

### Quick Start

1) Prerequisites
- Node.js >= 18
- PostgreSQL (local or remote)

2) Environment
- Copy `server/.env.example` to `server/.env` and set values

3) Install
```bash
cd /workspace/server && npm install
cd /workspace/client && npm install
```

4) Database init (Prisma)
```bash
cd /workspace/server
npx prisma migrate dev --name init
npm run seed
```

5) Run Dev (both server and client)
```bash
cd /workspace/server && npm run dev
cd /workspace/client && npm run dev
```

6) Open the app
- Client: `http://localhost:5173`
- Server: `http://localhost:3001`

### Accounts and Usage
- Tutor dashboard is accessible without auth for demo: `http://localhost:5173/dashboard?tutorId=1`
  - Replace the `tutorId` with an existing ID from the seed

### Notes
- For email in development, set SMTP to Ethereal or Mailtrap. In production use a real SMTP provider.
- Security hardening and authentication are left as follow-ups (JWT/OAuth, RBAC, CSRF, etc.).

