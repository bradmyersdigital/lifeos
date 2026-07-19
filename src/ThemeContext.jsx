import React, { createContext, useContext, useState, useEffect } from 'react'

const DARK = {
  mode: 'dark',
  accent:        '#c3955b',
  accentDim:     '#1e160a',
  accentBorder:  '#6b4f28',
  accentText:    '#d4a96a',
  bg:            '#0d0d0f',
  bgCard:        '#161614',
  bgCard2:       '#1c1c19',
  bgInput:       '#0d0d0f',
  border:        '#2a2820',
  borderHover:   '#3a3630',
  textPrimary:   '#e8e6e1',
  textSecondary: '#c0bdb7',
  textMuted:     '#666260',
  textDim:       '#444240',
  event:         '#c3955b',
  eventDim:      '#1e160a',
  eventBorder:   '#6b4f28',
  amber:         '#ba6a36',
  champagne:     '#e6c8b7',
}

const LIGHT = {
  mode: 'light',
  accent:        '#ba6a36',
  accentDim:     '#f5ede4',
  accentBorder:  '#d4956a',
  accentText:    '#9a4e22',
  bg:            '#f0ebe4',
  bgCard:        '#ffffff',
  bgCard2:       '#faf6f1',
  bgInput:       '#f5f0ea',
  border:        '#e2d8ce',
  borderHover:   '#cfc5b8',
  textPrimary:   '#1a1814',
  textSecondary: '#4a4640',
  textMuted:     '#8a8480',
  textDim:       '#b0ada8',
  event:         '#ba6a36',
  eventDim:      '#f5ede4',
  eventBorder:   '#d4956a',
  amber:         '#ba6a36',
  champagne:     '#c3955b',
}

const ThemeContext = createContext({ theme: DARK, mode: 'dark', toggleMode: () => {}, setMode: () => {} })
export function useTheme() { return useContext(ThemeContext) }
export { DARK, LIGHT }

