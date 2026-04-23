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
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtRelative(d) {
  if (!d) return ''
  const diff = Math.floor((new Date() - new Date(d)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return fmt(d)
}

// ── Note Editor ──────────────────────────────────────────────────────────────
function NoteEditor({ note, onBack, onSaved, categories, projects, goals, sectors }) {
  const [title, setTitle] = useState(note?.title || '')
  const [body, setBody] = useState(note?.body || note?.text || '')
  const [category, setCategory] = useState(note?.category || '')
  const [sector, setSector] = useState(note?.sector || '')
  const [projectId, setProjectId] = useState(note?.project_id || '')
  const [goalId, setGoalId] = useState(note?.goal_id || '')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [showLinks, setShowLinks] = useState(false)
  const [noteId, setNoteId] = useState(note?.id || null)
  const saveTimer = useRef(null)

  useEffect(() => {
    if (!title && !body) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(autoSave, 1200)
    return () => clearTimeout(saveTimer.current)
  }, [title, body, category, sector, projectId, goalId])

  const autoSave = async () => {
    setSaving(true)
    const payload = {
      title: title.trim() || null,
      body: body || null,
      text: body || null,
      category: category || null,
      sector: sector || null,
      project_id: projectId || null,
      goal_id: goalId || null,
      updated_at: new Date().toISOString(),
    }
    if (noteId) {
      await supabase.from('notes').update(payload).eq('id', noteId)
    } else {
      const { data } = await supabase.from('notes').insert(payload).select().single()
      if (data) setNoteId(data.id)
    }
    setSaving(false)
    setLastSaved(new Date())
    onSaved?.()
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this note?')) return
    if (noteId) await supabase.from('notes').delete().eq('id', noteId)
    onSaved?.()
    onBack()
  }

  const catColor = categories.find(c => c.name === category)?.color || '#555'
  const linkedProject = projects.find(p => p.id === projectId)
  const linkedGoal = goals.find(g => g.id === goalId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div onClick={() => { autoSave(); onBack() }} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888', flexShrink: 0 }}>‹</div>
        <div style={{ flex: 1, fontSize: 11, color: '#444', fontFamily: "'DM Mono'" }}>
          {saving ? 'Saving…' : lastSaved ? `Saved ${fmtRelative(lastSaved)}` : note?.id ? `Saved` : 'New note'}
        </div>
        <div onClick={handleDelete} style={{ padding: '6px 12px', borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>Delete</div>
        <div onClick={() => { autoSave(); onBack() }} className="btn-primary" style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer', border: 'none' }}>Done</div>
      </div>

      {/* Date + tags row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'" }}>{fmt(note?.created_at || new Date())}</div>
        {category && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500, background: catColor + '22', color: catColor, border: `1px solid ${catColor}44` }}>{category}</div>}
        {sector && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, color: '#888', background: '#161618', border: '1px solid #242428' }}>{sector}</div>}
        {linkedProject && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>📋 {linkedProject.name}</div>}
        {linkedGoal && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, color: '#a78bfa', background: '#16112e', border: '1px solid #3a2a6c' }}>🎯 {linkedGoal.goal_text?.substring(0,20)}…</div>}
      </div>

      {/* Title */}
      <textarea placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} rows={1}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 26, fontWeight: 600, color: '#e8e6e1', fontFamily: "'DM Sans'", resize: 'none', marginBottom: 10, lineHeight: 1.3, padding: 0 }}
        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} />

      {/* Body */}
      <textarea placeholder="Start writing…" value={body} onChange={e => setBody(e.target.value)}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 16, color: '#c0bdb7', fontFamily: "'DM Sans'", resize: 'none', lineHeight: 1.7, padding: 0, minHeight: 220 }} />

      {/* Links panel — toggleable */}
      <div style={{ marginTop: 24, background: '#161618', border: '1px solid #242428', borderRadius: 14, overflow: 'hidden' }}>
        <div onClick={() => setShowLinks(!showLinks)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#888' }}>Links &amp; category</div>
          <div style={{ fontSize: 18, color: '#555', transform: showLinks ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
        </div>

        {showLinks && (
          <div style={{ padding: '0 16px 16px' }}>
            {/* Category */}
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

            <div className="field-row" style={{ marginBottom: 12 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <div className="field-label">Sector</div>
                <select value={sector} onChange={e => setSector(e.target.value)}>
                  <option value="">None</option>
                  {sectors.map(s => <option key={s.id||s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <div className="field-label">Project</div>
                <select value={projectId} onChange={e => setProjectId(e.target.value)}>
                  <option value="">None</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <div className="field-label">Goal</div>
              <select value={goalId} onChange={e => setGoalId(e.target.value)}>
                <option value="">None</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.timeframe} — {g.goal_text?.substring(0,40)}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Category view — notes inside one category ────────────────────────────────
function CategoryView({ categoryName, categoryColor, notes, onBack, onOpenNote, onNewNote }) {
  const catNotes = categoryName === '__uncategorized__'
    ? notes.filter(n => !n.category)
    : notes.filter(n => n.category === categoryName)

  const label = categoryName === '__uncategorized__' ? 'Uncategorized' : categoryName

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888', flexShrink: 0 }}>‹</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 500, color: categoryColor || '#e8e6e1' }}>{label}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>{catNotes.length} note{catNotes.length !== 1 ? 's' : ''}</div>
        </div>
        <div onClick={onNewNote} className="action-btn btn-task" style={{ gap: 5 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          New
        </div>
      </div>

      {catNotes.length === 0 && (
        <div onClick={onNewNote} style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 14, border: '1px dashed #242428', borderRadius: 14, cursor: 'pointer' }}>
          No notes yet — tap to add one
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {catNotes.map(note => {
          const preview = (note.body || note.text || '').replace(/\n/g, ' ').substring(0, 80)
          return (
            <div key={note.id} onClick={() => onOpenNote(note)} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e8e6e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 10 }}>
                  {note.title || preview.substring(0, 40) || 'Untitled'}
                </div>
                {note.pinned && <div style={{ fontSize: 14 }}>📌</div>}
              </div>
              {note.title && preview && <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>{preview}</div>}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'" }}>{fmtRelative(note.updated_at || note.created_at)}</div>
                {note.sector && <div style={{ fontSize: 10, color: '#666', background: '#0f0f11', border: '1px solid #242428', borderRadius: 20, padding: '1px 7px' }}>{note.sector}</div>}
                {note.projects?.name && <div style={{ fontSize: 10, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '1px 7px' }}>📋 {note.projects.name}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Notes ───────────────────────────────────────────────────────────────
export default function Notes() {
  const [notes, setNotes] = useState([])
  const [categories, setCategories] = useState(DEFAULT_CATS)
  const [projects, setProjects] = useState([])
  const [goals, setGoals] = useState([])
  const [sectors, setSectors] = useState([])
  const [view, setView] = useState('categories') // 'categories' | 'category' | 'note'
  const [activeCat, setActiveCat] = useState(null) // { name, color }
  const [activeNote, setActiveNote] = useState(null)
  const [showManage, setShowManage] = useState(false)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#a78bfa')
  const [editingCat, setEditingCat] = useState(null)

  useEffect(() => { loadAll() }, [])

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

  const addCategory = async () => {
    if (!newCatName.trim()) return
    await supabase.from('note_categories').insert({ name: newCatName.trim(), color: newCatColor })
    setNewCatName(''); setShowNewCat(false)
    loadAll()
  }

  const renameCategory = async (oldName, newName) => {
    if (!newName.trim() || newName === oldName) { setEditingCat(null); return }
    await supabase.from('note_categories').update({ name: newName.trim() }).eq('name', oldName)
    await supabase.from('notes').update({ category: newName.trim() }).eq('category', oldName)
    setEditingCat(null); loadAll()
    if (activeCat?.name === oldName) setActiveCat({ ...activeCat, name: newName.trim() })
  }

  const deleteCategory = async (name) => {
    if (!window.confirm(`Delete "${name}"? Notes will become uncategorized.`)) return
    await supabase.from('note_categories').delete().eq('name', name)
    await supabase.from('notes').update({ category: null }).eq('category', name)
    loadAll()
  }

  // If viewing a note
  if (view === 'note') {
    return (
      <NoteEditor note={activeNote} categories={categories} projects={projects} goals={goals} sectors={sectors}
        onBack={() => { setView(activeCat ? 'category' : 'categories'); loadAll() }}
        onSaved={loadAll}
      />
    )
  }

  // If viewing a category
  if (view === 'category' && activeCat) {
    return (
      <CategoryView
        categoryName={activeCat.name}
        categoryColor={activeCat.color}
        notes={notes}
        onBack={() => setView('categories')}
        onOpenNote={(note) => { setActiveNote(note); setView('note') }}
        onNewNote={() => { setActiveNote(null); setView('note') }}
      />
    )
  }

  // Category grid view (default)
  const uncategorizedCount = notes.filter(n => !n.category).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Notes</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div onClick={() => setShowManage(!showManage)} style={{ padding: '7px 12px', borderRadius: 10, background: showManage ? 'var(--accent-dim)' : '#161618', border: `1px solid ${showManage ? 'var(--accent-border)' : '#242428'}`, color: showManage ? 'var(--accent)' : '#888', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            ✏️ Edit
          </div>
          <div onClick={() => { setActiveNote(null); setView('note') }} className="action-btn btn-task" style={{ gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Add note
          </div>
        </div>
      </div>

      {/* Manage categories panel */}
      {showManage && (
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Manage categories</div>
            <div onClick={() => setShowNewCat(!showNewCat)} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', padding: '4px 10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 8 }}>+ Add</div>
          </div>

          {showNewCat && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <input type="text" placeholder="Category name…" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key==='Enter' && addCategory()}
                style={{ flex: 1, background: '#0f0f11', border: '1px solid #242428', borderRadius: 10, padding: '9px 12px', fontSize: 14, color: '#e8e6e1', fontFamily: "'DM Sans'", outline: 'none' }} />
              <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: newCatColor, border: '2px solid #333' }} />
                <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', border: 'none', padding: 0 }} />
              </div>
              <button onClick={addCategory} className="btn-primary" style={{ padding: '0 14px', height: 36, borderRadius: 10, fontSize: 13, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans'" }}>Add</button>
              <button onClick={() => setShowNewCat(false)} style={{ padding: '0 12px', height: 36, borderRadius: 10, background: '#0f0f11', border: '1px solid #242428', color: '#666', fontSize: 18, cursor: 'pointer', fontFamily: "'DM Sans'" }}>×</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {categories.map(cat => (
              <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0f0f11', borderRadius: 10, border: '1px solid #242428' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                {editingCat?.name === cat.name ? (
                  <>
                    <input type="text" value={editingCat.newName} onChange={e => setEditingCat({ ...editingCat, newName: e.target.value })}
                      onKeyDown={e => { if(e.key==='Enter') renameCategory(cat.name, editingCat.newName); if(e.key==='Escape') setEditingCat(null) }}
                      autoFocus style={{ flex: 1, background: '#161618', border: '1px solid var(--accent-border)', borderRadius: 8, padding: '5px 10px', fontSize: 14, color: '#e8e6e1', fontFamily: "'DM Sans'", outline: 'none' }} />
                    <div onClick={() => renameCategory(cat.name, editingCat.newName)} style={{ fontSize: 12, color: '#10b981', cursor: 'pointer', padding: '3px 8px', background: '#0a1e14', border: '1px solid #1a4a2a', borderRadius: 7 }}>Save</div>
                    <div onClick={() => setEditingCat(null)} style={{ fontSize: 16, color: '#555', cursor: 'pointer' }}>×</div>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1, fontSize: 14, color: '#d4d2cc' }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'" }}>{notes.filter(n => n.category === cat.name).length}</div>
                    <div onClick={() => setEditingCat({ name: cat.name, newName: cat.name })} style={{ fontSize: 12, color: '#888', cursor: 'pointer', padding: '3px 8px', borderRadius: 6, background: '#161618', border: '1px solid #242428' }}>✏️</div>
                    <div onClick={() => deleteCategory(cat.name)} style={{ fontSize: 12, color: '#f87171', cursor: 'pointer', padding: '3px 8px', borderRadius: 6, background: '#2a0a0a', border: '1px solid #7a1010' }}>✕</div>
                  </>
                )}
              </div>
            ))}
          </div>
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

      {/* Category cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
        {categories.map(cat => {
          const count = notes.filter(n => n.category === cat.name).length
          const recent = notes.filter(n => n.category === cat.name)[0]
          const preview = recent ? (recent.title || (recent.body || recent.text || '').substring(0, 35) || 'Untitled') : null
          return (
            <div key={cat.name} onClick={() => { setActiveCat(cat); setView('category') }}
              style={{ background: '#161618', border: `1px solid ${cat.color}44`, borderTop: `3px solid ${cat.color}`, borderRadius: 14, padding: 16, cursor: 'pointer', minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: cat.color, marginBottom: 6 }}>{cat.name}</div>
                {preview && <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{preview}</div>}
              </div>
              <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'", marginTop: 10 }}>{count} note{count !== 1 ? 's' : ''}</div>
            </div>
          )
        })}
      </div>

      {/* Uncategorized */}
      {uncategorizedCount > 0 && (
        <div onClick={() => { setActiveCat({ name: '__uncategorized__', color: '#555' }); setView('category') }}
          style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#1e1e24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📄</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#888' }}>Uncategorized</div>
            <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>{uncategorizedCount} note{uncategorizedCount !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ fontSize: 18, color: '#333' }}>›</div>
        </div>
      )}

      {notes.length === 0 && !showManage && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 14, border: '1px dashed #242428', borderRadius: 14, marginTop: 10 }}>
          No notes yet — tap Add note to start
        </div>
      )}
    </div>
  )
}
