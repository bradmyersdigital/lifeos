import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { fmtTime, eventOccursOn, fmtDate } from '../utils'
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
  const [sectors, setSectors] = useState([])
  const [view, setView] = useState('week')
  const [dayOffset, setDayOffset] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [activeFilter, setActiveFilter] = useState('All')
  const [showOverdue, setShowOverdue] = useState(false)
  const [eventModal, setEventModal] = useState(null)
  const [daySheet, setDaySheet] = useState(null)
  const touchStartX = useRef(null)

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
    // no date filter — the month view scrolls across a wide window
    supabase.from('tasks').select('*, projects(name)').then(({ data }) => setTasks(data || []))
    supabase.from('events').select('*').then(({ data }) => setEvents(data || []))
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
    return [...t, ...e].sort((a,b) => {
      const at = a._type==='task' ? timeToMins(a.time_block) : a._type==='event' ? timeToMins(a.start_time) : timeToMins(a.time)
      const bt = b._type==='task' ? timeToMins(b.time_block) : b._type==='event' ? timeToMins(b.start_time) : timeToMins(b.time)
      return at - bt
    })
  }

  // Overdue tasks — incomplete tasks with start_date before today
  const overdueTasks = tasks.filter(t => !t.completed && t.start_date && t.start_date < todayStr)
    .filter(t => activeFilter === 'All' || t.sector === activeFilter)
    .sort((a,b) => a.start_date > b.start_date ? 1 : -1)

  useEffect(() => {
    if (view !== 'month') return
    selectedChipRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [monthOffset, view])

  // Day view
  const dayDate = (() => { const d = new Date(today); d.setDate(d.getDate() + dayOffset); return toStr(d) })()

  const filters = ['All', ...sectors.map(s => s.name)]

  // Month view
  const monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const monthYear = monthDate.getFullYear(), monthMonth = monthDate.getMonth()

  const openDaySheet = (date) => {
    setDaySheet({ date, tasks: tasksForDay(date), events: eventsForDay(date) })
  }

  // Swipe to page. Attached to the calendar surface only — on the root it
  // fired anywhere on the page, including the filters and header.
  const touchStartY = useRef(null)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    // must be clearly horizontal, or a diagonal scroll flips the month
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      if (view === 'day') setDayOffset(o => o + (dx < 0 ? 1 : -1))
      else if (view === 'week') setWeekOffset(o => o + (dx < 0 ? 1 : -1))
      else setMonthOffset(o => o + (dx < 0 ? 1 : -1))
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  // Month/year strip — a rolling window around today
  const MONTH_STRIP = Array.from({ length: 36 }, (_, i) => i - 12)
  const selectedChipRef = useRef(null)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>{view === 'day' ? 'Day' : view === 'week' ? 'Week' : 'Month'}</div>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {['day','week','month'].map(v => (
            <div key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: view === v ? 'var(--accent-dim)' : 'transparent', color: view === v ? 'var(--accent)' : 'var(--text-muted)' }}>
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
        <div onClick={() => view==='day' ? setDayOffset(o=>o-1) : view==='week' ? setWeekOffset(o=>o-1) : setMonthOffset(o=>o-1)} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>‹</div>
        <div onClick={() => { setWeekOffset(0); setMonthOffset(0); setDayOffset(0) }} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 500, color: (view==='day'?dayOffset:view==='week'?weekOffset:monthOffset)===0 ? 'var(--text-dim)' : 'var(--accent)', cursor: 'pointer', padding: '6px 0', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>Current</div>
        <div onClick={() => view==='day' ? setDayOffset(o=>o+1) : view==='week' ? setWeekOffset(o=>o+1) : setMonthOffset(o=>o+1)} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>›</div>
      </div>

      {/* Sector filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10, WebkitOverflowScrolling: 'touch' }}>
        {filters.map(s => (
          <div key={s} onClick={() => setActiveFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', background: activeFilter === s ? 'var(--accent-dim)' : 'var(--bg-card)', borderColor: activeFilter === s ? 'var(--accent-border)' : 'var(--border)', color: activeFilter === s ? 'var(--accent)' : 'var(--text-muted)' }}>
            {s}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} /> Tasks</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 20, height: 8, borderRadius: 4, background: 'var(--event-dim)', border: '1px solid var(--event-color)' }} /> Events</div>
      </div>

      {/* Period label — sits directly above the calendar so it's clear
          which week / month you've scrolled to */}
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
          {view === 'day'
            ? new Date(dayDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : view === 'week'
            ? `${MONTH_NAMES[new Date(weekDates[0] + 'T00:00:00').getMonth()]} ${new Date(weekDates[0] + 'T00:00:00').getFullYear()}`
            : `${MONTH_NAMES[monthMonth]} ${monthYear}`}
        </div>
        {view === 'week' && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Mono'", marginTop: 3 }}>
            {fmtDate(weekDates[0])} — {fmtDate(weekDates[6])}
          </div>
        )}
        {view === 'day' && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Mono'", marginTop: 3 }}>
            {fmtDate(dayDate)}{dayDate === todayStr ? ' · Today' : ''}
          </div>
        )}
      </div>

      {/* Month / year strip — jump straight to any month */}
      {view === 'month' && (
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 8, marginBottom: 10, alignItems: 'center' }}>
          {MONTH_STRIP.map(off => {
            const d = new Date(today.getFullYear(), today.getMonth() + off, 1)
            const m = d.getMonth(), y = d.getFullYear()
            const selected = off === monthOffset
            return (
              <React.Fragment key={off}>
                {m === 0 && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', padding: '0 4px', flexShrink: 0, fontFamily: "'DM Mono'" }}>{y}</div>
                )}
                <div
                  ref={selected ? selectedChipRef : null}
                  onClick={() => setMonthOffset(off)}
                  style={{
                    flexShrink: 0, padding: '7px 15px', borderRadius: 20,
                    fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
                    background: selected ? 'var(--accent-dim)' : 'transparent',
                    border: `1px solid ${selected ? 'var(--accent-border)' : 'var(--border)'}`,
                    color: selected ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                  {MONTH_NAMES[m].slice(0, 3)}
                </div>
              </React.Fragment>
            )
          })}
        </div>
      )}

      {/* ── DAY + WEEK VIEW (same row renderer, different date list) ── */}
      {(view === 'week' || view === 'day') && (
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {(view === 'day' ? [dayDate] : weekDates).map((date, i) => {
            const isPast = date < todayStr
            const isToday = date === todayStr
            const d = new Date(date + 'T00:00:00')
            const items = allItemsForDay(date)
            return (
              <div key={date} style={{ marginBottom: 16 }}>
                {/* Day header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: isToday ? 'var(--accent)' : 'transparent', border: isToday ? 'none' : `1px solid ${isPast ? 'var(--border)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: isToday ? '#fff' : isPast ? 'var(--text-dim)' : 'var(--text-muted)', flexShrink: 0 }}>{d.getDate()}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isToday ? 'var(--accent)' : isPast ? 'var(--text-dim)' : 'var(--text-muted)' }}>{DAY_NAMES[(new Date(date + 'T00:00:00').getDay() + 6) % 7]}</div>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{items.length > 0 ? `${items.length} item${items.length>1?'s':''}` : ''}</div>
                  <div onClick={() => openDaySheet(date)} style={{ fontSize: 18, color: 'var(--text-dim)', cursor: 'pointer', paddingLeft: 8 }}>+</div>
                </div>

                {items.length === 0
                  ? <div onClick={() => openDaySheet(date)} style={{ padding: '10px 14px', fontSize: 13, color: 'var(--bg-card2)', border: '1px dashed var(--border)', borderRadius: 10, textAlign: 'center', cursor: 'pointer' }}>Tap to add</div>
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
                        // Task
                        const isOverdue = item.start_date < todayStr && !item.completed
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-card)', border: `1px solid ${isOverdue ? 'var(--danger-dim)' : 'var(--border)'}`, borderRadius: 12, opacity: item.completed ? 0.5 : 1 }}>
                            <div onClick={e => { e.stopPropagation(); toggleTask(item) }} style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${item.completed ? 'var(--accent)' : 'var(--border-hover)'}`, background: item.completed ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                              {item.completed && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                            </div>
                            <div onClick={() => onEditTask(item)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                              <div style={{ fontSize: 14, color: item.completed ? 'var(--text-dim)' : 'var(--text-secondary)', textDecoration: item.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                                {item.projects && <div style={{ fontSize: 11, color: 'var(--accent)' }}>{item.projects.name} →</div>}
                                {isOverdue && <div style={{ fontSize: 11, color: 'var(--danger)', fontFamily: "'DM Mono'" }}>⚠ overdue · {item.start_date}</div>}
                              </div>
                            </div>
                            {item.time_block && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{fmtTime(item.time_block)}</div>}
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
            <div style={{ marginTop: 8, marginBottom: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div onClick={() => setShowOverdue(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: showOverdue ? 12 : 0, cursor: 'pointer' }}>
                <div style={{ fontSize: 16 }}>⚠️</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--danger)' }}>Overdue</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''}</div>
                <div style={{ fontSize: 18, color: 'var(--text-muted)', transform: showOverdue ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
              </div>
              {showOverdue && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {overdueTasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--danger-dim)', border: '1px solid var(--danger-dim)', borderRadius: 12 }}>
                      <div onClick={() => toggleTask(task)} style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid var(--danger)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }} />
                      <div onClick={() => onEditTask(task)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--danger)', fontFamily: "'DM Mono'", marginTop: 2 }}>Was due {fmtDate(task.start_date)}</div>
                      </div>
                      {task.time_block && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{fmtTime(task.time_block)}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Month stats */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div className="section-label">This month</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[['Tasks', tasks.filter(t=>t.start_date>=toStr(new Date(today.getFullYear(),today.getMonth(),1))&&t.start_date<=toStr(new Date(today.getFullYear(),today.getMonth()+1,0))).length, 'var(--text-primary)'],
                ['Events', events.filter(e=>e.start_date>=toStr(new Date(today.getFullYear(),today.getMonth(),1))&&e.start_date<=toStr(new Date(today.getFullYear(),today.getMonth()+1,0))).length, 'var(--event-color)'],
                ['Done', tasks.filter(t=>t.completed).length, 'var(--success)'],
                ['Left', tasks.filter(t=>!t.completed).length, 'var(--accent)']
              ].map(([label,val,color]) => (
                <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 500, color }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MONTH VIEW — one month per page, swipe left/right ── */}
      {view === 'month' && (() => {
        const dim = new Date(monthYear, monthMonth + 1, 0).getDate()
        const fdow = (new Date(monthYear, monthMonth, 1).getDay() + 6) % 7
        const cells = [...Array(fdow).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)]
        while (cells.length % 7 !== 0) cells.push(null)
        const rows = cells.length / 7
        // fill whatever vertical space is left below the controls
        const cellHeight = `calc((100dvh - 330px) / ${rows})`

        return (
          <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
              {['M','T','W','T','F','S','S'].map((d,i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', padding: '2px 0' }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
              {cells.map((day, idx) => {
                const base = { borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', minHeight: 76, height: cellHeight }
                if (!day) return <div key={idx} style={{ ...base, background: 'var(--bg-card2)', opacity: 0.35 }} />

                const ds = toStr(new Date(monthYear, monthMonth, day))
                const isToday = ds === todayStr
                const de = eventsForDay(ds)
                const dt = tasksForDay(ds)
                const chips = [
                  ...de.map(e => ({ key: 'e' + e.id, label: e.title, color: 'var(--event-color)', solid: true })),
                  ...dt.map(t => ({ key: 't' + t.id, label: t.name, color: SECTOR_COLORS[t.sector?.toLowerCase()] || 'var(--accent)', solid: false, done: t.completed })),
                ]
                const shown = chips.slice(0, 4)
                const extra = chips.length - shown.length

                return (
                  <div key={idx} onClick={() => openDaySheet(ds)}
                    style={{ ...base, padding: '3px 3px 4px', cursor: 'pointer', overflow: 'hidden', background: isToday ? 'var(--accent-dim)' : 'transparent' }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', margin: '1px auto 3px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: isToday ? 700 : 500,
                      background: isToday ? 'var(--accent)' : 'transparent',
                      color: isToday ? 'var(--on-accent)' : ds < todayStr ? 'var(--text-dim)' : 'var(--text-secondary)',
                    }}>{day}</div>

                    {shown.map(ch => (
                      <div key={ch.key} style={{
                        fontSize: 9, lineHeight: '13px', height: 13, marginBottom: 2,
                        padding: '0 3px', borderRadius: 3,
                        background: ch.solid ? ch.color : 'transparent',
                        color: ch.solid ? 'var(--on-accent)' : ch.color,
                        borderLeft: ch.solid ? 'none' : `2px solid ${ch.color}`,
                        textDecoration: ch.done ? 'line-through' : 'none',
                        opacity: ch.done ? 0.5 : 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{ch.label}</div>
                    ))}
                    {extra > 0 && <div style={{ fontSize: 8.5, color: 'var(--text-muted)', paddingLeft: 3 }}>+{extra}</div>}
                  </div>
                )
              })}
            </div>

            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', marginTop: 10 }}>
              Swipe left or right to change month
            </div>
          </div>
        )
      })()}

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
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 6, cursor: 'pointer' }} onClick={() => { setDaySheet(null); onEditTask(task) }}>
                <div onClick={e => { e.stopPropagation(); toggleTask(task).then(() => setDaySheet(ds => ({ ...ds, tasks: ds.tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t) }))) }}
                  style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${task.completed ? 'var(--accent)' : 'var(--border-hover)'}`, background: task.completed ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                  {task.completed && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: task.completed ? 'var(--text-dim)' : 'var(--text-secondary)', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.name}</div>
                  {task.time_block && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Mono'", marginTop: 2 }}>{fmtTime(task.time_block)}</div>}
                </div>
              </div>
            ))}
            {daySheet.tasks.length === 0 && daySheet.events.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: 13 }}>Nothing scheduled — add something above</div>
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
