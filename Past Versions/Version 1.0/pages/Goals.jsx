import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import TaskModal from '../components/TaskModal'

const TIMEFRAMES = [
  { key: '1month',  label: '1 Month',  section: 'Current Focus', prominent: true },
  { key: '3month',  label: '3 Month',  section: 'Current Focus', prominent: true },
  { key: '6month',  label: '6 Month',  section: 'Near Term', prominent: false },
  { key: '1year',   label: '1 Year',   section: 'Near Term', prominent: false },
  { key: '5year',   label: '5 Year',   section: 'Long Term', prominent: false },
  { key: '10year',  label: '10 Year',  section: 'Long Term', prominent: false },
  { key: '15year',  label: '15 Year',  section: 'Vision', prominent: false },
  { key: '20year',  label: '20 Year',  section: 'Vision', prominent: false },
]
const SECTIONS = ['Current Focus', 'Near Term', 'Long Term', 'Vision']
const SECTION_STYLES = {
  'Current Focus': { borderColor: 'var(--accent-border)', bg: '#1e1208', labelColor: '#d4520f' },
  'Near Term':     { borderColor: '#1a3a5c', bg: '#0c1a2e', labelColor: '#3b82f6' },
  'Long Term':     { borderColor: '#1a3a2a', bg: '#0a1e14', labelColor: '#10b981' },
  'Vision':        { borderColor: '#2a1a5c', bg: '#16112e', labelColor: '#a78bfa' },
}

function GoalModal({ tf, goal, linkedTasks, onClose, onSaved }) {
  const isEdit = !!goal
  const [title, setTitle] = useState(goal?.goal_text || '')
  const [details, setDetails] = useState(goal?.details || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return; setSaving(true)
    const payload = { timeframe: tf.key, goal_text: title.trim(), details, updated_at: new Date().toISOString() }
    if (isEdit) await supabase.from('goals').update(payload).eq('id', goal.id)
    else await supabase.from('goals').insert(payload)
    setSaving(false); onSaved(); onClose()
  }

  const handleDelete = async () => {
    if (!goal || !window.confirm('Delete this goal?')) return
    await supabase.from('goals').delete().eq('id', goal.id)
    onSaved(); onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{tf.label} Goal<div className="modal-close" onClick={onClose}>×</div></div>
        <div className="field"><div className="field-label">Goal</div><input type="text" placeholder={`What's your ${tf.label.toLowerCase()} goal?`} value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="field"><div className="field-label">Details & notes</div><textarea placeholder="Any context, milestones, or details..." value={details} onChange={e => setDetails(e.target.value)} style={{ height: 100 }} /></div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={handleDelete} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving || !title.trim()}>{saving ? 'Saving…' : 'Save goal'}</button>
        </div>
      </div>
    </div>
  )
}

