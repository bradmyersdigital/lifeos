import React, { createContext, useContext, useState, useEffect } from 'react'

// ── Color palette ─────────────────────────────────────────────────────────────
// Cognac gold:  #c3955b   Amber:      #ba6a36
// Champagne:    #e6c8b7   Off-white:  #e8e6e1
// Dark bg:      #0d0d0f   Light bg:   #f5f0eb

const DARK = {
  mode: 'dark',
  accent:       '#c3955b',   // cognac gold — primary action color
  accentDim:    '#1e160a',   // very dark cognac tint for backgrounds
  accentBorder: '#6b4f28',   // mid cognac for borders
  accentText:   '#d4a96a',   // lighter cognac for text on dark
  bg:           '#0d0d0f',   // near black
  bgCard:       '#161614',   // slightly lifted card bg — warm tinted
  bgCard2:      '#1c1c19',   // second card level
  bgInput:      '#0d0d0f',
  border:       '#2a2820',   // warm dark border
  borderHover:  '#3a3630',
  textPrimary:  '#e8e6e1',   // off-white
  textSecondary:'#c0bdb7',
  textMuted:    '#666260',
  textDim:      '#444240',
  event:        '#c3955b',   // use cognac for events too — unified palette
  eventDim:     '#1e160a',
  eventBorder:  '#6b4f28',
  amber:        '#ba6a36',   // amber as secondary accent
  champagne:    '#e6c8b7',   // champagne for highlights
}

const LIGHT = {
  mode: 'light',
  accent:       '#ba6a36',   // amber as main accent on light — pops more
  accentDim:    '#f5ede4',   // very light champagne tint
  accentBorder: '#d4956a',   // mid amber border
  accentText:   '#9a4e22',   // dark amber for text on light
  bg:           '#f5f0eb',   // warm off-white / champagne base
  bgCard:       '#ffffff',   // pure white cards
  bgCard2:      '#faf6f2',   // slight champagne card
  bgInput:      '#f5f0eb',
  border:       '#e0d8cf',   // warm light border
  borderHover:  '#cfc5b8',
  textPrimary:  '#1a1814',   // near black warm
  textSecondary:'#4a4640',
  textMuted:    '#8a8480',
  textDim:      '#b0ada8',
  event:        '#ba6a36',
  eventDim:     '#f5ede4',
  eventBorder:  '#d4956a',
  amber:        '#ba6a36',
  champagne:    '#c3955b',
}

const ThemeContext = createContext({ theme: DARK, mode: 'dark', toggleMode: () => {}, setMode: () => {} })
export function useTheme() { return useContext(ThemeContext) }

function injectTheme(t) {
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

    /* Cards & inputs */
    .bottom-nav { background: ${t.bgCard} !important; border-top-color: ${t.border} !important; }
    input, select, textarea {
      background: ${t.bgInput} !important;
      color: ${t.textPrimary} !important;
      border-color: ${t.border} !important;
    }

    /* Buttons */
    .btn-primary {
      background: ${t.accent} !important;
      color: ${t.mode === 'dark' ? '#fff' : '#fff'} !important;
    }
    .btn-ghost {
      background: ${t.bgCard} !important;
      border-color: ${t.border} !important;
      color: ${t.textMuted} !important;
    }
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

    /* Events */
    .event-card {
      background: ${t.eventDim} !important;
      border-color: ${t.eventBorder} !important;
    }
    .event-text { color: ${t.event} !important; }

    /* Pills & tabs */
    .pill-active {
      background: ${t.accentDim} !important;
      border-color: ${t.accentBorder} !important;
      color: ${t.accent} !important;
    }
    .tab-active {
      background: ${t.accentDim} !important;
      color: ${t.accent} !important;
    }
    .streak-badge {
      background: ${t.accentDim} !important;
      border-color: ${t.accentBorder} !important;
    }
    .streak-badge .streak-num { color: ${t.accent} !important; }

    /* Progress */
    .prog-fill { background: ${t.accent} !important; }

    /* Nav active */
    .nav-item.active span { color: ${t.accent} !important; }
    .action-btn { color: ${t.accentText}; }

    /* Section labels */
    .section-label { color: ${t.textMuted} !important; }

    /* Modal */
    .modal-overlay { background: rgba(0,0,0,${t.mode === 'dark' ? '0.75' : '0.45'}) !important; }
    .modal-sheet {
      background: ${t.bgCard} !important;
      border-top-color: ${t.border} !important;
    }
    .field-label { color: ${t.textMuted} !important; }
  `

  // Force body + all cards to use theme colors on iOS
  document.body.style.background = t.bg
  document.documentElement.style.background = t.bg

  // Patch card backgrounds for light mode
  const cardStyle = document.getElementById('lifeos-cards')
  const el2 = cardStyle || document.createElement('style')
  if (!cardStyle) { el2.id = 'lifeos-cards'; document.head.appendChild(el2) }
  el2.textContent = `
    .card, [class*="card"] { background: ${t.bgCard} !important; border-color: ${t.border} !important; }
    .modal-sheet { background: ${t.bgCard} !important; }
    .bottom-nav { background: ${t.bgCard} !important; border-top-color: ${t.border} !important; }
  `
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_mode')
      if (saved) return saved
      // Default dark regardless of system
      return 'dark'
    } catch { return 'dark' }
  })

  const theme = mode === 'dark' ? DARK : LIGHT

  useEffect(() => {
    injectTheme(theme)
    document.body.classList.toggle('light-mode', mode === 'light')
    document.body.classList.toggle('dark-mode', mode === 'dark')
    document.body.style.background = theme.bg
    document.documentElement.style.background = theme.bg
  }, [mode])

  const setMode = (m) => {
    setModeState(m)
    localStorage.setItem('lifeos_mode', m)
    const t = m === 'dark' ? DARK : LIGHT
    injectTheme(t)
    document.body.classList.toggle('light-mode', m === 'light')
    document.body.classList.toggle('dark-mode', m === 'dark')
    document.body.style.background = t.bg
    document.documentElement.style.background = t.bg
  }

  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export { DARK, LIGHT }
