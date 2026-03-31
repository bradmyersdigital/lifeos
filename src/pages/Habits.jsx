import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DAY_LABELS = ['M','T','W','T','F','S','S']

export default function Habits() {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [showEdit, setShowEdit] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const todayDow = new Date().getDay()
  const todayIdx = todayDow === 0 ? 6 : todayDow - 1

  useEffect(() => { loadHabits() }, [])

  const loadHabits = async () => {
    const { data: habitData } = await supabase.from('habits').select('*').order('created_at')
    const { data: logData } = await supabase.from('habit_logs').select('*').gte('completed_date', getWeekStart())
    setHabits(habitData || [])
    setLogs(logData || [])
  }

  const getWeekStart = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - ((day + 6) % 7)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

  const getDateForDayIdx = (idx) => {
    const d = new Date()
    const dow = d.getDay()
    const currentIdx = dow === 0 ? 6 : dow - 1
    const diff = idx - currentIdx
    d.setDate(d.getDate() + diff)
    return d.toISOString().split('T')[0]
  }

  const isLogged = (habitId, dayIdx) => {
    const date = getDateForDayIdx(dayIdx)
    return logs.some(l => l.habit_id === habitId && l.completed_date === date)
  }

  const isTodayLogged = (habitId) => isLogged(habitId, todayIdx)

  const toggleHabit = async (habitId) => {
    const logged = isTodayLogged(habitId)
    if (logged) {
      await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('completed_date', today)
      setLogs(prev => prev.filter(l => !(l.habit_id === habitId && l.completed_date === today)))
    } else {
      const { data } = await supabase.from('habit_logs').insert({ habit_id: habitId, completed_date: today }).select().single()
      if (data) setLogs(prev => [...prev, data])
    }
  }

  const addHabit = async () => {
    if (!newHabitName.trim()) return
    const { data } = await supabase.from('habits').insert({ name: newHabitName.trim(), icon: '✅' }).select().single()
    if (data) setHabits(prev => [...prev, data])
    setNewHabitName('')
  }

  const removeHabit = async (id) => {
    await supabase.from('habits').delete().eq('id', id)
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  const getStreak = (habitId) => {
    let streak = 0
    let d = new Date()
    while (true) {
      const dateStr = d.toISOString().split('T')[0]
      if (logs.some(l => l.habit_id === habitId && l.completed_date === dateStr)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else break
    }
    return streak
  }

  const doneToday = habits.filter(h => isTodayLogged(h.id)).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Habits</div>
        <div onClick={() => setShowEdit(!showEdit)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1208', border: '1px solid #7a3410', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#d4520f', fontWeight: 500 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="#d4520f" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="#d4520f" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add / Edit
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {[['Today', `${doneToday} / ${habits.length}`, '#e8e6e1', 'completed'], ['Best streak', Math.max(0, ...habits.map(h => getStreak(h.id))), '#d4520f', 'days'], ['This week', habits.length ? Math.round(logs.length / (habits.length * 7) * 100) + '%' : '0%', '#e8e6e1', 'completion']].map(([label, val, color, sub]) => (
          <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 11, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 2, fontFamily: "'DM Mono'" }}>{sub}</div>
          </div>
        ))}
      </div>

      {showEdit && (
        <div style={{ background: '#161618', border: '1px solid #2a2a30', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Manage habits</div>
            <div onClick={() => setShowEdit(false)} style={{ width: 26, height: 26, borderRadius: '50%', background: '#242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666', fontSize: 16 }}>×</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input style={{ flex: 1, background: '#0f0f11', border: '1px solid #2a2a30', borderRadius: 10, padding: '9px 12px', fontSize: 14, color: '#e8e6e1', fontFamily: "'DM Sans'", outline: 'none' }} placeholder="New habit name..." value={newHabitName} onChange={e => setNewHabitName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHabit()} />
            <button onClick={addHabit} style={{ background: '#d4520f', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 500, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans'" }}>+ Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {habits.map(h => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#0f0f11', border: '1px solid #1e1e24', borderRadius: 10 }}>
                <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{h.icon}</span>
                <span style={{ fontSize: 13, color: '#c0bdb7', flex: 1 }}>{h.name}</span>
                <div onClick={() => removeHabit(h.id)} style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #2a2a30', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555', fontSize: 14, transition: 'all 0.15s' }}>×</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-label">Today's habits</div>
      {habits.map(habit => {
        const done = isTodayLogged(habit.id)
        const streak = getStreak(habit.id)
        const weekDone = DAY_LABELS.filter((_, i) => isLogged(habit.id, i)).length
        const pct = Math.round((weekDone / 7) * 100)
        return (
          <div key={habit.id} style={{ background: '#161618', border: `1px solid ${done ? '#1a3a1a' : '#242428'}`, borderRadius: 14, padding: 16, marginBottom: 10, transition: 'border-color 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: '#1e1e22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{habit.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{habit.name}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>Every day</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1e1208', border: '1px solid #3a2010', borderRadius: 10, padding: '5px 10px', flexShrink: 0 }}>
                <span style={{ fontFamily: "'DM Mono'", fontSize: 14, fontWeight: 500, color: '#d4520f' }}>{streak}</span>
                <span style={{ fontSize: 11, color: '#7a3410' }}>day streak</span>
              </div>
              <div onClick={() => toggleHabit(habit.id)} style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${done ? '#16a34a' : '#333'}`, background: done ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="1.5,6 4.5,9 10.5,3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
              {DAY_LABELS.map((label, i) => {
                const dayDone = isLogged(habit.id, i)
                const isToday = i === todayIdx
                const isPast = i < todayIdx
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: dayDone ? (isToday ? '#d4520f' : '#16a34a') : isPast ? '#2a0a0a' : '#1e1e24', border: `1px solid ${isToday && !dayDone ? '#d4520f' : dayDone ? 'transparent' : '#2a2a30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {dayDone && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                    </div>
                    <div style={{ fontSize: 10, color: '#444', fontFamily: "'DM Mono'" }}>{label}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="prog-bar" style={{ flex: 1 }}><div className="prog-fill" style={{ width: pct + '%' }} /></div>
              <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555', minWidth: 34, textAlign: 'right' }}>{weekDone}/7</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
