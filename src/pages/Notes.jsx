import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import FolderList from '../components/FolderList'
import FolderSheet from '../components/FolderSheet'
import TaskModal from '../components/TaskModal'

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
  { tag: 'P',  label: 'Normal text',    preview: { fontSize: 15, fontWeight: 400 } },
  { tag: 'H1', label: 'Large heading',  preview: { fontSize: 22, fontWeight: 700 } },
  { tag: 'H2', label: 'Medium heading', preview: { fontSize: 19, fontWeight: 700 } },
  { tag: 'H3', label: 'Small heading',  preview: { fontSize: 17, fontWeight: 600 } },
  { tag: 'H4', label: 'Extra small heading', preview: { fontSize: 15, fontWeight: 600, color: 'var(--text-muted)' } },
  { tag: 'PRE',label: 'Monospace',      preview: { fontSize: 14, fontWeight: 400, fontFamily: "'DM Mono'" } },
]
const TEXT_COLORS = [
  { hex: '#e8e8ea', label: 'Default' },
  { hex: '#000000', label: 'Black', adaptive: true },
  { hex: '#d4520f', label: 'Orange' },
  { hex: '#3b82f6', label: 'Blue' },
  { hex: '#10b981', label: 'Green' },
  { hex: '#f59e0b', label: 'Yellow' },
  { hex: '#ef4444', label: 'Red' },
  { hex: '#a78bfa', label: 'Purple' },
]

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
function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
// Notes can have multiple "pages" (flip through them like a notebook). This marker only ever
// exists in the serialized body_html string for storage — it's never a real node in the DOM.
const PAGE_BREAK = '<!--NDL_PAGE_BREAK-->'
// Separates a page's subheading from its body within one page's serialized chunk.
const SUBTITLE_SEP = '<!--NDL_SUBTITLE_END-->'
// Inline attachment cards — embedded directly in the note body at the cursor, not tacked onto the bottom.
const imageCardHtml = (a) => `<img class="ndl-img" src="${a.url}" data-attachment-id="${a.id}" alt="${escHtml(a.name || '')}" /><div><br></div>`
const fileCardHtml = (a) => `<div class="ndl-file" contenteditable="false" data-attachment-id="${a.id}" data-url="${a.url}"><span class="ndl-file-icon">📎</span><span class="ndl-file-name">${escHtml(a.name)}</span><span class="ndl-file-menu">⋯</span></div><div><br></div>`
const audioCardHtml = (a) => `<div class="ndl-audio" contenteditable="false" data-attachment-id="${a.id}"><audio src="${a.url}" preload="metadata"></audio><span class="ndl-audio-play">▶</span><span class="ndl-audio-info"><span class="ndl-audio-name">${escHtml(a.name)}</span><span class="ndl-audio-dur">${fmtDuration(a.duration_seconds)}</span></span><span class="ndl-audio-menu">⋯</span></div><div><br></div>`

// ── Rich text toolbar ────────────────────────────────────────────────────────
// Prevents a toolbar/menu button from stealing focus (and cursor position) away from the note body
const keepFocus = (e) => e.preventDefault()

