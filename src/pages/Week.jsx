import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { fmtTime, eventOccursOn } from '../utils'
import EventModal from '../components/EventModal'

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
function toStr(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const SECTOR_COLORS = { business:'#d4520f','real estate':'#10b981',health:'#10b981','personal growth':'#a78bfa',hobbies:'#f59e0b',family:'#f43f5e' }

function timeToMins(t) {
  if (!t) return 9999
  const m = t.match(/(\d{1,2}):(\d{2})/)
  if (!m) return 9999
  let h = parseInt(m[1]), min = parseInt(m[2])
  if (t.includes('PM') && h !== 12) h += 12
  if (t.includes('AM') && h === 12) h = 0
  return h * 60 + min
}

export default function Week({ onAddTask, onEditTask }) {
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [routines, setRoutines] = useState([])
  const [sectors, setSectors] = useState([])
  const [view, setView] = useState('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [activeFilter, setActiveFilter] = useState('All')
  const [showRoutines, setShowRoutines] = useState(false)
  const [showOverdue, setShowOverdue] = useState(false)
  const [eventModal, setEventModal] = useState(null)
  const [daySheet, setDaySheet] = useState(null)
  const touchStartX = useRef(null)
  const todayRef = useRef(null)

  const today = new Date()
  const todayStr = toStr(today)
  const todayDow = today.getDay()
  const daysFromMon = (todayDow + 6) % 7

  // Week dates (Mon–Sun)
  const weekDates = Array.from({length: 7}, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - daysFromMon + i + weekOffset * 7)
    return toStr(d)
  })

  useEffect(() => {
    if (view === 'week' && weekOffset === 0 && todayRef.current) {
      setTimeout(() => {
        todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [view, weekOffset])

  useEffect(() => {
    // Fetch wide range to cover recurring events
    const from = weekDates[0]
    const far = new Date(today); far.setFullYear(far.getFullYear() - 1)
    supabase.from('tasks').select('*, projects(name)').then(({ data }) => setTasks(data || []))
    supabase.from('events').select('*').then(({ data }) => setEvents(data || []))
    supabase.from('routines').select('*').order('time').then(({ data }) => setRoutines(data || []))
    supabase.from('sectors').select('*').then(({ data }) => setSectors(data || []))
  }, [weekOffset, monthOffset])

  const toggleTask = async (task) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
  }

  const tasksForDay = (date) => {
    let t = tasks.filter(t => t.start_date === date)
    if (activeFilter !== 'All') t = t.filter(t => t.sector === activeFilter)
    return t.sort((a,b) => timeToMins(a.time_block) - timeToMins(b.time_block))
  }

  const eventsForDay = (date) => {
    return events.filter(ev => eventOccursOn(ev, date))
      .sort((a,b) => timeToMins(a.start_time) - timeToMins(b.start_time))
  }

  const allItemsForDay = (date) => {
    const t = tasksForDay(date).map(x => ({ ...x, _type: 'task' }))
    const e = eventsForDay(date).map(x => ({ ...x, _type: 'event' }))
    const r = showRoutines ? routines.map(x => ({ ...x, _type: 'routine' })) : []
    return [...t, ...e, ...r].sort((a,b) => {
      const at = a._type==='task' ? timeToMins(a.time_block) : a._type==='event' ? timeToMins(a.start_time) : timeToMins(a.time)
      const bt = b._type==='task' ? timeToMins(b.time_block) : b._type==='event' ? timeToMins(b.start_time) : timeToMins(b.time)
      return at - bt
    })
  }

  // Overdue tasks — incomplete tasks with start_date before today
  const overdueTasks = tasks.filter(t => !t.completed && t.start_date && t.start_date < todayStr)
    .filter(t => activeFilter === 'All' || t.sector === activeFilter)
    .sort((a,b) => a.start_date > b.start_date ? 1 : -1)

  const filters = ['All', ...sectors.map(s => s.name)]

  // Month view
  const monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const monthYear = monthDate.getFullYear(), monthMonth = monthDate.getMonth()
  const daysInMonth = new Date(monthYear, monthMonth + 1, 0).getDate()
  const firstDow = (new Date(monthYear, monthMonth, 1).getDay() + 6) % 7
  const calCells = [...Array(firstDow).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)]

  const openDaySheet = (date) => {
    setDaySheet({ date, tasks: tasksForDay(date), events: eventsForDay(date) })
  }

  // Touch swipe for week
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (view === 'week') setWeekOffset(o => o + (dx < 0 ? 1 : -1))
      else setMonthOffset(o => o + (dx < 0 ? 1 : -1))
    }
    touchStartX.current = null
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>{view === 'week' ? 'Week' : 'Month'}</div>
          <div style={{ fontSize: 12, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>
            {view === 'week'
              ? `${weekDates[0]} — ${weekDates[6]}`
              : `${MONTH_NAMES[monthMonth]} ${monthYear}`}
          </div>
        </div>
        <div style={{ display: 'flex', background: '#161618', border: '1px solid #242428', borderRadius: 10, overflow: 'hidden' }}>
          {['week','month'].map(v => (
            <div key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: view === v ? 'var(--accent-dim)' : 'transparent', color: view === v ? 'var(--accent)' : '#666' }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </div>
          ))}
        </div>
      </div>

      {/* Add buttons */}
      <div className="action-row" style={{ marginBottom: 14 }}>
        <div className="action-btn btn-task" onClick={() => onAddTask('today')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add task
        </div>
        <div className="action-btn btn-event" onClick={() => setEventModal({ event: null, date: todayStr })}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/><line x1="1.5" y1="6.5" x2="13.5" y2="6.5" stroke="currentColor" strokeWidth="1.4"/><line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="10" y1="1" x2="10" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Add event
        </div>
      </div>

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div onClick={() => view==='week' ? setWeekOffset(o=>o-1) : setMonthOffset(o=>o-1)} style={{ width: 32, height: 32, borderRadius: 8, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', fontSize: 16 }}>‹</div>
        <div onClick={() => { setWeekOffset(0); setMonthOffset(0) }} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 500, color: (view==='week'?weekOffset:monthOffset)===0 ? '#444' : 'var(--accent)', cursor: 'pointer', padding: '6px 0', background: '#161618', border: '1px solid #242428', borderRadius: 20 }}>Current</div>
        <div onClick={() => view==='week' ? setWeekOffset(o=>o+1) : setMonthOffset(o=>o+1)} style={{ width: 32, height: 32, borderRadius: 8, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', fontSize: 16 }}>›</div>
      </div>

      {/* Sector filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10, WebkitOverflowScrolling: 'touch' }}>
        {filters.map(s => (
          <div key={s} onClick={() => setActiveFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', background: activeFilter === s ? 'var(--accent-dim)' : '#161618', borderColor: activeFilter === s ? 'var(--accent-border)' : '#242428', color: activeFilter === s ? 'var(--accent)' : '#666' }}>
            {s}
          </div>
        ))}
      </div>

      {/* Routines toggle */}
      <div style={{ marginBottom: 12 }}>
        <div onClick={() => setShowRoutines(!showRoutines)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: showRoutines ? 'var(--accent-dim)' : '#161618', borderColor: showRoutines ? 'var(--accent-border)' : '#242428', color: showRoutines ? 'var(--accent)' : '#666' }}>
          🕐 {showRoutines ? 'Hide routines' : 'Show routines'}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: 12, color: '#555' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} /> Tasks</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 20, height: 8, borderRadius: 4, background: 'var(--event-dim)', border: '1px solid var(--event-color)' }} /> Events</div>
      </div>

      {/* ── WEEK VIEW ── */}
      {view === 'week' && (
        <div>
          {weekDates.map((date, i) => {
            const isPast = date < todayStr
            const isToday = date === todayStr
            const d = new Date(date + 'T00:00:00')
            const items = allItemsForDay(date)
            return (
              <div key={date} ref={isToday ? todayRef : null} style={{ marginBottom: 16 }}>
                {/* Day header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: isToday ? 'var(--accent)' : 'transparent', border: isToday ? 'none' : `1px solid ${isPast ? '#1e1e24' : '#242428'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: isToday ? '#fff' : isPast ? '#444' : '#888', flexShrink: 0 }}>{d.getDate()}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isToday ? 'var(--accent)' : isPast ? '#444' : '#888' }}>{DAY_NAMES[i]}</div>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontSize: 11, color: '#444' }}>{items.length > 0 ? `${items.length} item${items.length>1?'s':''}` : ''}</div>
                  <div onClick={() => openDaySheet(date)} style={{ fontSize: 18, color: '#444', cursor: 'pointer', paddingLeft: 8 }}>+</div>
                </div>

                {items.length === 0
                  ? <div onClick={() => openDaySheet(date)} style={{ padding: '10px 14px', fontSize: 13, color: '#2a2a2a', border: '1px dashed #1e1e24', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}>Tap to add</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {items.map(item => {
                        if (item._type === 'event') return (
                          <div key={item.id} onClick={() => setEventModal({ event: item, date: item.start_date })} className="event-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, cursor: 'pointer' }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><circle cx="6" cy="6" r="5" stroke="var(--event-color)" strokeWidth="1.3"/><polyline points="6,3 6,6 8,7.5" stroke="var(--event-color)" strokeWidth="1.3" strokeLinecap="round"/></svg>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="event-text" style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                              {item.location && <div style={{ fontSize: 11, color: 'var(--event-border)', marginTop: 2 }}>📍 {item.location}</div>}
                            </div>
                            <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--event-border)', flexShrink: 0, textAlign: 'right' }}>
                              {fmtTime(item.start_time)}{item.end_time ? ` → ${fmtTime(item.end_time)}` : ''}
                            </div>
                          </div>
                        )
                        if (item._type === 'routine') return (
                          <div key={item.id + '-r'} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#161618', border: '1px dashed #2a1a5c', borderRadius: 12, opacity: 0.75 }}>
                            <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#a78bfa', minWidth: 55, flexShrink: 0 }}>{fmtTime(item.time)}</div>
                            <div style={{ width: 1, height: 20, background: '#2a1a5c', flexShrink: 0 }} />
                            <div style={{ fontSize: 13, color: '#888', flex: 1 }}>{item.icon && item.icon + ' '}{item.name}</div>
                            {item.duration && <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'" }}>{item.duration}m</div>}
                          </div>
                        )
                        // Task
                        const isOverdue = item.start_date < todayStr && !item.completed
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#161618', border: `1px solid ${isOverdue ? '#3a1010' : '#1e1e24'}`, borderRadius: 12, opacity: item.completed ? 0.5 : 1 }}>
                            <div onClick={e => { e.stopPropagation(); toggleTask(item) }} style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${item.completed ? 'var(--accent)' : '#333'}`, background: item.completed ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                              {item.completed && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                            </div>
                            <div onClick={() => onEditTask(item)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                              <div style={{ fontSize: 14, color: item.completed ? '#555' : '#d4d2cc', textDecoration: item.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                                {item.projects && <div style={{ fontSize: 11, color: 'var(--accent)' }}>{item.projects.name} →</div>}
                                {isOverdue && <div style={{ fontSize: 11, color: '#f87171', fontFamily: "'DM Mono'" }}>⚠ overdue · {item.start_date}</div>}
                              </div>
                            </div>
                            {item.time_block && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555', flexShrink: 0 }}>{fmtTime(item.time_block)}</div>}
                          </div>
                        )
                      })}
                    </div>
                }
              </div>
            )
          })}

          {/* ── OVERDUE SECTION ── */}
          {overdueTasks.length > 0 && (
            <div style={{ marginTop: 8, marginBottom: 16, paddingTop: 16, borderTop: '1px solid #1e1e24' }}>
              <div onClick={() => setShowOverdue(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: showOverdue ? 12 : 0, cursor: 'pointer' }}>
                <div style={{ fontSize: 16 }}>⚠️</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#f87171' }}>Overdue</div>
                <div style={{ fontSize: 12, color: '#555', flex: 1 }}>{overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''}</div>
                <div style={{ fontSize: 18, color: '#555', transform: showOverdue ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
              </div>
              {showOverdue && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {overdueTasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#1a0a0a', border: '1px solid #3a1010', borderRadius: 12 }}>
                      <div onClick={() => toggleTask(task)} style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #f87171', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }} />
                      <div onClick={() => onEditTask(task)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                        <div style={{ fontSize: 14, color: '#d4d2cc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</div>
                        <div style={{ fontSize: 11, color: '#f87171', fontFamily: "'DM Mono'", marginTop: 2 }}>Was due {task.start_date}</div>
                      </div>
                      {task.time_block && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555', flexShrink: 0 }}>{fmtTime(task.time_block)}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Month stats */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #1e1e24' }}>
            <div className="section-label">This month</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[['Tasks', tasks.filter(t=>t.start_date>=toStr(new Date(today.getFullYear(),today.getMonth(),1))&&t.start_date<=toStr(new Date(today.getFullYear(),today.getMonth()+1,0))).length, '#e8e6e1'],
                ['Events', events.filter(e=>e.start_date>=toStr(new Date(today.getFullYear(),today.getMonth(),1))&&e.start_date<=toStr(new Date(today.getFullYear(),today.getMonth()+1,0))).length, 'var(--event-color)'],
                ['Done', tasks.filter(t=>t.completed).length, '#10b981'],
                ['Left', tasks.filter(t=>!t.completed).length, 'var(--accent)']
              ].map(([label,val,color]) => (
                <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 500, color }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MONTH VIEW ── */}
      {view === 'month' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {['M','T','W','T','F','S','S'].map((d,i) => <div key={i} style={{ textAlign:'center',fontSize:11,fontWeight:600,color:'#444',padding:'4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {calCells.map((day, idx) => {
              if (!day) return <div key={idx} />
              const dateStr = toStr(new Date(monthYear, monthMonth, day))
              const isToday = dateStr === todayStr
              const isPast = dateStr < todayStr
              const dt = tasksForDay(dateStr)
              const de = eventsForDay(dateStr)
              return (
                <div key={idx} onClick={() => openDaySheet(dateStr)} style={{ background: isToday ? 'var(--accent-dim)' : '#161618', border: `1px solid ${isToday ? 'var(--accent-border)' : '#1e1e24'}`, borderRadius: 8, padding: '5px 3px', height: 54, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: isToday?600:400, color: isToday ? 'var(--accent-text)' : isPast ? '#444' : '#888', marginBottom: 4 }}>{day}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                    {de.slice(0,3).map((ev,ti) => <div key={'e'+ti} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--event-color)' }} />)}
                    {dt.slice(0,4).map((t,ti) => <div key={'t'+ti} style={{ width: 6, height: 6, borderRadius: '50%', background: SECTOR_COLORS[t.sector?.toLowerCase()] || 'var(--accent)' }} />)}
                  </div>
                  {(dt.length + de.length) > 0 && <div style={{ fontSize: 8, color: '#444', marginTop: 2 }}>{dt.length + de.length}</div>}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e1e24' }}>
            <div className="section-label">This month</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[['Tasks', tasks.length,'#e8e6e1'],['Events', events.length,'var(--event-color)'],['Done', tasks.filter(t=>t.completed).length,'#10b981'],['Left', tasks.filter(t=>!t.completed).length,'var(--accent)']].map(([l,v,c]) => (
                <div key={l} style={{ background:'#161618',border:'1px solid #242428',borderRadius:12,padding:12 }}>
                  <div style={{ fontSize:11,color:'#555',marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:20,fontWeight:500,color:c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Day sheet modal */}
      {daySheet && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDaySheet(null)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">
              {new Date(daySheet.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              <div className="modal-close" onClick={() => setDaySheet(null)}>×</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div className="action-btn btn-task" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setDaySheet(null); onAddTask('today') }}>
                + Task
              </div>
              <div className="action-btn btn-event" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setDaySheet(null); setEventModal({ event: null, date: daySheet.date }) }}>
                + Event
              </div>
            </div>
            {daySheet.events.map(ev => (
              <div key={ev.id} onClick={() => { setDaySheet(null); setEventModal({ event: ev, date: ev.start_date }) }} className="event-card" style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 8, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="7" cy="7" r="6" stroke="var(--event-color)" strokeWidth="1.3"/><polyline points="7,4 7,7 9,8.5" stroke="var(--event-color)" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <div style={{ flex: 1 }}>
                  <div className="event-text" style={{ fontSize: 14, fontWeight: 500 }}>{ev.title}</div>
                  {ev.start_time && <div style={{ fontSize: 12, color: 'var(--event-border)', fontFamily: "'DM Mono'", marginTop: 2 }}>{fmtTime(ev.start_time)}{ev.end_time ? ` → ${fmtTime(ev.end_time)}` : ''}</div>}
                  {ev.location && <div style={{ fontSize: 12, color: 'var(--event-border)', marginTop: 2 }}>📍 {ev.location}</div>}
                </div>
              </div>
            ))}
            {daySheet.tasks.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 12, marginBottom: 6, cursor: 'pointer' }} onClick={() => { setDaySheet(null); onEditTask(task) }}>
                <div onClick={e => { e.stopPropagation(); toggleTask(task).then(() => setDaySheet(ds => ({ ...ds, tasks: ds.tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t) }))) }}
                  style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${task.completed ? 'var(--accent)' : '#333'}`, background: task.completed ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                  {task.completed && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: task.completed ? '#555' : '#d4d2cc', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.name}</div>
                  {task.time_block && <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>{fmtTime(task.time_block)}</div>}
                </div>
              </div>
            ))}
            {daySheet.tasks.length === 0 && daySheet.events.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#444', fontSize: 13 }}>Nothing scheduled — add something above</div>
            )}
          </div>
        </div>
      )}

      {/* Event modal */}
      {eventModal && (
        <EventModal event={eventModal.event} date={eventModal.date} sectors={sectors}
          onClose={() => setEventModal(null)}
          onSaved={() => { setEventModal(null); supabase.from('events').select('*').then(({ data }) => setEvents(data || [])) }}
        />
      )}
    </div>
  )
}
