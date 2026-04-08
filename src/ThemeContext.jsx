import React, { createContext, useContext, useState, useEffect } from 'react'

export const DEFAULT_THEME = {
  accent: '#d4520f',
  accentDim: '#1e1208',
  accentBorder: '#7a3410',
  accentText: '#e8823a',
  event: '#10b981',
  eventDim: '#0a1e14',
  eventBorder: '#1a4a2a',
  bg: '#0f0f11',
  bgCard: '#161618',
  textPrimary: '#e8e6e1',
  textMuted: '#555555',
}

const ThemeContext = createContext({ theme: DEFAULT_THEME, updateTheme: () => {} })
export function useTheme() { return useContext(ThemeContext) }

function injectThemeStyle(t) {
  let el = document.getElementById('lifeos-theme')
  if (!el) { el = document.createElement('style'); el.id = 'lifeos-theme'; document.head.appendChild(el) }
  el.textContent = `
    :root {
      --accent: ${t.accent};
      --accent-dim: ${t.accentDim};
      --accent-border: ${t.accentBorder};
      --accent-text: ${t.accentText};
      --event-color: ${t.event};
      --event-dim: ${t.eventDim};
      --event-border: ${t.eventBorder};
      --bg: ${t.bg};
      --bg-card: ${t.bgCard};
      --bg-card2: ${t.bgCard};
      --bg-input: ${t.bg};
      --text-primary: ${t.textPrimary};
      --text-muted: ${t.textMuted};
    }
    html, body, #root { background: ${t.bg} !important; }
    .bottom-nav { background: ${t.bgCard} !important; }
    .btn-primary { background: ${t.accent} !important; }
    .btn-task {
      background: ${t.accentDim} !important;
      border: 1px solid ${t.accentBorder} !important;
      color: ${t.accentText} !important;
    }
    .btn-task svg line, .btn-task svg path, .btn-task svg rect {
      stroke: ${t.accentText} !important;
    }
    .btn-event {
      background: ${t.eventDim} !important;
      border: 1px solid ${t.eventBorder} !important;
      color: ${t.event} !important;
    }
    .btn-event svg line, .btn-event svg path, .btn-event svg rect, .btn-event svg circle {
      stroke: ${t.event} !important;
    }
    .event-card {
      background: ${t.eventDim} !important;
      border-color: ${t.eventBorder} !important;
    }
    .event-text { color: ${t.event} !important; }
    .streak-badge {
      background: ${t.accentDim} !important;
      border-color: ${t.accentBorder} !important;
    }
    .streak-badge .streak-num { color: ${t.accent} !important; }
    .pill-active {
      background: ${t.accentDim} !important;
      border-color: ${t.accentBorder} !important;
      color: ${t.accent} !important;
    }
    .tab-active {
      background: ${t.accentDim} !important;
      color: ${t.accent} !important;
    }
    .prog-fill { background: ${t.accent} !important; }
    .nav-item.active span { color: ${t.accent} !important; }
    .action-btn { color: ${t.accentText}; }
  `
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const s = localStorage.getItem('lifeos_theme')
      return s ? { ...DEFAULT_THEME, ...JSON.parse(s) } : { ...DEFAULT_THEME }
    } catch { return { ...DEFAULT_THEME } }
  })

  useEffect(() => { injectThemeStyle(theme) }, [theme])

  const updateTheme = (next) => {
    setTheme(next)
    injectThemeStyle(next)
    localStorage.setItem('lifeos_theme', JSON.stringify(next))
  }

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