// ── Compact formatting bar — floating rounded pill, only visible while the body is focused (keyboard up) ──
function RichToolbar({ onCmd, onStyle, onColor, onChecklist, onList, onAttach, onRecord, isRecording, activeStyle, activeFormats, onOpenInsert, kbOffset }) {
  const [showStyles, setShowStyles] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const btn = (active) => ({ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, background: active ? 'var(--accent)' : 'transparent', border: 'none', color: active ? 'var(--bg)' : 'var(--text-secondary)', fontSize: 16, fontWeight: 600 })

  return (
    <div style={{ position: 'fixed', left: '50%', transform: 'translate3d(-50%, 0, 0)', WebkitTransform: 'translate3d(-50%, 0, 0)', width: '100%', maxWidth: 820, boxSizing: 'border-box', padding: '0 16px', bottom: kbOffset + 8, zIndex: 50 }}>
      {showStyles && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 6, boxShadow: '0 6px 24px rgba(0,0,0,0.35)' }}>
          {TEXT_STYLES.map(s => (
            <div key={s.tag} onMouseDown={keepFocus} onClick={() => { onStyle(s.tag); setShowStyles(false) }}
              style={{ padding: '9px 12px', borderRadius: 8, cursor: 'pointer', color: activeStyle === s.tag ? 'var(--accent)' : 'var(--text-secondary)', background: activeStyle === s.tag ? 'var(--accent-dim)' : 'transparent', ...s.preview }}>
              {s.label}
            </div>
          ))}
        </div>
      )}
      {showColors && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 10, justifyContent: 'center', boxShadow: '0 6px 24px rgba(0,0,0,0.35)' }}>
          {TEXT_COLORS.map(c => (
            <div key={c.hex + c.label} onMouseDown={keepFocus} onClick={() => { onColor(c); setShowColors(false) }}
              style={{ width: 26, height: 26, borderRadius: '50%', background: c.adaptive ? 'linear-gradient(135deg, #000 50%, #fff 50%)' : c.hex, cursor: 'pointer', border: '2px solid var(--bg-card)', boxShadow: '0 0 0 1px var(--border)' }} />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 6, boxShadow: '0 6px 24px rgba(0,0,0,0.35)' }}>
        <div style={{ ...btn(false), background: 'var(--accent-dim)', color: 'var(--accent)' }} onMouseDown={keepFocus} onClick={onOpenInsert}>
          <svg width="17" height="17" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
        <div style={{ ...btn(showStyles), width: 'auto', padding: '0 11px' }} onMouseDown={keepFocus} onClick={() => { setShowStyles(!showStyles); setShowColors(false) }}>Aa</div>
        <div style={btn(activeFormats?.bold)} onMouseDown={keepFocus} onClick={() => onCmd('bold')}><b>B</b></div>
        <div style={{ ...btn(activeFormats?.italic), fontStyle: 'italic' }} onMouseDown={keepFocus} onClick={() => onCmd('italic')}>I</div>
        <div style={{ ...btn(activeFormats?.underline), textDecoration: 'underline' }} onMouseDown={keepFocus} onClick={() => onCmd('underline')}>U</div>
        <div style={{ ...btn(activeFormats?.strikeThrough), textDecoration: 'line-through' }} onMouseDown={keepFocus} onClick={() => onCmd('strikeThrough')}>S</div>
        <div style={btn(showColors)} onMouseDown={keepFocus} onClick={() => { setShowColors(!showColors); setShowStyles(false) }}>
          <div style={{ width: 17, height: 17, borderRadius: '50%', background: 'linear-gradient(135deg,#d4520f,#3b82f6,#10b981)' }} />
        </div>
        <div style={btn(false)} onMouseDown={keepFocus} onClick={onList}>
          <svg width="17" height="17" viewBox="0 0 15 15" fill="none"><circle cx="2" cy="3" r="1.3" fill="currentColor"/><circle cx="2" cy="7.5" r="1.3" fill="currentColor"/><circle cx="2" cy="12" r="1.3" fill="currentColor"/><line x1="5.5" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="1.4"/><line x1="5.5" y1="7.5" x2="14" y2="7.5" stroke="currentColor" strokeWidth="1.4"/><line x1="5.5" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.4"/></svg>
        </div>
        <div style={btn(false)} onMouseDown={keepFocus} onClick={onChecklist}>
          <svg width="17" height="17" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.4"/><polyline points="4,6.5 6,8.5 9.5,4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={btn(false)} onMouseDown={keepFocus} onClick={onAttach}>
          <svg width="17" height="17" viewBox="0 0 15 15" fill="none"><path d="M13 6.5L7.2 12.3a3 3 0 01-4.24-4.24L8.8 2.2a2 2 0 012.83 2.83L5.8 10.9a1 1 0 01-1.42-1.42L9.5 4.35" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>
        </div>
        <div style={btn(isRecording)} onMouseDown={keepFocus} onClick={onRecord}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 7.5a5 5 0 0010 0M7 12.5v1.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>
        </div>
      </div>
    </div>
  )
}

// ── "+" Insert menu — categorized bottom sheet, like Evernote/Notion's block-insert menu ──
const INSERT_TABS = ['Essentials', 'Text Styles', 'Lists', 'Media', 'Advanced']

function InsertTile({ icon, label, disabled, onClick }) {
  return (
    <div onMouseDown={keepFocus} onClick={disabled ? undefined : onClick}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.25 }}>{label}</div>
    </div>
  )
}

