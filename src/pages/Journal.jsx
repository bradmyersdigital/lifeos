import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import FolderList, { FolderHeader } from '../components/FolderList'

function todayStr() { return new Date().toISOString().split('T')[0] }
function fmt(d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) }
function fmtShort(d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }

const JOURNAL_TYPES = [
  { id: 'reflection', label: 'Daily Reflection', icon: '📓', hasPrompts: true },
  { id: 'free',       label: 'Entry',            icon: '📝', hasPrompts: false },
  { id: 'fitness',    label: 'Fitness',          icon: '💪', hasPrompts: false },
  { id: 'travel',     label: 'Travel',           icon: '✈️', hasPrompts: false },
  { id: 'family',     label: 'Family',           icon: '❤️', hasPrompts: false },
  { id: 'reading',    label: 'Reading',          icon: '📚', hasPrompts: false },
]

const REFLECTION_PROMPTS = [
  { id: 'win',      emoji: '🏆', label: "Today's win",         placeholder: "What's one thing you actually got done today? Own it." },
  { id: 'grateful', emoji: '🙏', label: "Grateful for",        placeholder: "What are you genuinely grateful for today? Be specific." },
  { id: 'focus',    emoji: '🎯', label: "Tomorrow's #1 focus", placeholder: "If you could only accomplish one thing tomorrow, what would it be?" },
]

