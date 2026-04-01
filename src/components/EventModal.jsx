import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const SECTORS = ['Business', 'Real Estate', 'Health', 'Personal Growth', 'Hobbies', 'Family']
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
const AMPM = ['AM', 'PM']
const ITEM_H = 38

function parseTime(t) {
  if (!t) return { h: 8, m: 0, ap: 0 }
  const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return { h: 8, m: 0, ap: 0 }
  const h = HOURS.indexOf(String(parseInt(match[1])).padStart(2, '0'))
  const m = MINUTES.indexOf(String(Math.round(parseInt(match[2]) / 5) * 5).padStart(2, '0'))
  const ap = AMPM.indexOf(match[3].toUpperCase())
  return { h: h >= 0 ? h : 8, m: m >= 0 ? m : 0, ap: ap >= 0 ? ap : 0 }
}

function Drum({ items, selectedIdx, onChange }) {
  const HEIGHT = ITEM_H * 3
  const ref = useRef()
  const dragging = useRef(false)
  const startY = useRef(0)
  const startIdx = useRef(selectedIdx)
  const vel = useRef(0)
  const lastY = useRef(0)
  const lastT = useRef(0)
  const anim = useRef(null)
  const clamp = v => Math.max(0, Math.min(items.length - 1, v))

  const onWheel = useCallback(e => {
    e.preventDefault()
    onChange(clamp(selectedIdx + (e.deltaY > 0 ? 1 : -1)))
  }, [selectedIdx])

  useEffect(() => {
    const el = ref.current
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  const onDown = e => {
    if (anim.current) cancelAnimationFrame(anim.current)
    dragging.current = true
    startY.current = e.clientY
    startIdx.current = selectedIdx
    lastY.current = e.clientY
    lastT.current = Date.now()
    vel.current = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = e => {
    if (!dragging.current) return
    const now = Date.now(), dt = now - lastT.current
    if (dt > 0) vel.current = (lastY.current - e.clientY) / dt
    lastY.current = e.clientY; lastT.current = now
    onChange(clamp(Math.round(startIdx.current + (startY.current - e.clientY) / ITEM_H)))
  }
  const onUp = () => {
    if (!dragging.current) return
    dragging.current = false
    let v = vel.current, cur = selectedIdx
    const tick = () => {
      v *= 0.88; cur += v * 16 / ITEM_H
      onChange(clamp(Math.round(cur)))
      if (Math.abs(v) > 0.04) anim.current = requestAnimationFrame(tick)
    }
    if (Math.abs(v) > 0.08) anim.current = requestAnimationFrame(tick)
  }

  const ty = (ITEM_H * (3 - 1) / 2) - (selectedIdx * ITEM_H)
  return (
    <div ref={ref} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      style={{ flex: 1, height: HEIGHT, overflow: 'hidden', position: 'relative', cursor: 'ns-resize', userSelect: 'none', touchAction: 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to bottom, #0f0f11 30%, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to top, #0f0f11 30%, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 2, right: 2, top: '50%', transform: 'translateY(-50%)', height: ITEM_H, background: 'rgba(212,82,15,0.1)', border: '1px solid rgba(212,82,15,0.28)', borderRadius: 7, pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, transform: `translateY(${ty}px)`, transition: dragging.current ? 'none' : 'transform 0.18s cubic-bezier(0.25,0.46,0.45,0.94)' }}>
        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIdx)
          return <div key={item} onClick={() => onChange(i)} style={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: dist === 0 ? 20 : dist === 1 ? 15 : 12, fontWeight: dist === 0 ? 600 : 400, color: dist === 0 ? '#e8e6e1' : dist === 1 ? '#555' : '#2a2a2a', cursor: 'pointer' }}>{item}</div>
        })}
      </div>
    </div>
  )
}