function InsertMenu({ onClose, onStyle, onList, onDivider, onQuote, onNewTask, onNewPage, onAttach, onRecord }) {
  const [tab, setTab] = useState('Essentials')
  const [dragY, setDragY] = useState(0)
  const dragStart = useRef(null)
  const soon = (label) => () => alert(`${label} is on the roadmap — not built yet.`)

  const onHandleTouchStart = (e) => { dragStart.current = e.touches[0].clientY }
  const onHandleTouchMove = (e) => {
    if (dragStart.current == null) return
    const dy = e.touches[0].clientY - dragStart.current
    if (dy > 0) setDragY(dy)
  }
  const onHandleTouchEnd = () => {
    if (dragY > 90) onClose()
    setDragY(0)
    dragStart.current = null
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ maxHeight: '72vh', display: 'flex', flexDirection: 'column', transform: `translateY(${dragY}px)`, transition: dragY ? 'none' : 'transform 0.25s ease' }}>
        <div className="modal-handle" onTouchStart={onHandleTouchStart} onTouchMove={onHandleTouchMove} onTouchEnd={onHandleTouchEnd} style={{ touchAction: 'none' }} />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 2 }}>
          {INSERT_TABS.map(t => (
            <div key={t} onMouseDown={keepFocus} onClick={() => setTab(t)}
              style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, background: tab === t ? 'var(--accent-dim)' : 'var(--bg-card)', border: `1px solid ${tab === t ? 'var(--accent-border)' : 'var(--border)'}`, color: tab === t ? 'var(--accent)' : 'var(--text-muted)' }}>
              {t}
            </div>
          ))}
        </div>

        <div style={{ overflowY: 'auto' }}>
          {tab === 'Essentials' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              <InsertTile icon="☑️" label="New task" onClick={() => { onNewTask(); onClose() }} />
              <InsertTile icon="📖" label="New page" onClick={() => { onNewPage(); onClose() }} />
              <InsertTile icon="—" label="Divider" onClick={() => { onDivider(); onClose() }} />
              <InsertTile icon="❝" label="Quote" onClick={() => { onQuote(); onClose() }} />
              <InsertTile icon="🔗" label="Link to note" disabled onClick={soon('Link to note')} />
              <InsertTile icon="📑" label="Table of contents" disabled onClick={soon('Table of contents')} />
            </div>
          )}
          {tab === 'Text Styles' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              {TEXT_STYLES.map(s => (
                <InsertTile key={s.tag} icon={s.tag === 'PRE' ? 'Aa' : s.tag === 'P' ? 'Aa' : s.tag} label={s.label} onClick={() => { onStyle(s.tag); onClose() }} />
              ))}
            </div>
          )}
          {tab === 'Lists' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              <InsertTile icon="•≡" label="Bullet list" onClick={() => { onList('bullet'); onClose() }} />
              <InsertTile icon="☑≡" label="Checklist" onClick={() => { onList('checklist'); onClose() }} />
              <InsertTile icon="1≡" label="Numbered list" onClick={() => { onList('numbered'); onClose() }} />
            </div>
          )}
          {tab === 'Media' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              <InsertTile icon="🖼️" label="Image" onClick={() => { onAttach(); onClose() }} />
              <InsertTile icon="📎" label="File" onClick={() => { onAttach(); onClose() }} />
              <InsertTile icon="🎙️" label="Voice memo" onClick={() => { onRecord(); onClose() }} />
              <InsertTile icon="📷" label="Camera" disabled onClick={soon('Camera capture')} />
              <InsertTile icon="🖊️" label="Sketch" disabled onClick={soon('Sketch')} />
              <InsertTile icon="📄" label="Scan" disabled onClick={soon('Document scan')} />
            </div>
          )}
          {tab === 'Advanced' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              <InsertTile icon="▦" label="Table" disabled onClick={soon('Table')} />
              <InsertTile icon="💬" label="Callout" disabled onClick={soon('Callout')} />
              <InsertTile icon="▸" label="Toggle" disabled onClick={soon('Toggle')} />
              <InsertTile icon="{ }" label="Code block" disabled onClick={soon('Code block')} />
              <InsertTile icon="⇄" label="Mermaid diagram" disabled onClick={soon('Mermaid diagram')} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Recording bar — clean modern capsule shown at the top while recording a voice memo ──
function RecordingBar({ seconds, levels, isPaused, onPauseResume, onStop, onCancel }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 24, padding: '10px 14px', marginBottom: 14 }}>
      <div style={{ fontFamily: "'DM Mono'", fontSize: 13, color: 'var(--accent)', minWidth: 38 }}>{mm}:{ss}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3, height: 28 }}>
        {levels.map((h, i) => (
          <div key={i} style={{ width: 3, borderRadius: 2, height: h, background: 'var(--accent)', opacity: isPaused ? 0.35 : 1, transition: 'height 0.1s' }} />
        ))}
      </div>
      <div onClick={onPauseResume} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}>
        {isPaused
          ? <svg width="11" height="12" viewBox="0 0 11 12" fill="none"><path d="M1 1L10 6L1 11V1Z" fill="currentColor"/></svg>
          : <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><rect x="0" y="0" width="3" height="12" rx="1" fill="currentColor"/><rect x="7" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>}
      </div>
      <div onClick={onStop} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 11 11"><rect x="0.5" y="0.5" width="10" height="10" rx="2" fill="white"/></svg>
      </div>
      <div onClick={onCancel} style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 16, flexShrink: 0 }}>×</div>
    </div>
  )
}

// ── Attachment 3-dot menu — rename / download / share / remove ─────────────────
function AttachmentMenu({ attachment, onClose, onRename, onDownload, onShare, onRemove }) {
  if (!attachment) return null
  const canShare = typeof navigator !== 'undefined' && !!navigator.share
  const row = { padding: '13px 4px', cursor: 'pointer', fontSize: 15, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ paddingBottom: 24 }}>
        <div className="modal-handle" />
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name || 'Attachment'}</div>
        <div onClick={() => { onRename(attachment); onClose() }} style={row}>Rename</div>
        <div onClick={() => { onDownload(attachment); onClose() }} style={row}>Download / open</div>
        {canShare && <div onClick={() => { onShare(attachment); onClose() }} style={row}>Share</div>}
        <div onClick={() => { onRemove(attachment); onClose() }} style={{ ...row, color: 'var(--danger)', borderBottom: 'none' }}>Remove</div>
      </div>
    </div>
  )
}

