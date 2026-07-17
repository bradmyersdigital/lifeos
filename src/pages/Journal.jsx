import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

function fmt(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}
function fmtShort(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function todayStr() {
  return new Date().toISOString().split('T')[0]
}

const PROMPTS = [
  { id: 'win',       emoji: '🏆', label: "Today's win",         placeholder: "What's one thing you actually got done today, no matter how small? Own it." },
  { id: 'grateful',  emoji: '🙏', label: "Grateful for",        placeholder: "What or who are you genuinely grateful for today? Be specific, not generic." },
  { id: 'focus',     emoji: '🎯', label: "Tomorrow's #1 focus", placeholder: "If you could only accomplish one thing tomorrow, what would it be?" },
]

// ── Day Snapshot — habits + tasks pulled live ────────────────────────────────
function DaySnapshot({ date }) {
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState([])
  const [tasks, setTasks] = useState([])
  const [focusTotal, setFocusTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [habitsRes, logsRes, tasksRes, focusRes] = await Promise.all([
        supabase.from('habits').select('*').order('sort_order').order('name'),
        supabase.from('habit_logs').select('*').eq('log_date', date),
        supabase.from('tasks').select('*').eq('start_date', date),
        supabase.from('focus_sessions').select('duration_minutes').gte('completed_at', date + 'T00:00:00').lte('completed_at', date + 'T23:59:59'),
      ])
      setHabits(habitsRes.data || [])
      setHabitLogs(logsRes.data || [])
      setTasks(tasksRes.data || [])
      setFocusTotal((focusRes.data || []).reduce((s, r) => s + (r.duration_minutes || 0), 0))
      setLoading(false)
    }
    load()
  }, [date])

  const toggleHabit = async (habitId) => {
    const existing = habitLogs.find(l => l.habit_id === habitId)
    if (existing) {
      await supabase.from('habit_logs').delete().eq('id', existing.id)
      setHabitLogs(prev => prev.filter(l => l.id !== existing.id))
    } else {
      const { data } = await supabase.from('habit_logs').insert({ habit_id: habitId, log_date: date, completed: true }).select().single()
      if (data) setHabitLogs(prev => [...prev, data])
    }
  }

  const completedHabits = habitLogs.length
  const completedTasks = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const incompleteTasks = tasks.filter(t => !t.completed)

  if (loading) return <div style={{ padding: '16px', color: '#333', fontSize: 12 }}>Loading your day...</div>

  return (
    <div style={{ background: '#161618', border: '1px solid #1e1e24', borderRadius: 16, padding: 18, marginBottom: 24 }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
        <div style={{ background: '#0f0f11', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: completedHabits > 0 ? '#10b981' : '#333' }}>{completedHabits}<span style={{ fontSize: 13, color: '#444', fontWeight: 400 }}>/{habits.length}</span></div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Habits</div>
        </div>
        <div style={{ background: '#0f0f11', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: completedTasks > 0 ? 'var(--accent)' : '#333' }}>{completedTasks}<span style={{ fontSize: 13, color: '#444', fontWeight: 400 }}>/{totalTasks}</span></div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Tasks done</div>
        </div>
        <div style={{ background: '#0f0f11', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: focusTotal > 0 ? '#a78bfa' : '#333' }}>{focusTotal}<span style={{ fontSize: 13, color: '#444', fontWeight: 400 }}>m</span></div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Focus</div>
        </div>
      </div>

      {/* Habits checklist */}
      {habits.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Habits</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {habits.map(habit => {
              const done = habitLogs.some(l => l.habit_id === habit.id)
              return (
                <div key={habit.id} onClick={() => toggleHabit(habit.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${done ? '#10b981' : '#333'}`, background: done ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><polyline points="1,4 3.5,6.5 9,1" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>}
                  </div>
                  <div style={{ fontSize: 13, color: done ? '#555' : '#c0bdb7', textDecoration: done ? 'line-through' : 'none', flex: 1 }}>
                    {habit.icon && <span style={{ marginRight: 6 }}>{habit.icon}</span>}{habit.name}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Incomplete tasks */}
      {incompleteTasks.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Still open today</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {incompleteTasks.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0f0f11', borderRadius: 10, border: '1px solid #1e1e24' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: '#777', flex: 1 }}>{task.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Journal Entry editor ──────────────────────────────────────────────────────
function JournalEntry({ entry, onBack, onSaved }) {
  const isToday = entry.date === todayStr()
  const [prompts, setPrompts] = useState(entry.prompts || {})
  const [reflection, setReflection] = useState(entry.reflection || '')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const saveTimer = useRef(null)
  const entryId = useRef(entry.id || null)

  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(autoSave, 1200)
    return () => clearTimeout(saveTimer.current)
  }, [prompts, reflection])

  const autoSave = async () => {
    if (!prompts.win && !prompts.grateful && !prompts.focus && !reflection) return
    setSaving(true)
    const payload = { date: entry.date, prompts, reflection, updated_at: new Date().toISOString() }
    if (entryId.current) {
      await supabase.from('journal_entries').update(payload).eq('id', entryId.current)
    } else {
      const { data } = await supabase.from('journal_entries').insert(payload).select().single()
      if (data) entryId.current = data.id
    }
    setSaving(false)
    setLastSaved(new Date())
    onSaved?.()
  }

  const setPrompt = (id, val) => setPrompts(p => ({ ...p, [id]: val }))

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div onClick={() => { autoSave(); onBack() }} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888', flexShrink: 0 }}>‹</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#e8e6e1' }}>{fmt(entry.date + 'T12:00:00')}</div>
          <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'", marginTop: 1 }}>
            {saving ? 'Saving…' : lastSaved ? 'Saved' : entry.id ? 'Saved' : 'New entry'}
          </div>
        </div>
        <div onClick={() => { autoSave(); onBack() }} className="btn-primary" style={{ padding: '7px 16px', borderRadius: 10, fontSize: 13, border: 'none', cursor: 'pointer' }}>Done</div>
      </div>

      {/* Day snapshot */}
      <DaySnapshot date={entry.date} />

      {/* Prompts */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Daily check-in</div>
        {PROMPTS.map((p, i) => (
          <div key={p.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 18 }}>{p.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>{p.label}</div>
            </div>
            <textarea
              placeholder={p.placeholder}
              value={prompts[p.id] || ''}
              onChange={e => setPrompt(p.id, e.target.value)}
              style={{ width: '100%', background: '#161618', border: `1px solid ${prompts[p.id] ? 'var(--accent-border)' : '#242428'}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#d4d2cc', fontFamily: "'DM Sans'", resize: 'none', outline: 'none', lineHeight: 1.6, minHeight: 80, transition: 'border-color 0.15s' }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.max(80, e.target.scrollHeight) + 'px' }}
            />
          </div>
        ))}
      </div>

      {/* Reflection */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 18 }}>✍️</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>Reflection & review</div>
        </div>
        <div style={{ fontSize: 12, color: '#444', marginBottom: 10, lineHeight: 1.5 }}>Your space. No prompts. Write what's on your mind — thoughts, feelings, what you'd do differently, what you're thinking about.</div>
        <textarea
          placeholder="Start writing..."
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          style={{ width: '100%', background: '#161618', border: `1px solid ${reflection ? 'var(--accent-border)' : '#242428'}`, borderRadius: 12, padding: '14px', fontSize: 14, color: '#d4d2cc', fontFamily: "'DM Sans'", resize: 'none', outline: 'none', lineHeight: 1.7, minHeight: 160, transition: 'border-color 0.15s' }}
        />
      </div>
    </div>
  )
}

// ── Main Journal page ─────────────────────────────────────────────────────────
export default function Journal() {
  const [entries, setEntries] = useState([])
  const [openEntry, setOpenEntry] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('journal_entries').select('*').order('date', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  const openToday = () => {
    const today = todayStr()
    const existing = entries.find(e => e.date === today)
    setOpenEntry(existing || { date: today, prompts: {}, reflection: '' })
  }

  if (openEntry) {
    return <JournalEntry entry={openEntry} onBack={() => { setOpenEntry(null); load() }} onSaved={load} />
  }

  const todayEntry = entries.find(e => e.date === todayStr())
  const pastEntries = entries.filter(e => e.date !== todayStr())

  const EntryCard = ({ entry }) => {
    const hasContent = entry.prompts?.win || entry.prompts?.grateful || entry.prompts?.focus || entry.reflection
    const preview = entry.prompts?.win || entry.prompts?.grateful || entry.reflection || ''
    const completedPrompts = PROMPTS.filter(p => entry.prompts?.[p.id]).length

    return (
      <div onClick={() => setOpenEntry(entry)} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16, marginBottom: 10, cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e8e6e1' }}>{fmtShort(entry.date + 'T12:00:00')}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {PROMPTS.map(p => (
              <div key={p.id} style={{ fontSize: 13, opacity: entry.prompts?.[p.id] ? 1 : 0.2 }}>{p.emoji}</div>
            ))}
            <div style={{ fontSize: 13, opacity: entry.reflection ? 1 : 0.2, marginLeft: 2 }}>✍️</div>
          </div>
        </div>
        {preview && <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</div>}
        <div style={{ fontSize: 10, color: '#333', fontFamily: "'DM Mono'", marginTop: 6 }}>
          {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })} · {completedPrompts}/3 prompts{entry.reflection ? ' · reflection' : ''}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Journal</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</div>
        </div>
        <div onClick={openToday} className="action-btn btn-task" style={{ gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          {todayEntry ? "Today's entry" : "Write today"}
        </div>
      </div>

      {/* Today card */}
      {!loading && (
        <div onClick={openToday} style={{ background: todayEntry ? 'var(--accent-dim)' : '#161618', border: `1px solid ${todayEntry ? 'var(--accent-border)' : '#242428'}`, borderRadius: 16, padding: 18, marginBottom: 24, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: todayEntry ? 'var(--accent)' : '#888', marginBottom: 4 }}>
                {todayEntry ? '✅ Today written' : '📓 Write today\'s entry'}
              </div>
              <div style={{ fontSize: 12, color: '#555' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              {todayEntry && (
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {PROMPTS.map(p => (
                    <div key={p.id} style={{ fontSize: 14, opacity: todayEntry.prompts?.[p.id] ? 1 : 0.25 }}>{p.emoji}</div>
                  ))}
                  <div style={{ fontSize: 14, opacity: todayEntry.reflection ? 1 : 0.25, marginLeft: 2 }}>✍️</div>
                </div>
              )}
            </div>
            <div style={{ fontSize: 24, color: todayEntry ? 'var(--accent)' : '#2a2a30' }}>{todayEntry ? '›' : '+'}</div>
          </div>
        </div>
      )}

      {/* Stats */}
      {entries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
          {[
            ['Entries', entries.length, '#e8e6e1'],
            ['This month', entries.filter(e => e.date.startsWith(new Date().toISOString().slice(0,7))).length, 'var(--accent)'],
            ['Streak', (() => {
              let streak = 0, d = new Date()
              while (true) {
                const s = d.toISOString().split('T')[0]
                if (entries.find(e => e.date === s)) { streak++; d.setDate(d.getDate()-1) }
                else break
              }
              return streak
            })(), '#f59e0b'],
          ].map(([l,v,c]) => (
            <div key={l} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Past entries */}
      {pastEntries.length > 0 && (
        <div>
          <div className="section-label">Past entries</div>
          {pastEntries.map(e => <EntryCard key={e.id} entry={e} />)}
        </div>
      )}

      {entries.length === 0 && !loading && (
        <div onClick={openToday} style={{ textAlign: 'center', padding: '50px 20px', color: '#444', fontSize: 14, border: '1px dashed #242428', borderRadius: 14, cursor: 'pointer' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📓</div>
          <div style={{ marginBottom: 6, color: '#666' }}>Your journal is empty</div>
          <div style={{ fontSize: 12, color: '#333' }}>Tap to write your first entry</div>
        </div>
      )}
    </div>
  )
}
