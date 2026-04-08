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

export function useTheme() {
  return useContext(ThemeContext)
}

export function applyToCss(theme) {
  const r = document.documentElement.style
  r.setProperty('--accent', theme.accent)
  r.setProperty('--accent-dim', theme.accentDim)
  r.setProperty('--accent-border', theme.accentBorder)
  r.setProperty('--accent-text', theme.accentText)
  r.setProperty('--bg', theme.bg)
  r.setProperty('--bg-card', theme.bgCard)
  r.setProperty('--bg-card2', theme.bgCard)
  r.setProperty('--bg-input', theme.bg)
  r.setProperty('--text-primary', theme.textPrimary)
  r.setProperty('--text-muted', theme.textMuted)
  r.setProperty('--event-color', theme.event)
  r.setProperty('--event-dim', theme.eventDim)
  r.setProperty('--event-border', theme.eventBorder)
  // Also set body background directly so it changes immediately
  document.body.style.background = theme.bg
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const s = localStorage.getItem('lifeos_theme')
      return s ? { ...DEFAULT_THEME, ...JSON.parse(s) } : { ...DEFAULT_THEME }
    } catch { return { ...DEFAULT_THEME } }
  })

  useEffect(() => { applyToCss(theme) }, [theme])

  const updateTheme = (next) => {
    setTheme(next)
    applyToCss(next)
    localStorage.setItem('lifeos_theme', JSON.stringify(next))
  }

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
