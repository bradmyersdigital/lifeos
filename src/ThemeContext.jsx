import React, { createContext, useContext, useState, useEffect } from 'react'

const DARK = {
  mode: 'dark',
  accent: '#c3955b', accentDim: '#1e160a', accentBorder: '#6b4f28', accentText: '#d4a96a',
  bg: '#0d0d0f', bgCard: '#161614', bgCard2: '#1c1c19', bgInput: '#0d0d0f',
  border: '#2a2820', textPrimary: '#e8e6e1', textSecondary: '#c0bdb7',
  textMuted: '#666260', textDim: '#444240',
  event: '#c3955b', eventDim: '#1e160a', eventBorder: '#6b4f28',
  amber: '#ba6a36', champagne: '#e6c8b7',
}

const LIGHT = {
  mode: 'light',
  accent: '#ba6a36', accentDim: '#fdf0e8', accentBorder: '#e8c4a0', accentText: '#9a4e22',
  bg: '#ffffff', bgCard: '#fdfdfd', bgCard2: '#f5f5f5', bgInput: '#ffffff',
  border: '#e8e8e8', textPrimary: '#0a0a0a', textSecondary: '#2a2a2a',
  textMuted: '#555555', textDim: '#777777',
  event: '#ba6a36', eventDim: '#fdf0e8', eventBorder: '#e8c4a0',
  amber: '#ba6a36', champagne: '#c3955b',
}

const ThemeContext = createContext({ theme: DARK, mode: 'dark', toggleMode: () => {}, setMode: () => {} })
export function useTheme() { return useContext(ThemeContext) }
export { DARK, LIGHT }

function injectTheme(t) {
  let el = document.getElementById('lifeos-theme')
  if (!el) { el = document.createElement('style'); el.id = 'lifeos-theme'; document.head.appendChild(el) }

  el.textContent = `
    :root {
      --accent: ${t.accent}; --accent-dim: ${t.accentDim}; --accent-border: ${t.accentBorder}; --accent-text: ${t.accentText};
      --bg: ${t.bg}; --bg-card: ${t.bgCard}; --bg-card2: ${t.bgCard2}; --bg-input: ${t.bgInput};
      --border: ${t.border}; --text-primary: ${t.textPrimary}; --text-secondary: ${t.textSecondary};
      --text-muted: ${t.textMuted}; --text-dim: ${t.textDim};
      --event-color: ${t.event}; --event-dim: ${t.eventDim}; --event-border: ${t.eventBorder};
      --amber: ${t.amber}; --champagne: ${t.champagne}; --nav-height: 64px;
    }
    html, body, #root { background: ${t.bg} !important; color: ${t.textPrimary} !important; }
    .page-scroll { background: ${t.bg} !important; }
    .bottom-nav { background: ${t.mode==='dark'?'rgba(22,22,20,0.85)':'rgba(255,255,255,0.92)'} !important; border-color: ${t.border} !important; }
    .nav-item.active { background: ${t.accentDim} !important; }
    .nav-item span { color: ${t.textMuted} !important; }
    .nav-item.active span { color: ${t.accent} !important; }
    .modal-sheet { background: ${t.bgCard} !important; border-color: ${t.border} !important; }
    .modal-overlay { background: rgba(0,0,0,${t.mode==='dark'?'0.75':'0.35'}) !important; }
    .btn-primary { background: ${t.accent} !important; color: #fff !important; }
    .btn-ghost { background: ${t.bgCard} !important; border-color: ${t.border} !important; color: ${t.textMuted} !important; }
    .btn-task { background: ${t.accentDim} !important; border: 1px solid ${t.accentBorder} !important; color: ${t.accentText} !important; }
    .btn-task svg line, .btn-task svg path { stroke: ${t.accentText} !important; }
    .btn-event { background: ${t.eventDim} !important; border: 1px solid ${t.eventBorder} !important; color: ${t.event} !important; }
    .event-card { background: ${t.eventDim} !important; border-color: ${t.eventBorder} !important; }
    .event-text { color: ${t.event} !important; }
    .pill-active { background: ${t.accentDim} !important; border-color: ${t.accentBorder} !important; color: ${t.accent} !important; }
    .tab-active { background: ${t.accentDim} !important; color: ${t.accent} !important; }
    .prog-fill { background: ${t.accent} !important; }
    .section-label { color: ${t.textMuted} !important; }
    .field-label { color: ${t.textMuted} !important; }
    .action-btn { color: ${t.accentText} !important; }
    input, select, textarea { background: ${t.bgInput} !important; color: ${t.textPrimary} !important; border-color: ${t.border} !important; }
    .hamburger-btn { background: ${t.mode==='dark'?'rgba(22,22,20,0.85)':'rgba(255,255,255,0.92)'} !important; border-color: ${t.border} !important; }
    .drawer-panel { background: ${t.bgCard} !important; border-color: ${t.border} !important; }
    .theme-card { background: ${t.bgCard} !important; border-color: ${t.border} !important; color: ${t.textPrimary} !important; }
    .theme-card2 { background: ${t.bgCard2} !important; border-color: ${t.border} !important; color: ${t.textPrimary} !important; }
  `

  document.body.style.background = t.bg
  document.documentElement.style.background = t.bg
  document.body.style.color = t.textPrimary
  document.body.setAttribute('data-theme', t.mode)
  document.documentElement.setAttribute('data-theme', t.mode)
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem('lifeos_mode') || 'dark' } catch { return 'dark' }
  })
  const theme = mode === 'dark' ? DARK : LIGHT
  useEffect(() => { injectTheme(theme) }, [mode])
  const setMode = (m) => { setModeState(m); localStorage.setItem('lifeos_mode', m); injectTheme(m === 'dark' ? DARK : LIGHT) }
  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark')
  return <ThemeContext.Provider value={{ theme, mode, toggleMode, setMode }}>{children}</ThemeContext.Provider>
}