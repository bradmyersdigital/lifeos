import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fmtDate, todayLocal } from '../utils'
import TaskModal from '../components/TaskModal'

const PRIORITIES = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
]
const HEALTH = {
  green:  { label: 'On track',        color: 'var(--success)', bg: 'var(--success-dim)' },
  yellow: { label: 'Needs attention',  color: 'var(--warn)',    bg: 'var(--warn-dim)' },
  red:    { label: 'Off track',        color: 'var(--danger)',  bg: 'var(--danger-dim)' },
}

// ── Progress & Health — computed from data that already exists elsewhere in the app,
// never a second, separately-tracked copy of it. ────────────────────────────────────

function computeProjectPct(project) {
  const tasks = project.tasks || []
  if (!tasks.length) return 0
  const done = tasks.filter(t => t.completed).length
  return Math.round(done / tasks.length * 100)
}

// Priority order when a goal has more than one kind of linked work: real projects (which
// already carry their own task-based progress) outrank a flat task list, which outranks a
// bare numeric check-in. A goal only falls through to the next tier when the one above it
// is empty, so nothing gets double-counted.
function computeGoalProgress(goal, projects, tasks, checkins) {
  if (projects.length) {
    const avg = projects.reduce((sum, p) => sum + computeProjectPct(p), 0) / projects.length
    return Math.round(avg)
  }
  if (tasks.length) {
    const done = tasks.filter(t => t.completed).length
    return Math.round(done / tasks.length * 100)
  }
  if (goal.target_value != null && goal.start_value != null && checkins.length) {
    const latest = checkins[0].value // checkins are pre-sorted newest-first
    const range = goal.target_value - goal.start_value
    if (range === 0) return 100
    return Math.max(0, Math.min(100, Math.round(((latest - goal.start_value) / range) * 100)))
  }
  return 0
}

// Most recent signal of "someone touched this goal" available from existing data. Tasks
// don't carry a completion timestamp today, so a completed task's start_date is used as an
// approximate stand-in — noted here since it's the one soft spot in this signal.
function computeLastActivity(goal, tasks, checkins, notes) {
  const dates = [goal.updated_at]
  checkins.forEach(c => dates.push(c.logged_at))
  notes.forEach(n => dates.push(n.updated_at))
  tasks.filter(t => t.completed && t.start_date).forEach(t => dates.push(t.start_date))
  const valid = dates.filter(Boolean).map(d => new Date(d).getTime()).filter(n => !isNaN(n))
  return valid.length ? new Date(Math.max(...valid)) : null
}

function computeGoalHealth(goal, progress, lastActivity, tasks) {
  if (goal.status !== 'active') return null
  const now = new Date()
  const daysSince = lastActivity ? Math.floor((now - lastActivity) / 86400000) : Infinity
  const overdue = tasks.some(t => !t.completed && t.start_date && t.start_date < todayLocal())

  let paceDelta = null
  if (goal.due_date && goal.created_at) {
    const created = new Date(goal.created_at)
    const due = new Date(goal.due_date + 'T00:00:00')
    const totalDays = Math.max(1, (due - created) / 86400000)
    const elapsed = Math.max(0, (now - created) / 86400000)
    const expectedPct = Math.min(100, (elapsed / totalDays) * 100)
    paceDelta = progress - expectedPct
  }

  if (overdue || daysSince > 14 || (paceDelta !== null && paceDelta < -20)) return 'red'
  if (daysSince > 7 || (paceDelta !== null && paceDelta < -5)) return 'yellow'
  return 'green'
}

function HealthDot({ level, size = 9 }) {
  if (!level) return null
  const h = HEALTH[level]
  return <div title={h.label} style={{ width: size, height: size, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
}
function HealthBadge({ level }) {
  if (!level) return null
  const h = HEALTH[level]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: h.bg, border: `1px solid ${h.color}44` }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: h.color }} />
      <div style={{ fontSize: 12, fontWeight: 500, color: h.color }}>{h.label}</div>
    </div>
  )
}

