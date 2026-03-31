import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const SECTOR_COLORS = {
  business: '#d4520f', 'real estate': '#3b82f6', health: '#10b981',
  'personal growth': '#f59e0b', family: '#ec4899', hobbies: '#a78bfa',
}

export default function Week({ onAddTask }) {
  const [tasks, setTasks] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    supabase.from('tasks').select('*, projects(name)').gte('due_date', weekDates[0]).lte('due_date', weekDates[6]).order('time_block').then(({ data }) => setTasks(data || []))
  }, [])

  const SECTORS = ['all','business','real estate','health','personal growth','family','hobbies']

  const tasksForDay = (date) => tasks.filter(t => t.due_date === date && (activeFilter === 'all' || t.sector?.toLowerCase() === activeFilter))

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>This week</div>
          <div style={{ fontSize: 13, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>{months[monday.getMonth()]} {monday.getDate()} — {months[new Date(weekDates[6]).getMonth()]} {new Date(weekDates[6]).getDate()}</div>
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

      {/* Sector filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
        {SECTORS.map(s => (
          <div key={s} onClick={() => setActiveFilter(s)} style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', transition: 'all 0.15s', background: activeFilter === s ? '#1e1208' : '#161618', borderColor: activeFilter === s ? '#7a3410' : '#242428', color: activeFilter === s ? '#d4520f' : '#666' }}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
      </div>

      {/* Day columns */}
      {weekDates.map((date, i) => {
        const dayTasks = tasksForDay(date)
        const isToday = date === todayStr
        const d = new Date(date)
        return (
          <div key={date} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: isToday ? '#d4520f' : 'transparent', border: isToday ? 'none' : '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: isToday ? '#fff' : '#888', flexShrink: 0 }}>{d.getDate()}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: isToday ? '#d4520f' : '#666' }}>{DAY_NAMES[i]}</div>
              <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'", marginLeft: 'auto' }}>{dayTasks.length} tasks</div>
            </div>
            {dayTasks.length === 0
              ? <div style={{ padding: '10px 14px', fontSize: 13, color: '#2a2a2a', border: '1px dashed #1e1e24', borderRadius: 10, textAlign: 'center' }}>—</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {dayTasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#161618', border: '1px solid #1e1e24', borderRadius: 10 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: SECTOR_COLORS[task.sector?.toLowerCase()] || '#555', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#d4d2cc' }}>{task.name}</div>
                        {task.projects && <div style={{ fontSize: 11, color: '#d4520f', marginTop: 2 }}>{task.projects.name} →</div>}
                      </div>
                      {task.time_block && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555' }}>{task.time_block}</div>}
                    </div>
                  ))}
                </div>
            }
          </div>
        )
      })}
    </div>
  )
}
