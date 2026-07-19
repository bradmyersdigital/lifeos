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

// Dark hex values used throughout components
const DARK_BG_VALUES = [
  '#161618','#161614','#0f0f11','#0d0d0f','#1a1a18','#1a1a1e',
  '#1c1c19','#222220','#1e1e24','#242428','#1e160a','#0a0a0c',
  '#111113','#131311','#1e1e20',
]
const DARK_BORDER_VALUES = [
  '#242428','#1e1e24','#2a2820','#333330','#3a3a44','#2a2a28',
  '#1e1e22','#2a2a30','#333','#2a2a2e',
]
const DARK_TEXT_LIGHT = ['#e8e6e1','#d4d2cc','#c0bdb7','#f5f3ee','#e8e0d8']
const DARK_TEXT_MUTED = ['#888','#666','#555','#444','#888780','#666663','#555552','#666260','#444240']

const ThemeContext = createContext({ theme: DARK, mode: 'dark', toggleMode: () => {}, setMode: () => {} })
export function useTheme() { return useContext(ThemeContext) }
export { DARK, LIGHT }

// Active MutationObserver reference
let observer = null

function patchElement(el, t) {
  if (!el || !el.style) return
  const s = el.style

  // Background
  const bg = s.background || s.backgroundColor || ''
  const bgLower = bg.toLowerCase().replace(/\s/g,'')
  for (const v of DARK_BG_VALUES) {
    if (bgLower.includes(v.replace('#','').toLowerCase())) {
      // Decide card vs page bg
      const isPageBg = (v === '#0d0d0f' || v === '#0f0f11')
      s.background = isPageBg ? t.bg : t.bgCard
      s.backgroundColor = isPageBg ? t.bg : t.bgCard
      break
    }
  }

  // Border color
  const border = s.border || s.borderColor || ''
  const borderLower = border.toLowerCase().replace(/\s/g,'')
  for (const v of DARK_BORDER_VALUES) {
    if (borderLower.includes(v.replace('#','').toLowerCase())) {
      if (s.border) s.border = s.border.replace(/(#[0-9a-fA-F]{3,6})/g, (match) => {
        return DARK_BORDER_VALUES.some(dv => dv.toLowerCase() === match.toLowerCase()) ? t.border : match
      })
      s.borderColor = t.border
      break
    }
  }

  // Text color
  const color = s.color || ''
  const colorLower = color.toLowerCase().replace(/\s/g,'')
  for (const v of DARK_TEXT_LIGHT) {
    if (colorLower === v.toLowerCase()) { s.color = t.textPrimary; break }
  }
  for (const v of DARK_TEXT_MUTED) {
    if (colorLower === v.toLowerCase()) { s.color = t.textMuted; break }
  }
}

function patchAllElements(t) {
  if (t.mode !== 'light') return
  const all = document.querySelectorAll('*')
  all.forEach(el => patchElement(el, t))
}

function startObserver(t) {
  if (observer) { observer.disconnect(); observer = null }
  if (t.mode !== 'light') return

  observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.type === 'childList') {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            patchElement(node, t)
            node.querySelectorAll && node.querySelectorAll('*').forEach(el => patchElement(el, t))
          }
        })
      }
      if (m.type === 'attributes' && m.attributeName === 'style') {
        patchElement(m.target, t)
      }
    })
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style'],
  })
}

function injectTheme(t) {
  window.__LIFEOS_THEME__ = t

  // CSS variables + class-based overrides
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
    html, body, #root { background: ${t.bg} !important; color: ${t.textPrimary} !important; }
    .bottom-nav {
      background: ${t.mode === 'dark' ? 'rgba(22,22,20,0.85)' : 'rgba(255,255,255,0.92)'} !important;
      border-color: ${t.border} !important;
    }
    .nav-item.active { background: ${t.accentDim} !important; }
    .nav-item span { color: ${t.textMuted} !important; }
    .nav-item.active span { color: ${t.accent} !important; }
    .modal-sheet { background: ${t.bgCard} !important; border-color: ${t.border} !important; }
    .modal-overlay { background: rgba(0,0,0,${t.mode === 'dark' ? '0.75' : '0.35'}) !important; }
    .btn-primary { background: ${t.accent} !important; color: #fff !important; }
    .btn-ghost { background: ${t.bgCard} !important; border-color: ${t.border} !important; color: ${t.textMuted} !important; }
    .btn-task { background: ${t.accentDim} !important; border: 1px solid ${t.accentBorder} !important; color: ${t.accentText} !important; }
    .btn-task svg line, .btn-task svg path { stroke: ${t.accentText} !important; }
    .btn-event { background: ${t.eventDim} !important; border: 1px solid ${t.eventBorder} !important; color: ${t.event} !important; }
    .event-card { background: ${t.eventDim} !important; border-color: ${t.eventBorder} !important; }
    .event-text { color: ${t.event} !important; }
    .pill-active { background: ${t.accentDim} !important; border-color: ${t.accentBorder} !important; color: ${t.accent} !important; }
    .tab-active { background: ${t.accentDim} !important; color: ${t.accent} !important; }
    .streak-badge { background: ${t.accentDim} !important; border-color: ${t.accentBorder} !important; }
    .prog-fill { background: ${t.accent} !important; }
    .section-label { color: ${t.textMuted} !important; }
    .field-label { color: ${t.textMuted} !important; }
    .action-btn { color: ${t.accentText} !important; }
    input, select, textarea {
      background: ${t.bgInput} !important;
      color: ${t.textPrimary} !important;
      border-color: ${t.border} !important;
    }
    .hamburger-btn {
      background: ${t.mode === 'dark' ? 'rgba(22,22,20,0.85)' : 'rgba(255,255,255,0.92)'} !important;
      border-color: ${t.border} !important;
    }
    .drawer-panel { background: ${t.bgCard} !important; border-color: ${t.border} !important; }
    .page-scroll { background: ${t.bg} !important; }
  `

  // Body classes
  document.body.classList.toggle('light-mode', t.mode === 'light')
  document.body.classList.toggle('dark-mode', t.mode === 'dark')
  document.body.style.background = t.bg
  document.documentElement.style.background = t.bg

  // Patch existing elements + start observer for new ones
  setTimeout(() => {
    patchAllElements(t)
    startObserver(t)
  }, 50)
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem('lifeos_mode') || 'dark' }
    catch { return 'dark' }
  })

  const theme = mode === 'dark' ? DARK : LIGHT

  useEffect(() => {
    injectTheme(theme)
    return () => { if (observer) { observer.disconnect(); observer = null } }
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
