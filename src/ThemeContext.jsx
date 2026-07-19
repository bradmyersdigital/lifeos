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
  textPrimary:   '#0a0a0a',
  textSecondary: '#1a1a1a',
  textMuted:     '#444444',
  textDim:       '#666666',
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
  // 1. Set CSS variables on :root
  let el = document.getElementById('lifeos-theme')
  if (!el) { el = document.createElement('style'); el.id = 'lifeos-theme'; document.head.appendChild(el) }

  // 2. For light mode, we override the hardcoded dark values that inline styles set
  // We use :root variable overrides + targeted overrides for components
  const isLight = t.mode === 'light'

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
      --text-primary: ${t.textPrimary};
      --text-secondary: ${t.textSecondary};
      --text-muted: ${t.textMuted};
      --text-dim: ${t.textDim};
      --event-color: ${t.event};
      --event-dim: ${t.eventDim};
      --event-border: ${t.eventBorder};
      --amber: ${t.amber};
      --champagne: ${t.champagne};
      --nav-height: 64px;
    }

    html, body, #root {
      background: ${t.bg} !important;
      color: ${t.textPrimary} !important;
    }

    /* Nav */
    .bottom-nav {
      background: ${isLight ? 'rgba(255,255,255,0.92)' : 'rgba(22,22,20,0.85)'} !important;
      border-color: ${t.border} !important;
    }
    .nav-item.active { background: ${t.accentDim} !important; }
    .nav-item span { color: ${t.textMuted} !important; }
    .nav-item.active span { color: ${t.accent} !important; }

    /* Modals */
    .modal-sheet { background: ${t.bgCard} !important; border-color: ${t.border} !important; }
    .modal-overlay { background: rgba(0,0,0,${isLight ? '0.35' : '0.75'}) !important; }
    .modal-handle { background: ${t.border} !important; }

    /* Buttons */
    .btn-primary { background: ${t.accent} !important; color: #fff !important; }
    .btn-ghost { background: ${t.bgCard} !important; border-color: ${t.border} !important; color: ${t.textMuted} !important; }
    .btn-task { background: ${t.accentDim} !important; border: 1px solid ${t.accentBorder} !important; color: ${t.accentText} !important; }
    .btn-task svg line, .btn-task svg path { stroke: ${t.accentText} !important; }
    .btn-event { background: ${t.eventDim} !important; border: 1px solid ${t.eventBorder} !important; color: ${t.event} !important; }
    .action-btn { color: ${t.accentText} !important; }

    /* Events */
    .event-card { background: ${t.eventDim} !important; border-color: ${t.eventBorder} !important; }
    .event-text { color: ${t.event} !important; }

    /* Pills */
    .pill-active { background: ${t.accentDim} !important; border-color: ${t.accentBorder} !important; color: ${t.accent} !important; }
    .tab-active { background: ${t.accentDim} !important; color: ${t.accent} !important; }
    .streak-badge { background: ${t.accentDim} !important; border-color: ${t.accentBorder} !important; }
    .prog-fill { background: ${t.accent} !important; }

    /* Labels */
    .section-label { color: ${t.textMuted} !important; }
    .field-label { color: ${t.textMuted} !important; }

    /* Inputs */
    input, select, textarea {
      background: ${t.bgInput} !important;
      color: ${t.textPrimary} !important;
      border-color: ${t.border} !important;
    }

    /* Hamburger + Drawer */
    .hamburger-btn {
      background: ${isLight ? 'rgba(255,255,255,0.92)' : 'rgba(22,22,20,0.85)'} !important;
      border-color: ${t.border} !important;
    }
    .drawer-panel { background: ${t.bgCard} !important; border-color: ${t.border} !important; }

    /* Page */
    .page-scroll { background: ${t.bg} !important; }

    /* Theme utility classes — use className instead of inline styles */
    .bg-page   { background: ${t.bg} !important; }
    .bg-card   { background: ${t.bgCard} !important; }
    .bg-card2  { background: ${t.bgCard2} !important; }
    .bg-input  { background: ${t.bgInput} !important; }
    .bg-accent { background: ${t.accentDim} !important; }
    .text-primary   { color: ${t.textPrimary} !important; }
    .text-secondary { color: ${t.textSecondary} !important; }
    .text-muted     { color: ${t.textMuted} !important; }
    .text-dim       { color: ${t.textDim} !important; }
    .text-accent    { color: ${t.accent} !important; }
    .border-theme   { border-color: ${t.border} !important; }
    .theme-card  { background: ${t.bgCard} !important; border: 1px solid ${t.border} !important; color: ${t.textPrimary} !important; }
    .theme-card2 { background: ${t.bgCard2} !important; border: 1px solid ${t.border} !important; color: ${t.textPrimary} !important; }
    .theme-input { background: ${t.bgInput} !important; border: 1px solid ${t.border} !important; color: ${t.textPrimary} !important; }

    ${isLight ? `
    /* ── LIGHT MODE: force ALL inline dark backgrounds to white/off-white ── */
    /* This targets every combination React might render as an inline style */

    /* The trick: we intercept via a high-specificity universal rule on the page */
    .page-scroll > * { color: ${t.textPrimary}; }

    /* Force every child div of page-scroll that has inline bg to be card color */
    /* We do this by making the page background white and card slightly off-white */
    /* so even "black" boxes become visible as the page bg */
    .page-scroll { color: ${t.textPrimary} !important; }

    /* Target by cascading: any div inside page content gets overridden */
    #root div:not([class*="modal"]):not([class*="drawer"]):not([class*="bottom-nav"]):not([class*="hamburger"]) {
      border-color: ${t.border};
    }
    ` : ''}
  `

  // Set body bg directly for iOS overscroll
  document.body.style.background = t.bg
  document.documentElement.style.background = t.bg
  document.body.style.color = t.textPrimary

  // For light mode: directly walk the DOM and patch inline styles
  // This runs once on switch and handles all currently rendered elements
  if (isLight) {
    requestAnimationFrame(() => {
      const DARK_BGS = {
        '#161614': t.bgCard, '#161618': t.bgCard,
        '#0d0d0f': t.bg, '#0f0f11': t.bg,
        '#1c1c19': t.bgCard2, '#1a1a18': t.bgCard,
        '#1a1a1e': t.bgCard, '#222220': t.bgCard2,
        '#1e1e24': t.bgCard2, '#1e160a': t.accentDim,
        'rgb(22, 22, 20)': t.bgCard, 'rgb(13, 13, 15)': t.bg,
        'rgb(15, 15, 17)': t.bg, 'rgb(28, 28, 25)': t.bgCard2,
      }
      const DARK_TEXTS = {
        '#e8e6e1': t.textPrimary, '#d4d2cc': t.textPrimary,
        '#c0bdb7': t.textSecondary, '#f5f3ee': t.textPrimary,
        'rgb(232, 230, 225)': t.textPrimary,
        'rgb(192, 189, 183)': t.textSecondary,
      }
      const MUTED_TEXTS = {
        '#666260': t.textMuted, '#444240': t.textDim,
        'rgb(102, 98, 96)': t.textMuted, 'rgb(68, 66, 64)': t.textDim,
      }
      const DARK_BORDERS = [
        '#2a2820','#242428','#1e1e24','#333330',
        'rgb(42, 40, 32)','rgb(36, 36, 40)','rgb(30, 30, 36)',
      ]

      document.querySelectorAll('*').forEach(el => {
        const s = el.style
        if (!s) return

        // Background
        const bg = s.background || s.backgroundColor
        if (bg) {
          const bgKey = Object.keys(DARK_BGS).find(k => bg.toLowerCase().includes(k.toLowerCase()))
          if (bgKey) {
            s.setProperty('background', DARK_BGS[bgKey], 'important')
            s.setProperty('background-color', DARK_BGS[bgKey], 'important')
          }
        }

        // Text color
        const col = s.color
        if (col) {
          const colKey = Object.keys(DARK_TEXTS).find(k => col.toLowerCase().includes(k.toLowerCase()))
          if (colKey) { s.setProperty('color', DARK_TEXTS[colKey], 'important'); return }
          const mutedKey = Object.keys(MUTED_TEXTS).find(k => col.toLowerCase().includes(k.toLowerCase()))
          if (mutedKey) s.setProperty('color', MUTED_TEXTS[mutedKey], 'important')
        }

        // Border
        const border = s.border || s.borderColor || s.borderTopColor || s.borderBottomColor
        if (border) {
          const hasDark = DARK_BORDERS.some(b => border.toLowerCase().includes(b.toLowerCase()))
          if (hasDark) {
            if (s.border) s.border = s.border.replace(/#[0-9a-fA-F]{3,6}/g, t.border)
            if (s.borderColor) s.setProperty('border-color', t.border, 'important')
          }
        }
      })
    })
  }
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem('lifeos_mode') || 'dark' }
    catch { return 'dark' }
  })

  const theme = mode === 'dark' ? DARK : LIGHT

  useEffect(() => { injectTheme(theme) }, [mode])

  // Re-patch on any render when in light mode
  useEffect(() => {
    if (mode !== 'light') return
    const id = setInterval(() => injectTheme(LIGHT), 300)
    return () => clearInterval(id)
  }, [mode])

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