function GoalDetail({ tf, goal, onBack, onSaved }) {
  const [tasks, setTasks] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [editing, setEditing] = useState(false)
  const [addTaskModal, setAddTaskModal] = useState(false)
  const [linkingTask, setLinkingTask] = useState(false)
  const styles = SECTION_STYLES[tf.section]

  useEffect(() => {
    supabase.from('tasks').select('*').eq('goal_id', goal.id).then(({ data }) => setTasks(data || []))
    supabase.from('tasks').select('*').is('goal_id', null).eq('completed', false).order('start_date').limit(30).then(({ data }) => setAllTasks(data || []))
  }, [goal.id])

  const done = tasks.filter(t => t.completed).length
  const pct = tasks.length > 0 ? Math.round(done / tasks.length * 100) : 0

  const linkTask = async (taskId) => {
    await supabase.from('tasks').update({ goal_id: goal.id }).eq('id', taskId)
    supabase.from('tasks').select('*').eq('goal_id', goal.id).then(({ data }) => setTasks(data || []))
    supabase.from('tasks').select('*').is('goal_id', null).eq('completed', false).order('start_date').limit(30).then(({ data }) => setAllTasks(data || []))
    setLinkingTask(false)
  }

  const unlinkTask = async (taskId) => {
    await supabase.from('tasks').update({ goal_id: null }).eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
    supabase.from('tasks').select('*').is('goal_id', null).eq('completed', false).order('start_date').limit(30).then(({ data }) => setAllTasks(data || []))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>‹</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: styles.labelColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{tf.label}</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{goal.goal_text}</div>
        </div>
        <div onClick={() => setEditing(true)} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 1.5L11 3.5L4.5 10H2.5V8L9 1.5Z" stroke="#888" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {goal.details && (
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 14, color: '#888', lineHeight: 1.6 }}>{goal.details}</div>
      )}

      <div style={{ background: '#161618', border: `1px solid ${styles.borderColor}`, borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#555' }}>Progress</div>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 18, fontWeight: 500, color: styles.labelColor }}>{pct}%</div>
        </div>
        <div className="prog-bar"><div className="prog-fill" style={{ width: pct+'%', background: styles.labelColor }} /></div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 6, fontFamily: "'DM Mono'" }}>{done} of {tasks.length} tasks done</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="section-label" style={{ margin: 0 }}>Linked tasks</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div onClick={() => setAddTaskModal(true)} style={{ fontSize: 12, color: 'var(--accent-text)', cursor: 'pointer', padding: '4px 10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 8 }}>+ Create task</div>
          <div onClick={() => setLinkingTask(!linkingTask)} style={{ fontSize: 12, color: '#555', cursor: 'pointer', padding: '4px 10px', background: '#161618', border: '1px solid #242428', borderRadius: 8 }}>Link existing</div>
        </div>
      </div>

      {linkingTask && allTasks.length > 0 && (
        <div style={{ background: '#0f0f11', border: '1px solid #1e1e24', borderRadius: 12, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Select a task to link:</div>
          {allTasks.map(t => (
            <div key={t.id} onClick={() => linkTask(t.id)} style={{ padding: '8px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 13, color: '#c0bdb7', marginBottom: 4, background: '#161618', border: '1px solid #1e1e24' }}>
              {t.name} {t.start_date && <span style={{ fontSize: 11, color: '#555' }}>· {t.start_date}</span>}
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && !linkingTask && (
        <div style={{ textAlign: 'center', padding: '16px', color: '#444', fontSize: 13, border: '1px dashed #242428', borderRadius: 12, marginBottom: 14 }}>No tasks linked yet</div>
      )}

      {tasks.map(task => (
        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 12, marginBottom: 6, opacity: task.completed ? 0.4 : 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: task.completed ? '#555' : '#d4d2cc', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.name}</div>
            {task.start_date && <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>{task.start_date}</div>}
          </div>
          <div onClick={() => unlinkTask(task.id)} style={{ fontSize: 11, color: '#555', cursor: 'pointer', padding: '3px 8px', background: '#1e1e24', borderRadius: 6 }}>unlink</div>
        </div>
      ))}

      {editing && <GoalModal tf={tf} goal={goal} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); onSaved() }} />}
      {addTaskModal && (
        <TaskModal mode="today" task={null}
          onClose={() => setAddTaskModal(false)}
          onSaved={async (newTaskId) => {
            setAddTaskModal(false)
            // Re-fetch tasks linked to this goal
            supabase.from('tasks').select('*').eq('goal_id', goal.id).then(({ data }) => setTasks(data || []))
          }}
        />
      )}
    </div>
  )
}

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [selected, setSelected] = useState(null) // { tf, goal }
  const [addModal, setAddModal] = useState(null) // tf

  useEffect(() => { loadGoals() }, [])

  const loadGoals = async () => {
    const { data } = await supabase.from('goals').select('*').order('created_at')
    setGoals(data || [])
  }

  const getGoalsForTf = (tfKey) => goals.filter(g => g.timeframe === tfKey)

  if (selected) {
    return <GoalDetail tf={selected.tf} goal={selected.goal} onBack={() => setSelected(null)} onSaved={() => { setSelected(null); loadGoals() }} />
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Goals</div>
        <div style={{ fontSize: 13, color: '#555', marginTop: 3 }}>Your long-term direction</div>
      </div>

      {SECTIONS.map(section => {
        const tfs = TIMEFRAMES.filter(t => t.section === section)
        const styles = SECTION_STYLES[section]
        return (
          <div key={section} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: styles.labelColor, textTransform: 'uppercase', marginBottom: 12 }}>{section}</div>
            {tfs.map(tf => {
              const tfGoals = getGoalsForTf(tf.key)
              return (
                <div key={tf.key} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#555', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tf.label}</div>
                  {tfGoals.map(goal => {
                    const taskCount = 0 // simplified - could fetch
                    return (
                      <div key={goal.id} onClick={() => setSelected({ tf, goal })} style={{ background: styles.bg, border: `1px solid ${styles.borderColor}`, borderRadius: 12, padding: tf.prominent ? 18 : 14, marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: tf.prominent ? 15 : 14, color: '#e8e6e1', fontWeight: tf.prominent ? 500 : 400, flex: 1, lineHeight: 1.4 }}>{goal.goal_text}</div>
                          <div style={{ fontSize: 18, color: '#555', marginLeft: 8 }}>›</div>
                        </div>
                        {goal.details && <div style={{ fontSize: 12, color: '#555', marginTop: 6, lineHeight: 1.4 }}>{goal.details.substring(0, 80)}{goal.details.length > 80 ? '…' : ''}</div>}
                        {goal.updated_at && <div style={{ fontSize: 11, color: '#444', marginTop: 8, fontFamily: "'DM Mono'" }}>Updated {new Date(goal.updated_at).toLocaleDateString()}</div>}
                      </div>
                    )
                  })}
                  <div onClick={() => setAddModal(tf)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#161618', border: '1px dashed #2a2a30', borderRadius: 12, cursor: 'pointer', fontSize: 13, color: '#444' }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="#444" strokeWidth="1.6" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="#444" strokeWidth="1.6" strokeLinecap="round"/></svg>
                    Add {tf.label.toLowerCase()} goal
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {addModal && <GoalModal tf={addModal} goal={null} onClose={() => setAddModal(null)} onSaved={loadGoals} />}
    </div>
  )
}
