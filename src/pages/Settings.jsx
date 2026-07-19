import React, { useState } from 'react'
import { useTheme, buildTheme } from '../ThemeContext.jsx'

/* ── Primitives ─────────────────────────────────────────────────────────── */

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.02em', marginBottom: 10, paddingLeft: 2 }}>
        {title}
      </div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ icon, title, subtitle, right, onClick, last }) {
  return (
    <div onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', cursor: onClick ? 'pointer' : 'default',
        borderBottom: last ? 'none' : '1px solid var(--border)',
        WebkitTapHighlightColor: 'transparent',
      }}>
      {icon !== undefined && (
        <div style={{ width: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>{icon}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 500, color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}

function Toggle({ on, onChange, disabled }) {
  return (
    <div onClick={() => !disabled && onChange(!on)}
      style={{
        width: 50, height: 30, borderRadius: 15, flexShrink: 0,
        background: on ? 'var(--accent)' : 'var(--bg-card2)',
        border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
        position: 'relative', cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
        opacity: disabled ? 0.4 : 1,
      }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: on ? 'var(--bg)' : 'var(--text-muted)',
        position: 'absolute', top: 2, left: on ? 23 : 2,
        transition: 'left 0.2s, background 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </div>
  )
}

const Chevron = () => <div style={{ fontSize: 17, color: 'var(--text-dim)', flexShrink: 0, lineHeight: 1 }}>›</div>

/* ── Palette picker ─────────────────────────────────────────────────────── */

function PaletteSheet({ palettes, current, mode, onPick, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
            Palettes · {palettes.length}
          </div>
          <div onClick={onClose} style={{ fontSize: 14, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>Done</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 10 }}>
          {palettes.map(p => {
            const t = buildTheme(p.id, mode)
            const selected = current === p.id
            return (
              <div key={p.id} onClick={() => onPick(p.id)}
                style={{
                  background: t.bgCard,
                  border: `1.5px solid ${selected ? t.accent : t.border}`,
                  borderRadius: 16, padding: '14px 12px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11,
                }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: t.textPrimary, textAlign: 'center', lineHeight: 1.25 }}>
                  {p.name}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[t.accent, t.accentBorder, t.bg].map((c, i) => (
                    <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: `1px solid ${t.border}` }} />
                  ))}
                </div>
                <div style={{
                  width: '100%', textAlign: 'center', padding: '9px 0', borderRadius: 20,
                  fontSize: 13.5, fontWeight: 500,
                  background: selected ? t.bgCard2 : t.accent,
                  color: selected ? t.textMuted : t.onAccent,
                }}>
                  {selected ? 'Selected' : 'Use'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Settings() {
  const { mode, setMode, paletteId, setPalette, palettes, useSystem, setUseSystem } = useTheme()
  const [sheet, setSheet] = useState(false)
  const activePalette = palettes.find(p => p.id === paletteId) || palettes[0]

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24, letterSpacing: '-0.4px' }}>
        Settings
      </div>

      <Section title="Appearance">
        <Row
          icon="🖥️"
          title="Use system theme"
          subtitle="Match your device's light / dark setting"
          right={<Toggle on={useSystem} onChange={setUseSystem} />}
        />
        <Row
          icon="🌙"
          title="Dark mode"
          subtitle={useSystem ? `Controlled by system · currently ${mode}` : null}
          right={<Toggle on={mode === 'dark'} onChange={v => setMode(v ? 'dark' : 'light')} disabled={useSystem} />}
        />
        <Row
          icon="🎨"
          title="App palette"
          subtitle={activePalette.name}
          onClick={() => setSheet(true)}
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: i === 0 ? 'var(--accent)' : 'var(--accent-border)',
                    border: '1px solid var(--border)',
                  }} />
                ))}
              </div>
              <Chevron />
            </div>
          }
          last
        />
      </Section>

      <Section title="About">
        <Row title="App" right={<div style={{ fontSize: 14.5, color: 'var(--text-muted)' }}>LifeOS</div>} />
        <Row title="Version" right={<div style={{ fontSize: 14.5, color: 'var(--text-muted)', fontFamily: "'DM Mono'" }}>1.0.0</div>} />
        <Row title="Built by" right={<div style={{ fontSize: 14.5, color: 'var(--accent)', fontWeight: 500 }}>Brad Myers</div>} last />
      </Section>

      <div style={{ padding: '15px 18px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12.5, color: 'var(--accent-text)', lineHeight: 1.65 }}>
          LifeOS is your personal operating system — one place for tasks, habits, goals, notes, finance, and more.
          Built for people who want to live intentionally.
        </div>
      </div>

      {sheet && (
        <PaletteSheet
          palettes={palettes}
          current={paletteId}
          mode={mode}
          onPick={setPalette}
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  )
}
