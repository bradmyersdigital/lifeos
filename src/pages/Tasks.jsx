import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const URG_STYLE = {
  urgent: { bg: '#2a0a0a', color: '#f87171' },
  high:   { bg: '#1e1208', color: 'var(--accent-text)' },
  medium: { bg: '#1e1a00', color: '#fcd34d' },
  low:    { bg: '#0a1e14', color: 'var(--event-color)' },
}

export default function Tasks({ onAddTask, onEditTask }) {
  const [tasks, setTasks] = useState([])
  const [sectors, setSectors] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState({})
  const dragItem = useRef(null)
  const dragOver = useRef(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from('tasks').select('*, projects(name)').order('start_date').order('time_block'),
      supabase.from('sectors').select('*').order('name'),
    ])
    setTasks(t || [])
    setSectors(s || [])
  }

  const toggleTask = async (task) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
  }

  const toggleCollapse = key => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))

  const handleDragStart = idx => { dragItem.current = idx }
  const handleDragEnter = idx => { dragOver.current = idx }
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) return
    const reordered = [...sectors]
    const [moved] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, moved)
    setSectors(reordered)
    dragItem.current = null; dragOver.current = null
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('sectors').update({ sort_order: i }).eq('id', reordered[i].id)
    }
  }

  const filtered = tasks.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'today') return t.start_date === today && !t.completed
    if (filter === 'upcoming') return t.start_date > today && !t.completed
    if (filter === 'overdue') return t.start_date < today && !t.completed
    if (filter === 'done') return t.completed
    return true
  })

  const counts = {
    total: tasks.length,
    today: tasks.filter(t => t.start_date === today && !t.completed).length,
    overdue: tasks.filter(t => t.start_date < today && !t.completed).length,
    done: tasks.filter(t => t.completed).length,
  }

  // Build sector list from DB sectors + unassigned
  const sectorNames = sectors.map(s => s.name)
  const unassigned = filtered.filter(t => !t.sector || !sectorNames.includes(t.sector))
  const sectorGroups = sectors.map(s => ({
    key: s.name.toLowerCase(),
    label: s.name,
    icon: s.icon,
    color: s.color || '#d4520f',
    tasks: filtered.filter(t => t.sector === s.name),
  }))

  const TaskRow = ({ task }) => {
    const urg = URG_STYLE[task.urgency] || URG_STYLE.medium
    const isOverdue = task.start_date < today && !task.completed
    return (
      <div onClick={() => onEditTask(task)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 12, marginBottom: 6, opacity: task.completed ? 0.38 : 1, cursor: 'pointer' }}>
        <div className={`check-circle${task.completed ? ' checked' : ''}`} onClick={e => { e.stopPropagation(); toggleTask(task) }}>
          {task.completed && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: '#d4d2cc' }}>{task.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            {task.time_block && <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555' }}>{task.time_block}</span>}
            {task.start_date && <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: isOverdue ? '#f87171' : '#555' }}>{isOverdue ? `${task.start_date} ⚠` : task.start_date}</span>}
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6, background: urg.bg, color: urg.color }}>{task.urgency}</span>
            {task.projects && <span style={{ fontSize: 11, color: 'var(--accent)' }}>{task.projects.name} →</span>}
          </div>
        </div>
      </div>
    )
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

      <div style={{ marginBottom: 16 }}>
        <div className="action-btn btn-task" style={{, width: '100%', justifyContent: 'center' }} onClick={() => onAddTask('today')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add Task
        </div>

      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all','today','upcoming','overdue','done'].map(f => (
          <div key={f} onClick={() => setFilter(f)} style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: filter === f ? '#1e1208' : '#161618', borderColor: filter === f ? '#7a3410' : '#242428', color: filter === f ? '#d4520f' : '#666' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
        {[['Total', counts.total, '#e8e6e1'],['Today', counts.today, '#e8e6e1'],['Overdue', counts.overdue, '#f87171'],['Done', counts.done, '#6ee7b7']].map(([label, val, color]) => (
          <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 11, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color }}>{val}</div>
          </div>
        ))}
      </div>

      {sectorGroups.map(({ key, label, icon, color, tasks: st }, idx) => {
        if (st.length === 0 && filter !== 'all') return null
        return (
          <div key={key} style={{ marginBottom: 20 }}>
            <div
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'grab', userSelect: 'none' }}
              onClick={() => toggleCollapse(key)}
            >
              <div style={{ fontSize: 16 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#aaa', flex: 1 }}>{label}</div>
              <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555' }}>{st.length} tasks</div>
              <div style={{ color: '#444', fontSize: 13, transform: collapsed[key] ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
            </div>
            {!collapsed[key] && (
              st.length === 0
                ? <div style={{ padding: 14, textAlign: 'center', fontSize: 13, color: '#3a3a3a', border: '1px dashed #242428', borderRadius: 12 }}>No tasks — add one above</div>
                : st.map(task => <TaskRow key={task.id} task={task} />)
            )}
          </div>
        )
      })}

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse('__unassigned')}>
            <div style={{ fontSize: 16 }}>📌</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#666', flex: 1 }}>Unassigned</div>
            <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555' }}>{unassigned.length} tasks</div>
            <div style={{ color: '#444', fontSize: 13, transform: collapsed['__unassigned'] ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
          </div>
          {!collapsed['__unassigned'] && unassigned.map(task => <TaskRow key={task.id} task={task} />)}
        </div>
      )}
    </div>
  )
}
