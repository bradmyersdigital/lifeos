import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SECTORS = ['Business', 'Real Estate', 'Health', 'Personal Growth', 'Hobbies', 'Family']

function TimeInput({ label, value, onChange }) {
  // Convert stored "H:MM AM/PM" to 24h for input
  const toInput = (v) => {
    if (!v) return ''
    const m = v.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!m) return v
    let h = parseInt(m[1])
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2,'0')}:${m[2]}`
  }
  // Convert 24h back to "H:MM AM/PM"
  const fromInput = (v) => {
    if (!v) return ''
    const [hStr, mStr] = v.split(':')
    let h = parseInt(hStr)
    const ap = h >= 12 ? 'PM' : 'AM'
    if (h > 12) h -= 12
    if (h === 0) h = 12
    return `${h}:${mStr} ${ap}`
  }
  const [val, setVal] = useState(toInput(value))
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <input type="time" value={val} onChange={e => { setVal(e.target.value); onChange(fromInput(e.target.value)) }} style={{ width: '100%' }} />
    </div>
  )
}

export default function EventModal({ event, date, onClose, onSaved }) {
  const isEdit = !!event
  const today = new Date().toISOString().split('T')[0]
  const [title, setTitle] = useState(event?.title || '')
  const [startDate, setStartDate] = useState(event?.start_date || date || today)
  const [startTime, setStartTime] = useState(event?.start_time || '')
  const [endTime, setEndTime] = useState(event?.end_time || '')
  const [location, setLocation] = useState(event?.location || '')
  const [attending, setAttending] = useState(event?.attending || '')
  const [sector, setSector] = useState(event?.sector || '')
  const [notes, setNotes] = useState(event?.notes || '')
  const [projectId, setProjectId] = useState(event?.project_id || '')
  const [projects, setProjects] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.from('projects').select('id, name').eq('status', 'active').then(({ data }) => setProjects(data || []))
  }, [])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    const payload = { title: title.trim(), start_date: startDate, start_time: startTime || null, end_time: endTime || null, location, attending, sector, notes, project_id: projectId || null }
    if (isEdit) await supabase.from('events').update(payload).eq('id', event.id)
    else await supabase.from('events').insert(payload)
    setSaving(false); onSaved(); onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this event?')) return
    setDeleting(true)
    await supabase.from('events').delete().eq('id', event.id)
    setDeleting(false); onSaved(); onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? 'Edit event' : 'New event'}<div className="modal-close" onClick={onClose}>×</div></div>

        <div className="field"><div className="field-label">Event title</div><input type="text" placeholder="What's the event?" value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="field-row">
          <div className="field"><div className="field-label">Date</div><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div className="field"><div className="field-label">Sector</div>
            <select value={sector} onChange={e => setSector(e.target.value)}><option value="">Select...</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</select>
          </div>
        </div>
        <div className="field-row">
          <TimeInput label="Start time" value={startTime} onChange={setStartTime} />
          <TimeInput label="End time" value={endTime} onChange={setEndTime} />
        </div>
        <div className="field"><div className="field-label">Location</div><input type="text" placeholder="Where?" value={location} onChange={e => setLocation(e.target.value)} /></div>
        <div className="field"><div className="field-label">Who's attending</div><input type="text" placeholder="e.g. John, Sarah..." value={attending} onChange={e => setAttending(e.target.value)} /></div>
        <div className="field"><div className="field-label">Link to project</div>
          <select value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </div>
        <div className="field"><div className="field-label">Notes</div><textarea placeholder="Any details..." value={notes} onChange={e => setNotes(e.target.value)} style={{ height: 56 }} /></div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {isEdit && <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>{deleting ? '…' : 'Delete'}</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add event'}</button>
        </div>
      </div>
    </div>
  )
}