export default function EventModal({ event, date, onClose, onSaved }) {
  const isEdit = !!event
  const today = new Date().toISOString().split('T')[0]

  const ps = parseTime(event?.start_time)
  const pe = parseTime(event?.end_time || '10:00 AM')

  const [title, setTitle] = useState(event?.title || '')
  const [startDate, setStartDate] = useState(event?.start_date || date || today)
  const [location, setLocation] = useState(event?.location || '')
  const [sector, setSector] = useState(event?.sector || '')
  const [notes, setNotes] = useState(event?.notes || '')
  const [projectId, setProjectId] = useState(event?.project_id || '')
  const [projects, setProjects] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [sH, setSH] = useState(ps.h)
  const [sM, setSM] = useState(ps.m)
  const [sAp, setSAp] = useState(ps.ap)
  const [eH, setEH] = useState(pe.h)
  const [eM, setEM] = useState(pe.m)
  const [eAp, setEAp] = useState(pe.ap)

  const startTime = `${HOURS[sH]}:${MINUTES[sM]} ${AMPM[sAp]}`
  const endTime = `${HOURS[eH]}:${MINUTES[eM]} ${AMPM[eAp]}`

  useEffect(() => {
    supabase.from('projects').select('id, name').eq('status', 'active').then(({ data }) => setProjects(data || []))
  }, [])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    const payload = { title: title.trim(), start_date: startDate, start_time: startTime, end_time: endTime, location, sector, notes, project_id: projectId || null }
    if (isEdit) await supabase.from('events').update(payload).eq('id', event.id)
    else await supabase.from('events').insert(payload)
    setSaving(false)
    onSaved()
    onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this event?')) return
    setDeleting(true)
    await supabase.from('events').delete().eq('id', event.id)
    setDeleting(false)
    onSaved()
    onClose()
  }

  const preventScroll = e => e.preventDefault()

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      onTouchMove={e => { if (e.target === e.currentTarget) e.preventDefault() }}
    >
      <div
        className="modal-sheet"
        onTouchMove={e => e.stopPropagation()}
      >
        <div className="modal-handle" />
        <div className="modal-title">
          {isEdit ? 'Edit event' : 'New event'}
          <div className="modal-close" onClick={onClose}>×</div>
        </div>

        <div className="field">
          <div className="field-label">Event title</div>
          <input type="text" placeholder="What's the event?" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        </div>

        <div className="field-row">
          <div className="field">
            <div className="field-label">Date</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-label">Sector</div>
            <select value={sector} onChange={e => setSector(e.target.value)}>
              <option value="">Select...</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Time pickers side by side compact */}
        <div className="field">
          <div className="field-label">Time — Start → End</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
            <div style={{ background: '#0f0f11', border: '1px solid #2a2a30', borderRadius: 10, padding: '3px 6px', display: 'flex', alignItems: 'center' }}>
              <Drum items={HOURS} selectedIdx={sH} onChange={setSH} />
              <div style={{ fontFamily: "'DM Mono'", fontSize: 18, color: '#555' }}>:</div>
              <Drum items={MINUTES} selectedIdx={sM} onChange={setSM} />
              <div style={{ width: 6 }} />
              <Drum items={AMPM} selectedIdx={sAp} onChange={setSAp} />
            </div>
            <div style={{ textAlign: 'center', color: '#555', fontSize: 14 }}>→</div>
            <div style={{ background: '#0f0f11', border: '1px solid #2a2a30', borderRadius: 10, padding: '3px 6px', display: 'flex', alignItems: 'center' }}>
              <Drum items={HOURS} selectedIdx={eH} onChange={setEH} />
              <div style={{ fontFamily: "'DM Mono'", fontSize: 18, color: '#555' }}>:</div>
              <Drum items={MINUTES} selectedIdx={eM} onChange={setEM} />
              <div style={{ width: 6 }} />
              <Drum items={AMPM} selectedIdx={eAp} onChange={setEAp} />
            </div>
          </div>
          <div style={{ textAlign: 'center', fontFamily: "'DM Mono'", fontSize: 13, color: '#d4520f', marginTop: 6, fontWeight: 600 }}>{startTime} → {endTime}</div>
        </div>

        <div className="field">
          <div className="field-label">Location (optional)</div>
          <input type="text" placeholder="Where?" value={location} onChange={e => setLocation(e.target.value)} />
        </div>

        <div className="field">
          <div className="field-label">Link to project (optional)</div>
          <select value={projectId} onChange={e => setProjectId(e.target.value)}>
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="field">
          <div className="field-label">Notes (optional)</div>
          <textarea placeholder="Any details..." value={notes} onChange={e => setNotes(e.target.value)} style={{ height: 56 }} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {isEdit && (
            <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>
              {deleting ? '…' : 'Delete'}
            </button>
          )}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add event'}
          </button>
        </div>
      </div>
    </div>
  )
}
