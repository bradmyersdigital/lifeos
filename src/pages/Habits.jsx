import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const DAY_LABELS = ['M','T','W','T','F','S','S']
const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
function toStr(d) { return d.toISOString().split('T')[0] }

// dayOfWeek: 0=Mon, 1=Tue, ... 6=Sun
const habitScheduledToday = (habit, dowIdx) => {
  if (!habit.days_of_week || habit.days_of_week.length === 0) return true
  return habit.days_of_week.includes(String(dowIdx)) || habit.days_of_week.includes(dowIdx)
}

function HabitModal({ habit, onClose, onSaved }) {
  const isEdit = !!habit
  const [name, setName] = useState(habit?.name || '')
  const [icon, setIcon] = useState(habit?.icon || '✅')
  const [days, setDays] = useState(() => {
    if (habit?.days_of_week && habit.days_of_week.length > 0) {
      return habit.days_of_week.map(d => parseInt(d))
    }
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

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${habit.name}"?`)) return
    await supabase.from('habits').delete().eq('id', habit.id)
    onSaved(); onClose()
  }

  const QUICK_ICONS = ['✅','💪','📖','💧','🏃','🧘','🥗','😴','📝','🎯','💊','🚫','☀️','🌙','🎵','🧹']

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? 'Edit habit' : 'Add habit'}<div className="modal-close" onClick={onClose}>×</div></div>

        <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 12 }}>{icon}</div>

        <div className="field"><div className="field-label">Habit name</div>
          <input type="text" placeholder="e.g. Workout, Read, Meditate..." value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="field">
          <div className="field-label">Schedule — which days?</div>
          <div style={{ display: 'flex', gap: 7 }}>
            {DAY_LABELS.map((label, i) => (
              <div key={i} onClick={() => toggleDay(i)} style={{ flex: 1, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: days.includes(i) ? '#1e1208' : '#0f0f11', border: `1px solid ${days.includes(i) ? '#7a3410' : '#242428'}`, color: days.includes(i) ? '#d4520f' : '#444' }}>
                {label}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>
            {days.length === 7 ? 'Every day' : days.length === 0 ? 'No days selected' : days.sort((a,b)=>a-b).map(d => DAY_NAMES[d]).join(', ')}
          </div>
        </div>

        <div className="field">
          <div className="field-label">Icon</div>
          <input type="text" value={icon} onChange={e => setIcon(e.target.value)} style={{ fontSize: 20, textAlign: 'center' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'center' }}>
            {QUICK_ICONS.map(e => (
              <div key={e} onClick={() => setIcon(e)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: icon === e ? '#1e1208' : '#161618', border: `1px solid ${icon === e ? '#7a3410' : '#242428'}`, borderRadius: 10, cursor: 'pointer' }}>{e}</div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={handleDelete} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add habit'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Habits() {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [habitModal, setHabitModal] = useState(null)
  const [view, setView] = useState('today')
  const [calMonth, setCalMonth] = useState(0)
  const [selectedHabit, setSelectedHabit] = useState(null)
  const dragItem = useRef(null)
  const dragOver = useRef(null)
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
    setHabits(hd || []); setLogs(ld || [])
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
      const ds = toStr(d)
      const dow = d.getDay(); const dowIdx = dow === 0 ? 6 : dow - 1
      const habit = habits.find(h => h.id === habitId)
      const scheduled = habit ? habitScheduledToday(habit, dowIdx) : true
      if (!scheduled) { d.setDate(d.getDate()-1); continue }
      if (logs.some(l => l.habit_id === habitId && l.completed_date === ds)) { streak++; d.setDate(d.getDate()-1) } else break
    }
    return streak
  }

  const saveOrder = async (reordered) => {
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('habits').update({ sort_order: i }).eq('id', reordered[i].id)
    }
  }

  // Desktop drag
  const handleDragStart = idx => { dragItem.current = idx }
  const handleDragEnter = idx => { dragOver.current = idx }
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) return
    const reordered = [...habits]
    const [moved] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, moved)
    setHabits(reordered)
    dragItem.current = null; dragOver.current = null
    await saveOrder(reordered)
  }

  // Mobile touch drag
  const handleTouchStart = (e, idx) => {
    touchStartY.current = e.touches[0].clientY
    touchDragIdx.current = idx
  }
  const handleTouchMove = (e) => {
    e.preventDefault()
    const y = e.touches[0].clientY
    const cardH = 180
    const newIdx = Math.max(0, Math.min(habits.length - 1, Math.round(touchDragIdx.current + (y - touchStartY.current) / cardH)))
    if (touchDragIdx.current !== newIdx) {
      const reordered = [...habits]
      const [moved] = reordered.splice(touchDragIdx.current, 1)
      reordered.splice(newIdx, 0, moved)
      setHabits(reordered)
      touchDragIdx.current = newIdx
      touchStartY.current = y
    }
  }
  const handleTouchEnd = async () => {
    await saveOrder(habits)
    touchDragIdx.current = null; touchStartY.current = null
  }

  // Calendar
  const monthDate = new Date(today.getFullYear(), today.getMonth() + calMonth, 1)
  const monthYear = monthDate.getFullYear(), monthMonth = monthDate.getMonth()
  const daysInMonth = new Date(monthYear, monthMonth + 1, 0).getDate()
  const firstDow = (new Date(monthYear, monthMonth, 1).getDay() + 6) % 7
  const calCells = []
  for (let i = 0; i < firstDow; i++) calCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d)

  const scheduledHabitsToday = habits.filter(h => habitScheduledToday(h, todayIdx))
  const doneToday = scheduledHabitsToday.filter(h => isLogged(h.id, todayStr)).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Habits</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: '#161618', border: '1px solid #242428', borderRadius: 10, overflow: 'hidden' }}>
            {['today','calendar'].map(v => (
              <div key={v} onClick={() => setView(v)} style={{ padding: '7px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: view === v ? '#1e1208' : 'transparent', color: view === v ? '#d4520f' : '#666' }}>
                {v === 'today' ? 'Today' : 'Calendar'}
              </div>
            ))}
          </div>
          <div onClick={() => setHabitModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1208', border: '1px solid #7a3410', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: '#d4520f', fontWeight: 500 }}>+ Add</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {[
          ['Today', `${doneToday}/${scheduledHabitsToday.length}`, '#e8e6e1', 'completed'],
          ['Best streak', Math.max(0,...habits.map(h=>getStreak(h.id))), '#d4520f','days'],
          ['Total', habits.length, '#a78bfa','habits'],
        ].map(([label,val,color,sub])=>(
          <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 11, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 500, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 2, fontFamily: "'DM Mono'" }}>{sub}</div>
          </div>
        ))}
      </div>

      {view === 'today' && (
        <div>
          <div style={{ fontSize: 12, color: '#444', marginBottom: 12 }}>Hold to reorder · tap icon to edit · tap day dots to log past days</div>
          {habits.map((habit, idx) => {
            const isScheduledToday = habitScheduledToday(habit, todayIdx)
            const done = isLogged(habit.id, todayStr)
            const streak = getStreak(habit.id)
            const scheduledDays = habit.days_of_week?.map(d => parseInt(d)) || [0,1,2,3,4,5,6]
            const weekDone = DAY_LABELS.filter((_, i) => {
              const isScheduled = scheduledDays.includes(i)
              return isScheduled && isLogged(habit.id, getDateForDayIdx(i))
            }).length
            const scheduledThisWeek = DAY_LABELS.filter((_, i) => scheduledDays.includes(i)).length
            const pct = scheduledThisWeek > 0 ? Math.round((weekDone/scheduledThisWeek)*100) : 0

            return (
              <div key={habit.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}
                onTouchStart={e => handleTouchStart(e, idx)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ background: '#161618', border: `1px solid ${done ? '#1a3a1a' : isScheduledToday ? '#242428' : '#1e1e24'}`, borderRadius: 14, padding: 16, marginBottom: 10, userSelect: 'none', touchAction: 'none', opacity: !isScheduledToday ? 0.6 : 1 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div onClick={() => setHabitModal(habit)} style={{ width: 40, height: 40, borderRadius: 11, background: '#1e1e22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, cursor: 'pointer' }}>{habit.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div onClick={() => setHabitModal(habit)} style={{ fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>{habit.name}</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                      {scheduledDays.length === 7 ? 'Every day' : scheduledDays.sort((a,b)=>a-b).map(d=>DAY_LABELS[d]).join(' ')}
                      {!isScheduledToday && <span style={{ color: '#444', marginLeft: 6 }}>· not scheduled today</span>}
                    </div>
                  </div>
                  {streak > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1e1208', border: '1px solid #3a2010', borderRadius: 10, padding: '5px 10px', flexShrink: 0 }}>
                      <span style={{ fontFamily: "'DM Mono'", fontSize: 14, fontWeight: 500, color: '#d4520f' }}>{streak}</span>
                      <span style={{ fontSize: 11, color: '#7a3410' }}>streak</span>
                    </div>
                  )}
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
                    const isScheduled = scheduledDays.includes(i)
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div
                          onClick={() => isScheduled && (isPast || isToday) && toggleLog(habit.id, date)}
                          style={{ width: 28, height: 28, borderRadius: '50%', background: !isScheduled ? 'transparent' : dayDone ? (isToday ? '#d4520f' : '#16a34a') : isPast ? '#1a1a1a' : '#1e1e24', border: `1px solid ${!isScheduled ? '#1a1a1a' : isToday && !dayDone ? '#d4520f' : dayDone ? 'transparent' : '#2a2a30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isScheduled && (isPast || isToday) ? 'pointer' : 'default', transition: 'all 0.15s' }}
                        >
                          {isScheduled && dayDone && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                          {!isScheduled && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2a2a2a' }} />}
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

      {view === 'calendar' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div onClick={() => setCalMonth(o=>o-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>‹</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{MONTH_NAMES[monthMonth]} {monthYear}</div>
            <div onClick={() => setCalMonth(o=>o+1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>›</div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
            <div onClick={() => setSelectedHabit(null)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', background: !selectedHabit ? '#1e1208' : '#161618', borderColor: !selectedHabit ? '#7a3410' : '#242428', color: !selectedHabit ? '#d4520f' : '#666' }}>All</div>
            {habits.map(h => (
              <div key={h.id} onClick={() => setSelectedHabit(h.id === selectedHabit ? null : h.id)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', background: selectedHabit === h.id ? '#1e1208' : '#161618', borderColor: selectedHabit === h.id ? '#7a3410' : '#242428', color: selectedHabit === h.id ? '#d4520f' : '#666' }}>
                {h.icon} {h.name}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {['M','T','W','T','F','S','S'].map((d,i) => <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#444', padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {calCells.map((day, idx) => {
              if (!day) return <div key={idx} />
              const dateStr = toStr(new Date(monthYear, monthMonth, day))
              const isToday = dateStr === todayStr, isFuture = dateStr > todayStr
              const calDow = new Date(monthYear, monthMonth, day).getDay()
              const calDowIdx = calDow === 0 ? 6 : calDow - 1
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
            {[['#16a34a','All done'],['#f59e0b','Partial'],['#1e1e24','None']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />{l}
              </div>
            ))}
          </div>
        </div>
      )}

      {habitModal && <HabitModal habit={habitModal === 'new' ? null : habitModal} onClose={() => setHabitModal(null)} onSaved={loadAll} />}
    </div>
  )
}
