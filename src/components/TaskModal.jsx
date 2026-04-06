import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SECTORS = ['Business', 'Real Estate', 'Health', 'Personal Growth', 'Hobbies', 'Family']
const URGENCIES = ['Low', 'Medium', 'High', 'Urgent']
const URG_STYLES = {
  Low:    { bg: '#0a1e14', border: '#0f4a2a', color: '#6ee7b7' },
  Medium: { bg: '#1e1a00', border: '#4a3d00', color: '#fcd34d' },
  High:   { bg: '#1e1208', border: '#7a3410', color: '#e8823a' },
  Urgent: { bg: '#2a0a0a', border: '#7a1010', color: '#f87171' },
}

// Simple time input — iOS shows native wheel picker, no extra AM/PM toggle needed
function TimeInput({ value, onChange }) {
  const [noTime, setNoTime] = useState(false)

  // Convert stored "HH:MM AM/PM" to input type=time "HH:MM"
  const toInputVal = (v) => {
    if (!v) return ''
    const m = v.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!m) return v
    let h = parseInt(m[1]), min = m[2]
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2,'0')}:${min}`
  }

  // Convert "HH:MM" (24h) back to "H:MM AM/PM"
  const fromInputVal = (v) => {
    if (!v) return ''
    const [hStr, mStr] = v.split(':')
    let h = parseInt(hStr), m = mStr
    const ap = h >= 12 ? 'PM' : 'AM'
    if (h > 12) h -= 12
    if (h === 0) h = 12
    return `${h}:${m} ${ap}`
  }

  const [inputVal, setInputVal] = useState(toInputVal(value))

  return (
    <div className="field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="field-label" style={{ margin: 0 }}>Time block</div>
        <div onClick={() => { setNoTime(!noTime); if (!noTime) onChange('') }} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: noTime ? '#d4520f' : '#555' }}>
          <div style={{ width: 28, height: 16, borderRadius: 8, background: noTime ? '#1e1208' : '#1e1e24', border: `1px solid ${noTime ? '#7a3410' : '#333'}`, position: 'relative', transition: 'all 0.2s' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: noTime ? '#d4520f' : '#555', position: 'absolute', top: 1, left: noTime ? 13 : 1, transition: 'left 0.2s' }} />
          </div>
          No time
        </div>
      </div>
      {!noTime && (
        <input
          type="time"
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); onChange(fromInputVal(e.target.value)) }}
          style={{ width: '100%' }}
        />
      )}
      {noTime && <div style={{ textAlign: 'center', fontSize: 12, color: '#444', padding: '6px 0' }}>Will appear after timed items</div>}
    </div>
  )
}

export default function TaskModal({ mode, onClose, onSaved, task, defaultProjectId, defaultSector, defaultGoalId }) {
  const isEdit = !!task
  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()

  const [name, setName] = useState(task?.name || '')
  const [urgency, setUrgency] = useState(task?.urgency ? task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1) : 'High')
  const [sector, setSector] = useState(task?.sector || defaultSector || '')
  const [dueDate, setDueDate] = useState(task?.due_date || today)
  const [startDate, setStartDate] = useState(task?.start_date || today)
  const [projectId, setProjectId] = useState(task?.project_id || defaultProjectId || '')
  const [noteId, setNoteId] = useState(task?.note_id || '')
  const [notesText, setNotesText] = useState(task?.notes_text || '')
  const [location, setLocation] = useState(task?.location || '')
  const [timeBlock, setTimeBlock] = useState(task?.time_block || '')
  const [projects, setProjects] = useState([])
  const [notes, setNotes] = useState([])
  const [sectors, setSectors] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [goalId, setGoalId] = useState(task?.goal_id || defaultGoalId || '')
  const [goals, setGoals] = useState([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  useEffect(() => {
    supabase.from('projects').select('id, name').eq('status', 'active').then(({ data }) => setProjects(data || []))
    supabase.from('notes').select('id, text').order('created_at', { ascending: false }).limit(20).then(({ data }) => setNotes(data || []))
    supabase.from('sectors').select('*').order('sort_order').order('name').then(({ data }) => setSectors(data || []))
    supabase.from('goals').select('id, goal_text, timeframe').order('timeframe').then(({ data }) => setGoals(data || []))
  }, [])

  const createNewProject = async () => {
    if (!newProjectName.trim()) return
    const { data } = await supabase.from('projects').insert({ name: newProjectName.trim(), sector, status: 'active' }).select().single()
    if (data) { setProjects(prev => [...prev, data]); setProjectId(data.id); setShowNewProject(false); setNewProjectName('') }
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      name: name.trim(), urgency: urgency.toLowerCase(), sector,
      time_block: timeBlock || null, due_date: dueDate, start_date: startDate,
      project_id: projectId || null, note_id: noteId || null, goal_id: goalId || null,
      notes_text: notesText, location: location || null,
    }
    if (isEdit) await supabase.from('tasks').update(payload).eq('id', task.id)
    else await supabase.from('tasks').insert({ ...payload, completed: false })
    setSaving(false); onSaved?.(); onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return
    setDeleting(true)
    await supabase.from('tasks').delete().eq('id', task.id)
    setDeleting(false); onSaved?.(); onClose()
  }

  const sectorList = sectors.length > 0 ? sectors.map(s => s.name) : SECTORS

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">
          {isEdit ? 'Edit task' : 'Add task'}
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
              const s = URG_STYLES[u]; const active = urgency === u
              return <div key={u} onClick={() => setUrgency(u)} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', background: active ? s.bg : '#0f0f11', border: `1px solid ${active ? s.border : '#242428'}`, color: active ? s.color : '#555' }}>{u}</div>
            })}
          </div>
        </div>

        <TimeInput value={timeBlock} onChange={setTimeBlock} />

        {/* Do on + Deadline on same row — item 11 */}
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

        {/* Sector below — item 11 */}
        <div className="field">
          <div className="field-label">Sector</div>
          <select value={sector} onChange={e => setSector(e.target.value)}>
            <option value="">Select...</option>
            {sectorList.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="field">
          <div className="field-label">Link to project</div>
          {showNewProject ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="New project name..." value={newProjectName} onChange={e => setNewProjectName(e.target.value)} style={{ flex: 1 }} />
              <button onClick={createNewProject} style={{ background: '#d4520f', border: 'none', borderRadius: 10, padding: '0 14px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Create</button>
              <button onClick={() => setShowNewProject(false)} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 10, padding: '0 12px', color: '#888', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans'" }}>×</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} style={{ flex: 1 }}>
                <option value="">No project linked</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={() => setShowNewProject(true)} style={{ background: '#161618', border: '1px solid #2a2a30', borderRadius: 10, padding: '0 12px', color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans'", whiteSpace: 'nowrap' }}>+ New</button>
            </div>
          )}
        </div>

        <div className="field">
          <div className="field-label">Link to goal</div>
          <select value={goalId} onChange={e => setGoalId(e.target.value)}>
            <option value="">No goal linked</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.timeframe?.replace('month','mo ').replace('year','yr ')} — {g.goal_text?.substring(0,40)}{g.goal_text?.length>40?'…':''}</option>)}
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
              {deleting ? '…' : 'Delete'}
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
