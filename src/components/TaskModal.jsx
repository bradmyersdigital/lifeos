import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SECTORS = ['Business', 'Real Estate', 'Health', 'Personal Growth', 'Hobbies', 'Family']
const URGENCIES = ['Low', 'Medium', 'High', 'Urgent']
const URG_STYLES = {
  Low:    { bg: 'var(--success-dim)', border: 'var(--success-border)', color: 'var(--event-color)' },
  Medium: { bg: 'var(--warn-dim)', border: 'var(--warn-border)', color: 'var(--warn)' },
  High:   { bg: 'var(--accent-dim)', border: 'var(--accent-border)', color: 'var(--accent-text)' },
  Urgent: { bg: 'var(--danger-dim)', border: 'var(--danger-border)', color: 'var(--danger)' },
}

// Time block — optional start and end. Reset clears both.
function TimeInput({ start, end, onChange }) {
  const [noTime, setNoTime] = useState(!start && !end)

  const toInputVal = (v) => {
    if (!v) return ''
    const m = v.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!m) return v
    let h = parseInt(m[1]), min = m[2]
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2,'0')}:${min}`
  }
  const fromInputVal = (v) => {
    if (!v) return ''
    const [hStr, mStr] = v.split(':')
    let h = parseInt(hStr), m = mStr
    const ap = h >= 12 ? 'PM' : 'AM'
    if (h > 12) h -= 12
    if (h === 0) h = 12
    return `${h}:${m} ${ap}`
  }

  const toggleNoTime = () => {
    const next = !noTime
    setNoTime(next)
    if (next) onChange('', '')   // clearing both
  }

  return (
    <div className="field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="field-label" style={{ margin: 0 }}>Time block</div>
        <div onClick={toggleNoTime} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: noTime ? 'var(--accent)' : 'var(--text-dim)' }}>
          <div style={{ width: 28, height: 16, borderRadius: 8, background: noTime ? 'var(--accent-dim)' : 'var(--border)', border: `1px solid ${noTime ? 'var(--accent-border)' : 'var(--border-hover)'}`, position: 'relative', transition: 'all 0.2s' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: noTime ? 'var(--accent)' : 'var(--text-dim)', position: 'absolute', top: 1, left: noTime ? 13 : 1, transition: 'left 0.2s' }} />
          </div>
          No time
        </div>
      </div>
      {!noTime && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Start</div>
            <input type="time" value={toInputVal(start)}
              onChange={e => onChange(fromInputVal(e.target.value), end)} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>End</span>
              {end && <span onClick={() => onChange(start, '')} style={{ fontSize: 10.5, color: 'var(--accent)', cursor: 'pointer' }}>clear</span>}
            </div>
            <input type="time" value={toInputVal(end)}
              onChange={e => onChange(start, fromInputVal(e.target.value))} style={{ width: '100%' }} />
          </div>
        </div>
      )}
      {noTime && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', padding: '6px 0' }}>Will appear after timed items</div>}
    </div>
  )
}

export default function TaskModal({ mode, onClose, onSaved, task, defaultProjectId, defaultSector, defaultGoalId, asPage }) {
  const isEdit = !!task
  const [isComplete, setIsComplete] = useState(task?.completed || false)
  const toggleComplete = async () => {
    if (!isEdit) return
    const next = !isComplete
    setIsComplete(next)
    await supabase.from('tasks').update({ completed: next }).eq('id', task.id)
    onSaved?.()
  }
  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()

  const [name, setName] = useState(task?.name || '')
  const [urgency, setUrgency] = useState(task?.urgency ? task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1) : 'High')
  const [sector, setSector] = useState(task?.sector || defaultSector || '')
  const [dueDate, setDueDate] = useState(task?.due_date || today)
  const [startDate, setStartDate] = useState(task?.start_date || today)
  const [deadlineTouched, setDeadlineTouched] = useState(!!task)  // existing tasks: never auto-cascade
  const [projectId, setProjectId] = useState(task?.project_id || defaultProjectId || '')
  const [noteId, setNoteId] = useState(task?.note_id || '')
  const [notesText, setNotesText] = useState(task?.notes_text || '')
  const [location, setLocation] = useState(task?.location || '')
  const [timeBlock, setTimeBlock] = useState(task?.time_block || '')
  const [timeEnd, setTimeEnd] = useState(task?.end_time || '')
  const [projects, setProjects] = useState([])
  useEffect(() => {
    if (!projectId || sector) return
    const proj = projects.find(p => String(p.id) === String(projectId))
    if (proj?.sector) setSector(proj.sector)
  }, [projects, projectId])
  const [notes, setNotes] = useState([])
  const [sectors, setSectors] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [goalId, setGoalId] = useState(task?.goal_id || defaultGoalId || '')
  const [goals, setGoals] = useState([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  useEffect(() => {
    supabase.from('projects').select('id, name, sector').eq('status', 'active').then(({ data }) => setProjects(data || []))
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
      time_block: timeBlock || null, end_time: timeEnd || null, due_date: dueDate, start_date: startDate,
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

  const body = (
    <>

        <div className="field">
          <div className="field-label">Task name</div>
          <textarea
            placeholder="What needs to get done?"
            value={name}
            onChange={e => setName(e.target.value)}
            rows={1}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            style={{ resize: 'none', overflow: 'hidden', minHeight: 0, lineHeight: 1.4 }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault() }}
          />
        </div>

        <div className="field">
          <div className="field-label">Urgency</div>
          <div style={{ display: 'flex', gap: 7 }}>
            {URGENCIES.map(u => {
              const s = URG_STYLES[u]; const active = urgency === u
              return <div key={u} onClick={() => setUrgency(u)} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', background: active ? s.bg : 'var(--bg-input)', border: `1px solid ${active ? s.border : 'var(--border)'}`, color: active ? s.color : 'var(--text-dim)' }}>{u}</div>
            })}
          </div>
        </div>

        <TimeInput start={timeBlock} end={timeEnd} onChange={(s, e) => { setTimeBlock(s); setTimeEnd(e) }} />

        {/* Do on + Deadline on same row — item 11 */}
        <div className="field-row">
          <div className="field">
            <div className="field-label">Do on</div>
            <input type="date" value={startDate} onChange={e => {
              const v = e.target.value
              setStartDate(v)
              // new task, untouched deadline -> keep deadline in sync with do-on
              if (!isEdit && !deadlineTouched) setDueDate(v)
            }} />
          </div>
          <div className="field">
            <div className="field-label">Deadline</div>
            <input type="date" value={dueDate} onChange={e => { setDeadlineTouched(true); setDueDate(e.target.value) }} />
          </div>
        </div>

        <div className="field">
          <div className="field-label">Link to project</div>
          {showNewProject ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="New project name..." value={newProjectName} onChange={e => setNewProjectName(e.target.value)} style={{ flex: 1 }} />
              <button onClick={createNewProject} style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '0 14px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Create</button>
              <button onClick={() => setShowNewProject(false)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 12px', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans'" }}>×</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={projectId} onChange={e => {
                  const id = e.target.value
                  setProjectId(id)
                  const proj = projects.find(p => String(p.id) === String(id))
                  if (proj?.sector) setSector(proj.sector)   // inherit the project's sector
                }} style={{ flex: 1 }}>
                <option value="">No project linked</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={() => setShowNewProject(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 12px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans'", whiteSpace: 'nowrap' }}>+ New</button>
            </div>
          )}
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
            <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>
              {deleting ? '…' : 'Delete'}
            </button>
          )}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save task'}
          </button>
        </div>
    </>
  )

  // ── Full-page shell (routed Notion-style page) ──
  if (asPage) {
    return (
      <div className="doc-page" style={{ minHeight: '100%', paddingBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
          <div style={{ flex: 1, fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' }}>{isEdit ? 'Edit task' : 'New task'}</div>
          {isEdit && (
            <div onClick={toggleComplete}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 11, cursor: 'pointer', flexShrink: 0,
                background: isComplete ? 'var(--success-dim)' : 'var(--bg-card)',
                border: `1px solid ${isComplete ? 'var(--success-border)' : 'var(--border)'}`,
                color: isComplete ? 'var(--success)' : 'var(--text-muted)' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${isComplete ? 'var(--success)' : 'var(--border-hover)'}`, background: isComplete ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isComplete && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{isComplete ? 'Completed' : 'Complete'}</span>
            </div>
          )}
        </div>
        {body}
      </div>
    )
  }

  // ── Overlay sheet shell (unchanged) ──
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">
          {isEdit ? 'Edit task' : 'Add task'}
          <div className="modal-close" onClick={onClose}>×</div>
        </div>
        {body}
      </div>
    </div>
  )
}
