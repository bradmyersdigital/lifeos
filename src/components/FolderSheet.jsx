import React, { useState } from 'react'
import { ICON_REGISTRY, ICON_LABELS, IconOrEmoji } from './Icons'

/**
 * FolderSheet — full-screen folder creator.
 * Name + typed emoji + a horizontally-scrolling 4-row icon grid that slides
 * smoothly (continuous horizontal scroll, not batch paging).
 *
 * onCreate({ name, icon }) — icon is "icon:<key>" or an emoji string (or '')
 */
export default function FolderSheet({ onClose, onCreate, folder = null, title }) {
  const isEdit = !!folder
  const initialIcon = folder?.icon || ''
  const initialIsEmoji = initialIcon && !initialIcon.startsWith('icon:')
  const [name, setName] = useState(folder?.name || '')
  const [icon, setIcon] = useState(initialIsEmoji ? '' : initialIcon)
  const [emoji, setEmoji] = useState(initialIsEmoji ? initialIcon : '')
  const heading = title || (isEdit ? 'Edit folder' : 'New folder')

  const chosen = emoji.trim() || icon
  const keys = Object.keys(ICON_REGISTRY)

  // Lay icons into column-major order so a 4-row grid fills top-to-bottom then
  // moves right — the visual "4 rows that slide left/right" the user asked for.
  const ROWS = 4
  const cols = []
  for (let i = 0; i < keys.length; i += ROWS) cols.push(keys.slice(i, i + ROWS))

  const create = () => {
    if (!name.trim()) return
    onCreate({ name: name.trim(), icon: chosen, _original: folder })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)', display: 'flex', flexDirection: 'column', animation: 'sheetUp 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 8px', paddingTop: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}>
        <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
        <div style={{ flex: 1, fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' }}>{heading}</div>
        <div onClick={create} style={{ padding: '8px 18px', borderRadius: 11, cursor: name.trim() ? 'pointer' : 'default', background: name.trim() ? 'var(--accent)' : 'var(--bg-card)', border: `1px solid ${name.trim() ? 'var(--accent-border)' : 'var(--border)'}`, color: name.trim() ? 'var(--on-accent)' : 'var(--text-dim)', fontSize: 14, fontWeight: 600 }}>{isEdit ? 'Save' : 'Create'}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px 20px 40px' }}>
        {/* Preview + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconOrEmoji value={chosen || 'icon:folder'} size={30} />
          </div>
          <input type="text" placeholder="Folder name" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') create() }}
            style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 15px', fontSize: 17, color: 'var(--text-primary)', fontFamily: "'DM Sans'", outline: 'none' }} />
        </div>

        {/* Typed emoji */}
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>Type an emoji</div>
        <input type="text" placeholder="e.g.  📁  🎯  💰  🔥" value={emoji}
          onChange={e => {
            const raw = e.target.value
            let first = ''
            try {
              const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
              first = [...seg.segment(raw)][0]?.segment || ''
            } catch { first = Array.from(raw)[0] || '' }
            setEmoji(first)
            if (first) setIcon('')
          }}
          maxLength={4}
          style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', fontSize: 20, color: 'var(--text-primary)', outline: 'none', textAlign: 'center', marginBottom: 24 }} />

        {/* Icon grid — 4 rows, slides horizontally & continuously */}
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 10 }}>Or choose an icon</div>
        <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', paddingBottom: 10, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
          <div style={{ display: 'grid', gridTemplateRows: `repeat(${ROWS}, 1fr)`, gridAutoFlow: 'column', gridAutoColumns: '64px', gap: 10, width: 'max-content' }}>
            {keys.map(key => {
              const Icon = ICON_REGISTRY[key]
              const selected = !emoji.trim() && icon === `icon:${key}`
              return (
                <div key={key} onClick={() => { setIcon(`icon:${key}`); setEmoji('') }} title={ICON_LABELS[key] || key}
                  style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, cursor: 'pointer',
                    background: selected ? 'var(--accent-dim)' : 'var(--bg-card)',
                    border: `1px solid ${selected ? 'var(--accent-border)' : 'var(--border)'}` }}>
                  <Icon active={selected} size={26} />
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>Slide left or right to see more</div>
      </div>
    </div>
  )
}
