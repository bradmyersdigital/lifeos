import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fmtTime(t) {
  if (!t) return ''
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return t
  let h = parseInt(m[1]), min = m[2]
  const ap = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${h}:${min} ${ap}`
}

export default function EventModal({ event, date, onClose, onSaved, sectors = [] }) {
  const isEdit = !!event
  const [title, setTitle] = useState(event?.title || '')
  const [eventDate, setEventDate] = useState(event?.start_date || date || '')
  const [startTime, setStartTime] = useState(event?.start_time || '')
  const [endTime, setEndTime] = useState(event?.end_time || '')
  const [location, setLocation] = useState(event?.location || '')
  const [attending, setAttending] = useState(event?.attending || '')
  const [sector, setSector] = useState(event?.sector || '')
  const [notes, setNotes] = useState(event?.notes || '')
  const [projectId, setProjectId] = useState(event?.project_id || '')
  const [projects, setProjects] = useState([])
  const [recurring, setRecurring] = useState(event?.recurring || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('projects').select('id, name').eq('status', 'active').then(({ data }) => setProjects(data || []))
  }, [])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    const payload = {
      title: title.trim(), start_date: eventDate,
      start_time: startTime || null, end_time: endTime || null,
      location: location || null, attending: attending || null,
      sector: sector || null, notes: notes || null,
      project_id: projectId || null, recurring: recurring || null,
    }
    if (isEdit) await supabase.from('events').update(payload).eq('id', event.id)
    else await supabase.from('events').insert(payload)
    setSaving(false); onSaved?.(); onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this event?')) return
    await supabase.from('events').delete().eq('id', event.id)
    onSaved?.(); onClose()
  }

  const sectorList = sectors.length ? sectors.map(s => s.name) : ['Business','Real Estate','Health','Personal Growth','Hobbies','Family']

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">
          {isEdit ? 'Edit event' : 'Add event'}
          <div className="modal-close" onClick={onClose}>×</div>
        </div>

        <div className="field"><div className="field-label">Event title</div>
          <input type="text" placeholder="What's happening?" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className="field-row">
          <div className="field"><div className="field-label">Date</div>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
          </div>
          <div className="field"><div className="field-label">Sector</div>
            <select value={sector} onChange={e => setSector(e.target.value)}>
              <option value="">None</option>
              {sectorList.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field"><div className="field-label">Start time</div>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div className="field"><div className="field-label">End time</div>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className="field"><div className="field-label">Repeats</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['','Never'],['weekly','Weekly'],['biweekly','Bi-weekly'],['monthly','Monthly'],['yearly','Yearly']].map(([val, label]) => (
              <div key={val} onClick={() => setRecurring(val)}
                style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: recurring === val ? 'var(--accent-dim)' : '#161618', borderColor: recurring === val ? 'var(--accent-border)' : '#242428', color: recurring === val ? 'var(--accent)' : '#666' }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="field"><div className="field-label">Location</div>
          <input type="text" placeholder="Where?" value={location} onChange={e => setLocation(e.target.value)} />
        </div>

        <div className="field"><div className="field-label">Who's attending</div>
          <input type="text" placeholder="e.g. John, Sarah..." value={attending} onChange={e => setAttending(e.target.value)} />
        </div>

        <div className="field"><div className="field-label">Link to project</div>
          <select value={projectId} onChange={e => setProjectId(e.target.value)}>
            <option value="">None</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="field"><div className="field-label">Notes</div>
          <textarea placeholder="Any details..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={handleDelete} style={{ flex:1,padding:11,borderRadius:10,background:'#2a0a0a',border:'1px solid #7a1010',color:'#f87171',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add event'}</button>
        </div>
      </div>
    </div>
  )
}
