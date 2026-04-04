import React, { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const SECTORS = ['Business', 'Real Estate', 'Health', 'Personal Growth', 'Hobbies', 'Family']
const URGENCIES = ['Low', 'Medium', 'High', 'Urgent']
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
const AMPM = ['AM', 'PM']
const ITEM_H = 44

const URG_STYLES = {
  Low:    { bg: '#0a1e14', border: '#0f4a2a', color: '#6ee7b7' },
  Medium: { bg: '#1e1a00', border: '#4a3d00', color: '#fcd34d' },
  High:   { bg: '#1e1208', border: '#7a3410', color: '#e8823a' },
  Urgent: { bg: '#2a0a0a', border: '#7a1010', color: '#f87171' },
}

function parseTimeString(t) {
  if (!t) return { hourIdx: 8, minIdx: 0, ampmIdx: 0 }
  const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return { hourIdx: 8, minIdx: 0, ampmIdx: 0 }
  const h = parseInt(match[1])
  const m = parseInt(match[2])
  const ap = match[3].toUpperCase()
  const hourIdx = HOURS.indexOf(String(h).padStart(2, '0'))
  const minIdx = MINUTES.indexOf(String(Math.round(m / 5) * 5).padStart(2, '0'))
  const ampmIdx = AMPM.indexOf(ap)
  return {
    hourIdx: hourIdx >= 0 ? hourIdx : 8,
    minIdx: minIdx >= 0 ? minIdx : 0,
    ampmIdx: ampmIdx >= 0 ? ampmIdx : 0,
  }
}

function Drum({ items, selectedIdx, onChange }) {
  const VISIBLE = 3
  const HEIGHT = ITEM_H * VISIBLE
  const containerRef = useRef()
  const dragging = useRef(false)
  const startY = useRef(0)
  const startIdx = useRef(selectedIdx)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const velocity = useRef(0)
  const animRef = useRef(null)
  const clamp = v => Math.max(0, Math.min(items.length - 1, v))

  const onWheel = useCallback((e) => {
    e.preventDefault()
    onChange(clamp(selectedIdx + (e.deltaY > 0 ? 1 : -1)))
  }, [selectedIdx, onChange, items.length])

  useEffect(() => {
    const el = containerRef.current
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  const onPointerDown = (e) => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    dragging.current = true
    startY.current = e.clientY
    startIdx.current = selectedIdx
    lastY.current = e.clientY
    lastTime.current = Date.now()
    velocity.current = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!dragging.current) return
    const now = Date.now()
    const dt = now - lastTime.current
    if (dt > 0) velocity.current = (lastY.current - e.clientY) / dt
    lastY.current = e.clientY
    lastTime.current = now
    const delta = startY.current - e.clientY
    onChange(clamp(Math.round(startIdx.current + delta / ITEM_H)))
  }

  const onPointerUp = () => {
    if (!dragging.current) return
    dragging.current = false
    let vel = velocity.current
    let cur = selectedIdx
    const tick = () => {
      vel *= 0.88
      cur += vel * 16 / ITEM_H
      const snapped = clamp(Math.round(cur))
      onChange(snapped)
      if (Math.abs(vel) > 0.04) animRef.current = requestAnimationFrame(tick)
    }
    if (Math.abs(vel) > 0.08) animRef.current = requestAnimationFrame(tick)
  }

  const translateY = (ITEM_H * (VISIBLE - 1) / 2) - (selectedIdx * ITEM_H)

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ flex: 1, height: HEIGHT, overflow: 'hidden', position: 'relative', cursor: 'ns-resize', userSelect: 'none', touchAction: 'none' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to bottom, #0f0f11 30%, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to top, #0f0f11 30%, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 4, right: 4, top: '50%', transform: 'translateY(-50%)', height: ITEM_H, background: 'rgba(212,82,15,0.1)', border: '1px solid rgba(212,82,15,0.28)', borderRadius: 8, pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, transform: `translateY(${translateY}px)`, transition: dragging.current ? 'none' : 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94)' }}>
        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIdx)
          return (
            <div key={item} onClick={() => onChange(i)} style={{
              height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Mono', monospace",
              fontSize: dist === 0 ? 24 : dist === 1 ? 17 : 13,
              fontWeight: dist === 0 ? 600 : 400,
              color: dist === 0 ? '#e8e6e1' : dist === 1 ? '#555' : '#2a2a2a',
              transition: 'font-size 0.15s, color 0.15s',
              cursor: 'pointer', position: 'relative', zIndex: dist === 0 ? 3 : 0,
            }}>
              {item}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TaskModal({ mode, onClose, onSaved, task }) {
  const isEdit = !!task
  const today = new Date().toISOString().split('T')[0]
  const parsedTime = parseTimeString(task?.time_block)

  const [name, setName] = useState(task?.name || '')
  const [urgency, setUrgency] = useState(task?.urgency ? task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1) : 'High')
  const [sector, setSector] = useState(task?.sector || '')
  const [dueDate, setDueDate] = useState(task?.due_date || today)
  const [startDate, setStartDate] = useState(task?.start_date || today)
  const [projectId, setProjectId] = useState(task?.project_id || '')
  const [noteId, setNoteId] = useState(task?.note_id || '')
  const [notesText, setNotesText] = useState(task?.notes_text || '')
  const [location, setLocation] = useState(task?.location || '')
  const [noTime, setNoTime] = useState(!task?.time_block)
  const [hourIdx, setHourIdx] = useState(parsedTime.hourIdx)
  const [minIdx, setMinIdx] = useState(parsedTime.minIdx)
  const [ampmIdx, setAmpmIdx] = useState(parsedTime.ampmIdx)
  const [projects, setProjects] = useState([])
  const [notes, setNotes] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.from('projects').select('id, name').eq('status', 'active').then(({ data }) => setProjects(data || []))
    supabase.from('notes').select('id, text, category').order('created_at', { ascending: false }).limit(20).then(({ data }) => setNotes(data || []))
  }, [])

  const timeString = noTime ? null : `${HOURS[hourIdx]}:${MINUTES[minIdx]} ${AMPM[ampmIdx]}`

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      name: name.trim(), urgency: urgency.toLowerCase(), sector,
      time_block: timeString, due_date: dueDate,
      start_date: startDate,
      project_id: projectId || null, note_id: noteId || null, notes_text: notesText,
    }
    if (isEdit) {
      await supabase.from('tasks').update(payload).eq('id', task.id)
    } else {
      await supabase.from('tasks').insert({ ...payload, completed: false })
    }
    setSaving(false)
    onSaved?.()
    onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return
    setDeleting(true)
    await supabase.from('tasks').delete().eq('id', task.id)
    setDeleting(false)
    onSaved?.()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">
          {isEdit ? 'Edit task' : mode === 'today' ? 'Add task for today' : 'Schedule a task'}
          <div className="modal-close" onClick={onClose}>×</div>
        </div>

        <div className="field">
          <div className="field-label">Task name</div>
          <input type="text" placeholder="What needs to get done?" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="field">
          <div className="field-label">Urgency</div>
          <div style={{ display: 'flex', gap: 7 }}>
            {URGENCIES.map(u => {
              const s = URG_STYLES[u]
              const active = urgency === u
              return (
                <div key={u} onClick={() => setUrgency(u)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10, textAlign: 'center',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? s.bg : '#0f0f11',
                  border: `1px solid ${active ? s.border : '#242428'}`,
                  color: active ? s.color : '#555',
                }}>
                  {u}
                </div>
              )
            })}
          </div>
        </div>

        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="field-label" style={{ margin: 0 }}>Time block</div>
            <div onClick={() => setNoTime(!noTime)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: noTime ? '#d4520f' : '#555' }}>
              <div style={{ width: 28, height: 16, borderRadius: 8, background: noTime ? '#1e1208' : '#1e1e24', border: `1px solid ${noTime ? '#7a3410' : '#333'}`, position: 'relative', transition: 'all 0.2s' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: noTime ? '#d4520f' : '#555', position: 'absolute', top: 1, left: noTime ? 13 : 1, transition: 'left 0.2s' }} />
              </div>
              No specific time
            </div>
          </div>
          {!noTime && (
            <>
              <div style={{ background: '#0f0f11', border: '1px solid #2a2a30', borderRadius: 12, padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                <Drum items={HOURS} selectedIdx={hourIdx} onChange={setHourIdx} />
                <div style={{ fontFamily: "'DM Mono'", fontSize: 22, color: '#555', padding: '0 4px' }}>:</div>
                <Drum items={MINUTES} selectedIdx={minIdx} onChange={setMinIdx} />
                <div style={{ width: 14 }} />
                <Drum items={AMPM} selectedIdx={ampmIdx} onChange={setAmpmIdx} />
              </div>
              <div style={{ textAlign: 'center', fontFamily: "'DM Mono'", fontSize: 14, color: '#d4520f', marginTop: 8, fontWeight: 600 }}>{timeString}</div>
            </>
          )}
          {noTime && <div style={{ textAlign: 'center', fontSize: 13, color: '#555', padding: '8px 0' }}>Will appear after timed items</div>}
        </div>

        <div className="field">
          <div className="field-label">Sector</div>
          <select value={sector} onChange={e => setSector(e.target.value)}>
            <option value="">Select...</option>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="field-row">
          <div className="field">
            <div className="field-label">Do on</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-label">Deadline</div>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <div className="field-label">Link to project</div>
          <select value={projectId} onChange={e => setProjectId(e.target.value)}>
            <option value="">No project linked</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="field">
          <div className="field-label">Link a note</div>
          <select value={noteId} onChange={e => setNoteId(e.target.value)}>
            <option value="">No note linked</option>
            {notes.map(n => <option key={n.id} value={n.id}>{n.text.substring(0, 50)}{n.text.length > 50 ? '…' : ''}</option>)}
          </select>
        </div>

        <div className="field">
          <div className="field-label">Location (optional)</div>
          <input type="text" placeholder="Where?" value={location} onChange={e => setLocation(e.target.value)} />
        </div>

        <div className="field">
          <div className="field-label">Notes (optional)</div>
          <textarea placeholder="Any extra context..." value={notesText} onChange={e => setNotesText(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && (
            <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save task'}
          </button>
        </div>
      </div>
    </div>
  )
}
