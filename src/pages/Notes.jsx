import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import FolderList from '../components/FolderList'
import FolderSheet from '../components/FolderSheet'

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

// ── Rich text helpers ──────────────────────────────────────────────────────────
const TEXT_STYLES = [
  { tag: 'P',  label: 'Body',       preview: { fontSize: 15, fontWeight: 400 } },
  { tag: 'H1', label: 'Title',      preview: { fontSize: 22, fontWeight: 700 } },
  { tag: 'H2', label: 'Heading',    preview: { fontSize: 18, fontWeight: 700 } },
  { tag: 'H3', label: 'Subheading', preview: { fontSize: 16, fontWeight: 600 } },
  { tag: 'PRE',label: 'Monospace',  preview: { fontSize: 14, fontWeight: 400, fontFamily: "'DM Mono'" } },
]
const TEXT_COLORS = ['#e8e8ea', '#d4520f', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a78bfa']

function plainToHtml(text) {
  if (!text) return ''
  return text.split('\n').map(line => `<p>${line.replace(/</g, '&lt;') || '<br>'}</p>`).join('')
}
function htmlToPlain(html) {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').replace(/\s+\n/g, '\n').trim()
}
function fmtDuration(sec) {
  if (!sec && sec !== 0) return ''
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Rich text toolbar ────────────────────────────────────────────────────────
function RichToolbar({ onCmd, onStyle, onColor, onChecklist, onList, onAttach, onRecord, isRecording, activeStyle }) {
  const [showStyles, setShowStyles] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const btn = { width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }

  return (
    <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 10, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>
      {showStyles && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 6 }}>
          {TEXT_STYLES.map(s => (
            <div key={s.tag} onClick={() => { onStyle(s.tag); setShowStyles(false) }}
              style={{ padding: '9px 12px', borderRadius: 8, cursor: 'pointer', color: activeStyle === s.tag ? 'var(--accent)' : 'var(--text-secondary)', background: activeStyle === s.tag ? 'var(--accent-dim)' : 'transparent', ...s.preview }}>
              {s.label}
            </div>
          ))}
        </div>
      )}
      {showColors && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 10, justifyContent: 'center' }}>
          {TEXT_COLORS.map(c => (
            <div key={c} onClick={() => { onColor(c); setShowColors(false) }} style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: '2px solid var(--bg-card)', boxShadow: '0 0 0 1px var(--border)' }} />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        <div style={{ ...btn, width: 'auto', padding: '0 10px', color: showStyles ? 'var(--accent)' : 'var(--text-muted)', borderColor: showStyles ? 'var(--accent-border)' : 'var(--border)' }} onClick={() => { setShowStyles(!showStyles); setShowColors(false) }}>Aa</div>
        <div style={btn} onClick={() => onCmd('bold')}><b>B</b></div>
        <div style={{ ...btn, fontStyle: 'italic' }} onClick={() => onCmd('italic')}>I</div>
        <div style={{ ...btn, textDecoration: 'underline' }} onClick={() => onCmd('underline')}>U</div>
        <div style={{ ...btn, textDecoration: 'line-through' }} onClick={() => onCmd('strikeThrough')}>S</div>
        <div style={btn} onClick={() => { setShowColors(!showColors); setShowStyles(false) }}>
          <div style={{ width: 15, height: 15, borderRadius: '50%', background: 'linear-gradient(135deg,#d4520f,#3b82f6,#10b981)' }} />
        </div>
        <div style={btn} onClick={onList}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="2" cy="3" r="1.3" fill="currentColor"/><circle cx="2" cy="7.5" r="1.3" fill="currentColor"/><circle cx="2" cy="12" r="1.3" fill="currentColor"/><line x1="5.5" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="1.4"/><line x1="5.5" y1="7.5" x2="14" y2="7.5" stroke="currentColor" strokeWidth="1.4"/><line x1="5.5" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.4"/></svg>
        </div>
        <div style={btn} onClick={onChecklist}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.4"/><polyline points="4,6.5 6,8.5 9.5,4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={btn} onClick={onAttach}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M13 6.5L7.2 12.3a3 3 0 01-4.24-4.24L8.8 2.2a2 2 0 012.83 2.83L5.8 10.9a1 1 0 01-1.42-1.42L9.5 4.35" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>
        </div>
        <div style={{ ...btn, background: isRecording ? 'var(--danger-dim)' : 'var(--bg-card)', borderColor: isRecording ? 'var(--danger-border)' : 'var(--border)', color: isRecording ? 'var(--danger)' : 'var(--text-muted)' }} onClick={onRecord}>
          {isRecording
            ? <svg width="13" height="13" viewBox="0 0 13 13"><rect x="2" y="2" width="9" height="9" rx="1.5" fill="currentColor"/></svg>
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 7.5a5 5 0 0010 0M7 12.5v1.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>}
        </div>
      </div>
    </div>
  )
}

