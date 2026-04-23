import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import EventModal from '../components/EventModal'

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SECTOR_COLORS = {
  business: '#d4520f', 'real estate': '#10b981', health: '#10b981',
  'personal growth': '#f59e0b', family: '#ec4899', hobbies: '#a78bfa',
}

function getMonday(date) {
  const d = new Date(date); d.setHours(0,0,0,0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d }
function toStr(date) { return date.toISOString().split('T')[0] }

export default function Week({ onAddTask, onEditTask }) {
  const [view, setView] = useState('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [sectors, setSectors] = useState([])
  const [routines, setRoutines] = useState([])
  const [showRoutines, setShowRoutines] = useState(false)
  const [daySheet, setDaySheet] = useState(null) // { date, tasks, events }
  const [eventModal, setEventModal] = useState(null) // null | { event, date }

  // Lock body scroll when modal open
  useEffect(() => {
    const open = !!(eventModal || daySheet)
    const scrollY = window.scrollY
    if (open) {
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
    }
    return () => { document.documentElement.style.overflow = '' }
  }, [eventModal, daySheet])

  const today = new Date(); today.setHours(0,0,0,0)
  const todayStr = toStr(today)

  const baseMonday = getMonday(today)
  const monday = addDays(baseMonday, weekOffset * 7)
  const weekDates = Array.from({ length: 7 }, (_, i) => toStr(addDays(monday, i)))

  const monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const monthYear = monthDate.getFullYear()
  const monthMonth = monthDate.getMonth()

  useEffect(() => {
    supabase.from('sectors').select('*').order('sort_order').order('name').then(({ data }) => setSectors(data || []))
    supabase.from('routines').select('*').order('time').then(({ data }) => setRoutines(data || []))
  }, [])

  useEffect(() => {
    if (view === 'week') loadWeek()
    else loadMonth()
  }, [view, weekOffset, monthOffset])

  const loadWeek = async () => {
    setLoading(true)
    const [{ data: t }, { data: e }] = await Promise.all([
      supabase.from('tasks').select('*, projects(name)').gte('start_date', weekDates[0]).lte('start_date', weekDates[6]).order('time_block'),
      supabase.from('events').select('*').gte('start_date', weekDates[0]).lte('start_date', weekDates[6]).order('start_time'),
    ])
    setTasks(t || []); setEvents(e || [])
    setLoading(false)
  }

  const loadMonth = async () => {
    setLoading(true)
    const first = toStr(new Date(monthYear, monthMonth, 1))
    const last = toStr(new Date(monthYear, monthMonth + 1, 0))
    const [{ data: t }, { data: e }] = await Promise.all([
      supabase.from('tasks').select('*').gte('start_date', first).lte('start_date', last),
      supabase.from('events').select('*').gte('start_date', first).lte('start_date', last).order('start_time'),
    ])
    setTasks(t || []); setEvents(e || [])
    setLoading(false)
  }

  const reload = () => { view === 'week' ? loadWeek() : loadMonth() }

  const SECTORS = ['all', ...sectors.map(s => s.name.toLowerCase())]

  const timeToMins = t => {
    if (!t) return 999
    const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!m) return 999
    let h = parseInt(m[1]), min = parseInt(m[2])
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
    return h * 60 + min
  }
  const tasksForDay = date => tasks
    .filter(t => t.start_date === date && (activeFilter === 'all' || t.sector?.toLowerCase() === activeFilter))
    .sort((a, b) => timeToMins(a.time_block) - timeToMins(b.time_block))
  const eventsForDay = date => events
    .filter(e => e.start_date === date && (activeFilter === 'all' || e.sector?.toLowerCase() === activeFilter))
    .sort((a, b) => timeToMins(a.start_time) - timeToMins(b.start_time))
  // Convert routine time "HH:MM" to mins for sorting
  const routineToMins = t => {
    if (!t) return 999
    const [h, m] = t.split(':').map(Number)
    return h * 60 + (m || 0)
  }

  const allItemsForDay = date => {
    const t = tasksForDay(date).map(x => ({ ...x, _type: 'task' }))
    const e = eventsForDay(date).map(x => ({ ...x, _type: 'event' }))
    const r = showRoutines ? routines.map(x => ({ ...x, _type: 'routine' })) : []
    return [...t, ...e, ...r].sort((a, b) => {
      const at = a._type === 'task' ? timeToMins(a.time_block) : a._type === 'event' ? timeToMins(a.start_time) : routineToMins(a.time)
      const bt = b._type === 'task' ? timeToMins(b.time_block) : b._type === 'event' ? timeToMins(b.start_time) : routineToMins(b.time)
      return at - bt
    })
  }

  const openDaySheet = (date) => {
    setDaySheet({ date, tasks: tasksForDay(date), events: eventsForDay(date) })
  }

  const firstDayOfWeek = (new Date(monthYear, monthMonth, 1).getDay() + 6) % 7
  const daysInMonth = new Date(monthYear, monthMonth + 1, 0).getDate()
  const calCells = []
  for (let i = 0; i < firstDayOfWeek; i++) calCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d)
  while (calCells.length % 7 !== 0) calCells.push(null)

  const weekLabel = `${MONTH_NAMES[monday.getMonth()].slice(0,3)} ${monday.getDate()} — ${MONTH_NAMES[addDays(monday,6).getMonth()].slice(0,3)} ${addDays(monday,6).getDate()}, ${addDays(monday,6).getFullYear()}`
  const monthLabel = `${MONTH_NAMES[monthMonth]} ${monthYear}`

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>{view === 'week' ? 'Week' : 'Month'}</div>
          <div style={{ fontSize: 13, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>{view === 'week' ? weekLabel : monthLabel}</div>
        </div>
        <div style={{ display: 'flex', background: '#161618', border: '1px solid #242428', borderRadius: 10, overflow: 'hidden' }}>
          {['week','month'].map(v => (
            <div key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: view === v ? 'var(--accent-dim)' : 'transparent', color: view === v ? 'var(--accent)' : '#666', transition: 'all 0.15s' }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </div>
          ))}
        </div>
      </div>

      <div className="action-row" style={{ marginBottom: 14 }}>
        <div className="action-btn btn-task" onClick={() => onAddTask('today')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add task
        </div>
        <div className="action-btn btn-event" onClick={() => setEventModal({ event: null, date: todayStr })}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="2" stroke="var(--event-color)" strokeWidth="1.4"/><line x1="1.5" y1="6.5" x2="13.5" y2="6.5" stroke="var(--event-color)" strokeWidth="1.4"/><line x1="5" y1="1" x2="5" y2="4" stroke="var(--event-color)" strokeWidth="1.4" strokeLinecap="round"/><line x1="10" y1="1" x2="10" y2="4" stroke="var(--event-color)" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Add event
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div onClick={() => view === 'week' ? setWeekOffset(o => o-1) : setMonthOffset(o => o-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>‹</div>
        <div onClick={() => { setWeekOffset(0); setMonthOffset(0) }} style={{ fontSize: 12, fontWeight: 500, color: (view === 'week' ? weekOffset : monthOffset) === 0 ? '#444' : '#d4520f', cursor: 'pointer', padding: '6px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 20 }}>
          {(view === 'week' ? weekOffset : monthOffset) === 0 ? 'Current' : 'Jump to today'}
        </div>
        <div onClick={() => view === 'week' ? setWeekOffset(o => o+1) : setMonthOffset(o => o+1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>›</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {SECTORS.map(s => (
          <div key={s} onClick={() => setActiveFilter(s)} className={activeFilter === s ? 'pill-active' : 'pill-inactive'} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap' }}>
            {s === 'all' ? 'All' : sectors.find(sec => sec.name.toLowerCase() === s)?.name || s.charAt(0).toUpperCase() + s.slice(1)}
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
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} /> Tasks
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555' }}>
          <div style={{ width: 20, height: 8, borderRadius: 4, background: 'var(--event-dim)', border: '1px solid var(--event-color)' }} /> Events
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#444', padding: 20, fontSize: 13 }}>Loading…</div>}

      {/* WEEK VIEW */}
      {!loading && view === 'week' && weekDates.map((date, i) => {
        const items = allItemsForDay(date)
        const total = items.length
        const isToday = date === todayStr
        const isPast = date < todayStr
        const d = new Date(date + 'T00:00:00')
        return (
          <div key={date} style={{ marginBottom: 14 }}>
            <div onClick={() => openDaySheet(date)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: isToday ? 'var(--accent)' : 'transparent', border: isToday ? 'none' : `1px solid ${isPast ? '#1e1e24' : '#242428'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: isToday ? '#fff' : isPast ? '#444' : '#888', flexShrink: 0 }}>{d.getDate()}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: isToday ? 'var(--accent)' : isPast ? '#444' : '#888' }}>{DAY_NAMES[i]}</div>
              {total > 0 && <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'", marginLeft: 'auto' }}>{total} item{total > 1 ? 's' : ''}</div>}
              <div style={{ fontSize: 18, color: '#333' }}>+</div>
            </div>
            {total === 0
              ? <div onClick={() => openDaySheet(date)} style={{ padding: '10px 14px', fontSize: 13, color: '#2a2a2a', border: '1px dashed #1e1e24', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}>Tap to add</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map(item => item._type === 'event' ? (
                    <div key={item.id} onClick={() => setEventModal({ event: item, date: item.start_date })} className="event-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, cursor: 'pointer'  }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><circle cx="6" cy="6" r="5" stroke="var(--event-color)" strokeWidth="1.3"/><polyline points="6,3 6,6 8,7.5" stroke="var(--event-color)" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: 'var(--event-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        {item.location && <div style={{ fontSize: 11, color: 'var(--event-border)', marginTop: 2 }}>📍 {item.location}</div>}
                      </div>
                      <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--event-border)', flexShrink: 0, textAlign: 'right' }}>{item.start_time}{item.end_time ? ` → ${item.end_time}` : ''}</div>
                    </div>
                  ) : item._type === 'routine' ? (
                    <div key={item.id + '-r'} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#161618', border: '1px dashed #2a1a5c', borderRadius: 12, opacity: 0.75 }}>
                      <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#a78bfa', minWidth: 55, flexShrink: 0 }}>{item.time || '--:--'}</div>
                      <div style={{ width: 1, height: 20, background: '#2a1a5c', flexShrink: 0 }} />
                      <div style={{ fontSize: 13, color: '#888', flex: 1 }}>{item.icon && item.icon + ' '}{item.name}</div>
                      {item.duration && <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'" }}>{item.duration}m</div>}
                    </div>
                  ) : (
                    <div key={item.id} onClick={() => onEditTask(item)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#161618', border: '1px solid #1e1e24', borderRadius: 12, cursor: 'pointer', opacity: item.completed ? 0.5 : 1 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: SECTOR_COLORS[item.sector?.toLowerCase()] || '#555', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: item.completed ? '#555' : '#d4d2cc', textDecoration: item.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        {item.projects && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>{item.projects.name} →</div>}
                      </div>
                      {item.time_block && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555', flexShrink: 0 }}>{item.time_block}</div>}
                    </div>
                  ))}

                </div>
            }
          </div>
        )
      })}

      {/* MONTH VIEW */}
      {!loading && view === 'month' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {DAY_NAMES.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#444', padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {calCells.map((day, idx) => {
              if (!day) return <div key={idx} />
              const dateStr = toStr(new Date(monthYear, monthMonth, day))
              const dt = tasksForDay(dateStr)
              const de = eventsForDay(dateStr)
              const isToday = dateStr === todayStr
              const isPast = dateStr < todayStr
              return (
                <div key={idx} onClick={() => openDaySheet(dateStr)}
                  style={{ background: isToday ? 'var(--accent-dim)' : '#161618', border: `1px solid ${isToday ? 'var(--accent-border)' : '#1e1e24'}`, borderRadius: 8, padding: '4px 2px', height: 54, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: isToday ? 600 : 400, color: isToday ? 'var(--accent-text)' : isPast ? '#444' : '#888', marginBottom: 4 }}>{day}</div>
                  {/* Color dots for items */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                    {de.slice(0,3).map((ev, ti) => (
                      <div key={'e'+ti} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--event-color)', flexShrink: 0 }} />
                    ))}
                    {dt.slice(0,4).map((t, ti) => (
                      <div key={'t'+ti} style={{ width: 6, height: 6, borderRadius: '50%', background: SECTOR_COLORS[t.sector?.toLowerCase()] || '#555', flexShrink: 0 }} />
                    ))}
                  </div>
                  {(dt.length + de.length) > 0 && (
                    <div style={{ fontSize: 8, color: '#444', marginTop: 3, fontFamily: "'DM Mono'" }}>{dt.length + de.length}</div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 20 }}>
            <div className="section-label">This month</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[['Tasks', tasks.length, '#e8e6e1'],['Events', events.length, 'var(--event-color)'],['Done', tasks.filter(t=>t.completed).length, 'var(--accent)'],['Left', tasks.filter(t=>!t.completed).length, '#d4520f']].map(([label,val,color]) => (
                <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 500, color }}>{val}</div>
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
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>
              {new Date(daySheet.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div onClick={() => { setDaySheet(null); onAddTask('scheduled') }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Add task
              </div>
              <div onClick={() => { setEventModal({ event: null, date: daySheet.date }); setDaySheet(null) }} className="event-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, color: 'var(--event-color)', fontSize: 14, fontWeight: 500, cursor: 'pointer'  }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="2" stroke="var(--event-color)" strokeWidth="1.4"/><line x1="1.5" y1="6.5" x2="13.5" y2="6.5" stroke="var(--event-color)" strokeWidth="1.4"/><line x1="5" y1="1" x2="5" y2="4" stroke="var(--event-color)" strokeWidth="1.4" strokeLinecap="round"/><line x1="10" y1="1" x2="10" y2="4" stroke="var(--event-color)" strokeWidth="1.4" strokeLinecap="round"/></svg>
                Add event
              </div>
            </div>

            {daySheet.events.length === 0 && daySheet.tasks.length === 0 && (
              <div style={{ textAlign: 'center', color: '#444', fontSize: 13, padding: '20px 0' }}>Nothing scheduled — add something above</div>
            )}

            {daySheet.events.map(ev => (
              <div key={ev.id} onClick={() => { setDaySheet(null); setEventModal({ event: ev, date: ev.start_date }) }} className="event-card" style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 8, cursor: 'pointer'  }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="7" cy="7" r="6" stroke="var(--event-color)" strokeWidth="1.3"/><polyline points="7,4 7,7 9,8.5" stroke="var(--event-color)" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--event-color)', fontWeight: 500 }}>{ev.title}</div>
                  {ev.start_time && <div style={{ fontSize: 12, color: 'var(--event-border)', fontFamily: "'DM Mono'", marginTop: 2 }}>{ev.start_time} → {ev.end_time}</div>}
                  {ev.location && <div style={{ fontSize: 12, color: 'var(--event-border)', marginTop: 2 }}>📍 {ev.location}</div>}
                </div>
              </div>
            ))}

            {daySheet.tasks.map(task => (
              <div key={task.id} onClick={() => { setDaySheet(null); onEditTask(task) }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 12, marginBottom: 8, cursor: 'pointer', opacity: task.completed ? 0.5 : 1 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: SECTOR_COLORS[task.sector?.toLowerCase()] || '#555', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: task.completed ? '#555' : '#d4d2cc', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.name}</div>
                  {task.time_block && <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>{task.time_block}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event modal */}
      {eventModal && (
        <EventModal
          event={eventModal.event}
          date={eventModal.date}
          onClose={() => setEventModal(null)}
          onSaved={reload}
        />
      )}
    </div>
  )
}
