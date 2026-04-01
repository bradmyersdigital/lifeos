import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SECTOR_COLORS = {
  business: '#d4520f', 'real estate': '#3b82f6', health: '#10b981',
  'personal growth': '#f59e0b', family: '#ec4899', hobbies: '#a78bfa',
}

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - ((day + 6) % 7))
  d.setHours(0,0,0,0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toStr(date) {
  return date.toISOString().split('T')[0]
}

export default function Week({ onAddTask, onEditTask }) {
  const [view, setView] = useState('week') // 'week' | 'month'
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [tasks, setTasks] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const today = new Date()
  today.setHours(0,0,0,0)
  const todayStr = toStr(today)

  // Week calculation
  const baseMonday = getMonday(today)
  const monday = addDays(baseMonday, weekOffset * 7)
  const weekDates = Array.from({ length: 7 }, (_, i) => toStr(addDays(monday, i)))

  // Month calculation
  const baseMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthDate = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + monthOffset, 1)
  const monthYear = monthDate.getFullYear()
  const monthMonth = monthDate.getMonth()

  useEffect(() => {
    if (view === 'week') loadWeekTasks()
    else loadMonthTasks()
  }, [view, weekOffset, monthOffset])

  const loadWeekTasks = async () => {
    setLoading(true)
    const { data } = await supabase.from('tasks').select('*, projects(name)')
      .gte('start_date', weekDates[0])
      .lte('start_date', weekDates[6])
      .order('time_block')
    setTasks(data || [])
    setLoading(false)
  }

  const loadMonthTasks = async () => {
    setLoading(true)
    const firstDay = toStr(new Date(monthYear, monthMonth, 1))
    const lastDay = toStr(new Date(monthYear, monthMonth + 1, 0))
    const { data } = await supabase.from('tasks').select('*')
      .gte('start_date', firstDay)
      .lte('start_date', lastDay)
    setTasks(data || [])
    setLoading(false)
  }

  const SECTORS = ['all','business','real estate','health','personal growth','family','hobbies']

  const tasksForDay = (date) => tasks.filter(t =>
    t.start_date === date &&
    (activeFilter === 'all' || t.sector?.toLowerCase() === activeFilter)
  )

  // Month calendar grid
  const firstDayOfMonth = new Date(monthYear, monthMonth, 1)
  const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7 // Mon=0
  const daysInMonth = new Date(monthYear, monthMonth + 1, 0).getDate()
  const calendarCells = []
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  const weekLabel = `${MONTH_NAMES[monday.getMonth()].slice(0,3)} ${monday.getDate()} — ${MONTH_NAMES[addDays(monday,6).getMonth()].slice(0,3)} ${addDays(monday,6).getDate()}, ${addDays(monday,6).getFullYear()}`
  const monthLabel = `${MONTH_NAMES[monthMonth]} ${monthYear}`
  const isCurrentWeek = weekOffset === 0
  const isCurrentMonth = monthOffset === 0

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>{view === 'week' ? 'Week' : 'Month'}</div>
          <div style={{ fontSize: 13, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>
            {view === 'week' ? weekLabel : monthLabel}
          </div>
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', background: '#161618', border: '1px solid #242428', borderRadius: 10, overflow: 'hidden' }}>
          {['week','month'].map(v => (
            <div key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: view === v ? '#1e1208' : 'transparent', color: view === v ? '#d4520f' : '#666', transition: 'all 0.15s' }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </div>
          ))}
        </div>
      </div>

      {/* Add task buttons */}
      <div className="action-row" style={{ marginBottom: 14 }}>
        <div className="action-btn" style={{ background: '#1e1208', border: '1px solid #7a3410', color: '#e8823a' }} onClick={() => onAddTask('today')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add task for today
        </div>
        <div className="action-btn" style={{ background: '#161618', border: '1px solid #2a2a30', color: '#aaa' }} onClick={() => onAddTask('scheduled')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="2" stroke="#aaa" strokeWidth="1.4"/><line x1="1.5" y1="6.5" x2="13.5" y2="6.5" stroke="#aaa" strokeWidth="1.4"/><line x1="5" y1="1" x2="5" y2="4" stroke="#aaa" strokeWidth="1.4" strokeLinecap="round"/><line x1="10" y1="1" x2="10" y2="4" stroke="#aaa" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Schedule a task
        </div>
      </div>

      {/* Navigation row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div onClick={() => view === 'week' ? setWeekOffset(o => o - 1) : setMonthOffset(o => o - 1)}
          style={{ width: 36, height: 36, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>‹</div>

        <div onClick={() => view === 'week' ? setWeekOffset(0) : setMonthOffset(0)}
          style={{ fontSize: 12, fontWeight: 500, color: (view === 'week' ? isCurrentWeek : isCurrentMonth) ? '#444' : '#d4520f', cursor: 'pointer', padding: '6px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 20 }}>
          {(view === 'week' ? isCurrentWeek : isCurrentMonth) ? 'Current' : 'Jump to today'}
        </div>

        <div onClick={() => view === 'week' ? setWeekOffset(o => o + 1) : setMonthOffset(o => o + 1)}
          style={{ width: 36, height: 36, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>›</div>
      </div>

      {/* Sector filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {SECTORS.map(s => (
          <div key={s} onClick={() => setActiveFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', transition: 'all 0.15s', background: activeFilter === s ? '#1e1208' : '#161618', borderColor: activeFilter === s ? '#7a3410' : '#242428', color: activeFilter === s ? '#d4520f' : '#666' }}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#444', padding: 20, fontSize: 13 }}>Loading…</div>}

      {/* ── WEEK VIEW ── */}
      {!loading && view === 'week' && (
        <div>
          {weekDates.map((date, i) => {
            const dayTasks = tasksForDay(date)
            const isToday = date === todayStr
            const isPast = date < todayStr
            const d = new Date(date + 'T00:00:00')
            return (
              <div key={date} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: isToday ? '#d4520f' : 'transparent', border: isToday ? 'none' : `1px solid ${isPast ? '#1e1e24' : '#242428'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: isToday ? '#fff' : isPast ? '#444' : '#888', flexShrink: 0 }}>{d.getDate()}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isToday ? '#d4520f' : isPast ? '#444' : '#888' }}>{DAY_NAMES[i]}</div>
                  {dayTasks.length > 0 && <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'", marginLeft: 'auto' }}>{dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}</div>}
                </div>
                {dayTasks.length === 0
                  ? <div style={{ padding: '10px 14px', fontSize: 13, color: '#2a2a2a', border: '1px dashed #1e1e24', borderRadius: 10, textAlign: 'center' }}>—</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {dayTasks.map(task => (
                        <div key={task.id} onClick={() => onEditTask(task)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#161618', border: '1px solid #1e1e24', borderRadius: 12, cursor: 'pointer', opacity: task.completed ? 0.5 : 1, transition: 'border-color 0.15s' }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: SECTOR_COLORS[task.sector?.toLowerCase()] || '#555', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, color: task.completed ? '#555' : '#d4d2cc', textDecoration: task.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</div>
                            {task.projects && <div style={{ fontSize: 11, color: '#d4520f', marginTop: 2 }}>{task.projects.name} →</div>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                            {task.time_block && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555' }}>{task.time_block}</div>}
                            {task.urgency && task.urgency !== 'medium' && (
                              <div style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: task.urgency === 'urgent' ? '#2a0a0a' : '#1e1208', color: task.urgency === 'urgent' ? '#f87171' : '#e8823a' }}>{task.urgency}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )
          })}
        </div>
      )}

      {/* ── MONTH VIEW ── */}
      {!loading && view === 'month' && (
        <div>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#444', padding: '4px 0', letterSpacing: '0.06em' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {calendarCells.map((day, idx) => {
              if (!day) return <div key={idx} />
              const dateStr = toStr(new Date(monthYear, monthMonth, day))
              const dayTasks = tasksForDay(dateStr)
              const isToday = dateStr === todayStr
              const isPast = dateStr < todayStr
              return (
                <div key={idx} style={{ background: isToday ? '#1e1208' : '#161618', border: `1px solid ${isToday ? '#7a3410' : '#1e1e24'}`, borderRadius: 10, padding: '6px 4px', minHeight: 72, cursor: dayTasks.length > 0 ? 'pointer' : 'default' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isToday ? '#e8823a' : isPast ? '#444' : '#888', textAlign: 'center', marginBottom: 4 }}>{day}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayTasks.slice(0, 3).map((t, ti) => (
                      <div key={ti} onClick={() => onEditTask(t)} style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: (SECTOR_COLORS[t.sector?.toLowerCase()] || '#555') + '33', color: SECTOR_COLORS[t.sector?.toLowerCase()] || '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', lineHeight: 1.4 }}>
                        {t.name}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div style={{ fontSize: 9, color: '#555', textAlign: 'center' }}>+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Month summary */}
          <div style={{ marginTop: 20 }}>
            <div className="section-label">This month</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[
                ['Total tasks', tasks.length, '#e8e6e1'],
                ['Completed', tasks.filter(t => t.completed).length, '#10b981'],
                ['Remaining', tasks.filter(t => !t.completed).length, '#d4520f'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 500, color }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
