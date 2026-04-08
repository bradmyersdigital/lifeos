import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Business', 'Real Estate', 'Health', 'Ideas', 'Personal Growth', 'Gratitude']
const CAT_STYLES = {
  business:    { bg: '#1e1208', color: 'var(--accent-text)', dot: '#d4520f' },
  'real estate': { bg: '#0c1e36', color: '#93c5fd', dot: '#3b82f6' },
  health:      { bg: '#0a1e14', color: 'var(--event-color)', dot: '#10b981' },
  ideas:       { bg: '#1a0a1a', color: '#f0abfc', dot: '#c084fc' },
  'personal growth': { bg: '#1e1a00', color: '#fcd34d', dot: '#f59e0b' },
  gratitude:   { bg: '#1a1a1e', color: '#c4b5fd', dot: '#a78bfa' },
}
const getCatStyle = (cat) => CAT_STYLES[cat?.toLowerCase()] || { bg: '#161618', color: '#888', dot: '#555' }

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [newText, setNewText] = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  const [openCat, setOpenCat] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { loadNotes() }, [])

  const loadNotes = async () => {
    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
    setNotes(data || [])
  }

  const saveNote = async () => {
    if (!newText.trim()) return
    const { data } = await supabase.from('notes').insert({ text: newText.trim(), category: selectedCat }).select().single()
    if (data) setNotes(prev => [data, ...prev])
    setNewText('')
    setSelectedCat('')
  }

  const pinNote = async (note) => {
    const updated = !note.pinned
    await supabase.from('notes').update({ pinned: updated }).eq('id', note.id)
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, pinned: updated } : n))
  }

  const filtered = notes.filter(n => !search || n.text.toLowerCase().includes(search.toLowerCase()))
  const pinned = filtered.filter(n => n.pinned)
  const recent = filtered.slice(0, 5)
  const byCategory = (cat) => filtered.filter(n => n.category?.toLowerCase() === cat.toLowerCase())

  const fmt = (d) => {
    const date = new Date(d)
    const today = new Date()
    const diff = Math.floor((today - date) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return `${date.toLocaleString('default',{month:'short'})} ${date.getDate()}`
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Notes</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#161618', border: '1px solid #242428', borderRadius: 10, padding: '7px 11px' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="#555" strokeWidth="1.4"/><line x1="8.5" y1="8.5" x2="12" y2="12" stroke="#555" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <input style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#e8e6e1', fontFamily: "'DM Sans'", width: 120 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Quick capture */}
      <div style={{ background: '#161618', border: '1px solid #2a2a30', borderRadius: 14, padding: 14, marginBottom: 20 }}>
        <input style={{ background: 'none', border: 'none', outline: 'none', fontSize: 15, color: '#e8e6e1', fontFamily: "'DM Sans'", width: '100%', marginBottom: 10 }} placeholder="Jot something down..." value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveNote()} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => {
            const s = getCatStyle(cat)
            const active = selectedCat === cat
            return (
              <div key={cat} onClick={() => setSelectedCat(active ? '' : cat)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', background: active ? s.bg : '#0f0f11', border: `1px solid ${active ? '#7a3410' : '#242428'}`, color: active ? s.color : '#555' }}>
                {cat}
              </div>
            )
          })}
          <button onClick={saveNote} style={{ marginLeft: 'auto', background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 500, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans'" }}>Save</button>
        </div>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <>
          <div className="section-label">Pinned</div>
          {pinned.map(note => {
            const s = getCatStyle(note.category)
            return (
              <div key={note.id} style={{ background: 'var(--accent-dim)', border: '1px solid #3a2010', borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }} onClick={() => pinNote(note)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>📌</span>
                  <span style={{ fontSize: 11, color: '#a0440e', fontWeight: 500 }}>{note.category}</span>
                </div>
                <div style={{ fontSize: 13, color: '#d4c4b0', lineHeight: 1.4 }}>{note.text}</div>
                <div style={{ fontFamily: "'DM Mono'", fontSize: 10, color: '#5a3a20', marginTop: 4 }}>{fmt(note.created_at)}</div>
              </div>
            )
          })}
        </>
      )}

      {/* Categories */}
      <div className="section-label">Categories</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10, marginBottom: 20 }}>
        {CATEGORIES.map(cat => {
          const catNotes = byCategory(cat)
          const s = getCatStyle(cat)
          const isOpen = openCat === cat
          return (
            <div key={cat} style={{ background: '#161618', border: `1px solid ${isOpen ? '#3a2010' : '#242428'}`, borderRadius: 14, padding: 14, cursor: 'pointer', transition: 'border-color 0.15s' }} onClick={() => setOpenCat(isOpen ? null : cat)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                  {cat === 'Business' ? '💼' : cat === 'Real Estate' ? '🏠' : cat === 'Health' ? '🏃' : cat === 'Ideas' ? '💡' : cat === 'Personal Growth' ? '📚' : '🙏'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{cat}</div>
                  <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>{catNotes.length} notes</div>
                </div>
                <div style={{ color: isOpen ? '#d4520f' : '#333', fontSize: 14, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
              </div>
              {isOpen && catNotes.length > 0 && (
                <div style={{ marginTop: 10, borderTop: '1px solid #1e1e24', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {catNotes.map(note => (
                    <div key={note.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 10px', background: '#0f0f11', border: '1px solid #1e1e24', borderRadius: 9, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); pinNote(note) }}>
                      <div style={{ fontSize: 13, color: '#c0bdb7', flex: 1, lineHeight: 1.4 }}>{note.text}</div>
                      <div style={{ fontFamily: "'DM Mono'", fontSize: 10, color: '#444', flexShrink: 0 }}>{fmt(note.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Recent */}
      <div className="section-label">Recently added</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recent.map(note => {
          const s = getCatStyle(note.category)
          return (
            <div key={note.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#161618', border: '1px solid #1e1e24', borderRadius: 11 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#c0bdb7', flex: 1 }}>{note.text}</div>
              <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: s.bg, color: s.color, flexShrink: 0 }}>{note.category || '—'}</div>
              <div style={{ fontFamily: "'DM Mono'", fontSize: 10, color: '#444', flexShrink: 0 }}>{fmt(note.created_at)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
