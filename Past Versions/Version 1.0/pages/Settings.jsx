import React, { useState } from 'react'
import { useTheme, DEFAULT_THEME } from '../ThemeContext'

const PRESETS = [
  { name: 'Default', theme: { ...DEFAULT_THEME } },
  {
    name: 'Ocean', theme: {
      ...DEFAULT_THEME,
      accent: '#3b82f6', accentDim: '#0c1a2e', accentBorder: '#1a3a5c', accentText: '#93c5fd',
      event: '#06b6d4', eventDim: '#0a1e24', eventBorder: '#0e4a5c',
    }
  },
  {
    name: 'Forest', theme: {
      ...DEFAULT_THEME,
      accent: '#10b981', accentDim: '#0a1e14', accentBorder: '#1a4a2a', accentText: '#6ee7b7',
      event: '#84cc16', eventDim: '#0e1e08', eventBorder: '#2a4a10',
    }
  },
  {
    name: 'Violet', theme: {
      ...DEFAULT_THEME,
      accent: '#a78bfa', accentDim: '#16112e', accentBorder: '#3a2a6c', accentText: '#c4b5fd',
      event: '#e879f9', eventDim: '#2a0e2e', eventBorder: '#5a1a5c',
    }
  },
  {
    name: 'Rose', theme: {
      ...DEFAULT_THEME,
      accent: '#f43f5e', accentDim: '#2a0a14', accentBorder: '#7a1030', accentText: '#fb7185',
      event: '#f97316', eventDim: '#2a1000', eventBorder: '#7a3010',
    }
  },
  {
    name: 'Gold', theme: {
      ...DEFAULT_THEME,
      accent: '#f59e0b', accentDim: '#1e1200', accentBorder: '#7a4a00', accentText: '#fcd34d',
      event: '#eab308', eventDim: '#1a1400', eventBorder: '#6a5200',
    }
  },
]

const COLOR_FIELDS = [
  { key: 'accent', label: 'Primary accent', desc: 'Tasks, active nav, buttons' },
  { key: 'event', label: 'Events color', desc: 'All event-related colors' },
  { key: 'bg', label: 'Page background', desc: 'Main app background' },
  { key: 'bgCard', label: 'Card background', desc: 'Cards and tiles' },
  { key: 'textPrimary', label: 'Primary text', desc: 'Main text color' },
]

export default function Settings() {
  const { theme, updateTheme } = useTheme()
  const [activePreset, setActivePreset] = useState('Default')

  const applyPreset = (preset) => {
    setActivePreset(preset.name)
    updateTheme(preset.theme)
  }

  const updateColor = (key, value) => {
    const next = { ...theme, [key]: value }
    if (key === 'accent') {
      next.accentDim = value + '22'
      next.accentBorder = value + '99'
      next.accentText = value
    }
    if (key === 'event') {
      next.eventDim = value + '22'
      next.eventBorder = value + '66'
    }
    setActivePreset(null)
    updateTheme(next)
  }

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 6 }}>Settings</div>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>Customize your interface</div>

      <div className="section-label">Color presets</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
        {PRESETS.map(preset => (
          <div key={preset.name} onClick={() => applyPreset(preset)}
            style={{ background: activePreset === preset.name ? preset.theme.accentDim : '#161618', border: `2px solid ${activePreset === preset.name ? preset.theme.accent : '#242428'}`, borderRadius: 14, padding: 14, cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: preset.theme.accent }} />
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: preset.theme.event }} />
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: preset.theme.bgCard, border: '1px solid #333' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: activePreset === preset.name ? preset.theme.accent : '#e8e6e1' }}>{preset.name}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Custom colors</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {COLOR_FIELDS.map(field => (
          <div key={field.key} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#e8e6e1', marginBottom: 2 }}>{field.label}</div>
              <div style={{ fontSize: 12, color: '#555' }}>{field.desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555' }}>{theme[field.key]}</div>
              <div style={{ position: 'relative', width: 36, height: 36 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: theme[field.key], border: '2px solid #333' }} />
                <input type="color" value={theme[field.key]} onChange={e => updateColor(field.key, e.target.value)}
                  style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => applyPreset(PRESETS[0])} style={{ width: '100%', padding: 14, borderRadius: 14, background: '#161618', border: '1px solid #242428', color: '#555', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>
        Reset to default
      </button>

      <div style={{ textAlign: 'center', fontSize: 12, color: '#333', marginTop: 16 }}>
        Changes apply instantly across the whole app
      </div>
    </div>
  )
}