// Day snapshot at top of journal entry
function DaySnapshot({ date }) {
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('habits').select('*').order('sort_order').order('name'),
      supabase.from('habit_logs').select('*').eq('log_date', date),
      supabase.from('tasks').select('*').eq('start_date', date),
    ]).then(([h, l, t]) => {
      setHabits(h.data || [])
      setHabitLogs(l.data || [])
      setTasks(t.data || [])
      setLoading(false)
    })
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

  if (loading) return null

  const incompleteTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed).length

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: habits.length > 0 ? 16 : 0 }}>
        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: habitLogs.length > 0 ? 'var(--success)' : 'var(--text-dim)' }}>{habitLogs.length}<span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 400 }}>/{habits.length}</span></div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Habits done</div>
        </div>
        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: completedTasks > 0 ? 'var(--accent)' : 'var(--text-dim)' }}>{completedTasks}<span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 400 }}>/{tasks.length}</span></div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Tasks done</div>
        </div>
      </div>

      {/* Habits list */}
      {habits.length > 0 && (
        <div style={{ marginBottom: incompleteTasks.length > 0 ? 14 : 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Habits</div>
          {habits.map(habit => {
            const done = habitLogs.some(l => l.habit_id === habit.id)
            return (
              <div key={habit.id} onClick={() => toggleHabit(habit.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${done ? 'var(--success)' : 'var(--border)'}`, background: done ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><polyline points="1,4 3.5,6.5 9,1" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>}
                </div>
                <div style={{ fontSize: 13, color: done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
                  {habit.icon && <span style={{ marginRight: 5 }}>{habit.icon}</span>}{habit.name}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Incomplete tasks */}
      {incompleteTasks.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Still open</div>
          {incompleteTasks.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--bg)', borderRadius: 8, marginBottom: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Journal Entry editor
function JournalEntry({ entry, onBack, onSaved, categories }) {
  const [title, setTitle] = useState(entry.title || '')
  const [journalType, setJournalType] = useState(entry.journal_type || 'reflection')
  const [category, setCategory] = useState(entry.category || 'All Entries')
  const [prompts, setPrompts] = useState(entry.prompts || {})
  const [reflection, setReflection] = useState(entry.reflection || '')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const entryId = useRef(entry.id || null)
  const saveTimer = useRef(null)
  const isReflection = journalType === 'reflection'
  const typeInfo = JOURNAL_TYPES.find(t => t.id === journalType) || JOURNAL_TYPES[0]

  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(autoSave, 1200)
    return () => clearTimeout(saveTimer.current)
  }, [title, journalType, category, prompts, reflection])

  const autoSave = async () => {
    if (!title && !reflection && !Object.values(prompts).some(Boolean)) return
    setSaving(true)
    const payload = { date: entry.date, title: title || null, journal_type: journalType, category, prompts, reflection: reflection || null, updated_at: new Date().toISOString() }
    if (entryId.current) {
      await supabase.from('journal_entries').update(payload).eq('id', entryId.current)
    } else {
      const { data } = await supabase.from('journal_entries').insert(payload).select().single()
      if (data) entryId.current = data.id
    }
    setSaving(false); setLastSaved(new Date()); onSaved?.()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div onClick={() => { autoSave(); onBack() }} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(entry.date)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{saving ? 'Saving…' : lastSaved ? 'Saved' : entry.id ? 'Saved' : 'New entry'}</div>
        </div>
        <div onClick={() => { autoSave(); onBack() }} className="btn-primary" style={{ padding: '7px 16px', borderRadius: 10, fontSize: 13, border: 'none', cursor: 'pointer' }}>Done</div>
      </div>

      {/* Journal type selector */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Journal type</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
          {[...JOURNAL_TYPES, ...categories.filter(c => !JOURNAL_TYPES.find(t => t.label === c.label))].map(type => (
            <div key={type.id || type.label} onClick={() => setJournalType(type.id || type.label)}
              style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', flexShrink: 0, background: journalType === (type.id || type.label) ? 'var(--accent-dim)' : 'var(--bg-card)', borderColor: journalType === (type.id || type.label) ? 'var(--accent-border)' : 'var(--border)', color: journalType === (type.id || type.label) ? 'var(--accent)' : 'var(--text-muted)' }}>
              {type.icon} {type.label}
            </div>
          ))}
        </div>
      </div>

      {/* Day snapshot - only for reflection */}
      {isReflection && <DaySnapshot date={entry.date} />}

      {/* Title */}
      <input type="text" placeholder={isReflection ? 'Title (optional)' : 'Entry title…'} value={title} onChange={e => setTitle(e.target.value)}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'DM Sans'", marginBottom: 16, padding: 0 }} />

      {/* Reflection prompts */}
      {isReflection && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Daily check-in</div>
          {REFLECTION_PROMPTS.map(p => (
            <div key={p.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ fontSize: 16 }}>{p.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{p.label}</div>
              </div>
              <textarea placeholder={p.placeholder} value={prompts[p.id] || ''} onChange={e => setPrompts(pr => ({ ...pr, [p.id]: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg-card)', border: `1px solid ${prompts[p.id] ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 12, padding: '11px 13px', fontSize: 14, color: 'var(--text-primary)', fontFamily: "'DM Sans'", resize: 'none', outline: 'none', lineHeight: 1.6, minHeight: 72, transition: 'border-color 0.15s' }} />
            </div>
          ))}
        </div>
      )}

      {/* Free write area */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 16 }}>✍️</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{isReflection ? 'Reflection' : 'Write'}</div>
        </div>
        <textarea placeholder={isReflection ? 'Your thoughts, what happened, what you\'d change…' : `Write your ${typeInfo.label} entry…`}
          value={reflection} onChange={e => setReflection(e.target.value)}
          style={{ width: '100%', background: 'var(--bg-card)', border: `1px solid ${reflection ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 12, padding: '14px', fontSize: 14, color: 'var(--text-primary)', fontFamily: "'DM Sans'", resize: 'none', outline: 'none', lineHeight: 1.7, minHeight: 180, transition: 'border-color 0.15s' }} />
      </div>
    </div>
  )
}

// Main Journal page
export default function Journal() {
  const [entries, setEntries] = useState([])
  const [categories, setCategories] = useState([])
  const [activeFilter, setActiveFilter] = useState(null) // null = folder index
  const [openEntry, setOpenEntry] = useState(null)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📔')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const [entriesRes, catsRes] = await Promise.all([
      supabase.from('journal_entries').select('*').order('date', { ascending: false }),
      supabase.from('journal_categories').select('*').order('name'),
    ])
    setEntries(entriesRes.data || [])
    setCategories(catsRes.data || [])
    setLoading(false)
  }

  const addCategory = async () => {
    if (!newCatName.trim()) return
    await supabase.from('journal_categories').insert({ name: newCatName.trim(), icon: newCatIcon, label: newCatName.trim(), id: newCatName.trim().toLowerCase().replace(/\s+/g, '_') })
    setNewCatName(''); setShowNewCat(false); load()
  }

  // Daily Reflection — one per day, carries the prompt template
  const openReflection = () => {
    const today = todayStr()
    const existing = entries.find(e => e.date === today && (e.journal_type || 'reflection') === 'reflection')
    setOpenEntry(existing || { date: today, journal_type: 'reflection', prompts: {}, reflection: '' })
  }
  // Plain entry — always a fresh blank, no template
  const openBlank = () => {
    setOpenEntry({ date: todayStr(), journal_type: 'free', prompts: {}, reflection: '' })
  }

  if (openEntry) return <JournalEntry entry={openEntry} categories={categories} onBack={() => { setOpenEntry(null); load() }} onSaved={load} />

  const ALL_FILTERS = [
    { id: 'All Entries', label: 'All Entries', icon: '📒' },
    { id: 'reflection', label: 'Daily Reflection', icon: '📓' },
    { id: 'free', label: 'Entries', icon: '📝' },
    { id: 'fitness', label: 'Fitness', icon: '💪' },
    { id: 'travel', label: 'Travel', icon: '✈️' },
    { id: 'family', label: 'Family', icon: '❤️' },
    { id: 'reading', label: 'Reading', icon: '📚' },
    ...categories,
  ]

  const filtered = (!activeFilter || activeFilter === 'All Entries') ? entries : entries.filter(e => (e.journal_type || 'reflection') === activeFilter)
  const todayEntry = entries.find(e => e.date === todayStr())
  const streak = (() => {
    let s = 0, d = new Date()
    while (entries.find(e => e.date === d.toISOString().split('T')[0])) { s++; d.setDate(d.getDate() - 1) }
    return s
  })()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)' }}>Journal</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{entries.length} entries · {streak} day streak</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <div onClick={openReflection} className="action-btn btn-task" style={{ gap: 5, padding: '9px 12px', fontSize: 12.5 }}>
            📓 Reflection
          </div>
          <div onClick={openBlank} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 12, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Entry
          </div>
        </div>
      </div>

      {/* Today card */}
      {!activeFilter && <div onClick={openReflection} style={{ background: todayEntry ? 'var(--accent-dim)' : 'var(--bg-card)', border: `1px solid ${todayEntry ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 16, padding: 18, marginBottom: 20, cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: todayEntry ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 3 }}>
              {todayEntry ? '✅ Today written' : '📓 Write today\'s entry'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
          <div style={{ fontSize: 22, color: todayEntry ? 'var(--accent)' : 'var(--text-dim)' }}>›</div>
        </div>
      </div>}

      {/* Stats */}
      {!activeFilter && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
        {[['Total', entries.length, 'var(--text-primary)'],['This month', entries.filter(e => e.date.startsWith(new Date().toISOString().slice(0,7))).length,'var(--accent)'],['Streak', streak, 'var(--warn)']].map(([l,v,col]) => (
          <div key={l} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: col }}>{v}</div>
          </div>
        ))}
      </div>}

      {/* Journal folders */}
      {!activeFilter && (
        <FolderList
          folders={ALL_FILTERS.map(f => ({
            id: f.id,
            icon: f.icon,
            label: f.label,
            count: f.id === 'All Entries' ? entries.length : entries.filter(e => (e.journal_type || 'reflection') === f.id).length,
          }))}
          onOpen={(f) => setActiveFilter(f.id)}
        />
      )}

      {!activeFilter && (
        <div onClick={() => setShowNewCat(!showNewCat)}
          style={{ marginTop: 10, padding: '11px 16px', borderRadius: 14, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px dashed var(--accent-border)', color: 'var(--accent)', background: 'var(--accent-dim)', textAlign: 'center' }}>
          + New journal
        </div>
      )}

      {showNewCat && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
          <input value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} style={{ width: 46, textAlign: 'center', fontSize: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px', outline: 'none', color: 'var(--text-primary)', fontFamily: "'DM Sans'" }} />
          <input type="text" placeholder="Journal name…" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()}
            style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: "'DM Sans'", outline: 'none' }} />
          <button onClick={addCategory} className="btn-primary" style={{ padding: '0 14px', height: 38, borderRadius: 10, fontSize: 13, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans'" }}>Add</button>
          <button onClick={() => setShowNewCat(false)} style={{ padding: '0 12px', height: 38, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', fontFamily: "'DM Sans'" }}>×</button>
        </div>
      )}

      {/* Entries list — only inside a folder */}
      {activeFilter && (
        <FolderHeader
          icon={(ALL_FILTERS.find(f => f.id === activeFilter) || {}).icon}
          title={(ALL_FILTERS.find(f => f.id === activeFilter) || {}).label || activeFilter}
          subtitle={`${filtered.length} entr${filtered.length === 1 ? 'y' : 'ies'}`}
          onBack={() => setActiveFilter(null)}
        />
      )}

      {activeFilter && filtered.length === 0 && !loading && (
        <div onClick={openReflection} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: 14, border: '1px dashed var(--border)', borderRadius: 14, cursor: 'pointer' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📓</div>
          <div>No entries here yet</div>
        </div>
      )}

      {activeFilter && filtered.map(entry => {
        const typeInfo = JOURNAL_TYPES.find(t => t.id === (entry.journal_type || 'reflection')) || JOURNAL_TYPES[0]
        const preview = entry.prompts?.win || entry.reflection || ''
        return (
          <div key={entry.id} onClick={() => setOpenEntry(entry)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {entry.title || fmtShort(entry.date)}
                </div>
                {preview && <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</div>}
              </div>
              <div style={{ marginLeft: 10, fontSize: 18, flexShrink: 0 }}>{typeInfo.icon}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>{new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>{typeInfo.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
