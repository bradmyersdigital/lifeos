import React from 'react'
import { ICON_REGISTRY, ICON_LABELS } from './Icons'

/**
 * IconPicker — grid of our built-in drawn icons.
 * These recolor with the theme for free (they use currentColor / accent).
 *
 * value      — stored icon key with prefix, e.g. "icon:home" (or empty)
 * onPick(v)  — called with "icon:<key>"
 * accent     — highlight colour for the selected cell
 */
export default function IconPicker({ value, onPick, accent = 'var(--accent)' }) {
  const keys = Object.keys(ICON_REGISTRY)
  const current = value && value.startsWith('icon:') ? value.slice(5) : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
      {keys.map(key => {
        const Icon = ICON_REGISTRY[key]
        const selected = current === key
        return (
          <div key={key} onClick={() => onPick(`icon:${key}`)} title={ICON_LABELS[key] || key}
            style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 11, cursor: 'pointer',
              background: selected ? 'var(--accent-dim)' : 'var(--bg-card)',
              border: `1px solid ${selected ? 'var(--accent-border)' : 'var(--border)'}`,
            }}>
            <Icon active={selected} size={22} />
          </div>
        )
      })}
    </div>
  )
}
