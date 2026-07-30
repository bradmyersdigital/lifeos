import React, { useState } from 'react'
import IconPicker from './IconPicker'
import { IconOrEmoji } from './Icons'

/**
 * FolderSheet — half-screen sheet to name a folder and give it an icon.
 * Icon can come from the built-in drawn set (IconPicker) OR a typed emoji.
 *
 * onCreate({ name, icon }) — icon is "icon:<key>" or an emoji string (or '')
 */
export default function FolderSheet({ onClose, onCreate, title = 'New folder', subtitle }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [emoji, setEmoji] = useState('')

  const chosen = emoji.trim() || icon   // typed emoji wins if present

  const create = () => {
    if (!name.trim()) return
    onCreate({ name: name.trim(), icon: chosen })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ height: 'auto', maxHeight: '72dvh' }}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
          <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.3px' }}>{title}</div>
        </div>

        {/* Live preview + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconOrEmoji value={chosen || 'icon:folder'} size={24} />
          </div>
          <input type="text" placeholder="Folder name" value={name} autoFocus
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') create() }}
            style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 13px', fontSize: 16, color: 'var(--text-primary)', fontFamily: "'DM Sans'", outline: 'none' }} />
        </div>

        {/* Emoji field */}
        <div className="field">
          <div className="field-label">Type an emoji (optional)</div>
          <input type="text" placeholder="e.g. 📁  🎯  💰" value={emoji}
            onChange={e => { setEmoji(e.target.value); if (e.target.value) setIcon('') }}
            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 18, color: 'var(--text-primary)', outline: 'none', textAlign: 'center' }} />
        </div>

        {/* Or pick an icon */}
        <div className="field">
          <div className="field-label">Or choose an icon</div>
          <IconPicker value={emoji.trim() ? '' : icon} onPick={(v) => { setIcon(v); setEmoji('') }} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2, opacity: name.trim() ? 1 : 0.5 }} onClick={create} disabled={!name.trim()}>Create folder</button>
        </div>
      </div>
    </div>
  )
}
