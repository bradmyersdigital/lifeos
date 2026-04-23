import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_CATS = [
  { name: 'Ideas', color: '#a78bfa' },
  { name: 'Business', color: '#d4520f' },
  { name: 'Personal', color: '#10b981' },
  { name: 'Health', color: '#06b6d4' },
  { name: 'Gratitude', color: '#f59e0b' },
  { name: 'Research', color: '#3b82f6' },
]

function fmt(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtRelative(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diff = Math.floor((now - date) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return fmt(d)
}

// ── Note Editor — full page ─────────────────────────────────────────────────
function NoteEditor({ note, onBack, onSaved, categories, projects, goals, sectors }) {
  const [title, setTitle] = useState(note?.title || '')
  const [body, setBody] = useState(note?.body || note?.text || '')
  const [category, setCategory] = useState(note?.category || '')
  const [sector, setSector] = useState(note?.sector || '')
  const [projectId, setProjectId] = useState(note?.project_id || '')
  const [goalId, setGoalId] = useState(note?.goal_id || '')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const saveTimer = useRef(null)
  const bodyRef = useRef(null)
  const isNew = !note?.id

  // Auto-save
  useEffect(() => {
    if (!title && !body) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { autoSave() }, 1200)
    return () => clearTimeout(saveTimer.current)
  }, [title, body, category, sector, projectId, goalId])

  const autoSave = async () => {
    setSaving(true)
    const payload = {
      title: title.trim() || null,
      body: body || null,
      text: body || null, // keep legacy field in sync
      category: category || null,
      sector: sector || null,
      project_id: projectId || null,
      goal_id: goalId || null,
      updated_at: new Date().toISOString(),
    }
    if (note?.id) {
      await supabase.from('notes').update(payload).eq('id', note.id)
    } else {
      const { data } = await supabase.from('notes').insert(payload).select().single()
      if (data) note = data
    }
    setSaving(false)
    setLastSaved(new Date())
    onSaved?.()
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this note?')) return
    if (note?.id) await supabase.from('notes').delete().eq('id', note.id)
    onSaved?.()
    onBack()
  }

  const linkedProject = projects.find(p => p.id === projectId)
  const linkedGoal = goals.find(g => g.id === goalId)
  const catColor = categories.find(c => c.name === category)?.color || '#555'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div onClick={() => { autoSave(); onBack() }} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888', flexShrink: 0 }}>‹</div>
        <div style={{ flex: 1, fontSize: 12, color: '#444' }}>
          {saving ? 'Saving…' : lastSaved ? `Saved ${fmtRelative(lastSaved)}` : 'Unsaved'}
        </div>
        <div onClick={handleDelete} style={{ padding: '6px 12px', borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>Delete</div>
        <div onClick={() => { autoSave(); onBack() }} className="btn-primary" style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer', border: 'none' }}>Done</div>
      </div>

      {/* Meta row — date + tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'", marginRight: 4 }}>{fmt(note?.created_at || new Date())}</div>
        {category && <div style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: catColor + '22', color: catColor, border: `1px solid ${catColor}66` }}>{category}</div>}
        {sector && <div style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, color: '#888', background: '#161618', border: '1px solid #242428' }}>{sector}</div>}
        {linkedProject && <div style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>📋 {linkedProject.name}</div>}
        {linkedGoal && <div style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, color: '#a78bfa', background: '#16112e', border: '1px solid #3a2a6c' }}>🎯 {linkedGoal.goal_text?.substring(0,20)}…</div>}
      </div>

      {/* Title */}
      <textarea
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        rows={1}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 26, fontWeight: 600, color: '#e8e6e1', fontFamily: "'DM Sans'", resize: 'none', marginBottom: 12, lineHeight: 1.3, padding: 0 }}
        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
      />

      {/* Body */}
      <textarea
        ref={bodyRef}
        placeholder="Start writing…"
        value={body}
        onChange={e => setBody(e.target.value)}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 16, color: '#c0bdb7', fontFamily: "'DM Sans'", resize: 'none', flex: 1, lineHeight: 1.7, padding: 0, minHeight: 200 }}
      />

      {/* Link panel */}
      <div style={{ marginTop: 24, padding: 16, background: '#161618', border: '1px solid #242428', borderRadius: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Links & category</div>

        <div className="field" style={{ marginBottom: 12 }}>
          <div className="field-label">Category</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <div onClick={() => setCategory('')} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: !category ? 'var(--accent-dim)' : '#0f0f11', borderColor: !category ? 'var(--accent-border)' : '#242428', color: !category ? 'var(--accent)' : '#555' }}>None</div>
            {categories.map(cat => (
              <div key={cat.name} onClick={() => setCategory(cat.name)}
                style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: category === cat.name ? cat.color + '22' : '#0f0f11', borderColor: category === cat.name ? cat.color : '#242428', color: category === cat.name ? cat.color : '#555' }}>
                {cat.name}
              </div>
            ))}
          </div>
        </div>

        <div className="field-row" style={{ marginBottom: 0 }}>
          <div className="field">
            <div className="field-label">Sector</div>
            <select value={sector} onChange={e => setSector(e.target.value)}>
              <option value="">None</option>
              {sectors.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="field">
            <div className="field-label">Project</div>
            <select value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">None</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
          <div className="field-label">Goal</div>
          <select value={goalId} onChange={e => setGoalId(e.target.value)}>
            <option value="">None</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.timeframe} — {g.goal_text?.substring(0,40)}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

