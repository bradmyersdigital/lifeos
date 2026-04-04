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

function TimeInput({ label, value, onChange }) {
  const [time, setTime] = useState(value || '')
  const [ampm, setAmpm] = useState('AM')

  useEffect(() => {
    if (value) {
      const m = value.match(/(\d{1,2}:\d{2})\s*(AM|PM)/i)
      if (m) { setTime(m[1]); setAmpm(m[2].toUpperCase()) }
    }
  }, [])

  const handleChange = (t, ap) => {
    const formatted = t + ' ' + ap
    onChange(formatted)
  }

  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="time"
          value={time}
          onChange={e => { setTime(e.target.value); handleChange(e.target.value, ampm) }}
          style={{ flex: 1 }}
          placeholder="9:00"
        />
        <div style={{ display: 'flex', background: '#0f0f11', border: '1px solid #2a2a30', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
          {['AM','PM'].map(ap => (
            <div key={ap} onClick={() => { setAmpm(ap); handleChange(time, ap) }} style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: ampm === ap ? '#1e1208' : 'transparent', color: ampm === ap ? '#d4520f' : '#555', transition: 'all 0.15s' }}>{ap}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TaskModal({ mode, onClose, onSaved, task, defaultProjectId, defaultSector }) {
  const isEdit = !!task
  const today = new Date().toISOString().split('T')[0]

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
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  useEffect(() => {
    supabase.from('projects').select('id, name').eq('status', 'active').then(({ data }) => setProjects(data || []))
    supabase.from('notes').select('id, text').order('created_at', { ascending: false }).limit(20).then(({ data }) => setNotes(data || []))
    supabase.from('sectors').select('*').order('sort_order').order('name').then(({ data }) => setSectors(data || []))
  }, [])

  const createNewProject = async () => {
    if (!newProjectName.trim()) return
    const { data } = await supabase.from('projects').insert({ name: newProjectName.trim(), sector, status: 'active' }).select().single()
    if (data) {
      setProjects(prev => [...prev, data])
      setProjectId(data.id)
      setShowNewProject(false)
      setNewProjectName('')
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      name: name.trim(), urgency: urgency.toLowerCase(), sector,
      time_block: timeBlock || null,
      due_date: dueDate, start_date: startDate,
      project_id: projectId || null, note_id: noteId || null,
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
                <div key={u} onClick={() => setUrgency(u)} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', background: active ? s.bg : '#0f0f11', border: `1px solid ${active ? s.border : '#242428'}`, color: active ? s.color : '#555' }}>
                  {u}
                </div>
              )
            })}
          </div>
        </div>

        <TimeInput label="Time block" value={timeBlock} onChange={setTimeBlock} />

        <div className="field-row">
          <div className="field">
            <div className="field-label">Sector</div>
            <select value={sector} onChange={e => setSector(e.target.value)}>
              <option value="">Select...</option>
              {sectorList.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <div className="field-label">Do on</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <div className="field-label">Deadline</div>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
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
