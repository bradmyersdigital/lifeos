import React, { useState, useRef } from 'react'
import { ICON_REGISTRY, IconOrEmoji } from './Icons'

/**
 * Grouped folder list — inset-rounded list pattern.
 * folders: [{ id, icon, label, count, color, subtitle, _deletable }]
 * onOpen(folder)   — row tap
 * onDelete(folder) — optional; deletable rows get Apple-style swipe-to-delete
 */
export default function FolderList({ folders, onOpen, onDelete, emptyText = 'Nothing here yet' }) {
  if (!folders || folders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-dim)', fontSize: 14, border: '1px dashed var(--border)', borderRadius: 16 }}>
        {emptyText}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      {folders.map((f, i) => (
        <FolderRow key={f.id ?? f.label} f={f} isFirst={i === 0}
          onOpen={onOpen}
          onDelete={onDelete && f._deletable ? onDelete : null} />
      ))}
    </div>
  )
}

function FolderRow({ f, isFirst, onOpen, onDelete }) {
  const [offset, setOffset] = useState(0)      // current translateX
  const startX = useRef(null)
  const startY = useRef(null)
  const swiping = useRef(false)
  const REVEAL = 84                            // px the delete button occupies

  const isDrawnIcon = typeof f.icon === 'string' && f.icon.startsWith('icon:')
  const DrawnIcon = isDrawnIcon ? ICON_REGISTRY[f.icon.slice(5)] : null
  const isColorChip = typeof f.icon === 'string' && (f.icon.startsWith('#') || f.icon.startsWith('var('))

  const onTouchStart = (e) => {
    if (!onDelete) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    swiping.current = false
  }
  const onTouchMove = (e) => {
    if (!onDelete || startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    // only engage on a mostly-horizontal left swipe
    if (!swiping.current && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.4) swiping.current = true
    if (swiping.current) {
      e.preventDefault()
      const base = offset < 0 ? -REVEAL : 0
      const next = Math.min(0, Math.max(-REVEAL - 20, base + dx))
      setOffset(next)
    }
  }
  const onTouchEnd = () => {
    if (!onDelete) return
    setOffset(offset < -REVEAL / 2 ? -REVEAL : 0)   // snap open or closed
    startX.current = null
  }

  const handleRowClick = () => {
    if (offset < 0) { setOffset(0); return }         // first tap closes the swipe
    onOpen?.(f)
  }

  return (
    <div style={{ position: 'relative', borderTop: isFirst ? 'none' : '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Delete action revealed underneath */}
      {onDelete && (
        <div onClick={() => { setOffset(0); onDelete(f) }}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: REVEAL,
            background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Delete
        </div>
      )}

      {/* The sliding row */}
      <div
        onClick={handleRowClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '13px 16px', cursor: 'pointer',
          background: 'var(--bg-card)',
          transform: `translateX(${offset}px)`,
          transition: startX.current === null ? 'transform 0.22s cubic-bezier(0.22,1,0.36,1)' : 'none',
          WebkitTapHighlightColor: 'transparent',
        }}>
        <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {DrawnIcon
            ? <DrawnIcon active size={22} />
            : isColorChip
            ? <div style={{ width: 20, height: 20, borderRadius: 7, background: f.icon }} />
            : <span style={{ fontSize: 21, lineHeight: 1 }}>{f.icon || '📁'}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 500, color: f.color || 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</div>
          {f.subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.subtitle}</div>}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: "'DM Mono'", flexShrink: 0 }}>{f.count}</div>
        <div style={{ fontSize: 17, color: 'var(--text-dim)', flexShrink: 0, lineHeight: 1 }}>›</div>
      </div>
    </div>
  )
}

/** Matching back-header for folder detail views. */
export function FolderHeader({ icon, title, subtitle, onBack, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div onClick={onBack}
        style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
      {icon && <div style={{ width: 26, flexShrink: 0, display: "flex", justifyContent: "center" }}><IconOrEmoji value={icon} size={22} /></div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}