// ── Create / edit ────────────────────────────────────────────────────────────────────
function GoalModal({ goal, sectors, onClose, onSaved }) {
  const isEdit = !!goal
  const [title, setTitle] = useState(goal?.goal_text || '')
  const [details, setDetails] = useState(goal?.details || '')
  const [sector, setSector] = useState(goal?.sector || '')
  const [dueDate, setDueDate] = useState(goal?.due_date || '')
  const [priority, setPriority] = useState(goal?.priority || 'medium')
  const [status, setStatus] = useState(goal?.status || 'active')
  const [useNumeric, setUseNumeric] = useState(goal?.target_value != null)
  const [startValue, setStartValue] = useState(goal?.start_value ?? '')
  const [targetValue, setTargetValue] = useState(goal?.target_value ?? '')
  const [unit, setUnit] = useState(goal?.unit || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    const payload = {
      goal_text: title.trim(),
      details: details || null,
      sector: sector || null,
      due_date: dueDate || null,
      priority,
      status,
      start_value: useNumeric && startValue !== '' ? Number(startValue) : null,
      target_value: useNumeric && targetValue !== '' ? Number(targetValue) : null,
      unit: useNumeric ? (unit || null) : null,
      updated_at: new Date().toISOString(),
    }
    let error
    if (isEdit) { const r = await supabase.from('goals').update(payload).eq('id', goal.id); error = r.error }
    else { const r = await supabase.from('goals').insert(payload); error = r.error }
    // New columns may not exist yet if the migration hasn't run — retry with just the
    // original fields rather than losing the whole save.
    if (error?.code === '42703' || error?.code === 'PGRST204') {
      const fallback = { goal_text: payload.goal_text, details: payload.details, updated_at: payload.updated_at }
      if (isEdit) await supabase.from('goals').update(fallback).eq('id', goal.id)
      else await supabase.from('goals').insert(fallback)
      console.warn('Some goal columns are missing — run the goals migration SQL to enable sector/due date/priority/status/numeric tracking.')
    }
    setSaving(false); onSaved(); onClose()
  }

  const handleDelete = async () => {
    if (!goal || !window.confirm('Delete this goal? Linked projects, tasks, habits, and notes stay — they just lose the link.')) return
    await supabase.from('goals').delete().eq('id', goal.id)
    onSaved(); onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? 'Edit goal' : 'New goal'}<div className="modal-close" onClick={onClose}>×</div></div>

        <div className="field"><div className="field-label">What do you want to accomplish?</div>
          <input type="text" placeholder="e.g. Publish my app to the App Store" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="field"><div className="field-label">Details</div>
          <textarea placeholder="Any context — why this matters, what done looks like…" value={details} onChange={e => setDetails(e.target.value)} style={{ height: 80 }} />
        </div>

        <div className="field-row" style={{ marginBottom: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <div className="field-label">Sector</div>
            <select value={sector} onChange={e => setSector(e.target.value)}>
              <option value="">None</option>
              {sectors.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <div className="field-label">Due date</div>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="field-row" style={{ marginBottom: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <div className="field-label">Priority</div>
            <select value={priority} onChange={e => setPriority(e.target.value)}>
              {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <div className="field-label">Status</div>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div onClick={() => setUseNumeric(!useNumeric)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: useNumeric ? 12 : 18 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${useNumeric ? 'var(--accent)' : 'var(--border-hover)'}`, background: useNumeric ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {useNumeric && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1,5 4,8 9,1.5" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Track with a number instead of tasks (e.g. weight, savings)</div>
        </div>
        {useNumeric && (
          <div className="field-row" style={{ marginBottom: 18 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="field-label">Starting value</div>
              <input type="number" placeholder="0" value={startValue} onChange={e => setStartValue(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="field-label">Target value</div>
              <input type="number" placeholder="0" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="field-label">Unit</div>
              <input type="text" placeholder="lbs, $, pages" value={unit} onChange={e => setUnit(e.target.value)} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {isEdit && <button onClick={handleDelete} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving || !title.trim()}>{saving ? 'Saving…' : 'Save goal'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Detail ────────────────────────────────────────────────────────────────────────────
function GoalDetail({ goal, onBack, onSaved }) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [checkins, setCheckins] = useState([])
  const [notes, setNotes] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [allHabits, setAllHabits] = useState([])
  const [editing, setEditing] = useState(false)
  const [addTaskModal, setAddTaskModal] = useState(false)
  const [linkingTask, setLinkingTask] = useState(false)
  const [linkingHabit, setLinkingHabit] = useState(false)
  const [checkinValue, setCheckinValue] = useState('')
  const [sectors, setSectors] = useState([])

  const load = () => {
    supabase.from('projects').select('*, tasks(*)').eq('goal_id', goal.id).then(({ data }) => setProjects(data || []))
    supabase.from('tasks').select('*').eq('goal_id', goal.id).then(({ data }) => setTasks(data || []))
    supabase.from('tasks').select('*').is('goal_id', null).eq('completed', false).order('start_date').limit(30).then(({ data }) => setAllTasks(data || []))
    supabase.from('notes').select('id, title, updated_at').eq('goal_id', goal.id).then(({ data }) => setNotes(data || []))
    supabase.from('habits').select('*').eq('goal_id', goal.id).then(({ data, error }) => setHabits(error ? [] : (data || [])))
    supabase.from('habits').select('*').is('goal_id', null).order('sort_order').then(({ data, error }) => setAllHabits(error ? [] : (data || [])))
    supabase.from('goal_checkins').select('*').eq('goal_id', goal.id).order('logged_at', { ascending: false }).then(({ data, error }) => setCheckins(error ? [] : (data || [])))
    supabase.from('sectors').select('*').order('sort_order').order('name').then(({ data }) => setSectors(data || []))
  }
  useEffect(load, [goal.id])

  const progress = computeGoalProgress(goal, projects, tasks, checkins)
  const lastActivity = computeLastActivity(goal, tasks, checkins, notes)
  const health = computeGoalHealth(goal, progress, lastActivity, tasks)
  const usesNumeric = goal.target_value != null && goal.start_value != null

  const linkTask = async (taskId) => {
    await supabase.from('tasks').update({ goal_id: goal.id }).eq('id', taskId)
    load(); setLinkingTask(false)
  }
  const unlinkTask = async (taskId) => {
    await supabase.from('tasks').update({ goal_id: null }).eq('id', taskId)
    load()
  }
  const linkHabit = async (habitId) => {
    await supabase.from('habits').update({ goal_id: goal.id }).eq('id', habitId)
    load(); setLinkingHabit(false)
  }
  const unlinkHabit = async (habitId) => {
    await supabase.from('habits').update({ goal_id: null }).eq('id', habitId)
    load()
  }
  const addCheckin = async () => {
    if (checkinValue === '' || isNaN(Number(checkinValue))) return
    await supabase.from('goal_checkins').insert({ goal_id: goal.id, value: Number(checkinValue) })
    setCheckinValue('')
    load()
  }
  const deleteCheckin = async (id) => {
    await supabase.from('goal_checkins').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>‹</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            {goal.sector && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{goal.sector}</div>}
            <HealthBadge level={health} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.goal_text}</div>
        </div>
        <div onClick={() => setEditing(true)} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 1.5L11 3.5L4.5 10H2.5V8L9 1.5Z" stroke="var(--text-muted)" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {goal.details && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{goal.details}</div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Progress</div>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 18, fontWeight: 500, color: 'var(--accent)' }}>{progress}%</div>
        </div>
        <div className="prog-bar"><div className="prog-fill" style={{ width: progress + '%' }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>
            {projects.length ? `${projects.length} project${projects.length===1?'':'s'} linked`
              : tasks.length ? `${tasks.filter(t=>t.completed).length} of ${tasks.length} tasks done`
              : usesNumeric ? `${goal.start_value}${goal.unit||''} → ${goal.target_value}${goal.unit||''}`
              : 'Nothing linked yet'}
          </div>
          {goal.due_date && <div style={{ fontSize: 11, color: goal.due_date < todayLocal() && goal.status==='active' ? 'var(--danger)' : 'var(--text-dim)', fontFamily: "'DM Mono'" }}>Due {fmtDate(goal.due_date)}</div>}
        </div>
      </div>

      {/* Numeric check-ins */}
      {usesNumeric && (
        <div style={{ marginBottom: 22 }}>
          <div className="section-label" style={{ margin: '0 0 10px' }}>Log progress</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input type="number" placeholder={`Current ${goal.unit || 'value'}…`} value={checkinValue} onChange={e => setCheckinValue(e.target.value)}
              style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, fontFamily: "'DM Sans'" }} />
            <button className="btn-primary" style={{ padding: '0 18px' }} onClick={addCheckin}>Log</button>
          </div>
          {checkins.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {checkins.slice(0, 5).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.value}{goal.unit || ''}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>{fmtDate(c.logged_at?.substring(0,10))}</div>
                    <div onClick={() => deleteCheckin(c.id)} style={{ fontSize: 14, color: 'var(--text-dim)', cursor: 'pointer' }}>×</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Linked projects */}
      {projects.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div className="section-label" style={{ margin: '0 0 10px' }}>Linked projects</div>
          {projects.map(p => (
            <div key={p.id} onClick={() => navigate(`/projects?open=${p.id}`)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 6, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{p.name}</div>
                <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--text-dim)' }}>{computeProjectPct(p)}%</div>
              </div>
              <div className="prog-bar"><div className="prog-fill" style={{ width: computeProjectPct(p) + '%' }} /></div>
            </div>
          ))}
        </div>
      )}

      {/* Linked tasks */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="section-label" style={{ margin: 0 }}>Linked tasks</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div onClick={() => setAddTaskModal(true)} style={{ fontSize: 12, color: 'var(--accent-text)', cursor: 'pointer', padding: '4px 10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 8 }}>+ Create task</div>
          <div onClick={() => setLinkingTask(!linkingTask)} style={{ fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>Link existing</div>
        </div>
      </div>

      {linkingTask && (
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 14 }}>
          {allTasks.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No unlinked tasks available</div>}
          {allTasks.map(t => (
            <div key={t.id} onClick={() => linkTask(t.id)} style={{ padding: '8px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {t.name} {t.start_date && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>· {fmtDate(t.start_date)}</span>}
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && !linkingTask && (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 12, marginBottom: 14 }}>No tasks linked yet</div>
      )}
      {tasks.map(task => (
        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 6, opacity: task.completed ? 0.4 : 1 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, color: task.completed ? 'var(--text-dim)' : 'var(--text-secondary)', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.name}</div>
            {task.start_date && <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'", marginTop: 2 }}>{fmtDate(task.start_date)}</div>}
          </div>
          <div onClick={() => unlinkTask(task.id)} style={{ fontSize: 11, color: 'var(--text-dim)', cursor: 'pointer', padding: '3px 8px', background: 'var(--border)', borderRadius: 6, flexShrink: 0 }}>unlink</div>
        </div>
      ))}

      {/* Linked habits */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '22px 0 12px' }}>
        <div className="section-label" style={{ margin: 0 }}>Supporting habits</div>
        <div onClick={() => setLinkingHabit(!linkingHabit)} style={{ fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>Link a habit</div>
      </div>
      {linkingHabit && (
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 14 }}>
          {allHabits.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No unlinked habits available</div>}
          {allHabits.map(h => (
            <div key={h.id} onClick={() => linkHabit(h.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 16 }}>{h.icon}</div>{h.name}
            </div>
          ))}
        </div>
      )}
      {habits.length === 0 && !linkingHabit && (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 12, marginBottom: 14 }}>No habits linked yet</div>
      )}
      {habits.map(h => (
        <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 6 }}>
          <div style={{ fontSize: 18 }}>{h.icon}</div>
          <div style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>{h.name}</div>
          <div onClick={() => unlinkHabit(h.id)} style={{ fontSize: 11, color: 'var(--text-dim)', cursor: 'pointer', padding: '3px 8px', background: 'var(--border)', borderRadius: 6, flexShrink: 0 }}>unlink</div>
        </div>
      ))}

      {/* Linked notes */}
      {notes.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div className="section-label" style={{ margin: '0 0 10px' }}>Notes</div>
          {notes.map(n => (
            <div key={n.id} onClick={() => navigate('/notes', { state: { openNoteId: n.id, from: '/goals' } })} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 6, cursor: 'pointer' }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{n.title || 'Untitled'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'", marginTop: 4 }}>{fmtDate(n.updated_at?.substring(0,10))}</div>
            </div>
          ))}
        </div>
      )}

      {editing && <GoalModal goal={goal} sectors={sectors} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); onSaved() }} />}
      {addTaskModal && (
        <TaskModal mode="today" task={null} defaultGoalId={goal.id}
          onClose={() => setAddTaskModal(false)}
          onSaved={() => { setAddTaskModal(false); load() }}
        />
      )}
    </div>
  )
}

function GoalCard({ goal, projects, tasks, checkins, notes, onClick }) {
  const progress = computeGoalProgress(goal, projects, tasks, checkins)
  const lastActivity = computeLastActivity(goal, tasks, checkins, notes)
  const health = computeGoalHealth(goal, progress, lastActivity, tasks)
  const overdue = goal.due_date && goal.due_date < todayLocal() && goal.status === 'active'

  return (
    <div onClick={onClick} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 8, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <HealthDot level={health} />
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.goal_text}</div>
        </div>
        <div style={{ fontSize: 16, color: 'var(--text-dim)', marginLeft: 8, flexShrink: 0 }}>›</div>
      </div>
      <div className="prog-bar" style={{ marginBottom: 6 }}><div className="prog-fill" style={{ width: progress + '%' }} /></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--text-dim)' }}>{progress}%</div>
        {goal.due_date && <div style={{ fontSize: 11, fontFamily: "'DM Mono'", color: overdue ? 'var(--danger)' : 'var(--text-dim)' }}>{overdue ? 'Overdue' : `Due ${fmtDate(goal.due_date)}`}</div>}
      </div>
    </div>
  )
}

const HEALTH_SORT = { red: 0, yellow: 1, green: 2, null: 3 }

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [sectors, setSectors] = useState([])
  const [projectsByGoal, setProjectsByGoal] = useState({})
  const [tasksByGoal, setTasksByGoal] = useState({})
  const [checkinsByGoal, setCheckinsByGoal] = useState({})
  const [notesByGoal, setNotesByGoal] = useState({})
  const [selected, setSelected] = useState(null)
  const [addModal, setAddModal] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => { loadAll() }, [])

  const groupByGoal = (rows) => (rows || []).reduce((acc, row) => {
    if (!row.goal_id) return acc
    ;(acc[row.goal_id] ||= []).push(row)
    return acc
  }, {})

  const loadAll = async () => {
    const { data: g } = await supabase.from('goals').select('*').order('created_at')
    const { data: s } = await supabase.from('sectors').select('*').order('sort_order').order('name')
    const { data: p } = await supabase.from('projects').select('*, tasks(*)').not('goal_id', 'is', null)
    const { data: t } = await supabase.from('tasks').select('*').not('goal_id', 'is', null)
    const { data: n } = await supabase.from('notes').select('id, goal_id, updated_at').not('goal_id', 'is', null)
    let c = []
    try { const r = await supabase.from('goal_checkins').select('*').order('logged_at', { ascending: false }); c = r.data || [] } catch { /* migration not run yet */ }

    setGoals(g || [])
    setSectors(s || [])
    setProjectsByGoal(groupByGoal(p))
    setTasksByGoal(groupByGoal(t))
    setNotesByGoal(groupByGoal(n))
    setCheckinsByGoal(groupByGoal(c))
  }

  if (selected) {
    return <GoalDetail goal={selected} onBack={() => setSelected(null)} onSaved={() => { loadAll() }} />
  }

  const visibleGoals = goals.filter(g => showArchived ? g.status === 'archived' : g.status !== 'archived')
  const bySector = {}
  visibleGoals.forEach(g => { (bySector[g.sector || '__none__'] ||= []).push(g) })
  const sectorOrder = [...sectors.map(s => s.name), '__none__'].filter(name => bySector[name]?.length)

  const sortGoals = (list) => [...list].sort((a, b) => {
    const ha = computeGoalHealth(a, computeGoalProgress(a, projectsByGoal[a.id]||[], tasksByGoal[a.id]||[], checkinsByGoal[a.id]||[]), computeLastActivity(a, tasksByGoal[a.id]||[], checkinsByGoal[a.id]||[], notesByGoal[a.id]||[]), tasksByGoal[a.id]||[])
    const hb = computeGoalHealth(b, computeGoalProgress(b, projectsByGoal[b.id]||[], tasksByGoal[b.id]||[], checkinsByGoal[b.id]||[]), computeLastActivity(b, tasksByGoal[b.id]||[], checkinsByGoal[b.id]||[], notesByGoal[b.id]||[]), tasksByGoal[b.id]||[])
    return HEALTH_SORT[ha] - HEALTH_SORT[hb]
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Goals</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>Your long-term direction</div>
        </div>
        <div onClick={() => setAddModal(true)} className="action-btn" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/></svg>
          New goal
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div onClick={() => setShowArchived(false)} style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', background: !showArchived ? 'var(--accent-dim)' : 'var(--bg-card)', border: `1px solid ${!showArchived ? 'var(--accent-border)' : 'var(--border)'}`, color: !showArchived ? 'var(--accent)' : 'var(--text-dim)' }}>Active</div>
        <div onClick={() => setShowArchived(true)} style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', background: showArchived ? 'var(--accent-dim)' : 'var(--bg-card)', border: `1px solid ${showArchived ? 'var(--accent-border)' : 'var(--border)'}`, color: showArchived ? 'var(--accent)' : 'var(--text-dim)' }}>Archived</div>
      </div>

      {visibleGoals.length === 0 && (
        <div onClick={() => setAddModal(true)} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: 14, border: '1px dashed var(--border)', borderRadius: 14, cursor: 'pointer' }}>
          No goals yet — tap to set your first one
        </div>
      )}

      {sectorOrder.map(sectorName => (
        <div key={sectorName} style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 10 }}>
            {sectorName === '__none__' ? 'No sector' : sectorName}
          </div>
          {sortGoals(bySector[sectorName]).map(goal => (
            <GoalCard key={goal.id} goal={goal}
              projects={projectsByGoal[goal.id] || []} tasks={tasksByGoal[goal.id] || []}
              checkins={checkinsByGoal[goal.id] || []} notes={notesByGoal[goal.id] || []}
              onClick={() => setSelected(goal)}
            />
          ))}
        </div>
      ))}

      {addModal && <GoalModal goal={null} sectors={sectors} onClose={() => setAddModal(false)} onSaved={loadAll} />}
    </div>
  )
}