// ── Links & category — moved off the page into a "⋯" sheet ─────────────────────
// ── Page manager — see all pages in this note, jump to one, or delete one ──────
function PageManagerSheet({ pages, currentIndex, onClose, onJump, onDelete }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ maxHeight: '72vh' }}>
        <div className="modal-handle" />
        <div className="modal-title">Pages<div className="modal-close" onClick={onClose}>×</div></div>
        {pages.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', borderBottom: i < pages.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div onClick={() => { onJump(i); onClose() }} style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: i === currentIndex ? 'var(--accent)' : 'var(--text-primary)' }}>
                Page {i + 1}{i === currentIndex ? ' — current' : ''}
              </div>
              {p.subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.subtitle}</div>}
            </div>
            {pages.length > 1 && (
              <div onClick={() => onDelete(i)} style={{ fontSize: 13, color: 'var(--danger)', cursor: 'pointer', padding: '6px 10px', flexShrink: 0 }}>Delete</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function LinksSheet({ onClose, onDelete, category, setCategory, sector, setSector, projectId, setProjectId, goalId, setGoalId, categories, sectors, projects, goals }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">Note actions<div className="modal-close" onClick={onClose}>×</div></div>

        <div onClick={() => { onClose(); onDelete() }} style={{ padding: '12px 4px', marginBottom: 18, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--danger)', borderBottom: '1px solid var(--border)' }}>Delete note</div>

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
    </div>
  )
}

// ── Note Editor ──────────────────────────────────────────────────────────────
function NoteEditor({ note, onBack, onSaved, categories, projects, goals, sectors }) {
  const [title, setTitle] = useState(note?.title || '')
  const [category, setCategory] = useState(note?.category || '')
  const [sector, setSector] = useState(note?.sector || '')
  const [projectId, setProjectId] = useState(note?.project_id || '')
  const [goalId, setGoalId] = useState(note?.goal_id || '')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [noteId, setNoteId] = useState(note?.id || null)
  const [attachments, setAttachments] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [levels, setLevels] = useState([4, 4, 4, 4, 4])
  const [activeStyle, setActiveStyle] = useState('P')
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false, strikeThrough: false })
  const [isFocused, setIsFocused] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [newTaskModal, setNewTaskModal] = useState(false)
  const [showLinksSheet, setShowLinksSheet] = useState(false)
  const [showPageManager, setShowPageManager] = useState(false)
  const [attachmentMenu, setAttachmentMenu] = useState(null) // { id, name, url, type }
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [pageSubtitle, setPageSubtitle] = useState('')
  const [flipDir, setFlipDir] = useState(null) // 'next' | 'prev' | null while animating
  const [flipSnapshot, setFlipSnapshot] = useState(null)
  const pagesRef = useRef([{ subtitle: '', body: '' }])
  const saveTimer = useRef(null)
  const bodyRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordChunksRef = useRef([])
  const recordStartRef = useRef(null)
  const recordCancelledRef = useRef(false)
  const recordTimerRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const levelFrameRef = useRef(null)
  const savedRangeRef = useRef(null)
  const touchStart = useRef(null)

  const [kbOffset, setKbOffset] = useState(0)
  useEffect(() => {
    let usingNative = false
    let removeNativeListeners = () => {}

    // Running inside the actual iOS app (via Capacitor) — use the real native keyboard height.
    // This is exact, unlike visualViewport, which doesn't reliably track the keyboard inside a
    // Capacitor WKWebView the way it does in Safari.
    if (window.Capacitor?.isNativePlatform?.()) {
      import('@capacitor/keyboard').then(({ Keyboard }) => {
        usingNative = true
        const NATIVE_BUFFER = 8 // small breathing room only — the native height is already exact
        const showSub = Keyboard.addListener('keyboardWillShow', (info) => {
          setKbOffset((info?.keyboardHeight || 0) + NATIVE_BUFFER)
        })
        const hideSub = Keyboard.addListener('keyboardWillHide', () => setKbOffset(0))
        removeNativeListeners = () => { showSub.remove(); hideSub.remove() }
      }).catch(() => { /* @capacitor/keyboard not installed yet — falls back to visualViewport below */ })
    }

    // Web/PWA fallback — also acts as the initial value until the native listeners above attach.
    const vv = window.visualViewport
    const ACCESSORY_BAR_BUFFER = 48
    const updateFromViewport = () => {
      if (usingNative) return // native events are authoritative once available
      const raw = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKbOffset(raw > 0 ? raw + ACCESSORY_BAR_BUFFER : 0)
    }
    vv?.addEventListener('resize', updateFromViewport)
    vv?.addEventListener('scroll', updateFromViewport)
    updateFromViewport()

    return () => {
      removeNativeListeners()
      vv?.removeEventListener('resize', updateFromViewport)
      vv?.removeEventListener('scroll', updateFromViewport)
    }
  }, [])

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
    {
      const rawHtml = note?.body_html || plainToHtml(note?.body || note?.text || '')
      const split = rawHtml.split(PAGE_BREAK)
      pagesRef.current = (split.length ? split : ['']).map(chunk => {
        const [subtitle, ...rest] = chunk.split(SUBTITLE_SEP)
        return rest.length ? { subtitle, body: rest.join(SUBTITLE_SEP) } : { subtitle: '', body: chunk }
      })
      setPageCount(pagesRef.current.length)
      setPageIndex(0)
      setPageSubtitle(pagesRef.current[0]?.subtitle || '')
      if (bodyRef.current) bodyRef.current.innerHTML = pagesRef.current[0]?.body || ''
    }
    wireAudioCards()
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
  }, [title, category, sector, projectId, goalId, pageSubtitle])

  const pageIndexRef = useRef(0)
  const pageSubtitleRef = useRef('')
  useEffect(() => { pageIndexRef.current = pageIndex }, [pageIndex])
  useEffect(() => { pageSubtitleRef.current = pageSubtitle }, [pageSubtitle])

  // Pulls the live DOM content of the page you're currently on back into the pages array —
  // needed before saving or flipping away, since only the active page is ever a real contentEditable.
  // Uses pageIndexRef (not the pageIndex closure) so a debounced autosave firing after a page
  // flip can't write the new page's content into the old page's slot.
  const syncCurrentPage = () => {
    pagesRef.current[pageIndexRef.current] = { subtitle: pageSubtitleRef.current, body: bodyRef.current?.innerHTML || '' }
  }
  const buildFullHtml = () => {
    syncCurrentPage()
    return pagesRef.current.map(p => (p.subtitle || '') + SUBTITLE_SEP + (p.body || '')).join(PAGE_BREAK)
  }

  const flipToPage = (targetIndex, dir) => {
    if (targetIndex < 0 || targetIndex >= pagesRef.current.length || targetIndex === pageIndex) return
    clearTimeout(saveTimer.current)
    syncCurrentPage()
    setFlipSnapshot(pagesRef.current[pageIndex]?.body || '')
    setFlipDir(dir)
    setTimeout(() => {
      setPageIndex(targetIndex)
      setPageSubtitle(pagesRef.current[targetIndex]?.subtitle || '')
      if (bodyRef.current) bodyRef.current.innerHTML = pagesRef.current[targetIndex]?.body || ''
      wireAudioCards()
      setFlipDir(null)
      setFlipSnapshot(null)
      scheduleSave()
    }, 360)
  }
  const addPage = () => {
    syncCurrentPage()
    pagesRef.current.push({ subtitle: '', body: '' })
    setPageCount(pagesRef.current.length)
    flipToPage(pagesRef.current.length - 1, 'next')
  }
  const jumpToPage = (index) => {
    if (index === pageIndex) return
    flipToPage(index, index > pageIndex ? 'next' : 'prev')
  }
  const deletePage = (index) => {
    if (pagesRef.current.length <= 1) return
    const label = pagesRef.current[index]?.subtitle ? `"${pagesRef.current[index].subtitle}"` : `Page ${index + 1}`
    if (!window.confirm(`Delete ${label}? This can't be undone.`)) return
    clearTimeout(saveTimer.current)
    pagesRef.current.splice(index, 1)
    const newCount = pagesRef.current.length
    let newIndex = pageIndex
    if (index === pageIndex) newIndex = Math.min(pageIndex, newCount - 1)
    else if (index < pageIndex) newIndex = pageIndex - 1
    setPageCount(newCount)
    setPageIndex(newIndex)
    setPageSubtitle(pagesRef.current[newIndex]?.subtitle || '')
    if (bodyRef.current) bodyRef.current.innerHTML = pagesRef.current[newIndex]?.body || ''
    wireAudioCards()
    scheduleSave()
  }

  // Ensures the note has a row saved in the DB — needed before attaching files/audio to a brand-new note
  const ensureSaved = async () => {
    if (noteId) return noteId
    const html = buildFullHtml()
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
    const html = buildFullHtml()
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

  // Remembers exactly where the cursor was, so an attachment/voice memo that finishes
  // uploading seconds later still lands where the user was typing — not at the bottom.
  const saveRange = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && bodyRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
  }
  const restoreRange = () => {
    bodyRef.current?.focus()
    const sel = window.getSelection()
    sel.removeAllRanges()
    if (savedRangeRef.current) {
      try { sel.addRange(savedRangeRef.current) } catch { /* range no longer valid — falls back to end of note */ }
    }
  }
  // Only restores the saved range when the selection isn't already live in the body (e.g. after
  // the insert menu blurred it to show the keyboard). If it's already live, leave it alone —
  // forcing a restore on every click was what broke stacking bold+italic on the same selection.
  const ensureSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && bodyRef.current?.contains(sel.anchorNode)) return
    restoreRange()
  }

  const updateActiveFormats = () => {
    saveRange()
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
      })
      const b = document.queryCommandValue?.('formatBlock')
      if (b) setActiveStyle(b.toUpperCase())
    } catch { /* queryCommandState can throw outside an editable context — ignore */ }
  }
  useEffect(() => {
    if (!isFocused) return
    document.addEventListener('selectionchange', updateActiveFormats)
    return () => document.removeEventListener('selectionchange', updateActiveFormats)
  }, [isFocused])

  // Wraps the current selection in a span with the given class, instead of a literal execCommand
  // color — used for the "black" swatch so it resolves through CSS (theme-adaptive) instead of
  // baking in a literal #000 that goes invisible against the dark theme's background.
  const wrapSelectionWithClass = (className) => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    span.className = className
    try {
      range.surroundContents(span)
    } catch {
      const contents = range.extractContents()
      span.appendChild(contents)
      range.insertNode(span)
    }
    sel.removeAllRanges()
    const newRange = document.createRange()
    newRange.selectNodeContents(span)
    sel.addRange(newRange)
  }

  const cmd = (command, value = null) => { ensureSelection(); document.execCommand(command, false, value); scheduleSave(); updateActiveFormats() }
  const applyStyle = (tag) => { ensureSelection(); document.execCommand('formatBlock', false, tag); setActiveStyle(tag); scheduleSave() }
  const applyColor = (color) => {
    ensureSelection()
    if (color.adaptive) wrapSelectionWithClass('ndl-ink')
    else document.execCommand('foreColor', false, color.hex)
    scheduleSave()
  }
  const insertList = (type = 'bullet') => {
    ensureSelection()
    if (type === 'checklist') { insertChecklist(); return }
    document.execCommand(type === 'numbered' ? 'insertOrderedList' : 'insertUnorderedList')
    scheduleSave()
  }
  const insertDivider = () => { ensureSelection(); document.execCommand('insertHorizontalRule'); scheduleSave() }
  const insertQuote = () => { ensureSelection(); document.execCommand('formatBlock', false, 'BLOCKQUOTE'); scheduleSave() }
  const openNewTask = async () => { await ensureSaved(); setNewTaskModal(true) }
  const insertChecklist = () => {
    ensureSelection()
    document.execCommand('insertHTML', false,
      '<div class="ndl-check" data-checked="false"><span class="ndl-box" contenteditable="false">\u2610</span><span> </span></div><div><br></div>')
    scheduleSave()
  }
  const wireAudioCards = () => {
    bodyRef.current?.querySelectorAll('.ndl-audio').forEach(card => {
      const audioEl = card.querySelector('audio')
      const playBtn = card.querySelector('.ndl-audio-play')
      if (audioEl && playBtn && !audioEl.dataset.wired) {
        audioEl.addEventListener('ended', () => { playBtn.textContent = '▶' })
        audioEl.dataset.wired = 'true'
      }
    })
  }

  const handleBodyClick = (e) => {
    const box = e.target.closest?.('.ndl-box')
    if (box) {
      e.preventDefault()
      const line = box.closest('.ndl-check')
      const wasChecked = line.dataset.checked === 'true'
      line.dataset.checked = wasChecked ? 'false' : 'true'
      box.textContent = wasChecked ? '\u2610' : '\u2611'
      line.style.opacity = wasChecked ? '1' : '0.5'
      line.style.textDecoration = wasChecked ? 'none' : 'line-through'
      scheduleSave()
      return
    }
    const playBtn = e.target.closest?.('.ndl-audio-play')
    if (playBtn) {
      e.preventDefault()
      const audioEl = playBtn.closest('.ndl-audio')?.querySelector('audio')
      if (!audioEl) return
      if (audioEl.paused) { audioEl.play(); playBtn.textContent = '⏸' } else { audioEl.pause(); playBtn.textContent = '▶' }
      return
    }
    const menuBtn = e.target.closest?.('.ndl-audio-menu, .ndl-file-menu')
    if (menuBtn) {
      e.preventDefault()
      const card = menuBtn.closest('.ndl-audio, .ndl-file')
      const id = card?.dataset.attachmentId
      const a = attachments.find(x => x.id === id)
      if (a) setAttachmentMenu(a)
      return
    }
    const fileCard = e.target.closest?.('.ndl-file')
    if (fileCard && fileCard.dataset.url) window.open(fileCard.dataset.url, '_blank')
  }

  // ── Attachments ───────────────────────────────────────────────────────────
  // Cursor position is captured before the (async) upload so the card lands where the
  // user was typing, not wherever the cursor happens to end up seconds later.
  const handleAttachClick = () => { saveRange(); fileInputRef.current?.click() }
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
    const isImage = file.type.startsWith('image/')
    const { data } = await supabase.from('note_attachments').insert({
      note_id: id, type: isImage ? 'image' : 'file',
      url: pub.publicUrl, name: file.name, size_bytes: file.size,
    }).select().single()
    if (!data) return
    setAttachments(prev => [...prev, data])
    restoreRange()
    document.execCommand('insertHTML', false, isImage ? imageCardHtml(data) : fileCardHtml(data))
    scheduleSave()
  }
  const renameAttachment = async (a) => {
    const name = window.prompt('Rename attachment', a.name || '')
    if (!name || !name.trim()) return
    const trimmed = name.trim()
    await supabase.from('note_attachments').update({ name: trimmed }).eq('id', a.id)
    setAttachments(prev => prev.map(x => x.id === a.id ? { ...x, name: trimmed } : x))
    const nameEl = bodyRef.current?.querySelector(`[data-attachment-id="${a.id}"] .ndl-audio-name, [data-attachment-id="${a.id}"] .ndl-file-name`)
    if (nameEl) nameEl.textContent = trimmed
    scheduleSave()
  }
  const downloadAttachment = (a) => window.open(a.url, '_blank')
  const shareAttachment = async (a) => {
    try { await navigator.share({ title: a.name || 'Attachment', url: a.url }) } catch { /* user cancelled share sheet */ }
  }
  const deleteAttachment = async (a) => {
    if (!window.confirm('Remove this attachment?')) return
    await supabase.from('note_attachments').delete().eq('id', a.id)
    setAttachments(prev => prev.filter(x => x.id !== a.id))
    bodyRef.current?.querySelector(`[data-attachment-id="${a.id}"]`)?.remove()
    scheduleSave()
  }

  // ── Voice memo ────────────────────────────────────────────────────────────
  const startLevelMeter = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioCtx()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      const bars = 5, chunk = Math.max(1, Math.floor(data.length / bars))
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const next = []
        for (let i = 0; i < bars; i++) {
          let sum = 0
          for (let j = i * chunk; j < i * chunk + chunk; j++) sum += data[j] || 0
          next.push(Math.max(4, Math.min(28, Math.round((sum / chunk) / 255 * 28))))
        }
        setLevels(next)
        levelFrameRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch { /* AudioContext unsupported — bars stay flat, recording itself still works fine */ }
  }
  const stopLevelMeter = () => {
    if (levelFrameRef.current) cancelAnimationFrame(levelFrameRef.current)
    try { audioCtxRef.current?.close?.() } catch { /* already closed */ }
    audioCtxRef.current = null; analyserRef.current = null
    setLevels([4, 4, 4, 4, 4])
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      alert('Voice recording isn\u2019t supported in this browser.'); return
    }
    saveRange()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = ['audio/mp4', 'audio/webm'].find(t => MediaRecorder.isTypeSupported?.(t)) || ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recordChunksRef.current = []
      recordCancelledRef.current = false
      recordStartRef.current = Date.now()
      recorder.ondataavailable = (ev) => { if (ev.data.size > 0) recordChunksRef.current.push(ev.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        stopLevelMeter()
        clearInterval(recordTimerRef.current)
        setIsRecording(false); setIsPaused(false); setRecordSeconds(0)
        if (recordCancelledRef.current) return
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
        if (!data) return
        setAttachments(prev => [...prev, data])
        restoreRange()
        document.execCommand('insertHTML', false, audioCardHtml(data))
        wireAudioCards()
        scheduleSave()
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true); setIsPaused(false); setRecordSeconds(0)
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000)
      startLevelMeter(stream)
    } catch (err) {
      alert('Couldn\u2019t access the microphone: ' + err.message)
    }
  }
  const toggleRecord = () => { if (isRecording) stopRecording(); else startRecording() }
  const pauseResumeRecording = () => {
    const rec = mediaRecorderRef.current
    if (!rec) return
    if (isPaused) { rec.resume(); setIsPaused(false); recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000) }
    else { rec.pause(); setIsPaused(true); clearInterval(recordTimerRef.current) }
  }
  const stopRecording = () => { recordCancelledRef.current = false; mediaRecorderRef.current?.stop() }
  const cancelRecording = () => { recordCancelledRef.current = true; mediaRecorderRef.current?.stop() }

  // ── Swipe flips between pages of THIS note, like turning a page in a notebook ──
  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) > 70 && Math.abs(dy) < 50) flipToPage(pageIndex + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev')
  }

  const catColor = categories.find(c => c.name === category)?.color || 'var(--text-dim)'
  const linkedProject = projects.find(p => p.id === projectId)
  const linkedGoal = goals.find(g => g.id === goalId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Top bar — portaled out of the scrolling container so it's genuinely fixed on iOS,
          and positioned to share the same header band as the hamburger menu */}
      {createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90, background: 'var(--bg)', borderBottom: '1px solid var(--border)', paddingTop: 'env(safe-area-inset-top, 44px)', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', height: 62, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 64, paddingRight: 16, boxSizing: 'border-box' }}>
            <div onClick={() => { autoSave(); onBack() }} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
            <div style={{ flex: 1, fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>
              {saving ? 'Saving…' : lastSaved ? `Saved ${fmtRelative(lastSaved)}` : note?.id ? `Saved` : 'New note'}
            </div>
            <div onClick={() => setShowLinksSheet(true)} style={{ width: 40, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-secondary)', flexShrink: 0 }}>⋯</div>
          </div>
        </div>,
        document.body
      )}
      <div style={{ height: 14 }} />

      {isRecording && (
        <RecordingBar seconds={recordSeconds} levels={levels} isPaused={isPaused}
          onPauseResume={pauseResumeRecording} onStop={stopRecording} onCancel={cancelRecording} />
      )}

      {/* Date + tags row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>{fmt(note?.created_at || new Date())}</div>
        {category && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500, background: catColor + '22', color: catColor, border: `1px solid ${catColor}44` }}>{category}</div>}
        {sector && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>{sector}</div>}
        {linkedProject && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>📋 {linkedProject.name}</div>}
        {linkedGoal && <div style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, color: 'var(--purple)', background: 'var(--purple-dim)', border: '1px solid var(--purple-border)' }}>🎯 {linkedGoal.goal_text?.substring(0,20)}…</div>}
      </div>

      {/* Page dots — this note's own pages, flipped through by swiping */}
      {(pageCount > 1 || isFocused) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <div key={i} onClick={() => jumpToPage(i)}
              style={{ width: pageIndex === i ? 20 : 7, height: 7, borderRadius: 4, background: pageIndex === i ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', transition: 'all 0.2s' }} />
          ))}
          <div onMouseDown={keepFocus} onClick={addPage} style={{ marginLeft: 6, fontSize: 11, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>+ Page</div>
          {pageCount > 1 && (
            <div onClick={() => { syncCurrentPage(); setShowPageManager(true) }}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Mono'", cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px' }}>
              Page {pageIndex + 1} of {pageCount}
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M9 1.5L11 3.5L4.5 10H2.5V8L9 1.5Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}
        </div>
      )}

      {/* Title — constant across all of this note's pages */}
      <textarea placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} rows={1}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'DM Sans'", resize: 'none', marginBottom: 4, lineHeight: 1.3, padding: 0 }}
        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} />

      {/* Subheading — its own text per page */}
      <input placeholder="Subheading" value={pageSubtitle} onChange={e => setPageSubtitle(e.target.value)}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 19, fontWeight: 500, color: 'var(--text-muted)', fontFamily: "'DM Sans'", marginBottom: 12, padding: 0 }} />

      <div style={{ width: 64, height: 1, background: 'var(--border)', opacity: 0.5, marginBottom: 16 }} />

      {/* Rich body — images/files/voice memos render inline at wherever the cursor was */}
      <div style={{ position: 'relative', perspective: 1400 }}>
        {flipSnapshot != null && (
          <div className={flipDir === 'next' ? 'ndl-page-flip-next' : 'ndl-page-flip-prev'}
            dangerouslySetInnerHTML={{ __html: flipSnapshot }}
            style={{ position: 'absolute', inset: 0, background: 'var(--bg)', fontSize: 16, color: 'var(--text-secondary)', fontFamily: "'DM Sans'", lineHeight: 1.7, pointerEvents: 'none', zIndex: 2 }} />
        )}
        <div ref={bodyRef} contentEditable suppressContentEditableWarning
          data-placeholder="Start writing…" className="rich-body"
          onInput={scheduleSave} onClick={handleBodyClick}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyUp={updateActiveFormats} onMouseUp={updateActiveFormats}
          style={{ width: '100%', fontSize: 16, color: 'var(--text-secondary)', fontFamily: "'DM Sans'", lineHeight: 1.7, minHeight: 200, outline: 'none' }} />
      </div>

      <input ref={fileInputRef} type="file" onChange={handleFileChosen} style={{ display: 'none' }} />

      {/* Extra scroll room so typed content and the toolbar never fight over the same space above the keyboard */}
      {isFocused && <div style={{ height: '42vh', flexShrink: 0 }} />}


      {(isFocused || showInsertMenu) && createPortal(
        <RichToolbar
          onCmd={cmd} onStyle={applyStyle} onColor={applyColor}
          onChecklist={insertChecklist} onList={() => insertList('bullet')}
          onAttach={handleAttachClick} onRecord={toggleRecord} isRecording={isRecording}
          activeStyle={activeStyle} activeFormats={activeFormats} onOpenInsert={() => { saveRange(); bodyRef.current?.blur(); setShowInsertMenu(true) }} kbOffset={kbOffset}
        />,
        document.body
      )}

      {showInsertMenu && (
        <InsertMenu
          onClose={() => setShowInsertMenu(false)}
          onStyle={applyStyle} onList={insertList} onDivider={insertDivider} onQuote={insertQuote}
          onNewTask={openNewTask} onNewPage={addPage} onAttach={handleAttachClick} onRecord={toggleRecord}
        />
      )}
      {newTaskModal && (
        <TaskModal mode="today" defaultNoteId={noteId}
          onClose={() => setNewTaskModal(false)}
          onSaved={() => setNewTaskModal(false)}
        />
      )}
      {attachmentMenu && (
        <AttachmentMenu attachment={attachmentMenu} onClose={() => setAttachmentMenu(null)}
          onRename={renameAttachment} onDownload={downloadAttachment} onShare={shareAttachment} onRemove={deleteAttachment}
        />
      )}
      {showLinksSheet && (
        <LinksSheet onClose={() => setShowLinksSheet(false)} onDelete={handleDelete}
          category={category} setCategory={setCategory}
          sector={sector} setSector={setSector}
          projectId={projectId} setProjectId={setProjectId}
          goalId={goalId} setGoalId={setGoalId}
          categories={categories} sectors={sectors} projects={projects} goals={goals}
        />
      )}
      {showPageManager && (
        <PageManagerSheet pages={pagesRef.current} currentIndex={pageIndex}
          onClose={() => setShowPageManager(false)} onJump={jumpToPage} onDelete={deletePage}
        />
      )}
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
  const isSector = categoryName.startsWith('__sector__')
  const sectorName = isSector ? categoryName.slice('__sector__'.length) : null

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
