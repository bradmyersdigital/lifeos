import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const EMOJI_PICKS = ['💼','🏠','🏃','📚','🎨','❤️','💰','🌱','⚡','🎯','🔥','✨','🎵','🏋️','🧠','💡','🌍','🚀','📝','🎮','🏆','🛠️','📊','🎭','🧘','🍎','☀️','🌙','💎','🦁']
const COLOR_PICKS = ['#d4520f','#3b82f6','#10b981','#f59e0b','#ec4899','#a78bfa','#f87171','#34d399','#60a5fa','#fbbf24','#e879f9','#2dd4bf']
const URG_STYLE = {
  urgent: { bg: '#2a0a0a', color: '#f87171' },
  high:   { bg: '#1e1208', color: '#e8823a' },
  medium: { bg: '#1e1a00', color: '#fcd34d' },
  low:    { bg: '#0a1e14', color: '#6ee7b7' },
}

function SectorModal({ sector, onClose, onSaved }) {
  const isEdit = !!sector
  const [name, setName] = useState(sector?.name || '')
  const [icon, setIcon] = useState(sector?.icon || '📁')
  const [color, setColor] = useState(sector?.color || '#d4520f')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (isEdit) {
      await supabase.from('sectors').update({ name: name.trim(), icon, color }).eq('id', sector.id)
    } else {
      await supabase.from('sectors').insert({ name: name.trim(), icon, color })
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${sector.name}" sector?`)) return
    setDeleting(true)
    await supabase.from('sectors').delete().eq('id', sector.id)
    setDeleting(false)
    onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">
          {isEdit ? `Edit ${sector.name}` : 'New sector'}
          <div className="modal-close" onClick={onClose}>×</div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 52, marginBottom: 12 }}>{icon}</div>
        <div className="field">
          <div className="field-label">Sector name</div>
          <input type="text" placeholder="e.g. Business, Health..." value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <div className="field-label">Icon</div>
          <input type="text" value={icon} onChange={e => setIcon(e.target.value)} style={{ fontSize: 22, textAlign: 'center' }} placeholder="Paste any emoji..." />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10, justifyContent: 'center' }}>
            {EMOJI_PICKS.map(e => (
              <div key={e} onClick={() => setIcon(e)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: icon === e ? '#1e1208' : '#161618', border: `1px solid ${icon === e ? '#7a3410' : '#242428'}`, borderRadius: 10, cursor: 'pointer' }}>
                {e}
              </div>
            ))}
          </div>
        </div>
        <div className="field">
          <div className="field-label">Color</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_PICKS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: `3px solid ${color === c ? '#fff' : 'transparent'}`, cursor: 'pointer', transition: 'border 0.15s' }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && (
            <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add sector'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SectorDetail({ sector, onBack, onEditTask, onAddTask }) {
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [tab, setTab] = useState('tasks')
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    supabase.from('tasks').select('*, projects(name)').eq('sector', sector.name).order('start_date').order('time_block')
      .then(({ data }) => setTasks(data || []))
    supabase.from('notes').select('*').eq('category', sector.name).order('created_at', { ascending: false })
      .then(({ data }) => setNotes(data || []))
  }, [sector.name])

  const toggleTask = async (task) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
  }

  const todayTasks = tasks.filter(t => t.start_date === today && !t.completed)
  const upcomingTasks = tasks.filter(t => t.start_date > today && !t.completed)
  const doneTasks = tasks.filter(t => t.completed)
  const overdueTasks = tasks.filter(t => t.start_date < today && !t.completed)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>‹</div>
        <div style={{ fontSize: 28 }}>{sector.icon}</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>{sector.name}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>{tasks.length} tasks · {notes.length} notes</div>
        </div>
      </div>

      {/* Add task buttons */}
      <div className="action-row" style={{ marginBottom: 16 }}>
        <div className="action-btn" style={{ background: '#1e1208', border: '1px solid #7a3410', color: '#e8823a' }} onClick={() => onAddTask('today')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add task for today
        </div>
        <div className="action-btn" style={{ background: '#161618', border: '1px solid #2a2a30', color: '#aaa' }} onClick={() => onAddTask('scheduled')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="2" stroke="#aaa" strokeWidth="1.4"/><line x1="1.5" y1="6.5" x2="13.5" y2="6.5" stroke="#aaa" strokeWidth="1.4"/><line x1="5" y1="1" x2="5" y2="4" stroke="#aaa" strokeWidth="1.4" strokeLinecap="round"/><line x1="10" y1="1" x2="10" y2="4" stroke="#aaa" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Schedule a task
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
        {[['Today', todayTasks.length, '#d4520f'],['Upcoming', upcomingTasks.length, '#a78bfa'],['Overdue', overdueTasks.length, '#f87171'],['Done', doneTasks.length, '#10b981']].map(([label, val, color]) => (
          <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: '10px 8px' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color }}>{val}</div>
            <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['tasks','notes'].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: tab === t ? '#1e1208' : '#161618', borderColor: tab === t ? '#7a3410' : '#242428', color: tab === t ? '#d4520f' : '#666' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {tab === 'tasks' && (
        <div>
          {tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#444', fontSize: 13 }}>No tasks in this sector yet</div>
          )}
          {overdueTasks.length > 0 && (
            <>
              <div className="section-label" style={{ color: '#f87171' }}>Overdue</div>
              {overdueTasks.map(task => <TaskRow key={task.id} task={task} today={today} onEdit={onEditTask} onToggle={toggleTask} />)}
            </>
          )}
          {todayTasks.length > 0 && (
            <>
              <div className="section-label">Today</div>
              {todayTasks.map(task => <TaskRow key={task.id} task={task} today={today} onEdit={onEditTask} onToggle={toggleTask} />)}
            </>
          )}
          {upcomingTasks.length > 0 && (
            <>
              <div className="section-label">Upcoming</div>
              {upcomingTasks.map(task => <TaskRow key={task.id} task={task} today={today} onEdit={onEditTask} onToggle={toggleTask} />)}
            </>
          )}
          {doneTasks.length > 0 && (
            <>
              <div className="section-label">Completed</div>
              {doneTasks.map(task => <TaskRow key={task.id} task={task} today={today} onEdit={onEditTask} onToggle={toggleTask} />)}
            </>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#444', fontSize: 13 }}>No notes in this sector yet</div>
          )}
          {notes.map(note => (
            <div key={note.id} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 14, color: '#d4d2cc', lineHeight: 1.5 }}>{note.text}</div>
              <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'", marginTop: 6 }}>{new Date(note.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, today, onEdit, onToggle }) {
  const urg = URG_STYLE[task.urgency] || URG_STYLE.medium
  const isOverdue = task.start_date < today && !task.completed
  return (
    <div onClick={() => onEdit(task)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 12, marginBottom: 6, opacity: task.completed ? 0.4 : 1, cursor: 'pointer' }}>
      <div onClick={e => { e.stopPropagation(); onToggle(task) }} style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${task.completed ? '#d4520f' : '#333'}`, background: task.completed ? '#d4520f' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {task.completed && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: task.completed ? '#555' : '#d4d2cc', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
          {task.time_block && <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555' }}>{task.time_block}</span>}
          {task.start_date && <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: isOverdue ? '#f87171' : '#555' }}>{task.start_date}</span>}
          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: urg.bg, color: urg.color }}>{task.urgency}</span>
          {task.projects && <span style={{ fontSize: 11, color: '#d4520f' }}>{task.projects.name} →</span>}
        </div>
      </div>
    </div>
  )
}

export default function Sectors({ onEditTask, onAddTask }) {
  const [sectors, setSectors] = useState([])
  const [selected, setSelected] = useState(null)
  const [sectorModal, setSectorModal] = useState(null)

  useEffect(() => { loadSectors() }, [])

  const loadSectors = async () => {
    const { data } = await supabase.from('sectors').select('*').order('name')
    setSectors(data || [])
  }

  if (selected) {
    return <SectorDetail sector={selected} onBack={() => setSelected(null)} onEditTask={onEditTask} onAddTask={onAddTask} />
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Sectors</div>
        <div onClick={() => setSectorModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1208', border: '1px solid #7a3410', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#d4520f', fontWeight: 500 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="#d4520f" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="#d4520f" strokeWidth="1.8" strokeLinecap="round"/></svg>
          New sector
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {sectors.map(s => (
          <div key={s.id} onClick={() => setSelected(s)} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 16, padding: 20, cursor: 'pointer', position: 'relative', transition: 'border-color 0.15s' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#e8e6e1', marginBottom: 4 }}>{s.name}</div>
            <div style={{ width: 32, height: 3, background: s.color || '#d4520f', borderRadius: 2, marginBottom: 8 }} />
            <div style={{ fontSize: 12, color: '#555' }}>Tap to explore →</div>
            <div onClick={e => { e.stopPropagation(); setSectorModal(s) }} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 8, background: '#1e1e24', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 1.5L10.5 3L4.5 9H3V7.5L9 1.5Z" stroke="#666" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        ))}

        {sectors.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 14 }}>
            No sectors yet — tap New sector to create your first one
          </div>
        )}
      </div>

      {sectorModal && (
        <SectorModal
          sector={sectorModal === 'new' ? null : sectorModal}
          onClose={() => setSectorModal(null)}
          onSaved={loadSectors}
        />
      )}
    </div>
  )
}
