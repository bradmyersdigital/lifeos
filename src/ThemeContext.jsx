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
  accentDim:     '#fdf0e8',
  accentBorder:  '#e8c4a0',
  accentText:    '#9a4e22',
  bg:            '#ffffff',
  bgCard:        '#fdfdfd',
  bgCard2:       '#f8f8f8',
  bgInput:       '#ffffff',
  border:        '#ebebeb',
  borderHover:   '#d8d8d8',
  textPrimary:   '#0a0a0a',
  textSecondary: '#1a1a1a',
  textMuted:     '#3a3a3a',
  textDim:       '#555555',
  event:         '#ba6a36',
  eventDim:      '#fdf0e8',
  eventBorder:   '#e8c4a0',
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
      /* Light mode: page backgrounds */
      body.light-mode .page-scroll { background: ${t.bg} !important; }
      body.light-mode .app-shell { background: ${t.bg} !important; }

      /* ALL div backgrounds → white or off-white */
      body.light-mode div[style*="background: #161618"],
      body.light-mode div[style*="background: #161614"],
      body.light-mode div[style*="background: #0f0f11"],
      body.light-mode div[style*="background: #0d0d0f"],
      body.light-mode div[style*="background: #1a1a18"],
      body.light-mode div[style*="background: #1a1a1e"],
      body.light-mode div[style*="background: #1c1c19"],
      body.light-mode div[style*="background: #222220"],
      body.light-mode div[style*="background: #1e1e24"],
      body.light-mode div[style*="background: #242428"],
      body.light-mode div[style*="background: #1e160a"],
      body.light-mode div[style*="background:#161618"],
      body.light-mode div[style*="background:#0f0f11"],
      body.light-mode div[style*="background:#0d0d0f"] { background: ${t.bgCard} !important; }

      /* Deeper nested backgrounds */
      body.light-mode div[style*="background: #111"],
      body.light-mode div[style*="background: #0a"],
      body.light-mode div[style*="background: #12"],
      body.light-mode div[style*="background: #13"],
      body.light-mode div[style*="background: #14"] { background: ${t.bgCard2} !important; }

      /* ALL borders → light grey */
      body.light-mode div[style*="border: 1px solid #242428"],
      body.light-mode div[style*="border: 1px solid #1e1e24"],
      body.light-mode div[style*="border: 1px solid #2a2820"],
      body.light-mode div[style*="border: 1px solid #333"],
      body.light-mode div[style*="border: 1px solid #2a"],
      body.light-mode div[style*="border: 1px solid #1e"],
      body.light-mode div[style*="border-color: #242428"] { border-color: ${t.border} !important; }

      /* ALL text → black or near-black */
      body.light-mode div[style*="color: #e8e6e1"],
      body.light-mode div[style*="color: #d4d2cc"],
      body.light-mode div[style*="color: #c0bdb7"],
      body.light-mode span[style*="color: #e8e6e1"],
      body.light-mode span[style*="color: #d4d2cc"],
      body.light-mode div[style*="color: #f5f3ee"],
      body.light-mode div[style*="color: #e8"] { color: ${t.textPrimary} !important; }

      body.light-mode div[style*="color: #888"],
      body.light-mode div[style*="color: #666"],
      body.light-mode div[style*="color: #555"],
      body.light-mode div[style*="color: #444"],
      body.light-mode div[style*="color: #333"],
      body.light-mode span[style*="color: #888"],
      body.light-mode span[style*="color: #666"],
      body.light-mode span[style*="color: #555"],
      body.light-mode span[style*="color: #444"] { color: ${t.textMuted} !important; }

      /* Inputs */
      body.light-mode input,
      body.light-mode select,
      body.light-mode textarea {
        background: ${t.bgInput} !important;
        color: ${t.textPrimary} !important;
        border-color: ${t.border} !important;
      }

      /* Hamburger */
      body.light-mode .hamburger-btn {
        background: rgba(255,255,255,0.92) !important;
        border-color: ${t.border} !important;
        box-shadow: 0 2px 12px rgba(0,0,0,0.10) !important;
      }
      body.light-mode .hamburger-btn div { background: #1a1a1a !important; }

      /* Drawer */
      body.light-mode .drawer-panel {
        background: #ffffff !important;
        border-color: ${t.border} !important;
      }

      /* Nav active item */
      body.light-mode .nav-item.active { background: ${t.accentDim} !important; }
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
