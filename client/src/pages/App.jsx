import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = 'http://localhost:3001/api'
const socket = io('http://localhost:3001')

function AreaSelector({ area, onChange }) {
  const areas = ['Augustine Heights', 'Deebing Heights', 'Ripley']
  return (
    <select value={area} onChange={(e) => onChange(e.target.value)}>
      {areas.map((a) => (
        <option key={a} value={a}>{a}</option>
      ))}
    </select>
  )
}

function AvailabilityList({ area, onSelectSlot }) {
  const [slots, setSlots] = useState([])

  useEffect(() => {
    let mounted = true
    axios.get(`${API}/availability`, { params: { area } }).then((res) => {
      if (mounted) setSlots(res.data)
    })
    const onCreated = (s) => setSlots((prev) => [...prev, s])
    const onDeleted = (s) => setSlots((prev) => prev.filter((p) => p.id !== s.id))
    socket.on('availability:created', onCreated)
    socket.on('availability:deleted', onDeleted)
    return () => {
      mounted = false
      socket.off('availability:created', onCreated)
      socket.off('availability:deleted', onDeleted)
    }
  }, [area])

  return (
    <div>
      {slots.filter((s) => !s.isBooked && s.tutor.areas.some((x) => x.name === area)).map((s) => (
        <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
          <div>
            <div><strong>{s.tutor.name}</strong></div>
            <div>{new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleString()}</div>
          </div>
          <button onClick={() => onSelectSlot(s)}>Book</button>
        </div>
      ))}
    </div>
  )
}

function BookingForm({ slot, onBooked }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const disabled = useMemo(() => {
    return !form.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)
  }, [form])

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        tutorId: slot.tutorId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        area: slot.tutor.areas[0]?.name ?? 'Ripley',
        client: form
      }
      const res = await axios.post(`${API}/bookings`, payload)
      onBooked(res.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to book')
    } finally {
      setSubmitting(false)
    }
  }

  if (!slot) return null
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginTop: 8 }}>
      <div>Booking with <strong>{slot.tutor.name}</strong> ({new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleString()})</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        <input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <textarea placeholder="Notes about coursework" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button disabled={disabled || submitting} onClick={submit}>Confirm Booking</button>
      </div>
    </div>
  )
}

function TutorDashboard() {
  const params = new URLSearchParams(window.location.search)
  const tutorId = Number(params.get('tutorId') || 1)
  const [bookings, setBookings] = useState([])

  async function fetchBookings() {
    const res = await axios.get(`${API}/bookings/tutor/${tutorId}`)
    setBookings(res.data)
  }

  useEffect(() => {
    fetchBookings()
    const onUpdate = (b) => setBookings((prev) => prev.map((p) => (p.id === b.id ? b : p)))
    const onCreate = (b) => setBookings((prev) => [...prev, b])
    socket.on('booking:updated', onUpdate)
    socket.on('booking:created', onCreate)
    return () => {
      socket.off('booking:updated', onUpdate)
      socket.off('booking:created', onCreate)
    }
  }, [tutorId])

  async function updateStatus(id, status) {
    await axios.post(`${API}/bookings/${id}/status`, { status })
  }

  return (
    <div>
      <h2>Your Bookings</h2>
      {bookings.map((b) => (
        <div key={b.id} style={{ border: '1px solid #eee', padding: 8, borderRadius: 6, marginBottom: 8 }}>
          <div>
            <strong>{new Date(b.startTime).toLocaleString()} - {new Date(b.endTime).toLocaleString()}</strong>
          </div>
          <div>Client: {b.client?.name} ({b.client?.email})</div>
          <div>Status: {b.status}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button onClick={() => updateStatus(b.id, 'APPROVED')}>Approve</button>
            <button onClick={() => updateStatus(b.id, 'CANCELED')}>Cancel</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function App() {
  const [area, setArea] = useState('Augustine Heights')
  const [selected, setSelected] = useState(null)

  const onBooked = () => {
    setSelected(null)
    alert('Booking submitted! Check your email.')
  }

  const isDashboard = window.location.pathname.includes('dashboard')
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 16 }}>
      <h1>Tutoring Booking</h1>
      {isDashboard ? (
        <TutorDashboard />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>Area:</span>
            <AreaSelector area={area} onChange={setArea} />
          </div>
          <AvailabilityList area={area} onSelectSlot={setSelected} />
          <BookingForm slot={selected} onBooked={onBooked} />
        </>
      )}
    </div>
  )
}

