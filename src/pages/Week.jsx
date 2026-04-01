import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import EventModal from '../components/EventModal'

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SECTOR_COLORS = {
  business: '#d4520f', 'real estate': '#3b82f6', health: '#10b981',
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
  const [daySheet, setDaySheet] = useState(null) // { date, tasks, events }
  const [eventModal, setEventModal] = useState(null) // null | { event, date }

  const today = new Date(); today.setHours(0,0,0,0)
  const todayStr = toStr(today)

  const baseMonday = getMonday(today)
  const monday = addDays(baseMonday, weekOffset * 7)
  const weekDates = Array.from({ length: 7 }, (_, i) => toStr(addDays(monday, i)))

  const monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const monthYear = monthDate.getFullYear()
  const monthMonth = monthDate.getMonth()

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

  const SECTORS = ['all','business','real estate','health','personal growth','family','hobbies']

  const tasksForDay = date => tasks.filter(t => t.start_date === date && (activeFilter === 'all' || t.sector?.toLowerCase() === activeFilter))
  const eventsForDay = date => events.filter(e => e.start_date === date && (activeFilter === 'all' || e.sector?.toLowerCase() === activeFilter))

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
            <div key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: view === v ? '#1e1208' : 'transparent', color: view === v ? '#d4520f' : '#666', transition: 'all 0.15s' }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </div>
          ))}
        </div>
      </div>

      <div className="action-row" style={{ marginBottom: 14 }}>
        <div className="action-btn" style={{ background: '#1e1208', border: '1px solid #7a3410', color: '#e8823a' }} onClick={() => onAddTask('today')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add task
        </div>
        <div className="action-btn" style={{ background: '#0c1e36', border: '1px solid #1a3a5c', color: '#93c5fd' }} onClick={() => setEventModal({ event: null, date: todayStr })}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="2" stroke="#93c5fd" strokeWidth="1.4"/><line x1="1.5" y1="6.5" x2="13.5" y2="6.5" stroke="#93c5fd" strokeWidth="1.4"/><line x1="5" y1="1" x2="5" y2="4" stroke="#93c5fd" strokeWidth="1.4" strokeLinecap="round"/><line x1="10" y1="1" x2="10" y2="4" stroke="#93c5fd" strokeWidth="1.4" strokeLinecap="round"/></svg>
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
          <div key={s} onClick={() => setActiveFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', transition: 'all 0.15s', background: activeFilter === s ? '#1e1208' : '#161618', borderColor: activeFilter === s ? '#7a3410' : '#242428', color: activeFilter === s ? '#d4520f' : '#666' }}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4520f' }} /> Tasks
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555' }}>
          <div style={{ width: 20, height: 8, borderRadius: 4, background: '#1a3a5c', border: '1px solid #3b82f6' }} /> Events
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#444', padding: 20, fontSize: 13 }}>Loading…</div>}

      {/* WEEK VIEW */}
      {!loading && view === 'week' && weekDates.map((date, i) => {
        const dt = tasksForDay(date)
        const de = eventsForDay(date)
        const total = dt.length + de.length
        const isToday = date === todayStr
        const isPast = date < todayStr
        const d = new Date(date + 'T00:00:00')
        return (
          <div key={date} style={{ marginBottom: 14 }}>
            <div onClick={() => openDaySheet(date)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: isToday ? '#d4520f' : 'transparent', border: isToday ? 'none' : `1px solid ${isPast ? '#1e1e24' : '#242428'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: isToday ? '#fff' : isPast ? '#444' : '#888', flexShrink: 0 }}>{d.getDate()}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: isToday ? '#d4520f' : isPast ? '#444' : '#888' }}>{DAY_NAMES[i]}</div>
              {total > 0 && <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'", marginLeft: 'auto' }}>{total} item{total > 1 ? 's' : ''}</div>}
              <div style={{ fontSize: 18, color: '#333' }}>+</div>
            </div>
            {total === 0
              ? <div onClick={() => openDaySheet(date)} style={{ padding: '10px 14px', fontSize: 13, color: '#2a2a2a', border: '1px dashed #1e1e24', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}>Tap to add</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {de.map(ev => (
                    <div key={ev.id} onClick={() => setEventModal({ event: ev, date: ev.start_date })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#0c1a2e', border: '1px solid #1a3a5c', borderRadius: 12, cursor: 'pointer' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><circle cx="6" cy="6" r="5" stroke="#3b82f6" strokeWidth="1.3"/><polyline points="6,3 6,6 8,7.5" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: '#93c5fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                        {ev.location && <div style={{ fontSize: 11, color: '#1e5a8c', marginTop: 2 }}>📍 {ev.location}</div>}
                      </div>
                      {(ev.start_time || ev.end_time) && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#1e5a8c', flexShrink: 0, textAlign: 'right' }}>{ev.start_time}{ev.end_time ? ` → ${ev.end_time}` : ''}</div>}
                    </div>
                  ))}
                  {dt.map(task => (
                    <div key={task.id} onClick={() => onEditTask(task)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#161618', border: '1px solid #1e1e24', borderRadius: 12, cursor: 'pointer', opacity: task.completed ? 0.5 : 1 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: SECTOR_COLORS[task.sector?.toLowerCase()] || '#555', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: task.completed ? '#555' : '#d4d2cc', textDecoration: task.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</div>
                        {task.projects && <div style={{ fontSize: 11, color: '#d4520f', marginTop: 2 }}>{task.projects.name} →</div>}
                      </div>
                      {task.time_block && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555', flexShrink: 0 }}>{task.time_block}</div>}
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
                <div key={idx} onClick={() => openDaySheet(dateStr)} style={{ background: isToday ? '#1e1208' : '#161618', border: `1px solid ${isToday ? '#7a3410' : '#1e1e24'}`, borderRadius: 10, padding: '6px 4px', minHeight: 72, cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isToday ? '#e8823a' : isPast ? '#444' : '#888', textAlign: 'center', marginBottom: 4 }}>{day}</div>
                  {de.slice(0,1).map((ev, ti) => (
                    <div key={ti} style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: '#0c1a2e', color: '#3b82f6', border: '1px solid #1a3a5c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      🗓 {ev.title}
                    </div>
                  ))}
                  {dt.slice(0, 2).map((t, ti) => (
                    <div key={ti} style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: (SECTOR_COLORS[t.sector?.toLowerCase()] || '#555') + '33', color: SECTOR_COLORS[t.sector?.toLowerCase()] || '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      {t.name}
                    </div>
                  ))}
                  {(dt.length + de.length) > 3 && <div style={{ fontSize: 9, color: '#555', textAlign: 'center' }}>+{dt.length + de.length - 3}</div>}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 20 }}>
            <div className="section-label">This month</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[['Tasks', tasks.length, '#e8e6e1'],['Events', events.length, '#93c5fd'],['Done', tasks.filter(t=>t.completed).length, '#10b981'],['Left', tasks.filter(t=>!t.completed).length, '#d4520f']].map(([label,val,color]) => (
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
              <div onClick={() => { setDaySheet(null); onAddTask('scheduled') }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, background: '#1e1208', border: '1px solid #7a3410', color: '#e8823a', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Add task
              </div>
              <div onClick={() => { setEventModal({ event: null, date: daySheet.date }); setDaySheet(null) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, background: '#0c1e36', border: '1px solid #1a3a5c', color: '#93c5fd', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="2" stroke="#93c5fd" strokeWidth="1.4"/><line x1="1.5" y1="6.5" x2="13.5" y2="6.5" stroke="#93c5fd" strokeWidth="1.4"/><line x1="5" y1="1" x2="5" y2="4" stroke="#93c5fd" strokeWidth="1.4" strokeLinecap="round"/><line x1="10" y1="1" x2="10" y2="4" stroke="#93c5fd" strokeWidth="1.4" strokeLinecap="round"/></svg>
                Add event
              </div>
            </div>

            {daySheet.events.length === 0 && daySheet.tasks.length === 0 && (
              <div style={{ textAlign: 'center', color: '#444', fontSize: 13, padding: '20px 0' }}>Nothing scheduled — add something above</div>
            )}

            {daySheet.events.map(ev => (
              <div key={ev.id} onClick={() => { setDaySheet(null); setEventModal({ event: ev, date: ev.start_date }) }} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#0c1a2e', border: '1px solid #1a3a5c', borderRadius: 12, marginBottom: 8, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="7" cy="7" r="6" stroke="#3b82f6" strokeWidth="1.3"/><polyline points="7,4 7,7 9,8.5" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#93c5fd', fontWeight: 500 }}>{ev.title}</div>
                  {ev.start_time && <div style={{ fontSize: 12, color: '#1e5a8c', fontFamily: "'DM Mono'", marginTop: 2 }}>{ev.start_time} → {ev.end_time}</div>}
                  {ev.location && <div style={{ fontSize: 12, color: '#1e5a8c', marginTop: 2 }}>📍 {ev.location}</div>}
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
