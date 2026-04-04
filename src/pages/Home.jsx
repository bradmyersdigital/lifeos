import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SECTOR_COLORS = {
  business: '#d4520f', 'real estate': '#3b82f6', health: '#10b981',
  'personal growth': '#f59e0b', family: '#ec4899', hobbies: '#a78bfa',
}
const URG_STYLE = {
  urgent: { bg: '#2a0a0a', color: '#f87171' },
  high:   { bg: '#1e1208', color: '#e8823a' },
  medium: { bg: '#1e1a00', color: '#fcd34d' },
  low:    { bg: '#0a1e14', color: '#6ee7b7' },
}
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const EMOJI_PICKS = ['💼','🏠','🏃','📚','🎨','❤️','💰','🌱','⚡','🎯','🔥','✨','🎵','🏋️','🧠','💡','🌍','🚀','📝','🎮','🏆','🛠️','📊','🎭','🧘','🍎','☀️','🌙','💎','🦁']
const COLOR_PICKS = ['#d4520f','#3b82f6','#10b981','#f59e0b','#ec4899','#a78bfa','#f87171','#34d399','#60a5fa','#fbbf24','#e879f9','#2dd4bf']

function SectorModal({ sector, onClose, onSaved }) {
  const isEdit = !!sector
  const [name, setName] = useState(sector?.name || '')
  const [icon, setIcon] = useState(sector?.icon || '📁')
  const [color, setColor] = useState(sector?.color || '#d4520f')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (isEdit) {
      await supabase.from('sectors').update({ name: name.trim(), icon, color }).eq('id', sector.id)
    } else {
      await supabase.from('sectors').insert({ name: name.trim(), icon, color })
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${sector.name}" sector?`)) return
    setDeleting(true)
    await supabase.from('sectors').delete().eq('id', sector.id)
    setDeleting(false)
    onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">
          {isEdit ? `Edit ${sector.name}` : 'New sector'}
          <div className="modal-close" onClick={onClose}>×</div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 52, marginBottom: 12 }}>{icon}</div>

        <div className="field">
          <div className="field-label">Sector name</div>
          <input type="text" placeholder="e.g. Business, Health..." value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>

        <div className="field">
          <div className="field-label">Icon — tap to select or type any emoji</div>
          <input type="text" value={icon} onChange={e => setIcon(e.target.value)} style={{ fontSize: 22, textAlign: 'center' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10, justifyContent: 'center' }}>
            {EMOJI_PICKS.map(e => (
              <div key={e} onClick={() => setIcon(e)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: icon === e ? '#1e1208' : '#161618', border: `1px solid ${icon === e ? '#7a3410' : '#242428'}`, borderRadius: 10, cursor: 'pointer' }}>
                {e}
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-label">Color</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_PICKS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: `3px solid ${color === c ? '#fff' : 'transparent'}`, cursor: 'pointer', transition: 'border 0.15s' }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && (
            <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add sector'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DueSoonSection() {
  const [items, setItems] = useState([])
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const soon = new Date(today); soon.setDate(today.getDate() + 7)
  const soonStr = soon.toISOString().split('T')[0]

  useEffect(() => {
    const load = async () => {
      const [{ data: s }, { data: b }] = await Promise.all([
        supabase.from('finance_subscriptions').select('*').gte('due_date', todayStr).lte('due_date', soonStr).eq('is_active', true),
        supabase.from('finance_bills').select('*').gte('due_date', todayStr).lte('due_date', soonStr).eq('is_active', true),
      ])
      const merged = [...(s||[]).map(x=>({...x,_type:'sub'})),...(b||[]).map(x=>({...x,_type:'bill'}))]
        .sort((a,b) => a.due_date?.localeCompare(b.due_date))
      setItems(merged)
    }
    load()
  }, [])

  if (items.length === 0) return null

  return (
    <div style={{ marginBottom: 18 }}>
      <div className="section-label">Due soon</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 12 }}>
            <div style={{ fontSize: 18 }}>{item._type === 'sub' ? '🔄' : '🧾'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#d4d2cc', fontWeight: 500 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>{item._type === 'sub' ? 'Subscription' : 'Bill'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#f59e0b', fontFamily: "'DM Mono'", fontWeight: 500 }}>${parseFloat(item.amount).toFixed(0)}</div>
              <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>Due {item.due_date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home({ onAddTask, onEditTask }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState([])
  const [weekTasks, setWeekTasks] = useState([])
  const [todayEvents, setTodayEvents] = useState([])
  const [weekEvents, setWeekEvents] = useState([])
  const [sectors, setSectors] = useState([])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dateStr = `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}`

  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  monday.setHours(0,0,0,0)
  const [weekGlanceOffset, setWeekGlanceOffset] = useState(0)
  const glanceMonday = new Date(monday)
  glanceMonday.setDate(monday.getDate() + weekGlanceOffset * 7)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(glanceMonday)
    d.setDate(glanceMonday.getDate() + i)
    // Fix timezone offset
    const offset = d.getTimezoneOffset()
    const adjusted = new Date(d.getTime() - offset * 60 * 1000)
    return adjusted.toISOString().split('T')[0]
  })

  useEffect(() => { loadAll() }, [todayStr])

  const loadAll = async () => {
    supabase.from('tasks').select('*, projects(name)').eq('start_date', todayStr).order('time_block').then(({ data }) => setTasks(data || []))
    supabase.from('projects').select('*, tasks(*)').eq('status', 'active').then(({ data }) => setProjects(data || []))
    supabase.from('habits').select('*').then(({ data }) => setHabits(data || []))
    supabase.from('habit_logs').select('*').gte('completed_date', weekDates[0]).then(({ data }) => setHabitLogs(data || []))
    supabase.from('tasks').select('*').gte('start_date', weekDates[0]).lte('start_date', weekDates[6]).then(({ data }) => setWeekTasks(data || []))
    supabase.from('sectors').select('*').order('name').then(({ data }) => setSectors(data || []))
    supabase.from('events').select('*').eq('start_date', todayStr).order('start_time')
      .then(({ data }) => setTodayEvents(data || []))
    supabase.from('events').select('*').gte('start_date', todayStr).lte('start_date', weekDates[6]).order('start_date').order('start_time')
      .then(({ data }) => setWeekEvents(data || []))
  }

  const toggleTask = async (task) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
  }

  const toggleHabit = async (habit) => {
    const logged = habitLogs.some(l => l.habit_id === habit.id && l.completed_date === todayStr)
    if (logged) {
      await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('completed_date', todayStr)
      setHabitLogs(prev => prev.filter(l => !(l.habit_id === habit.id && l.completed_date === todayStr)))
    } else {
      const { data } = await supabase.from('habit_logs').insert({ habit_id: habit.id, completed_date: todayStr }).select().single()
      if (data) setHabitLogs(prev => [...prev, data])
    }
  }

  const getProjectPct = (p) => {
    const t = p.tasks || []
    if (!t.length) return 0
    return Math.round(t.filter(x => x.completed).length / t.length * 100)
  }

  const timeToMins = t => {
    if (!t) return 999
    const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!m) return 999
    let h = parseInt(m[1]), min = parseInt(m[2])
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
    return h * 60 + min
  }
  const todayAllItems = [
    ...tasks.map(t => ({ ...t, _type: 'task' })),
    ...todayEvents.map(e => ({ ...e, _type: 'event' }))
  ].sort((a, b) => {
    const at = a._type === 'task' ? timeToMins(a.time_block) : timeToMins(a.start_time)
    const bt = b._type === 'task' ? timeToMins(b.time_block) : timeToMins(b.start_time)
    return at - bt
  })

  const urgentTasks = tasks.filter(t => !t.completed && (t.urgency === 'urgent' || t.urgency === 'high'))
  const todayDone = tasks.filter(t => t.completed).length
  const rolledOver = tasks.filter(t => t.rolled_over).length
  const doneHabitsToday = habits.filter(h => habitLogs.some(l => l.habit_id === h.id && l.completed_date === todayStr)).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>Good morning 👋</div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 3, fontFamily: "'DM Mono'" }}>{dateStr}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#b84a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#fff' }}>Y</div>
      </div>

      {/* Add task buttons */}
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
          { label: 'Due today', val: tasks.length + todayEvents.length, color: '#f87171' },
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

      {/* Today + Urgent side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase' }}>Today's blocks</div>
            <div style={{ fontSize: 10, color: '#444', fontFamily: "'DM Mono'" }}>{todayDone}/{tasks.length}</div>
          </div>
          {todayAllItems.length === 0
            ? <div style={{ fontSize: 12, color: '#333', textAlign: 'center', padding: '8px 0' }}>Nothing today</div>
            : todayAllItems.map(item => item._type === 'event' ? (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, cursor: 'pointer' }} onClick={() => navigate('/week')}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><circle cx="6" cy="6" r="5" stroke="#3b82f6" strokeWidth="1.3"/><polyline points="6,3 6,6 8,7.5" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <div style={{ fontSize: 12, color: '#93c5fd', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                <div style={{ fontFamily: "'DM Mono'", fontSize: 10, color: '#1e5a8c', flexShrink: 0 }}>{item.start_time}</div>
              </div>
            ) : (
              <div key={item.id} onClick={() => onEditTask(item)} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, cursor: 'pointer' }}>
                <div onClick={e => { e.stopPropagation(); toggleTask(item) }} style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${item.completed ? '#d4520f' : '#333'}`, background: item.completed ? '#d4520f' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.completed && <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <div style={{ fontSize: 12, color: item.completed ? '#444' : '#d4d2cc', textDecoration: item.completed ? 'line-through' : 'none', flex: 1, minWidth: 0, wordBreak: 'break-word', lineHeight: 1.3 }}>{item.name}</div>
                {item.time_block && <div style={{ fontFamily: "'DM Mono'", fontSize: 10, color: '#555', flexShrink: 0 }}>{item.time_block}</div>}
              </div>
            ))
          }
        </div>
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', marginBottom: 10 }}>Urgent / High</div>
          {urgentTasks.length === 0
            ? <div style={{ fontSize: 12, color: '#333', textAlign: 'center', padding: '8px 0' }}>All clear 🎉</div>
            : urgentTasks.slice(0, 4).map(task => {
              const u = URG_STYLE[task.urgency] || URG_STYLE.high
              return (
                <div key={task.id} onClick={() => onEditTask(task)} style={{ marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ fontSize: 12, color: '#d4d2cc', marginBottom: 3, lineHeight: 1.3 }}>{task.name}</div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: u.bg, color: u.color }}>{task.urgency}</span>
                </div>
              )
            })
          }
        </div>
      </div>

      {/* Week at a glance */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="section-label" style={{ margin: 0 }}>Week at a glance</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div onClick={() => setWeekGlanceOffset(o => o-1)} style={{ width: 28, height: 28, borderRadius: 8, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#888' }}>‹</div>
            {weekGlanceOffset !== 0 && <div onClick={() => setWeekGlanceOffset(0)} style={{ fontSize: 11, color: '#d4520f', cursor: 'pointer' }}>Today</div>}
            <div onClick={() => setWeekGlanceOffset(o => o+1)} style={{ width: 28, height: 28, borderRadius: 8, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#888' }}>›</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
          {weekDates.map((date, i) => {
            const isToday = date === todayStr
            const dayTasks = weekTasks.filter(t => t.start_date === date)
            const d = new Date(date)
            return (
              <div key={date} onClick={() => navigate('/week')} style={{ background: isToday ? '#1e1208' : '#161618', border: `1px solid ${isToday ? '#7a3410' : '#242428'}`, borderRadius: 10, padding: '8px 4px', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: 9, color: isToday ? '#d4520f' : '#555', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{DAY_NAMES[i]}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: isToday ? '#e8823a' : '#888', marginBottom: 4 }}>{d.getDate()}</div>
                {dayTasks.slice(0, 2).map((t, ti) => (
                  <div key={ti} style={{ fontSize: 9, background: '#1e1e24', color: '#555', borderRadius: 4, padding: '1px 3px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.name.length > 7 ? t.name.substring(0, 7) + '…' : t.name}
                  </div>
                ))}
                {dayTasks.length === 0 && <div style={{ fontSize: 10, color: '#2a2a2a' }}>—</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming events this week */}
      {weekEvents.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div className="section-label">Upcoming events</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {weekEvents.slice(0, 5).map(ev => {
              const evDate = new Date(ev.start_date + 'T00:00:00')
              const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][evDate.getDay()]
              const isToday = ev.start_date === todayStr
              return (
                <div key={ev.id} onClick={() => navigate('/week')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: '#0c1a2e', border: '1px solid #1a3a5c', borderRadius: 12, cursor: 'pointer' }}>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? '#d4520f' : '#1e5a8c', textTransform: 'uppercase' }}>{isToday ? 'Today' : dayName}</div>
                    <div style={{ fontSize: 18, fontWeight: 500, color: isToday ? '#e8823a' : '#93c5fd' }}>{evDate.getDate()}</div>
                  </div>
                  <div style={{ width: 1, height: 32, background: '#1a3a5c', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#93c5fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: '#1e5a8c', marginTop: 2, fontFamily: "'DM Mono'" }}>{ev.start_time} → {ev.end_time}{ev.location ? ` · 📍 ${ev.location}` : ''}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Active projects */}
      <div style={{ marginBottom: 18 }}>
        <div className="section-label">Active projects</div>
        {projects.length === 0 ? (
          <div style={{ padding: 14, textAlign: 'center', fontSize: 13, color: '#333', border: '1px dashed #242428', borderRadius: 12 }}>
            No active projects — add one in the Projects tab
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {projects.slice(0, 4).map(p => {
              const pct = getProjectPct(p)
              const color = SECTOR_COLORS[p.sector?.toLowerCase()] || '#d4520f'
              const tasksLeft = (p.tasks || []).filter(t => !t.completed).length
              const isOverdue = p.due_date && p.due_date < todayStr
              return (
                <div key={p.id} onClick={() => navigate('/projects')} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 12, cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e6e1', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>{p.sector}</div>
                  <div style={{ height: 4, background: '#1e1e24', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 2 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 10, color: '#555', fontFamily: "'DM Mono'" }}>{pct}% · {tasksLeft} left</div>
                    {p.due_date && <div style={{ fontSize: 10, fontFamily: "'DM Mono'", color: isOverdue ? '#f87171' : '#444' }}>Due {p.due_date}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Habits */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="section-label" style={{ margin: 0 }}>Habits</div>
          <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono'" }}>{doneHabitsToday}/{habits.length} today</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {habits.slice(0, 4).map(h => {
            const done = habitLogs.some(l => l.habit_id === h.id && l.completed_date === todayStr)
            return (
              <div key={h.id} onClick={() => toggleHabit(h)} style={{ background: '#161618', border: `1px solid ${done ? '#1a3a2a' : '#242428'}`, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'border-color 0.15s' }}>
                <div style={{ width: 30, height: 30, background: done ? '#0a2a1a' : '#1e1e22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{h.icon}</div>
                <span style={{ fontSize: 13, color: done ? '#6ee7b7' : '#c0bdb7', flex: 1 }}>{h.name}</span>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? '#16a34a' : 'transparent', border: `1.5px solid ${done ? '#16a34a' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  {done && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bills & Subs due soon */}
      <DueSoonSection />

      {/* Sectors */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="section-label" style={{ margin: 0 }}>Sectors</div>
          <div onClick={() => navigate('/sectors')} style={{ fontSize: 12, color: '#555', cursor: 'pointer' }}>Manage →</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {sectors.map(s => (
            <div key={s.id} onClick={() => navigate('/sectors')} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'border-color 0.15s' }}>
              <div style={{ fontSize: 30 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 500, textAlign: 'center' }}>{s.name}</div>
            </div>
          ))}
          {sectors.length === 0 && ['Business','Real Estate','Health','Personal Growth','Hobbies','Family'].map(n => (
            <div key={n} onClick={() => navigate('/sectors')} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <div style={{ fontSize: 28 }}>📁</div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 500, textAlign: 'center' }}>{n}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
