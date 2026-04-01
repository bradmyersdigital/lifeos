import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SECTOR_COLORS = {
  business: '#d4520f', 'real estate': '#3b82f6', health: '#10b981',
  'personal growth': '#f59e0b', family: '#ec4899', hobbies: '#a78bfa',
}
const SECTOR_ICONS = {
  business: '💼', 'real estate': '🏠', health: '🏃',
  'personal growth': '📚', family: '❤️', hobbies: '🎨',
}
const URG_STYLE = {
  urgent: { bg: '#2a0a0a', color: '#f87171', border: '#7a1010' },
  high:   { bg: '#1e1208', color: '#e8823a', border: '#7a3410' },
  medium: { bg: '#1e1a00', color: '#fcd34d', border: '#4a3d00' },
  low:    { bg: '#0a1e14', color: '#6ee7b7', border: '#0f4a2a' },
}
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function Home({ onAddTask, onEditTask }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState([])
  const [weekTasks, setWeekTasks] = useState([])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dateStr = `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}`

  // week dates Mon-Sun
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    // today's tasks (by start_date)
    supabase.from('tasks').select('*, projects(name)')
      .eq('start_date', todayStr).order('time_block')
      .then(({ data }) => setTasks(data || []))

    // active projects
    supabase.from('projects').select('*, tasks(*)')
      .eq('status', 'active')
      .then(({ data }) => setProjects(data || []))

    // habits
    supabase.from('habits').select('*')
      .then(({ data }) => setHabits(data || []))

    // habit logs this week
    supabase.from('habit_logs').select('*')
      .gte('completed_date', weekDates[0])
      .then(({ data }) => setHabitLogs(data || []))

    // week tasks
    supabase.from('tasks').select('*')
      .gte('start_date', weekDates[0])
      .lte('start_date', weekDates[6])
      .then(({ data }) => setWeekTasks(data || []))
  }, [todayStr])

  const toggleTask = async (task) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
  }

  const todayDone = tasks.filter(t => t.completed).length
  const urgentTasks = tasks.filter(t => !t.completed && (t.urgency === 'urgent' || t.urgency === 'high'))
  const focusTask = urgentTasks[0] || tasks.find(t => !t.completed)
  const rolledOver = tasks.filter(t => t.rolled_over).length
  const doneHabitsToday = habits.filter(h => habitLogs.some(l => l.habit_id === h.id && l.completed_date === todayStr)).length

  const getProjectPct = (p) => {
    const t = p.tasks || []
    if (!t.length) return 0
    return Math.round(t.filter(x => x.completed).length / t.length * 100)
  }

  const todayIdx = dow === 0 ? 6 : dow - 1

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>Good morning 👋</div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 3, fontFamily: "'DM Mono'" }}>{dateStr}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#b84a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#fff', flexShrink: 0 }}>Y</div>
      </div>

      {/* Quick add buttons */}
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

      {/* Stat chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
        {[
          { label: 'Due today', val: tasks.length, color: '#f87171' },
          { label: 'Urgent', val: urgentTasks.length, color: '#f59e0b' },
          { label: 'This week', val: weekTasks.length, color: '#a78bfa' },
          { label: 'Projects', val: projects.length, color: '#10b981' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: '10px 8px' }}>
            <div style={{ fontSize: 22, fontWeight: 500, color }}>{val}</div>
            <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Rollover */}
      {rolledOver > 0 && (
        <div style={{ background: '#1a1200', border: '1px solid #5a3a00', borderRadius: 10, padding: '8px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f59e0b' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
          {rolledOver} task{rolledOver > 1 ? 's' : ''} rolled over from yesterday
        </div>
      )}

      {/* Two column layout for time blocks + urgent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>

        {/* Today's time blocks */}
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase' }}>Today's blocks</div>
            <div style={{ fontSize: 10, color: '#444', fontFamily: "'DM Mono'" }}>{todayDone}/{tasks.length}</div>
          </div>
          {tasks.length === 0
            ? <div style={{ fontSize: 12, color: '#333', textAlign: 'center', padding: '8px 0' }}>No tasks today</div>
            : tasks.map(task => (
              <div key={task.id} onClick={() => onEditTask(task)} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, cursor: 'pointer' }}>
                <div onClick={e => { e.stopPropagation(); toggleTask(task) }} style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${task.completed ? '#d4520f' : '#333'}`, background: task.completed ? '#d4520f' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                  {task.completed && <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: task.completed ? '#444' : '#d4d2cc', textDecoration: task.completed ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</div>
                </div>
                {task.sector && <div style={{ width: 5, height: 5, borderRadius: '50%', background: SECTOR_COLORS[task.sector?.toLowerCase()] || '#555', flexShrink: 0 }} />}
                {task.time_block && <div style={{ fontFamily: "'DM Mono'", fontSize: 10, color: '#555', flexShrink: 0 }}>{task.time_block}</div>}
              </div>
            ))
          }
        </div>

        {/* Urgent / High priority */}
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', marginBottom: 10 }}>Urgent / High</div>
          {urgentTasks.length === 0
            ? <div style={{ fontSize: 12, color: '#333', textAlign: 'center', padding: '8px 0' }}>All clear 🎉</div>
            : urgentTasks.slice(0, 5).map(task => {
              const u = URG_STYLE[task.urgency] || URG_STYLE.high
              return (
                <div key={task.id} onClick={() => onEditTask(task)} style={{ marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ fontSize: 12, color: '#d4d2cc', marginBottom: 3, lineHeight: 1.3 }}>{task.name}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: u.bg, color: u.color }}>{task.urgency}</span>
                    {task.sector && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 5, background: '#1e1e24', color: '#666' }}>{task.sector}</span>}
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>

      {/* Week at a glance */}
      <div style={{ marginBottom: 18 }}>
        <div className="section-label">Week at a glance</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
          {weekDates.map((date, i) => {
            const isToday = date === todayStr
            const dayTasks = weekTasks.filter(t => t.start_date === date)
            const d = new Date(date)
            return (
              <div key={date} onClick={() => navigate('/week')} style={{ background: isToday ? '#1e1208' : '#161618', border: `1px solid ${isToday ? '#7a3410' : '#242428'}`, borderRadius: 10, padding: '8px 4px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                <div style={{ fontSize: 9, color: isToday ? '#d4520f' : '#555', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{DAY_NAMES[i]}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: isToday ? '#e8823a' : '#888', marginBottom: 4 }}>{d.getDate()}</div>
                {dayTasks.slice(0, 3).map((t, ti) => (
                  <div key={ti} style={{ fontSize: 9, background: SECTOR_COLORS[t.sector?.toLowerCase()] ? SECTOR_COLORS[t.sector?.toLowerCase()] + '22' : '#1e1e24', color: SECTOR_COLORS[t.sector?.toLowerCase()] || '#555', borderRadius: 4, padding: '1px 3px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.name.length > 8 ? t.name.substring(0, 8) + '…' : t.name}
                  </div>
                ))}
                {dayTasks.length === 0 && <div style={{ fontSize: 10, color: '#2a2a2a' }}>—</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active projects */}
      {projects.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div className="section-label">Active projects</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {projects.slice(0, 4).map(p => {
              const pct = getProjectPct(p)
              const color = SECTOR_COLORS[p.sector?.toLowerCase()] || '#d4520f'
              return (
                <div key={p.id} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e6e1', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>{p.sector}</div>
                  <div style={{ height: 4, background: '#1e1e24', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 2, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#555', fontFamily: "'DM Mono'" }}>{pct}% — {(p.tasks || []).filter(t => !t.completed).length} tasks left</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Habits quick check */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="section-label" style={{ margin: 0 }}>Habits</div>
          <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono'" }}>{doneHabitsToday}/{habits.length} today</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {habits.slice(0, 4).map(h => {
            const done = habitLogs.some(l => l.habit_id === h.id && l.completed_date === todayStr)
            return (
              <div key={h.id} style={{ background: '#161618', border: `1px solid ${done ? '#1a3a2a' : '#242428'}`, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: '#1e1e22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{h.icon}</div>
                <span style={{ fontSize: 13, color: '#c0bdb7', flex: 1 }}>{h.name}</span>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: done ? '#16a34a' : 'transparent', border: `1.5px solid ${done ? '#16a34a' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sectors */}
      <div className="section-label">Sectors</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 8 }}>
        {[['Business','business'],['Health','health'],['Growth','personal growth'],['Hobbies','hobbies'],['Notes','']].map(([label, key]) => (
          <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: key ? (SECTOR_COLORS[key] + '22') : '#1e1e22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {SECTOR_ICONS[key] || '📝'}
            </div>
            <div style={{ fontSize: 11, color: '#777', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
