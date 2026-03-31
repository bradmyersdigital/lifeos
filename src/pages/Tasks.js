import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SECTORS = [
  { key: 'business',      label: 'Business',       color: '#d4520f' },
  { key: 'real estate',   label: 'Real Estate',    color: '#3b82f6' },
  { key: 'health',        label: 'Health',         color: '#10b981' },
  { key: 'personal growth', label: 'Personal Growth', color: '#f59e0b' },
  { key: 'family',        label: 'Family',         color: '#ec4899' },
  { key: 'hobbies',       label: 'Hobbies',        color: '#a78bfa' },
]

const URG_STYLE = {
  urgent: { bg: '#2a0a0a', color: '#f87171' },
  high:   { bg: '#1e1208', color: '#e8823a' },
  medium: { bg: '#1e1a00', color: '#fcd34d' },
  low:    { bg: '#0a1e14', color: '#6ee7b7' },
}

export default function Tasks({ onAddTask, onEditTask }) {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState({})
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadTasks() }, [])

  const loadTasks = async () => {
    const { data } = await supabase.from('tasks').select('*, projects(name)').order('due_date').order('time_block')
    setTasks(data || [])
  }

  const toggleTask = async (task) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
  }

  const toggleCollapse = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))

  const filtered = tasks.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'today') return t.due_date === today && !t.completed
    if (filter === 'upcoming') return t.due_date > today && !t.completed
    if (filter === 'overdue') return t.due_date < today && !t.completed
    if (filter === 'done') return t.completed
    return true
  })

  const counts = {
    total: tasks.length,
    today: tasks.filter(t => t.due_date === today && !t.completed).length,
    overdue: tasks.filter(t => t.due_date < today && !t.completed).length,
    done: tasks.filter(t => t.completed).length,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>All tasks</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#161618', border: '1px solid #242428', borderRadius: 10, padding: '7px 11px' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="#555" strokeWidth="1.4"/><line x1="8.5" y1="8.5" x2="12" y2="12" stroke="#555" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <input style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#e8e6e1', fontFamily: "'DM Sans'", width: 110 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="action-row">
        <div className="action-btn" style={{ background: '#1e1208', border: '1px solid #7a3410', color: '#e8823a' }} onClick={() => onAddTask('today')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add task for today
        </div>
        <div className="action-btn" style={{ background: '#161618', border: '1px solid #2a2a30', color: '#aaa' }} onClick={() => onAddTask('scheduled')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="2" stroke="#aaa" strokeWidth="1.4"/><line x1="1.5" y1="6.5" x2="13.5" y2="6.5" stroke="#aaa" strokeWidth="1.4"/><line x1="5" y1="1" x2="5" y2="4" stroke="#aaa" strokeWidth="1.4" strokeLinecap="round"/><line x1="10" y1="1" x2="10" y2="4" stroke="#aaa" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Schedule a task
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all','today','upcoming','overdue','done'].map(f => (
          <div key={f} onClick={() => setFilter(f)} style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: filter === f ? '#1e1208' : '#161618', borderColor: filter === f ? '#7a3410' : '#242428', color: filter === f ? '#d4520f' : '#666' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
        {[['Total', counts.total, '#e8e6e1'],['Today', counts.today, '#e8e6e1'],['Overdue', counts.overdue, '#f87171'],['Done', counts.done, '#6ee7b7']].map(([label, val, color]) => (
          <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 11, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Sectors */}
      {SECTORS.map(({ key, label, color }) => {
        const sectorTasks = filtered.filter(t => t.sector?.toLowerCase() === key)
        if (sectorTasks.length === 0 && filter !== 'all') return null
        return (
          <div key={key} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse(key)}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
              <div style={{ fontSize: 13, fontWeight: 500, color: '#aaa', flex: 1 }}>{label}</div>
              <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555' }}>{sectorTasks.length} tasks</div>
              <div style={{ color: '#444', fontSize: 13, transform: collapsed[key] ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
            </div>
            {!collapsed[key] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sectorTasks.length === 0
                  ? <div style={{ padding: 14, textAlign: 'center', fontSize: 13, color: '#3a3a3a', border: '1px dashed #242428', borderRadius: 12 }}>No tasks — add one above</div>
                  : sectorTasks.map(task => {
                    const urg = URG_STYLE[task.urgency] || URG_STYLE.medium
                    const isOverdue = task.due_date < today && !task.completed
                    return (
                      <div key={task.id} onClick={() => onEditTask(task)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 12, opacity: task.completed ? 0.38 : 1, cursor: 'pointer' }}>
                        <div className={`check-circle${task.completed ? ' checked' : ''}`} onClick={e => { e.stopPropagation(); toggleTask(task) }}>
                          {task.completed && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, color: '#d4d2cc' }}>{task.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                            {task.time_block && <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555' }}>{task.time_block}</span>}
                            <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: isOverdue ? '#f87171' : '#555' }}>{isOverdue ? `${task.due_date} — overdue` : task.due_date}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6, background: urg.bg, color: urg.color }}>{task.urgency}</span>
                            {task.projects && <span style={{ fontSize: 11, color: '#d4520f' }}>{task.projects.name} →</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
