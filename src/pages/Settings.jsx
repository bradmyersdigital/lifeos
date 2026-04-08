import React, { useState, useEffect } from 'react'

const DEFAULT_THEME = {
  accent: '#d4520f',       // main orange — tasks, buttons, active nav
  accentBg: '#1e1208',     // dark bg for active states
  accentBorder: '#7a3410', // border for active states
  event: '#10b981',        // event green
  eventBg: '#0a1e14',
  eventBorder: '#1a4a2a',
  navBg: '#111113',        // bottom nav background
  cardBg: '#161618',       // card background
  pageBg: '#0f0f11',       // page background
  text: '#e8e6e1',         // primary text
  textMuted: '#555555',    // muted text
}

const PRESETS = [
  { name: 'Default', colors: { ...DEFAULT_THEME } },
  {
    name: 'Ocean', colors: {
      ...DEFAULT_THEME,
      accent: '#3b82f6', accentBg: '#0c1a2e', accentBorder: '#1a3a5c',
      event: '#06b6d4', eventBg: '#0a1e24', eventBorder: '#0e4a5c',
    }
  },
  {
    name: 'Forest', colors: {
      ...DEFAULT_THEME,
      accent: '#10b981', accentBg: '#0a1e14', accentBorder: '#1a4a2a',
      event: '#84cc16', eventBg: '#0e1e08', eventBorder: '#2a4a10',
    }
  },
  {
    name: 'Violet', colors: {
      ...DEFAULT_THEME,
      accent: '#a78bfa', accentBg: '#16112e', accentBorder: '#3a2a6c',
      event: '#e879f9', eventBg: '#2a0e2e', eventBorder: '#5a1a5c',
    }
  },
  {
    name: 'Rose', colors: {
      ...DEFAULT_THEME,
      accent: '#f43f5e', accentBg: '#2a0a14', accentBorder: '#7a1030',
      event: '#fb7185', eventBg: '#2a0a14', eventBorder: '#7a1030',
    }
  },
  {
    name: 'Gold', colors: {
      ...DEFAULT_THEME,
      accent: '#f59e0b', accentBg: '#1e1200', accentBorder: '#7a4a00',
      event: '#fbbf24', eventBg: '#1e1600', eventBorder: '#7a5a00',
    }
  },
]

const COLOR_FIELDS = [
  { key: 'accent', label: 'Primary accent', desc: 'Tasks, active nav, buttons' },
  { key: 'event', label: 'Events color', desc: 'Event pills, event borders' },
  { key: 'navBg', label: 'Nav bar background', desc: 'Bottom navigation bar' },
  { key: 'cardBg', label: 'Card background', desc: 'Cards and tiles' },
  { key: 'pageBg', label: 'Page background', desc: 'Main app background' },
  { key: 'text', label: 'Primary text', desc: 'Main text color' },
  { key: 'textMuted', label: 'Muted text', desc: 'Labels and secondary text' },
]

function applyTheme(colors) {
  const root = document.documentElement
  root.style.setProperty('--accent', colors.accent)
  root.style.setProperty('--accent-bg', colors.accentBg)
  root.style.setProperty('--accent-border', colors.accentBorder)
  root.style.setProperty('--event', colors.event)
  root.style.setProperty('--event-bg', colors.eventBg)
  root.style.setProperty('--event-border', colors.eventBorder)
  root.style.setProperty('--nav-bg', colors.navBg)
  root.style.setProperty('--card-bg', colors.cardBg)
  root.style.setProperty('--page-bg', colors.pageBg)
  root.style.setProperty('--text', colors.text)
  root.style.setProperty('--text-muted', colors.textMuted)
}

export default function Settings() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_theme')
      return saved ? { ...DEFAULT_THEME, ...JSON.parse(saved) } : { ...DEFAULT_THEME }
    } catch { return { ...DEFAULT_THEME } }
  })
  const [activePreset, setActivePreset] = useState(null)

  useEffect(() => { applyTheme(theme) }, [])

  const updateColor = (key, value) => {
    const next = { ...theme, [key]: value }
    // Auto-derive bg and border from accent
    if (key === 'accent') {
      next.accentBg = value + '22'
      next.accentBorder = value + '88'
    }
    if (key === 'event') {
      next.eventBg = value + '22'
      next.eventBorder = value + '66'
    }
    setTheme(next)
    setActivePreset(null)
    applyTheme(next)
    localStorage.setItem('lifeos_theme', JSON.stringify(next))
  }

  const applyPreset = (preset) => {
    setTheme(preset.colors)
    setActivePreset(preset.name)
    applyTheme(preset.colors)
    localStorage.setItem('lifeos_theme', JSON.stringify(preset.colors))
  }

  const resetToDefault = () => {
    setTheme({ ...DEFAULT_THEME })
    setActivePreset('Default')
    applyTheme(DEFAULT_THEME)
    localStorage.setItem('lifeos_theme', JSON.stringify(DEFAULT_THEME))
  }

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 6 }}>Settings</div>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>Customize your interface</div>

      {/* Presets */}
      <div className="section-label">Color presets</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
        {PRESETS.map(preset => (
          <div key={preset.name} onClick={() => applyPreset(preset)} style={{ background: activePreset === preset.name ? preset.colors.accentBg : '#161618', border: `1px solid ${activePreset === preset.name ? preset.colors.accent : '#242428'}`, borderRadius: 14, padding: 14, cursor: 'pointer', transition: 'all 0.15s' }}>
            {/* Color preview dots */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: preset.colors.accent }} />
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: preset.colors.event }} />
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: preset.colors.navBg, border: '1px solid #333' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: activePreset === preset.name ? preset.colors.accent : '#e8e6e1' }}>{preset.name}</div>
          </div>
        ))}
      </div>

      {/* Custom colors */}
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
              <div style={{ position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: theme[field.key], border: '2px solid #2a2a30', cursor: 'pointer', overflow: 'hidden' }}>
                  <input type="color" value={theme[field.key]} onChange={e => updateColor(field.key, e.target.value)}
                    style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reset */}
      <button onClick={resetToDefault} style={{ width: '100%', padding: 14, borderRadius: 14, background: '#161618', border: '1px solid #242428', color: '#555', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>
        Reset to default theme
      </button>

      {/* Theme applied note */}
      <div style={{ textAlign: 'center', fontSize: 12, color: '#333', marginTop: 16, lineHeight: 1.6 }}>
        Colors apply instantly across the app.{'\n'}Saved automatically.
      </div>
    </div>
  )
}

// Export applyTheme for use at app startup
export { applyTheme, DEFAULT_THEME }