function injectTheme(t) {
  // CSS variables
  let el = document.getElementById('lifeos-theme')
  if (!el) { el = document.createElement('style'); el.id = 'lifeos-theme'; document.head.appendChild(el) }

  el.textContent = `
    :root {
      --accent: ${t.accent};
      --accent-dim: ${t.accentDim};
      --accent-border: ${t.accentBorder};
      --accent-text: ${t.accentText};
      --bg: ${t.bg};
      --bg-card: ${t.bgCard};
      --bg-card2: ${t.bgCard2};
      --bg-input: ${t.bgInput};
      --border: ${t.border};
      --border-hover: ${t.borderHover};
      --text-primary: ${t.textPrimary};
      --text-secondary: ${t.textSecondary};
      --text-muted: ${t.textMuted};
      --text-dim: ${t.textDim};
      --event-color: ${t.event};
      --event-dim: ${t.eventDim};
      --event-border: ${t.eventBorder};
      --amber: ${t.amber};
      --champagne: ${t.champagne};
    }
    html, body, #root {
      background: ${t.bg} !important;
      color: ${t.textPrimary} !important;
    }
    .bottom-nav {
      background: ${t.mode === 'dark' ? 'rgba(22,22,20,0.85)' : 'rgba(255,252,248,0.90)'} !important;
      border-color: ${t.border} !important;
    }
    .nav-item.active { background: ${t.accentDim} !important; }
    .nav-item span { color: ${t.textMuted} !important; }
    .nav-item.active span { color: ${t.accent} !important; }
    .modal-sheet { background: ${t.bgCard} !important; border-color: ${t.border} !important; }
    .modal-overlay { background: rgba(0,0,0,${t.mode === 'dark' ? '0.75' : '0.4'}) !important; }
    .btn-primary { background: ${t.accent} !important; color: #fff !important; }
    .btn-ghost { background: ${t.bgCard} !important; border-color: ${t.border} !important; color: ${t.textMuted} !important; }
    .btn-task { background: ${t.accentDim} !important; border: 1px solid ${t.accentBorder} !important; color: ${t.accentText} !important; }
    .btn-task svg line, .btn-task svg path, .btn-task svg rect { stroke: ${t.accentText} !important; }
    .btn-event { background: ${t.eventDim} !important; border: 1px solid ${t.eventBorder} !important; color: ${t.event} !important; }
    .event-card { background: ${t.eventDim} !important; border-color: ${t.eventBorder} !important; }
    .event-text { color: ${t.event} !important; }
    .pill-active { background: ${t.accentDim} !important; border-color: ${t.accentBorder} !important; color: ${t.accent} !important; }
    .tab-active { background: ${t.accentDim} !important; color: ${t.accent} !important; }
    .streak-badge { background: ${t.accentDim} !important; border-color: ${t.accentBorder} !important; }
    .streak-badge .streak-num { color: ${t.accent} !important; }
    .prog-fill { background: ${t.accent} !important; }
    .section-label { color: ${t.textMuted} !important; }
    .field-label { color: ${t.textMuted} !important; }
    .action-btn { color: ${t.accentText} !important; }
    input, select, textarea {
      background: ${t.bgInput} !important;
      color: ${t.textPrimary} !important;
      border-color: ${t.border} !important;
    }
  `

  // Inject a React context bridge — passes theme to all inline-styled components
  window.__LIFEOS_THEME__ = t

  // Body class
  document.body.classList.toggle('light-mode', t.mode === 'light')
  document.body.classList.toggle('dark-mode', t.mode === 'dark')
  document.body.style.background = t.bg
  document.documentElement.style.background = t.bg

  // Light mode aggressive overrides via attribute selectors on style prop
  // Since inline styles beat CSS classes, we patch using a MutationObserver approach
  // Instead - we force a full re-background on all child divs
  if (t.mode === 'light') {
    let el2 = document.getElementById('lifeos-light-patch')
    if (!el2) { el2 = document.createElement('style'); el2.id = 'lifeos-light-patch'; document.head.appendChild(el2) }
    el2.textContent = `
      /* Light mode: force page backgrounds */
      body.light-mode .page-scroll { background: ${t.bg} !important; }

      /* Target every background color that appears in dark mode components */
      body.light-mode div[style*="background: #161618"],
      body.light-mode div[style*="background: #161614"],
      body.light-mode div[style*='background: rgb(22, 22, 24)'],
      body.light-mode div[style*="background:#161618"],
      body.light-mode div[style*="background:#161614"] { background: ${t.bgCard} !important; }

      body.light-mode div[style*="background: #0f0f11"],
      body.light-mode div[style*="background: #0d0d0f"],
      body.light-mode div[style*="background:#0f0f11"],
      body.light-mode div[style*="background:#0d0d0f"] { background: ${t.bg} !important; }

      body.light-mode div[style*="background: #1a1a"],
      body.light-mode div[style*="background: #1c1c"],
      body.light-mode div[style*="background: #222"],
      body.light-mode div[style*="background: #111"] { background: ${t.bgCard2} !important; }

      /* Text overrides */
      body.light-mode div[style*="color: #e8e6e1"],
      body.light-mode div[style*="color: #d4d2cc"],
      body.light-mode div[style*="color: rgb(232, 230, 225)"] { color: ${t.textPrimary} !important; }

      body.light-mode div[style*="color: #888"],
      body.light-mode div[style*="color: #666"],
      body.light-mode div[style*="color: #555"],
      body.light-mode div[style*="color: #444"] { color: ${t.textMuted} !important; }

      /* Border overrides */
      body.light-mode div[style*="border: 1px solid #242428"],
      body.light-mode div[style*="border: 1px solid #1e1e24"],
      body.light-mode div[style*="border: 1px solid #2a2820"] { border-color: ${t.border} !important; }

      /* Hamburger button */
      body.light-mode .hamburger-btn {
        background: rgba(245, 240, 235, 0.90) !important;
        border-color: ${t.border} !important;
      }
      /* Drawer */
      body.light-mode .drawer-panel { background: ${t.bgCard} !important; border-color: ${t.border} !important; }
      body.light-mode .drawer-section-label { color: ${t.textDim} !important; }
      body.light-mode .drawer-item { color: ${t.textPrimary} !important; }
    `
  } else {
    const el2 = document.getElementById('lifeos-light-patch')
    if (el2) el2.textContent = ''
  }
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem('lifeos_mode') || 'dark' }
    catch { return 'dark' }
  })

  const theme = mode === 'dark' ? DARK : LIGHT

  useEffect(() => { injectTheme(theme) }, [mode])

  const setMode = (m) => {
    setModeState(m)
    localStorage.setItem('lifeos_mode', m)
    injectTheme(m === 'dark' ? DARK : LIGHT)
  }

  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