// ── Main Notes page ──────────────────────────────────────────────────────────
export default function Notes() {
  const [notes, setNotes] = useState([])
  const [categories, setCategories] = useState(DEFAULT_CATS)
  const [projects, setProjects] = useState([])
  const [goals, setGoals] = useState([])
  const [sectors, setSectors] = useState([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [openNote, setOpenNote] = useState(null) // null = list, 'new' = new, note obj = edit
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#a78bfa')

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    const [notesRes, projRes, goalsRes, sectorsRes, catsRes] = await Promise.all([
      supabase.from('notes').select('*, projects(name)').order('pinned', { ascending: false }).order('updated_at', { ascending: false }),
      supabase.from('projects').select('id, name').eq('status', 'active'),
      supabase.from('goals').select('id, goal_text, timeframe').order('timeframe'),
      supabase.from('sectors').select('*').order('sort_order').order('name'),
      supabase.from('note_categories').select('*').order('name'),
    ])
    setNotes(notesRes.data || [])
    setProjects(projRes.data || [])
    setGoals(goalsRes.data || [])
    setSectors(sectorsRes.data || [])
    if (catsRes.data?.length) setCategories(catsRes.data)
  }

  const pinNote = async (note, e) => {
    e.stopPropagation()
    await supabase.from('notes').update({ pinned: !note.pinned }).eq('id', note.id)
    loadAll()
  }

  const addCategory = async () => {
    if (!newCatName.trim()) return
    await supabase.from('note_categories').insert({ name: newCatName.trim(), color: newCatColor })
    setNewCatName(''); setShowNewCat(false)
    loadAll()
  }

  const filtered = notes.filter(n => {
    const matchSearch = !search || (n.title || n.body || n.text || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || n.category === filterCat
    return matchSearch && matchCat
  })

  const pinned = filtered.filter(n => n.pinned)
  const unpinned = filtered.filter(n => !n.pinned)

  // If editing a note, show editor full-page
  if (openNote !== null) {
    return (
      <NoteEditor
        note={openNote === 'new' ? null : openNote}
        categories={categories}
        projects={projects}
        goals={goals}
        sectors={sectors}
        onBack={() => { setOpenNote(null); loadAll() }}
        onSaved={loadAll}
      />
    )
  }

  const NoteCard = ({ note }) => {
    const catColor = categories.find(c => c.name === note.category)?.color || '#555'
    const preview = (note.body || note.text || '').replace(/\n/g, ' ').substring(0, 100)
    return (
      <div onClick={() => setOpenNote(note)} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16, marginBottom: 10, cursor: 'pointer', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#e8e6e1', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {note.title || preview.substring(0, 40) || 'Untitled'}
            </div>
            {note.title && <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</div>}
          </div>
          <div style={{ display: 'flex', gap: 6, marginLeft: 10, flexShrink: 0 }}>
            <div onClick={e => pinNote(note, e)} style={{ fontSize: 16, opacity: note.pinned ? 1 : 0.3, cursor: 'pointer' }}>📌</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'" }}>{fmtRelative(note.updated_at || note.created_at)}</div>
          {note.category && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500, background: catColor + '22', color: catColor, border: `1px solid ${catColor}44` }}>{note.category}</div>}
          {note.sector && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, color: '#666', background: '#0f0f11', border: '1px solid #242428' }}>{note.sector}</div>}
          {note.projects?.name && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>📋 {note.projects.name}</div>}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Notes</div>
        <div onClick={() => setOpenNote('new')} className="action-btn btn-task" style={{ gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add note
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#444', fontSize: 14 }}>🔍</div>
        <input type="text" placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: '10px 12px 10px 34px', fontSize: 14, color: '#e8e6e1', fontFamily: "'DM Sans'", outline: 'none' }} />
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, WebkitOverflowScrolling: 'touch', alignItems: 'center' }}>
        <div onClick={() => setFilterCat('')} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', background: !filterCat ? 'var(--accent-dim)' : '#161618', borderColor: !filterCat ? 'var(--accent-border)' : '#242428', color: !filterCat ? 'var(--accent)' : '#666' }}>All</div>
        {categories.map(cat => (
          <div key={cat.name} onClick={() => setFilterCat(filterCat === cat.name ? '' : cat.name)}
            style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', background: filterCat === cat.name ? cat.color + '22' : '#161618', borderColor: filterCat === cat.name ? cat.color : '#242428', color: filterCat === cat.name ? cat.color : '#666' }}>
            {cat.name}
          </div>
        ))}
        <div onClick={() => setShowNewCat(!showNewCat)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px dashed #242428', whiteSpace: 'nowrap', color: 'var(--accent)', background: 'var(--accent-dim)', flexShrink: 0 }}>+ Category</div>
      </div>

      {/* Add category panel */}
      {showNewCat && (
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="text" placeholder="Category name…" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()}
            style={{ flex: 1, background: '#0f0f11', border: '1px solid #242428', borderRadius: 10, padding: '9px 12px', fontSize: 14, color: '#e8e6e1', fontFamily: "'DM Sans'", outline: 'none' }} />
          <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: newCatColor, border: '2px solid #333', cursor: 'pointer' }} />
            <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', border: 'none', padding: 0 }} />
          </div>
          <button onClick={addCategory} className="btn-primary" style={{ padding: '0 14px', height: 36, borderRadius: 10, fontSize: 13, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans'" }}>Add</button>
          <button onClick={() => setShowNewCat(false)} style={{ padding: '0 12px', height: 36, borderRadius: 10, background: '#0f0f11', border: '1px solid #242428', color: '#666', fontSize: 18, cursor: 'pointer', fontFamily: "'DM Sans'" }}>×</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {[['Total', notes.length, '#e8e6e1'],['Pinned', notes.filter(n=>n.pinned).length,'#f59e0b'],['Categories', categories.length,'var(--accent)']].map(([l,v,c]) => (
          <div key={l} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Notes list */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 14, border: '1px dashed #242428', borderRadius: 14 }}>
          {search ? 'No notes match your search' : 'No notes yet — tap Add note to start'}
        </div>
      )}

      {pinned.length > 0 && (
        <div>
          <div className="section-label">📌 Pinned</div>
          {pinned.map(n => <NoteCard key={n.id} note={n} />)}
        </div>
      )}

      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && <div className="section-label">Notes</div>}
          {unpinned.map(n => <NoteCard key={n.id} note={n} />)}
        </div>
      )}
    </div>
  )
}
