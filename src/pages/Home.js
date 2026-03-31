import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SECTOR_COLORS = {
  business: '#d4520f', 'real estate': '#3b82f6', health: '#10b981',
  'personal growth': '#f59e0b', family: '#ec4899', hobbies: '#a78bfa',
}

export default function Home({ onAddTask, onEditTask }) {
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [rolledOver, setRolledOver] = useState(0)

  const today = new Date()
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dateStr = `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}`
  const todayStr = today.toISOString().split('T')[0]

  useEffect(() => {
    supabase.from('tasks').select('*').eq('due_date', todayStr).order('time_block').then(({ data }) => {
      setTasks(data || [])
      setRolledOver((data || []).filter(t => t.rolled_over).length)
    })
    supabase.from('habits').select('*, habit_logs(completed_date)').then(({ data }) => setHabits(data || []))
  }, [todayStr])

  const toggleTask = async (task) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
  }

  const focusTask = tasks.find(t => !t.completed && (t.urgency === 'urgent' || t.urgency === 'high')) || tasks.find(t => !t.completed)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>Good morning 👋</div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 4, fontFamily: "'DM Mono'" }}>{dateStr}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#b84a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#fff' }}>Y</div>
      </div>

      {/* Add task buttons */}
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

      {/* Rollover */}
      {rolledOver > 0 && (
        <div style={{ background: '#1a1200', border: '1px solid #5a3a00', borderRadius: 10, padding: '8px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f59e0b' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
          {rolledOver} task{rolledOver > 1 ? 's' : ''} rolled over from yesterday
        </div>
      )}

      {/* Focus now */}
      {focusTask && (
        <>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: '#a0440e', textTransform: 'uppercase', marginBottom: 8 }}>⚡ Focus on this now</div>
          <div style={{ background: '#1e1208', border: '1px solid #7a3410', borderRadius: 16, padding: '16px 18px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#d4520f' }} />
            <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 4 }}>{focusTask.name}</div>
            <div style={{ fontSize: 12, color: '#666', fontFamily: "'DM Mono'" }}>{focusTask.time_block} · {focusTask.urgency}</div>
          </div>
        </>
      )}

      {/* Today's tasks */}
      <div className="section-label">Today's schedule</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tasks.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#3a3a3a', border: '1px dashed #242428', borderRadius: 12 }}>
            No tasks today — add one above
          </div>
        )}
        {tasks.map(task => (
          <div key={task.id} onClick={() => onEditTask(task)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 12, opacity: task.completed ? 0.4 : 1, transition: 'opacity 0.2s', cursor: 'pointer' }}>
            <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555', minWidth: 50 }}>{task.time_block || '—'}</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: SECTOR_COLORS[task.sector?.toLowerCase()] || '#555', flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: '#d4d2cc', flex: 1 }}>{task.name}</span>
            <div className={`check-circle${task.completed ? ' checked' : ''}`} onClick={e => { e.stopPropagation(); toggleTask(task) }}>
              {task.completed && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
            </div>
          </div>
        ))}
      </div>

      {/* Habits quick view */}
      <div className="section-label">Habits</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
        {habits.slice(0, 4).map(habit => {
          const doneTodayLog = habit.habit_logs?.find(l => l.completed_date === todayStr)
          return (
            <div key={habit.id} style={{ background: '#161618', border: `1px solid ${doneTodayLog ? '#1a3a2a' : '#242428'}`, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: '#1e1e22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{habit.icon}</div>
              <span style={{ fontSize: 13, color: '#c0bdb7', flex: 1 }}>{habit.name}</span>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: doneTodayLog ? '#16a34a' : 'transparent', border: `1.5px solid ${doneTodayLog ? '#16a34a' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {doneTodayLog && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
