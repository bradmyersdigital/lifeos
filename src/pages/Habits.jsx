import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const DAY_LABELS = ['M','T','W','T','F','S','S']
const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
function toStr(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

const habitScheduledToday = (habit, dowIdx) => {
  if (!habit.days_of_week || habit.days_of_week.length === 0) return true
  return habit.days_of_week.includes(String(dowIdx)) || habit.days_of_week.includes(dowIdx)
}

// ── Stats Component ──────────────────────────────────────────────────────────
function HabitStats({ habits, logs, isLogged, getStreak, statsPeriod, setStatsPeriod }) {
  const now = new Date()
  const days = statsPeriod === 'week' ? 7 : 30
  const dates = Array.from({length: days}, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (days - 1 - i))
    return { str: toStr(d), label: String(d.getDate()), day: d.getDay() }
  })
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['week','This week'],['month','30 days']].map(([p,label]) => (
          <div key={p} onClick={() => setStatsPeriod(p)} style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: statsPeriod === p ? '#1e1208' : '#161618', borderColor: statsPeriod === p ? '#7a3410' : '#242428', color: statsPeriod === p ? '#d4520f' : '#666' }}>
            {label}
          </div>
        ))}
      </div>
      {habits.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#444', fontSize: 14 }}>No habits yet — add some first</div>}
      {habits.map(habit => {
        const scheduledDays = habit.days_of_week?.map(d => parseInt(d)) || [0,1,2,3,4,5,6]
        const scheduledDates = dates.filter(d => { const dow = d.day === 0 ? 6 : d.day - 1; return scheduledDays.includes(dow) })
        const loggedDates = scheduledDates.filter(d => isLogged(habit.id, d.str))
        const pct = scheduledDates.length ? Math.round(loggedDates.length / scheduledDates.length * 100) : 0
        const streak = getStreak(habit.id)
        const col = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f87171'
        return (
          <div key={habit.id} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 22 }}>{habit.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{habit.name}</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{loggedDates.length}/{scheduledDates.length} days · {streak} day streak</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: col, fontFamily: "'DM Mono'" }}>{pct}%</div>
            </div>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 52, marginBottom: 8 }}>
              {dates.map(d => {
                const dow = d.day === 0 ? 6 : d.day - 1
                const isSched = scheduledDays.includes(dow)
                const logged = isLogged(habit.id, d.str)
                return (
                  <div key={d.str} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', height: logged ? 44 : isSched ? 8 : 3, borderRadius: 3, background: logged ? col : isSched ? '#1e1e24' : '#0f0f11', transition: 'height 0.3s' }} />
                    {days <= 7 && <div style={{ fontSize: 9, color: '#444', fontFamily: "'DM Mono'" }}>{d.label}</div>}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 5, background: '#1e1e24', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: col, borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#666', minWidth: 32 }}>{loggedDates.length}/{scheduledDates.length}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Routine Modal ────────────────────────────────────────────────────────────
function RoutineModal({ routine, onClose, onSaved }) {
  const isEdit = !!routine
  const [name, setName] = useState(routine?.name || '')
  const [time, setTime] = useState(routine?.time || '')
  const [duration, setDuration] = useState(routine?.duration || '')
  const [icon, setIcon] = useState(routine?.icon || '')
  const [saving, setSaving] = useState(false)
  const QUICK_ICONS = ['🏃','🧘','☕','🚿','🥗','📖','💊','🧹','🎯','💪','🌅','🌙','🎵','✍️','🧠']
  const handleSave = async () => {
    if (!name.trim()) return; setSaving(true)
    const payload = { name: name.trim(), time, duration: parseInt(duration)||null, icon }
    if (isEdit) await supabase.from('routines').update(payload).eq('id', routine.id)
    else await supabase.from('routines').insert(payload)
    setSaving(false); onSaved(); onClose()
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? 'Edit routine' : 'Add routine'}<div className="modal-close" onClick={onClose}>×</div></div>
        <div className="field"><div className="field-label">Name</div><input type="text" placeholder="e.g. Morning run..." value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field-row">
          <div className="field"><div className="field-label">Time</div><input type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
          <div className="field"><div className="field-label">Duration (mins)</div><input type="number" placeholder="30" value={duration} onChange={e => setDuration(e.target.value)} /></div>
        </div>
        <div className="field">
          <div className="field-label">Icon</div>
          <input type="text" value={icon} onChange={e => setIcon(e.target.value)} style={{ fontSize: 20, textAlign: 'center' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'center' }}>
            {QUICK_ICONS.map(e => <div key={e} onClick={() => setIcon(e)} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: icon === e ? '#1e1208' : '#161618', border: `1px solid ${icon === e ? '#7a3410' : '#242428'}`, borderRadius: 9, cursor: 'pointer' }}>{e}</div>)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={async () => { await supabase.from('routines').delete().eq('id', routine.id); onSaved(); onClose() }} style={{ flex:1,padding:11,borderRadius:10,background:'#2a0a0a',border:'1px solid #7a1010',color:'#f87171',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Habit Modal ──────────────────────────────────────────────────────────────
function HabitModal({ habit, onClose, onSaved }) {
  const isEdit = !!habit
  const [name, setName] = useState(habit?.name || '')
  const [icon, setIcon] = useState(habit?.icon || '✅')
  const [days, setDays] = useState(() => {
    if (habit?.days_of_week && habit.days_of_week.length > 0) return habit.days_of_week.map(d => parseInt(d))
    return [0,1,2,3,4,5,6]
  })
  const [saving, setSaving] = useState(false)
  const toggleDay = d => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  const handleSave = async () => {
    if (!name.trim()) return; setSaving(true)
    const payload = { name: name.trim(), icon, days_of_week: days.map(String) }
    if (isEdit) await supabase.from('habits').update(payload).eq('id', habit.id)
    else await supabase.from('habits').insert(payload)
    setSaving(false); onSaved(); onClose()
  }
  const QUICK_ICONS = ['✅','💪','📖','💧','🏃','🧘','🥗','😴','📝','🎯','💊','🚫','☀️','🌙','🎵','🧹']
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? 'Edit habit' : 'Add habit'}<div className="modal-close" onClick={onClose}>×</div></div>
        <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 12 }}>{icon}</div>
        <div className="field"><div className="field-label">Habit name</div><input type="text" placeholder="e.g. Workout, Read..." value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field">
          <div className="field-label">Which days?</div>
          <div style={{ display: 'flex', gap: 7 }}>
            {DAY_LABELS.map((label, i) => (
              <div key={i} onClick={() => toggleDay(i)} style={{ flex: 1, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: days.includes(i) ? '#1e1208' : '#0f0f11', border: `1px solid ${days.includes(i) ? '#7a3410' : '#242428'}`, color: days.includes(i) ? '#d4520f' : '#444' }}>
                {label}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>{days.length === 7 ? 'Every day' : days.length === 0 ? 'No days selected' : days.sort((a,b)=>a-b).map(d => DAY_NAMES[d]).join(', ')}</div>
        </div>
        <div className="field">
          <div className="field-label">Icon</div>
          <input type="text" value={icon} onChange={e => setIcon(e.target.value)} style={{ fontSize: 20, textAlign: 'center' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'center' }}>
            {QUICK_ICONS.map(e => <div key={e} onClick={() => setIcon(e)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: icon === e ? '#1e1208' : '#161618', border: `1px solid ${icon === e ? '#7a3410' : '#242428'}`, borderRadius: 10, cursor: 'pointer' }}>{e}</div>)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={async () => { if(window.confirm(`Delete "${habit.name}"?`)) { await supabase.from('habits').delete().eq('id', habit.id); onSaved(); onClose() } }} style={{ flex:1,padding:11,borderRadius:10,background:'#2a0a0a',border:'1px solid #7a1010',color:'#f87171',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add habit'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Habits() {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [habitModal, setHabitModal] = useState(null)
  const [habitDetail, setHabitDetail] = useState(null)
  const [routineModal, setRoutineModal] = useState(null)
  const [view, setView] = useState('today')
  const [calMonth, setCalMonth] = useState(0)
  const [statsPeriod, setStatsPeriod] = useState('week')
  const [selectedHabit, setSelectedHabit] = useState(null)
  const [routines, setRoutines] = useState([])
  const dragItem = useRef(null)
  const dragOver = useRef(null)
  const longPressTimer = useRef(null)
  const isDragging = useRef(false)
  const touchStartY = useRef(null)
  const touchDragIdx = useRef(null)

  const today = new Date()
  const todayStr = toStr(today)
  const todayDow = today.getDay()
  const todayIdx = todayDow === 0 ? 6 : todayDow - 1

  useEffect(() => { loadAll() }, [calMonth])

  const loadAll = async () => {
    const { data: hd } = await supabase.from('habits').select('*').order('sort_order').order('created_at')
    const monthDate = new Date(today.getFullYear(), today.getMonth() + calMonth, 1)
    const first = toStr(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1))
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - todayIdx)
    const fetchFrom = first < toStr(weekStart) ? first : toStr(weekStart)
    const { data: ld } = await supabase.from('habit_logs').select('*').gte('completed_date', fetchFrom)
    const { data: rd } = await supabase.from('routines').select('*').order('time')
    setHabits(hd || []); setLogs(ld || [])
    if (rd) setRoutines(rd)
  }

  const getDateForDayIdx = idx => {
    const d = new Date(today); d.setDate(d.getDate() - (todayIdx - idx)); return toStr(d)
  }
  const isLogged = (habitId, date) => logs.some(l => l.habit_id === habitId && l.completed_date === date)

  const toggleLog = async (habitId, date) => {
    const logged = isLogged(habitId, date)
    if (logged) {
      await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('completed_date', date)
      setLogs(prev => prev.filter(l => !(l.habit_id === habitId && l.completed_date === date)))
    } else {
      const { data } = await supabase.from('habit_logs').insert({ habit_id: habitId, completed_date: date }).select().single()
      if (data) setLogs(prev => [...prev, data])
    }
  }

  const getStreak = habitId => {
    let streak = 0, d = new Date(today)
    while (true) {
      const ds = toStr(d); const dow = d.getDay(); const dowIdx = dow === 0 ? 6 : dow - 1
      const habit = habits.find(h => h.id === habitId)
      const scheduled = habit ? habitScheduledToday(habit, dowIdx) : true
      if (!scheduled) { d.setDate(d.getDate()-1); continue }
      if (logs.some(l => l.habit_id === habitId && l.completed_date === ds)) { streak++; d.setDate(d.getDate()-1) } else break
    }
    return streak
  }

  const saveOrder = async (reordered) => {
    for (let i = 0; i < reordered.length; i++) await supabase.from('habits').update({ sort_order: i }).eq('id', reordered[i].id)
  }

  const handleDragStart = idx => { dragItem.current = idx }
  const handleDragEnter = idx => { dragOver.current = idx }
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) return
    const reordered = [...habits]
    const [moved] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, moved)
    setHabits(reordered); dragItem.current = null; dragOver.current = null
    await saveOrder(reordered)
  }
  const handleTouchStart = (e, idx) => {
    touchStartY.current = e.touches[0].clientY; touchDragIdx.current = idx; isDragging.current = false
    longPressTimer.current = setTimeout(() => { isDragging.current = true }, 300)
  }
  const handleTouchMove = (e) => {
    if (!isDragging.current) { clearTimeout(longPressTimer.current); return }
    e.preventDefault(); e.stopPropagation()
    const y = e.touches[0].clientY
    const delta = Math.round((y - touchStartY.current) / 185)
    const targetIdx = Math.max(0, Math.min(habits.length - 1, touchDragIdx.current + delta))
    if (targetIdx !== touchDragIdx.current) {
      const reordered = [...habits]
      const [moved] = reordered.splice(touchDragIdx.current, 1)
      reordered.splice(targetIdx, 0, moved)
      setHabits(reordered); touchDragIdx.current = targetIdx; touchStartY.current = y
    }
  }
  const handleTouchEnd = async () => {
    clearTimeout(longPressTimer.current)
    if (isDragging.current) await saveOrder(habits)
    isDragging.current = false; touchDragIdx.current = null; touchStartY.current = null
  }

  const monthDate = new Date(today.getFullYear(), today.getMonth() + calMonth, 1)
  const monthYear = monthDate.getFullYear(), monthMonth = monthDate.getMonth()
  const daysInMonth = new Date(monthYear, monthMonth + 1, 0).getDate()
  const firstDow = (new Date(monthYear, monthMonth, 1).getDay() + 6) % 7
  const calCells = []
  for (let i = 0; i < firstDow; i++) calCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d)

  const scheduledHabitsToday = habits.filter(h => habitScheduledToday(h, todayIdx))
  const doneToday = scheduledHabitsToday.filter(h => isLogged(h.id, todayStr)).length

  // ── Habit Detail View ──────────────────────────────────────────────────────
  if (habitDetail) {
    const habit = habitDetail
    const scheduledDays = habit.days_of_week?.map(d => parseInt(d)) || [0,1,2,3,4,5,6]
    const last30 = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const dateStr = toStr(d), dow = d.getDay(), dowIdx = dow === 0 ? 6 : dow - 1
      last30.push({ dateStr, day: d.getDate(), dowIdx, isToday: i === 0, label: DAY_LABELS[dowIdx] })
    }
    const streak = getStreak(habit.id)
    const totalLogged = last30.filter(d => isLogged(habit.id, d.dateStr)).length
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div onClick={() => setHabitDetail(null)} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>‹</div>
          <div style={{ fontSize: 28 }}>{habit.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 500 }}>{habit.name}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>{scheduledDays.length === 7 ? 'Every day' : scheduledDays.sort((a,b)=>a-b).map(d=>DAY_NAMES[d]).join(', ')}</div>
          </div>
          <div onClick={() => setHabitModal(habit)} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 1.5L11 3.5L4.5 10H2.5V8L9 1.5Z" stroke="#888" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
          {[['Streak', streak + ' days', '#d4520f'],['Last 30d', totalLogged + ' days', '#10b981'],['Schedule', scheduledDays.length + '/7', '#a78bfa']].map(([l,v,col])=>(
            <div key={l} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: col }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="section-label">History — tap any day to toggle</div>
        <div style={{ fontSize: 12, color: '#444', marginBottom: 12 }}>Green = logged · dot = not scheduled · empty = missed</div>
        {(() => {
          const weeks = []; let week = []
          last30.forEach((day, i) => {
            week.push(day)
            if (day.dowIdx === 6 || i === last30.length - 1) { weeks.push([...week]); week = [] }
          })
          return weeks.map((wk, wi) => (
            <div key={wi} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {wk.map(day => {
                  const logged = isLogged(habit.id, day.dateStr)
                  const scheduled = scheduledDays.includes(day.dowIdx)
                  return (
                    <div key={day.dateStr} onClick={() => scheduled && toggleLog(habit.id, day.dateStr)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: scheduled ? 'pointer' : 'default' }}>
                      <div style={{ width: '100%', aspectRatio: '1', borderRadius: 10, background: logged ? '#10b981' : scheduled ? '#1e1e24' : '#0f0f11', border: `1px solid ${day.isToday ? '#d4520f' : logged ? '#10b981' : '#2a2a30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 36 }}>
                        {logged && <svg width="14" height="14" viewBox="0 0 14 14"><polyline points="2,7 5.5,10.5 12,3.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        {!scheduled && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#333' }} />}
                      </div>
                      <div style={{ fontSize: 10, color: day.isToday ? '#d4520f' : '#444', fontFamily: "'DM Mono'" }}>{day.day}</div>
                      <div style={{ fontSize: 9, color: '#333', fontFamily: "'DM Mono'" }}>{day.label}</div>
                    </div>
                  )
                })}
                {wk.length < 7 && Array.from({length: 7-wk.length}).map((_,pi) => <div key={'p'+pi} style={{ flex: 1 }} />)}
              </div>
            </div>
          ))
        })()}
        {habitModal && <HabitModal habit={habitModal === 'new' ? null : habitModal} onClose={() => setHabitModal(null)} onSaved={loadAll} />}
      </div>
    )
  }

  // ── Main Return ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Habits</div>
        <div onClick={() => setHabitModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1e1208', border: '1px solid #7a3410', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: '#d4520f', fontWeight: 500 }}>+ Add</div>
      </div>

      {/* View tabs — full width row */}
      <div style={{ display: 'flex', background: '#161618', border: '1px solid #242428', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        {[['today','Today'],['calendar','Calendar'],['routines','Routines'],['stats','Stats']].map(([v,label]) => (
          <div key={v} onClick={() => setView(v)} style={{ flex: 1, textAlign: 'center', padding: '10px 4px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: view === v ? '#1e1208' : 'transparent', color: view === v ? '#d4520f' : '#666', transition: 'all 0.15s' }}>
            {label}
          </div>
        ))}
      </div>

      {/* Stat chips — always visible below header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          ['Today', `${doneToday}/${scheduledHabitsToday.length}`, '#e8e6e1', 'completed'],
          ['Best streak', Math.max(0,...habits.map(h=>getStreak(h.id))), '#d4520f', 'days'],
          ['Total', habits.length, '#a78bfa', 'habits'],
        ].map(([label,val,color,sub]) => (
          <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 11, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 500, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 2, fontFamily: "'DM Mono'" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* TODAY VIEW */}
      {view === 'today' && (
        <div>
          <div style={{ fontSize: 12, color: '#444', marginBottom: 12 }}>Hold icon to reorder · tap name to view history</div>
          {habits.map((habit, idx) => {
            const isScheduledToday = habitScheduledToday(habit, todayIdx)
            const done = isLogged(habit.id, todayStr)
            const streak = getStreak(habit.id)
            const scheduledDays = habit.days_of_week?.map(d => parseInt(d)) || [0,1,2,3,4,5,6]
            const weekDone = DAY_LABELS.filter((_,i) => scheduledDays.includes(i) && isLogged(habit.id, getDateForDayIdx(i))).length
            const scheduledThisWeek = DAY_LABELS.filter((_,i) => scheduledDays.includes(i)).length
            const pct = scheduledThisWeek > 0 ? Math.round((weekDone/scheduledThisWeek)*100) : 0
            return (
              <div key={habit.id} style={{ background: '#161618', border: `1px solid ${done ? '#1a3a1a' : isScheduledToday ? '#242428' : '#1e1e24'}`, borderRadius: 14, padding: 16, marginBottom: 10, opacity: !isScheduledToday ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div
                    draggable onDragStart={() => handleDragStart(idx)} onDragEnter={() => handleDragEnter(idx)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
                    onTouchStart={e => handleTouchStart(e, idx)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                    onClick={() => setHabitModal(habit)}
                    style={{ width: 40, height: 40, borderRadius: 11, background: '#1e1e22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                  >{habit.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div onClick={() => setHabitDetail(habit)} style={{ fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>{habit.name}</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{scheduledDays.length === 7 ? 'Every day' : scheduledDays.sort((a,b)=>a-b).map(d=>DAY_LABELS[d]).join(' ')}{!isScheduledToday && <span style={{ color: '#444', marginLeft: 6 }}>· not today</span>}</div>
                  </div>
                  {streak > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1e1208', border: '1px solid #3a2010', borderRadius: 10, padding: '5px 10px', flexShrink: 0 }}><span style={{ fontFamily: "'DM Mono'", fontSize: 14, fontWeight: 500, color: '#d4520f' }}>{streak}</span><span style={{ fontSize: 11, color: '#7a3410' }}>streak</span></div>}
                  {isScheduledToday && (
                    <div onClick={() => toggleLog(habit.id, todayStr)} style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${done ? '#16a34a' : '#333'}`, background: done ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="1.5,6 4.5,9 10.5,3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 10 }}>
                  {DAY_LABELS.map((label, i) => {
                    const date = getDateForDayIdx(i)
                    const dayDone = isLogged(habit.id, date)
                    const isToday = i === todayIdx
                    const isPast = i < todayIdx
                    const isSched = scheduledDays.includes(i)
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div onClick={() => isSched && (isPast || isToday) && toggleLog(habit.id, date)} style={{ width: 28, height: 28, borderRadius: '50%', background: dayDone ? (isToday ? '#d4520f' : '#16a34a') : isPast ? '#1a1a1a' : '#1e1e24', border: `1px solid ${!isSched ? '#1a1a1a' : isToday && !dayDone ? '#d4520f' : dayDone ? 'transparent' : '#2a2a30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSched && (isPast || isToday) ? 'pointer' : 'default' }}>
                          {isSched && dayDone && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                          {!isSched && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2a2a2a' }} />}
                        </div>
                        <div style={{ fontSize: 10, color: isToday ? '#d4520f' : '#444', fontFamily: "'DM Mono'" }}>{label}</div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="prog-bar" style={{ flex: 1 }}><div className="prog-fill" style={{ width: pct + '%' }} /></div>
                  <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555', minWidth: 40, textAlign: 'right' }}>{weekDone}/{scheduledThisWeek}</div>
                </div>
              </div>
            )
          })}
          {habits.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#444', fontSize: 14 }}>No habits yet — tap + Add to create one</div>}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === 'calendar' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div onClick={() => setCalMonth(o=>o-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>‹</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{MONTH_NAMES[monthMonth]} {monthYear}</div>
            <div onClick={() => setCalMonth(o=>o+1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>›</div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
            <div onClick={() => setSelectedHabit(null)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', background: !selectedHabit ? '#1e1208' : '#161618', borderColor: !selectedHabit ? '#7a3410' : '#242428', color: !selectedHabit ? '#d4520f' : '#666' }}>All</div>
            {habits.map(h => <div key={h.id} onClick={() => setSelectedHabit(h.id === selectedHabit ? null : h.id)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', background: selectedHabit === h.id ? '#1e1208' : '#161618', borderColor: selectedHabit === h.id ? '#7a3410' : '#242428', color: selectedHabit === h.id ? '#d4520f' : '#666' }}>{h.icon} {h.name}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {DAY_LABELS.map((d,i) => <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#444', padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {calCells.map((day, idx) => {
              if (!day) return <div key={idx} />
              const dateStr = toStr(new Date(monthYear, monthMonth, day))
              const isToday = dateStr === todayStr, isFuture = dateStr > todayStr
              const calDow = new Date(monthYear, monthMonth, day).getDay(), calDowIdx = calDow === 0 ? 6 : calDow - 1
              const habitsToShow = selectedHabit ? habits.filter(h => h.id === selectedHabit) : habits
              const scheduledHere = habitsToShow.filter(h => habitScheduledToday(h, calDowIdx))
              const doneCount = scheduledHere.filter(h => isLogged(h.id, dateStr)).length
              const total = scheduledHere.length
              const allDone = total > 0 && doneCount === total, someDone = doneCount > 0 && doneCount < total
              return (
                <div key={idx} style={{ background: isToday ? '#1e1208' : '#161618', border: `1px solid ${isToday ? '#7a3410' : '#1e1e24'}`, borderRadius: 10, padding: '6px 4px', minHeight: 52, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isToday ? '#e8823a' : isFuture ? '#333' : '#888', marginBottom: 4 }}>{day}</div>
                  {!isFuture && total > 0 && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: allDone ? '#16a34a' : someDone ? '#f59e0b' : '#1e1e24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {allDone ? <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
                        : <div style={{ fontSize: 9, color: someDone ? '#fff' : '#444', fontWeight: 600 }}>{doneCount}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 16, justifyContent: 'center' }}>
            {[['#16a34a','All done'],['#f59e0b','Partial'],['#1e1e24','None']].map(([col,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: col }} />{l}</div>
            ))}
          </div>
        </div>
      )}

      {/* ROUTINES VIEW */}
      {view === 'routines' && (
        <div>
          <div style={{ fontSize: 12, color: '#444', marginBottom: 16 }}>Daily routines organized by time of day</div>
          <div style={{ marginBottom: 14 }}>
            <div onClick={() => setRoutineModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#1e1208', border: '1px solid #7a3410', borderRadius: 12, cursor: 'pointer', color: '#e8823a', fontSize: 13, fontWeight: 500 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Add routine item
            </div>
          </div>
          {[{label:'Morning',color:'#f59e0b',icon:'🌅',range:[0,12]},{label:'Afternoon',color:'#10b981',icon:'☀️',range:[12,17]},{label:'Evening',color:'#a78bfa',icon:'🌆',range:[17,21]},{label:'Night',color:'#3b82f6',icon:'🌙',range:[21,24]}].map(period => {
            const items = routines.filter(r => { if (!r.time) return false; const hr = parseInt(r.time.split(':')[0]); return hr >= period.range[0] && hr < period.range[1] })
            return (
              <div key={period.label} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 18 }}>{period.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: period.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{period.label}</div>
                </div>
                {items.length === 0
                  ? <div style={{ padding: '10px 14px', fontSize: 13, color: '#2a2a2a', border: '1px dashed #1e1e24', borderRadius: 10, textAlign: 'center' }}>Nothing yet</div>
                  : items.map(item => (
                    <div key={item.id} onClick={() => setRoutineModal(item)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#161618', border: '1px solid #1e1e24', borderRadius: 12, marginBottom: 6, cursor: 'pointer' }}>
                      <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: period.color, minWidth: 55, flexShrink: 0 }}>{item.time}</div>
                      <div style={{ width: 1, height: 28, background: '#2a2a30', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: '#d4d2cc', fontWeight: 500 }}>{item.icon && item.icon + ' '}{item.name}</div>
                        {item.duration && <div style={{ fontSize: 11, color: '#555', marginTop: 2, fontFamily: "'DM Mono'" }}>{item.duration} min</div>}
                      </div>
                    </div>
                  ))
                }
              </div>
            )
          })}
        </div>
      )}

      {/* STATS VIEW */}
      {view === 'stats' && (
        <HabitStats habits={habits} logs={logs} isLogged={isLogged} getStreak={getStreak} statsPeriod={statsPeriod} setStatsPeriod={setStatsPeriod} />
      )}

      {routineModal && <RoutineModal routine={routineModal === 'new' ? null : routineModal} onClose={() => setRoutineModal(null)} onSaved={loadAll} />}
      {habitModal && <HabitModal habit={habitModal === 'new' ? null : habitModal} onClose={() => setHabitModal(null)} onSaved={loadAll} />}
    </div>
  )
}
