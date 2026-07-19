import React from 'react'
import { useTheme } from '../ThemeContext.jsx'

export default function Settings() {
  const { mode, setMode } = useTheme()
  const isDark = mode === 'dark'

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 24 }}>Settings</div>

      {/* Appearance */}
      <div className="section-label">Appearance</div>

      {/* Dark / Light toggle */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>

        {/* Mode toggle row */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 14 }}>Color mode</div>
          <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div onClick={() => setMode('dark')} style={{ flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer', background: isDark ? 'var(--accent-dim)' : 'transparent', transition: 'background 0.2s' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>🌙</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: isDark ? 'var(--accent)' : 'var(--text-muted)' }}>Dark</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div onClick={() => setMode('light')} style={{ flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer', background: !isDark ? 'var(--accent-dim)' : 'transparent', transition: 'background 0.2s' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>☀️</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: !isDark ? 'var(--accent)' : 'var(--text-muted)' }}>Light</div>
            </div>
          </div>
        </div>

        {/* Palette preview */}
        <div style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>LifeOS palette</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {[
              { color: '#c3955b', label: 'Cognac' },
              { color: '#ba6a36', label: 'Amber' },
              { color: '#e6c8b7', label: 'Champagne' },
              { color: isDark ? '#0d0d0f' : '#f5f0eb', label: isDark ? 'Black' : 'White', border: true },
              { color: '#e8e6e1', label: 'Off-white', border: isDark },
            ].map(({ color, label, border }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: color, border: border ? '1px solid var(--border)' : 'none' }} />
                <div style={{ fontSize: 9, color: 'var(--text-dim)', textAlign: 'center' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="section-label">About</div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>App</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>LifeOS</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Version</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>1.0.0</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Built by</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)' }}>Brad Myers</div>
        </div>
      </div>

      {/* Brand note */}
      <div style={{ padding: '14px 18px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--accent-text)', lineHeight: 1.6 }}>
          LifeOS is your personal operating system — one place for tasks, habits, goals, notes, finance, and more. Built for people who want to live intentionally.
        </div>
      </div>
    </div>
  )
}