// ── Attachments (photos, files, voice memos) ────────────────────────────────
function AttachmentList({ attachments, onDelete }) {
  if (!attachments.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18, marginBottom: 10 }}>
      {attachments.map(a => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 10 }}>
          {a.type === 'image' ? (
            <img src={a.url} alt={a.name || ''} style={{ width: 46, height: 46, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
          ) : a.type === 'audio' ? (
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>🎙️</div>
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>📎</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {a.type === 'audio' ? (
              <>
                <audio controls src={a.url} style={{ width: '100%', height: 32 }} />
                {a.duration_seconds != null && <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'DM Mono'", marginTop: 2 }}>{fmtDuration(a.duration_seconds)}</div>}
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name || 'Attachment'}</div>
            )}
          </div>
          <div onClick={() => onDelete(a)} style={{ fontSize: 15, color: 'var(--text-dim)', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}>×</div>
        </div>
      ))}
    </div>
  )
}

// ── Note Editor ──────────────────────────────────────────────────────────────
function NoteEditor({ note, onBack, onSaved, categories, projects, goals, sectors, notesInCategory, onNavigate }) {
  const [title, setTitle] = useState(note?.title || '')
  const [category, setCategory] = useState(note?.category || '')
  const [sector, setSector] = useState(note?.sector || '')
  const [projectId, setProjectId] = useState(note?.project_id || '')
  const [goalId, setGoalId] = useState(note?.goal_id || '')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [showLinks, setShowLinks] = useState(false)
  const [noteId, setNoteId] = useState(note?.id || null)
  const [attachments, setAttachments] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [activeStyle, setActiveStyle] = useState('P')
  const saveTimer = useRef(null)
  const bodyRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordChunksRef = useRef([])
  const recordStartRef = useRef(null)
  const touchStart = useRef(null)

  // Load body into the contentEditable on mount and whenever we swipe to a different note.
  // Never React-driven by state on every keystroke — that causes cursor jumping.
  useEffect(() => {
    setTitle(note?.title || '')
    setCategory(note?.category || '')
    setSector(note?.sector || '')
    setProjectId(note?.project_id || '')
    setGoalId(note?.goal_id || '')
    setNoteId(note?.id || null)
    setLastSaved(null)
    if (bodyRef.current) bodyRef.current.innerHTML = note?.body_html || plainToHtml(note?.body || note?.text || '')
    loadAttachments(note?.id)
  }, [note?.id])

  const loadAttachments = async (id) => {
    if (!id) { setAttachments([]); return }
    const { data } = await supabase.from('note_attachments').select('*').eq('note_id', id).order('created_at')
    setAttachments(data || [])
  }

  const scheduleSave = () => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(autoSave, 900)
  }

  useEffect(() => {
    if (!title) return
    scheduleSave()
    return () => clearTimeout(saveTimer.current)
  }, [title, category, sector, projectId, goalId])

  // Ensures the note has a row saved in the DB — needed before attaching files/audio to a brand-new note
  const ensureSaved = async () => {
    if (noteId) return noteId
    const html = bodyRef.current?.innerHTML || ''
    const { data } = await supabase.from('notes').insert({
      title: title.trim() || null, body: htmlToPlain(html) || null, text: htmlToPlain(html) || null,
      body_html: html || null, category: category || null, sector: sector || null,
      project_id: projectId || null, goal_id: goalId || null, updated_at: new Date().toISOString(),
    }).select().single()
    if (data) { setNoteId(data.id); onSaved?.(); return data.id }
    return null
  }

  const autoSave = async () => {
    setSaving(true)
    const html = bodyRef.current?.innerHTML || ''
    const plain = htmlToPlain(html)
    const payload = {
      title: title.trim() || null,
      body: plain || null,
      text: plain || null,
      body_html: html || null,
      category: category || null,
      sector: sector || null,
      project_id: projectId || null,
      goal_id: goalId || null,
      updated_at: new Date().toISOString(),
    }
    let error
    if (noteId) {
      const r = await supabase.from('notes').update(payload).eq('id', noteId); error = r.error
    } else {
      const r = await supabase.from('notes').insert(payload).select().single()
      if (r.data) setNoteId(r.data.id)
      error = r.error
    }
    // body_html column may not exist yet — retry without it rather than losing the rest
    if (error?.code === '42703' || error?.code === 'PGRST204') {
      const { body_html, ...fallback } = payload
      if (noteId) await supabase.from('notes').update(fallback).eq('id', noteId)
      else { const r = await supabase.from('notes').insert(fallback).select().single(); if (r.data) setNoteId(r.data.id) }
      console.warn('notes.body_html column is missing — rich formatting will not persist. Run the migration SQL to add it.')
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

  // ── Formatting commands ──────────────────────────────────────────────────
  const focusBody = () => bodyRef.current?.focus()
  const cmd = (command, value = null) => { focusBody(); document.execCommand(command, false, value); scheduleSave() }
  const applyStyle = (tag) => { focusBody(); document.execCommand('formatBlock', false, tag); setActiveStyle(tag); scheduleSave() }
  const applyColor = (hex) => { focusBody(); document.execCommand('foreColor', false, hex); scheduleSave() }
  const insertList = () => { focusBody(); document.execCommand('insertUnorderedList'); scheduleSave() }
  const insertChecklist = () => {
    focusBody()
    document.execCommand('insertHTML', false,
      '<div class="ndl-check" data-checked="false"><span class="ndl-box" contenteditable="false">\u2610</span><span> </span></div><div><br></div>')
    scheduleSave()
  }
  const handleBodyClick = (e) => {
    const box = e.target.closest?.('.ndl-box')
    if (!box) return
    e.preventDefault()
    const line = box.closest('.ndl-check')
    const wasChecked = line.dataset.checked === 'true'
    line.dataset.checked = wasChecked ? 'false' : 'true'
    box.textContent = wasChecked ? '\u2610' : '\u2611'
    line.style.opacity = wasChecked ? '1' : '0.5'
    line.style.textDecoration = wasChecked ? 'none' : 'line-through'
    scheduleSave()
  }

  // ── Attachments ───────────────────────────────────────────────────────────
  const handleAttachClick = () => fileInputRef.current?.click()
  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const id = await ensureSaved()
    if (!id) return
    const path = `${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error: upErr } = await supabase.storage.from('note-attachments').upload(path, file)
    if (upErr) { alert('Upload failed: ' + upErr.message + '\n\nMake sure the "note-attachments" storage bucket exists — see setup instructions.'); return }
    const { data: pub } = supabase.storage.from('note-attachments').getPublicUrl(path)
    const { data } = await supabase.from('note_attachments').insert({
      note_id: id, type: file.type.startsWith('image/') ? 'image' : 'file',
      url: pub.publicUrl, name: file.name, size_bytes: file.size,
    }).select().single()
    if (data) setAttachments(prev => [...prev, data])
  }
  const deleteAttachment = async (a) => {
    if (!window.confirm('Remove this attachment?')) return
    await supabase.from('note_attachments').delete().eq('id', a.id)
    setAttachments(prev => prev.filter(x => x.id !== a.id))
  }

  // ── Voice memo ────────────────────────────────────────────────────────────
  const toggleRecord = async () => {
    if (isRecording) { mediaRecorderRef.current?.stop(); return }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      alert('Voice recording isn\u2019t supported in this browser.'); return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = ['audio/mp4', 'audio/webm'].find(t => MediaRecorder.isTypeSupported?.(t)) || ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recordChunksRef.current = []
      recordStartRef.current = Date.now()
      recorder.ondataavailable = (ev) => { if (ev.data.size > 0) recordChunksRef.current.push(ev.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setIsRecording(false)
        const durationSec = Math.round((Date.now() - recordStartRef.current) / 1000)
        const blob = new Blob(recordChunksRef.current, { type: mimeType || 'audio/webm' })
        const id = await ensureSaved()
        if (!id) return
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm'
        const path = `${id}/${Date.now()}-voice-memo.${ext}`
        const { error: upErr } = await supabase.storage.from('note-attachments').upload(path, blob)
        if (upErr) { alert('Upload failed: ' + upErr.message + '\n\nMake sure the "note-attachments" storage bucket exists — see setup instructions.'); return }
        const { data: pub } = supabase.storage.from('note-attachments').getPublicUrl(path)
        const { data } = await supabase.from('note_attachments').insert({
          note_id: id, type: 'audio', url: pub.publicUrl, name: 'Voice memo', duration_seconds: durationSec,
        }).select().single()
        if (data) setAttachments(prev => [...prev, data])
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      alert('Couldn\u2019t access the microphone: ' + err.message)
    }
  }

  // ── Swipe between notes in this folder, like flipping notebook pages ───────
  const currentIndex = notesInCategory?.findIndex(n => n.id === noteId) ?? -1
  const canSwipe = notesInCategory && notesInCategory.length > 1 && currentIndex !== -1
  const goToOffset = async (offset) => {
    if (!canSwipe) return
    const nextIndex = currentIndex + offset
    if (nextIndex < 0 || nextIndex >= notesInCategory.length) return
    await autoSave()
    onNavigate?.(notesInCategory[nextIndex])
  }
  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) > 70 && Math.abs(dy) < 50) goToOffset(dx < 0 ? 1 : -1)
  }

  const catColor = categories.find(c => c.name === category)?.color || 'var(--text-dim)'
  const linkedProject = projects.find(p => p.id === projectId)
  const linkedGoal = goals.find(g => g.id === goalId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div onClick={() => { autoSave(); onBack() }} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
        <div style={{ flex: 1, fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>
          {saving ? 'Saving…' : lastSaved ? `Saved ${fmtRelative(lastSaved)}` : note?.id ? `Saved` : 'New note'}
          {canSwipe && <span> · {currentIndex + 1} of {notesInCategory.length}</span>}
        </div>
        {canSwipe && (
          <div style={{ display: 'flex', gap: 4 }}>
            <div onClick={() => goToOffset(-1)} style={{ width: 28, height: 28, borderRadius: 8, background: currentIndex === 0 ? 'var(--bg)' : 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentIndex === 0 ? 'default' : 'pointer', fontSize: 14, color: currentIndex === 0 ? 'var(--border)' : 'var(--text-muted)' }}>‹</div>
            <div onClick={() => goToOffset(1)} style={{ width: 28, height: 28, borderRadius: 8, background: currentIndex === notesInCategory.length - 1 ? 'var(--bg)' : 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentIndex === notesInCategory.length - 1 ? 'default' : 'pointer', fontSize: 14, color: currentIndex === notesInCategory.length - 1 ? 'var(--border)' : 'var(--text-muted)' }}>›</div>
          </div>
        )}
        <div onClick={handleDelete} style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: 12, cursor: 'pointer' }}>Delete</div>
        <div onClick={() => { autoSave(); onBack() }} className="btn-primary" style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer', border: 'none' }}>Done</div>
      </div>

      {/* Date + tags row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>{fmt(note?.created_at || new Date())}</div>
        {category && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500, background: catColor + '22', color: catColor, border: `1px solid ${catColor}44` }}>{category}</div>}
        {sector && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>{sector}</div>}
        {linkedProject && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>📋 {linkedProject.name}</div>}
        {linkedGoal && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, color: 'var(--purple)', background: 'var(--purple-dim)', border: '1px solid var(--purple-border)' }}>🎯 {linkedGoal.goal_text?.substring(0,20)}…</div>}
      </div>

      {/* Title */}
      <textarea placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} rows={1}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'DM Sans'", resize: 'none', marginBottom: 10, lineHeight: 1.3, padding: 0 }}
        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} />

      {/* Rich body */}
      <div ref={bodyRef} contentEditable suppressContentEditableWarning
        data-placeholder="Start writing…" className="rich-body"
        onInput={scheduleSave} onClick={handleBodyClick}
        onKeyUp={() => { const b = document.queryCommandValue?.('formatBlock'); if (b) setActiveStyle(b.toUpperCase()) }}
        style={{ width: '100%', fontSize: 16, color: 'var(--text-secondary)', fontFamily: "'DM Sans'", lineHeight: 1.7, minHeight: 200, outline: 'none' }} />

      <input ref={fileInputRef} type="file" onChange={handleFileChosen} style={{ display: 'none' }} />
      <AttachmentList attachments={attachments} onDelete={deleteAttachment} />

      <RichToolbar
        onCmd={cmd} onStyle={applyStyle} onColor={applyColor}
        onChecklist={insertChecklist} onList={insertList}
        onAttach={handleAttachClick} onRecord={toggleRecord} isRecording={isRecording}
        activeStyle={activeStyle}
      />

      {/* Links panel — toggleable */}
      <div style={{ marginTop: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div onClick={() => setShowLinks(!showLinks)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Links &amp; category</div>
          <div style={{ fontSize: 18, color: 'var(--text-dim)', transform: showLinks ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
        </div>

        {showLinks && (
          <div style={{ padding: '0 16px 16px' }}>
            {/* Category */}
            <div className="field" style={{ marginBottom: 12 }}>
              <div className="field-label">Category</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <div onClick={() => setCategory('')} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: !category ? 'var(--accent-dim)' : 'var(--bg-input)', borderColor: !category ? 'var(--accent-border)' : 'var(--border)', color: !category ? 'var(--accent)' : 'var(--text-dim)' }}>None</div>
                {categories.map(cat => (
                  <div key={cat.name} onClick={() => setCategory(cat.name)}
                    style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: category === cat.name ? cat.color + '22' : 'var(--bg-input)', borderColor: category === cat.name ? cat.color : 'var(--border)', color: category === cat.name ? cat.color : 'var(--text-dim)' }}>
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
function filterNotesForCat(notes, categoryName) {
  if (!categoryName) return []
  const isSector = categoryName.startsWith('__sector__')
  const sectorName = isSector ? categoryName.slice('__sector__'.length) : null
  return categoryName === '__all__' ? notes
    : categoryName === '__uncategorized__' ? notes.filter(n => !n.category)
    : isSector ? notes.filter(n => n.sector === sectorName)
    : notes.filter(n => n.category === categoryName)
}

function CategoryView({ categoryName, categoryColor, categoryLabel, notes, onBack, onOpenNote, onNewNote }) {
  const catNotes = filterNotesForCat(notes, categoryName)

  const label =
    categoryName === '__all__' ? 'All Notes' :
    categoryName === '__uncategorized__' ? 'Uncategorized' :
    isSector ? sectorName :
    categoryName

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 500, color: categoryColor || 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 1 }}>{catNotes.length} note{catNotes.length !== 1 ? 's' : ''}</div>
        </div>
        <div onClick={onNewNote} className="action-btn btn-task" style={{ gap: 5 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          New
        </div>
      </div>

      {catNotes.length === 0 && (
        <div onClick={onNewNote} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: 14, border: '1px dashed var(--border)', borderRadius: 14, cursor: 'pointer' }}>
          No notes yet — tap to add one
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {catNotes.map(note => {
          const preview = (note.body || note.text || '').replace(/\n/g, ' ').substring(0, 80)
          return (
            <div key={note.id} onClick={() => onOpenNote(note)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 10 }}>
                  {note.title || preview.substring(0, 40) || 'Untitled'}
                </div>
                {note.pinned && <div style={{ fontSize: 14 }}>📌</div>}
              </div>
              {note.title && preview && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>{preview}</div>}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>{fmtRelative(note.updated_at || note.created_at)}</div>
                {note.sector && <div style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 20, padding: '1px 7px' }}>{note.sector}</div>}
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
  const [categories, setCategories] = useState([])
  const [projects, setProjects] = useState([])
  const [goals, setGoals] = useState([])
  const [sectors, setSectors] = useState([])
  const [view, setView] = useState('categories') // 'categories' | 'category' | 'note'
  const [activeCat, setActiveCat] = useState(null) // { name, color }
  const [activeNote, setActiveNote] = useState(null)
  const [showManage, setShowManage] = useState(false)
  const [showFolderSheet, setShowFolderSheet] = useState(false)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('var(--purple)')
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
    setCategories(catsRes.data || [])
  }

  const addCategory = async () => {
    if (!newCatName.trim()) return
    await supabase.from('note_categories').insert({ name: newCatName.trim(), color: newCatColor })
    setNewCatName(''); setShowNewCat(false)
    loadAll()
  }
  const createFolder = async ({ name, icon }) => {
    // pick a colour for the chip if no icon chosen
    const palette = ['var(--purple)','var(--blue)','var(--success)','var(--warn)','var(--danger)','var(--accent)']
    const color = palette[categories.length % palette.length]
    await supabase.from('note_categories').insert({ name, color, icon: icon || null })
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

  const [editingFolder, setEditingFolder] = useState(null)
  const saveFolderEdit = async ({ name, icon, _original }) => {
    const oldName = _original?.name
    await supabase.from('note_categories').update({ name, icon: icon || null }).eq('name', oldName)
    if (oldName && oldName !== name) {
      await supabase.from('notes').update({ category: name }).eq('category', oldName)
    }
    setEditingFolder(null); loadAll()
  }

  // If viewing a note
  if (view === 'note') {
    return (
      <NoteEditor note={activeNote} categories={categories} projects={projects} goals={goals} sectors={sectors}
        notesInCategory={activeCat ? filterNotesForCat(notes, activeCat.name) : null}
        onNavigate={(nextNote) => setActiveNote(nextNote)}
        onBack={() => { setView(activeCat ? 'category' : 'categories'); loadAll() }}
        onSaved={loadAll}
      />
    )
  }

  // If viewing a category
  if (view === 'category' && activeCat) {
    return (
      <CategoryView categoryName={activeCat.name} categoryColor={activeCat.color} categoryLabel={activeCat.label}
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
          <div onClick={() => { setActiveNote(null); setView('note') }} className="action-btn btn-task" style={{ gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Add note
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {[['Total', notes.length, 'var(--text-primary)'],['Pinned', notes.filter(n=>n.pinned).length,'var(--warn)'],['Categories', categories.length,'var(--accent)']].map(([l,v,c]) => (
          <div key={l} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* All Notes */}
      <FolderList
        folders={[{ id: '__all__', icon: 'icon:notes', label: 'All Notes', count: notes.length, color: 'var(--accent)' }]}
        onOpen={() => { setActiveCat({ name: '__all__', color: 'var(--accent)' }); setView('category') }}
      />

      {/* Sectors */}
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--text-dim)', margin:'20px 4px 8px' }}>Sectors</div>
      <FolderList
        folders={sectors.map(s => ({
          id: '__sector__' + s.name,
          icon: s.icon || '\u{1F4C1}',
          label: s.name,
          count: notes.filter(n => n.sector === s.name).length,
        }))}
        onOpen={(f) => { setActiveCat({ name: f.id, color: 'var(--text-dim)', label: f.label }); setView('category') }}
        emptyText="No sectors yet"
      />

      {/* Folders (custom categories) */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'20px 4px 8px' }}>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--text-dim)' }}>Folders</div>
        <div onClick={() => setShowFolderSheet(true)} style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:12.5, color:'var(--accent)', fontWeight:500 }}>
          + Folder
        </div>
      </div>
      {/* Manage categories panel */}
      {showManage && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Manage categories</div>
            <div onClick={() => setShowNewCat(!showNewCat)} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', padding: '4px 10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 8 }}>+ Add</div>
          </div>

          {showNewCat && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <input type="text" placeholder="Category name…" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key==='Enter' && addCategory()}
                style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: "'DM Sans'", outline: 'none' }} />
              <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: newCatColor, border: '2px solid var(--border-hover)' }} />
                <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', border: 'none', padding: 0 }} />
              </div>
              <button onClick={addCategory} className="btn-primary" style={{ padding: '0 14px', height: 36, borderRadius: 10, fontSize: 13, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans'" }}>Add</button>
              <button onClick={() => setShowNewCat(false)} style={{ padding: '0 12px', height: 36, borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', fontFamily: "'DM Sans'" }}>×</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {categories.map(cat => (
              <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                {editingCat?.name === cat.name ? (
                  <>
                    <input type="text" value={editingCat.newName} onChange={e => setEditingCat({ ...editingCat, newName: e.target.value })}
                      onKeyDown={e => { if(e.key==='Enter') renameCategory(cat.name, editingCat.newName); if(e.key==='Escape') setEditingCat(null) }}
                      autoFocus style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--accent-border)', borderRadius: 8, padding: '5px 10px', fontSize: 14, color: 'var(--text-primary)', fontFamily: "'DM Sans'", outline: 'none' }} />
                    <div onClick={() => renameCategory(cat.name, editingCat.newName)} style={{ fontSize: 12, color: 'var(--success)', cursor: 'pointer', padding: '3px 8px', background: 'var(--success-dim)', border: '1px solid var(--success-border)', borderRadius: 7 }}>Save</div>
                    <div onClick={() => setEditingCat(null)} style={{ fontSize: 16, color: 'var(--text-dim)', cursor: 'pointer' }}>×</div>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>{notes.filter(n => n.category === cat.name).length}</div>
                    <div onClick={() => setEditingCat({ name: cat.name, newName: cat.name })} style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '3px 8px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>✏️</div>
                    <div onClick={() => deleteCategory(cat.name)} style={{ fontSize: 12, color: 'var(--danger)', cursor: 'pointer', padding: '3px 8px', borderRadius: 6, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)' }}>✕</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <FolderList
        folders={[
          ...categories.map(cat => {
            const catNotes = notes.filter(n => n.category === cat.name)
            const recent = catNotes[0]
            return {
              id: cat.name,
              icon: cat.icon || cat.color,
              color: cat.color,
              label: cat.name,
              count: catNotes.length,
              subtitle: recent ? (recent.title || (recent.body || recent.text || '').substring(0, 40) || 'Untitled') : null,
              _deletable: true,
              _folder: { name: cat.name, icon: cat.icon || '' },
            }
          }),
          ...(uncategorizedCount > 0
            ? [{ id: '__uncategorized__', icon: '\u{1F4C4}', label: 'Uncategorized', count: uncategorizedCount, color: 'var(--text-muted)' }]
            : []),
        ]}
        onOpen={(f) => {
          if (f.id === '__uncategorized__') { setActiveCat({ name: f.id, color: f.color || 'var(--text-dim)' }); setView('category'); return }
          setActiveCat({ name: f.id, color: f.color || 'var(--text-dim)' })
          setView('category')
        }}
        onDelete={(f) => f.id !== '__uncategorized__' && deleteCategory(f.id)}
        onEdit={(f) => f._folder && setEditingFolder(f._folder)}
        emptyText="No folders yet — tap + Folder to add one"
      />
      {showFolderSheet && <FolderSheet onClose={() => setShowFolderSheet(false)} onCreate={createFolder} />}
      {editingFolder && <FolderSheet folder={editingFolder} onClose={() => setEditingFolder(null)} onCreate={saveFolderEdit} />}

      {notes.length === 0 && !showManage && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: 14, border: '1px dashed var(--border)', borderRadius: 14, marginTop: 10 }}>
          No notes yet — tap Add note to start
        </div>
      )}
    </div>
  )
}
