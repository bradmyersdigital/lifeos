import React from 'react'

/**
 * Grouped folder list — the inset-rounded list pattern (Apple Journal / Settings style).
 *
 * folders: [{ id, icon, label, count, color, subtitle }]
 *   icon     — emoji string OR a hex/var() colour (renders as a colour chip)
 *   color    — optional accent for the label
 *   subtitle — optional second line
 *
 * onOpen(folder) fires on row tap.
 */
export default function FolderList({ folders, onOpen, emptyText = 'Nothing here yet' }) {
  if (!folders || folders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-dim)', fontSize: 14, border: '1px dashed var(--border)', borderRadius: 16 }}>
        {emptyText}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      {folders.map((f, i) => {
        const isColorChip = typeof f.icon === 'string' && (f.icon.startsWith('#') || f.icon.startsWith('var('))
        return (
          <div key={f.id ?? f.label}
            onClick={() => onOpen?.(f)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 16px', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            }}>

            {/* Icon */}
            <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {isColorChip
                ? <div style={{ width: 20, height: 20, borderRadius: 7, background: f.icon }} />
                : <span style={{ fontSize: 21, lineHeight: 1 }}>{f.icon || '📁'}</span>}
            </div>

            {/* Label */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 500, color: f.color || 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.label}
              </div>
              {f.subtitle && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.subtitle}
                </div>
              )}
            </div>

            {/* Count + chevron */}
            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: "'DM Mono'", flexShrink: 0 }}>{f.count}</div>
            <div style={{ fontSize: 17, color: 'var(--text-dim)', flexShrink: 0, lineHeight: 1 }}>›</div>
          </div>
        )
      })}
    </div>
  )
}

/** Matching back-header for folder detail views. */
export function FolderHeader({ icon, title, subtitle, onBack, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div onClick={onBack}
        style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
      {icon && <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}
