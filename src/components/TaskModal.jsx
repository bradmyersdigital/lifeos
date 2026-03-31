import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SECTORS = ['Business', 'Real Estate', 'Health', 'Personal Growth', 'Hobbies', 'Family']
const URGENCIES = ['Low', 'Medium', 'High', 'Urgent']
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
const AMPM = ['AM', 'PM']

const URG_STYLES = {
  Low:    { bg: '#0a1e14', border: '#0f4a2a', color: '#6ee7b7' },
  Medium: { bg: '#1e1a00', border: '#4a3d00', color: '#fcd34d' },
  High:   { bg: '#1e1208', border: '#7a3410', color: '#e8823a' },
  Urgent: { bg: '#2a0a0a', border: '#7a1010', color: '#f87171' },
}

// ── Drum scroller ─────────────────────────────────────────────────────────────
function Drum({ items, selectedIdx, onChange }) {
  const ITEM_H = 40
  const startY = useRef(null)
  const startIdx = useRef(selectedIdx)
  const containerRef = useRef()

  const clamp = v => Math.max(0, Math.min(items.length - 1, v))

  const onStart = (clientY) => {
    startY.current = clientY
    startIdx.current = selectedIdx
  }
  const onMove = (clientY) => {
    if (startY.current === null) return
    const delta = startY.current - clientY
    const newIdx = clamp(Math.round(startIdx.current + delta / ITEM_H))
    if (newIdx !== selectedIdx) onChange(newIdx)
  }
  const onEnd = () => { startY.current = null }

  const onWheel = (e) => {
    e.preventDefault()
    onChange(clamp(selectedIdx + (e.deltaY > 0 ? 1 : -1)))
  }

  useEffect(() => {
    const el = containerRef.current
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, height: 120, overflow: 'hidden', position: 'relative', cursor: 'ns-resize', userSelect: 'none' }}
      onMouseDown={e => onStart(e.clientY)}
      onMouseMove={e => e.buttons && onMove(e.clientY)}
      onMouseUp={onEnd}
      onTouchStart={e => onStart(e.touches[0].clientY)}
      onTouchMove={e => onMove(e.touches[0].clientY)}
      onTouchEnd={onEnd}
    >
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${(2 - selectedIdx) * ITEM_H}px)`, transition: 'transform 0.1s' }}>
        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIdx)
          return (
            <div key={item} onClick={() => onChange(i)} style={{
              height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Mono', monospace",
              fontSize: dist === 0 ? 22 : dist === 1 ? 17 : 14,
              fontWeight: 500,
              color: dist === 0 ? '#e8e6e1' : dist === 1 ? '#555' : '#2a2a2a',
              width: '100%', cursor: 'pointer', transition: 'all 0.1s',
            }}>
              {item}
            </div>
          )
        })}
      </div>
      {/* selection highlight */}
      <div style={{ position: 'absolute', left: 4, right: 4, top: '50%', transform: 'translateY(-50%)', height: 40, background: 'rgba(212,82,15,0.08)', border: '1px solid rgba(212,82,15,0.2)', borderRadius: 8, pointerEvents: 'none' }} />
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function TaskModal({ mode, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0]
  const [name, setName] = useState('')
  const [urgency, setUrgency] = useState('High')
  const [sector, setSector] = useState('')
  const [dueDate, setDueDate] = useState(today)
  const [startDate, setStartDate] = useState(today)
  const [projectId, setProjectId] = useState('')
  const [noteId, setNoteId] = useState('')
  const [notesText, setNotesText] = useState('')
  const [hourIdx, setHourIdx] = useState(8)   // default 9 AM
  const [minIdx, setMinIdx] = useState(0)
  const [ampmIdx, setAmpmIdx] = useState(0)
  const [projects, setProjects] = useState([])
  const [notes, setNotes] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('projects').select('id, name').eq('status', 'active').then(({ data }) => setProjects(data || []))
    supabase.from('notes').select('id, text, category').order('created_at', { ascending: false }).limit(20).then(({ data }) => setNotes(data || []))
  }, [])

  const timeString = `${HOURS[hourIdx]}:${MINUTES[minIdx]} ${AMPM[ampmIdx]}`

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      name: name.trim(),
      urgency: urgency.toLowerCase(),
      sector,
      time_block: timeString,
      due_date: dueDate,
      start_date: mode === 'scheduled' ? startDate : today,
      project_id: projectId || null,
      note_id: noteId || null,
      notes_text: notesText,
      completed: false,
    }
    const { error } = await supabase.from('tasks').insert(payload)
    setSaving(false)
    if (!error) { onSaved?.(); onClose() }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">
          {mode === 'today' ? 'Add task for today' : 'Schedule a task'}
          <div className="modal-close" onClick={onClose}>×</div>
        </div>

        <div className="field">
          <div className="field-label">Task name</div>
          <input type="text" placeholder="What needs to get done?" value={name} onChange={e => setName(e.target.value)} autoFocus />
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
          <div className="field-label">Time block</div>
          <div style={{ background: '#0f0f11', border: '1px solid #2a2a30', borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Drum items={HOURS} selectedIdx={hourIdx} onChange={setHourIdx} />
            <div style={{ fontFamily: "'DM Mono'", fontSize: 22, color: '#444', padding: '0 2px' }}>:</div>
            <Drum items={MINUTES} selectedIdx={minIdx} onChange={setMinIdx} />
            <div style={{ width: 12 }} />
            <Drum items={AMPM} selectedIdx={ampmIdx} onChange={setAmpmIdx} />
          </div>
          <div style={{ textAlign: 'center', fontFamily: "'DM Mono'", fontSize: 13, color: '#d4520f', marginTop: 6 }}>{timeString}</div>
        </div>

        <div className="field-row">
          <div className="field">
            <div className="field-label">Sector</div>
            <select value={sector} onChange={e => setSector(e.target.value)}>
              <option value="">Select...</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <div className="field-label">Due date</div>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        {mode === 'scheduled' && (
          <div className="field">
            <div className="field-label">Start date</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
        )}

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
          <div className="field-label">Notes (optional)</div>
          <textarea placeholder="Any extra context..." value={notesText} onChange={e => setNotesText(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save task'}
          </button>
        </div>
      </div>
    </div>
  )
}
