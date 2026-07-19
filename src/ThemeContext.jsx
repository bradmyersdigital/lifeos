import React, { createContext, useContext, useState, useEffect } from 'react'

const DARK = {
  mode: 'dark',
  accent: '#c3955b', accentDim: '#1e160a', accentBorder: '#6b4f28', accentText: '#d4a96a',
  bg: '#0d0d0f', bgCard: '#161614', bgCard2: '#1c1c19', bgInput: '#0d0d0f',
  border: '#2a2820', borderHover: '#3a3630',
  textPrimary: '#e8e6e1', textSecondary: '#c0bdb7', textMuted: '#7d7873', textDim: '#565250',
  event: '#c3955b', eventDim: '#1e160a', eventBorder: '#6b4f28',
  amber: '#ba6a36', champagne: '#e6c8b7',

  danger: '#f87171',  dangerDim: '#2a0a0a',  dangerBorder: '#7a1010',
  success: '#10b981', successDim: '#0a1e14', successBorder: '#14512f',
  warn: '#f5b545',    warnDim: '#1e1a00',    warnBorder: '#4a3d00',
  purple: '#a78bfa',  purpleDim: '#16112e',  purpleBorder: '#2a1a5c',
  blue: '#60a5fa',    blueDim: '#0c1a2e',    blueBorder: '#1a3a5c',

  navBg: 'rgba(22,22,20,0.85)',
  overlay: 'rgba(0,0,0,0.75)',
  shadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
}

const LIGHT = {
  mode: 'light',
  accent: '#b0632f', accentDim: '#fbf2ea', accentBorder: '#e3c3a4', accentText: '#8f4b1e',
  bg: '#fdfdfd', bgCard: '#ffffff', bgCard2: '#f7f7f5', bgInput: '#ffffff',
  border: '#e5e3de', borderHover: '#d0cdc7',
  textPrimary: '#17150f', textSecondary: '#4a4640', textMuted: '#7a756e', textDim: '#a09b94',
  event: '#b0632f', eventDim: '#fbf2ea', eventBorder: '#e3c3a4',
  amber: '#b0632f', champagne: '#a6764f',

  danger: '#dc2626',  dangerDim: '#fef2f2',  dangerBorder: '#fbd5d5',
  success: '#15803d', successDim: '#f0fdf4', successBorder: '#bbf7d0',
  warn: '#b45309',    warnDim: '#fffbeb',    warnBorder: '#fde68a',
  purple: '#6d28d9',  purpleDim: '#f5f3ff',  purpleBorder: '#ddd6fe',
  blue: '#1d4ed8',    blueDim: '#eff6ff',    blueBorder: '#bfdbfe',

  navBg: 'rgba(255,255,255,0.92)',
  overlay: 'rgba(30,26,20,0.35)',
  shadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
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
      --border: ${t.border}; --border-hover: ${t.borderHover};
      --text-primary: ${t.textPrimary}; --text-secondary: ${t.textSecondary};
      --text-muted: ${t.textMuted}; --text-dim: ${t.textDim};
      --event-color: ${t.event}; --event-dim: ${t.eventDim}; --event-border: ${t.eventBorder};
      --amber: ${t.amber}; --champagne: ${t.champagne};

      --danger: ${t.danger};   --danger-dim: ${t.dangerDim};   --danger-border: ${t.dangerBorder};
      --success: ${t.success}; --success-dim: ${t.successDim}; --success-border: ${t.successBorder};
      --warn: ${t.warn};       --warn-dim: ${t.warnDim};       --warn-border: ${t.warnBorder};
      --purple: ${t.purple};   --purple-dim: ${t.purpleDim};   --purple-border: ${t.purpleBorder};
      --blue: ${t.blue};       --blue-dim: ${t.blueDim};       --blue-border: ${t.blueBorder};

      --nav-bg: ${t.navBg}; --overlay: ${t.overlay}; --shadow-float: ${t.shadow};
      --nav-height: 64px;
    }
    html, body, #root { background: ${t.bg}; color: ${t.textPrimary}; }
    .page-scroll { background: ${t.bg}; }
    .bottom-nav { background: ${t.navBg}; border-color: ${t.border}; box-shadow: ${t.shadow}; }
    .hamburger-btn { background: ${t.navBg}; border-color: ${t.border}; box-shadow: ${t.shadow}; }
    .modal-overlay { background: ${t.overlay}; }
    .prog-bar { background: ${t.bgCard2}; }
    .modal-handle { background: ${t.borderHover}; }
  `

  document.body.setAttribute('data-theme', t.mode)
  document.documentElement.setAttribute('data-theme', t.mode)
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem('lifeos_mode') || 'dark' } catch { return 'dark' }
  })
  const theme = mode === 'dark' ? DARK : LIGHT
  useEffect(() => { injectTheme(mode === 'dark' ? DARK : LIGHT) }, [mode])
  const setMode = (m) => { setModeState(m); try { localStorage.setItem('lifeos_mode', m) } catch {} }
  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark')
  return <ThemeContext.Provider value={{ theme, mode, toggleMode, setMode }}>{children}</ThemeContext.Provider>
}
