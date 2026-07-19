import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

/* ────────────────────────────────────────────────────────────────
   Colour maths — tokens are derived from a small seed per palette
   so adding a palette means writing 9 values, not 34.
   ──────────────────────────────────────────────────────────────── */
function hex2rgb(h) {
  h = h.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function rgb2hex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}
/** mix(a, b, t) — t=0 returns a, t=1 returns b */
function mix(a, b, t) {
  const [r1, g1, b1] = hex2rgb(a), [r2, g2, b2] = hex2rgb(b)
  return rgb2hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}
/** relative luminance, used for contrast maths */
function luminance(h) {
  const [r, g, b] = hex2rgb(h).map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const l1 = luminance(a), l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
/** whichever of near-black / near-white is actually readable on `bg` */
function readableOn(bg) {
  return contrast('#111111', bg) >= contrast('#ffffff', bg) ? '#111111' : '#ffffff'
}

/* ────────────────────────────────────────────────────────────────
   Palettes — each mode needs: accent, bg, card, card2, border,
   textPrimary, textSecondary, textMuted, textDim
   ──────────────────────────────────────────────────────────────── */
export const PALETTES = [
  {
    id: 'cognac', name: 'Cognac Gold',
    dark:  { accent: '#c3955b', bg: '#0d0d0f', card: '#161614', card2: '#1c1c19', border: '#2a2820', textPrimary: '#e8e6e1', textSecondary: '#c0bdb7', textMuted: '#7d7873', textDim: '#565250' },
    light: { accent: '#a15726', bg: '#fdfdfd', card: '#ffffff', card2: '#f7f7f5', border: '#e5e3de', textPrimary: '#17150f', textSecondary: '#4a4640', textMuted: '#7a756e', textDim: '#a09b94' },
  },
  {
    id: 'terracotta', name: 'Terracotta Warmth',
    dark:  { accent: '#f4794f', bg: '#181110', card: '#231916', card2: '#2b1f1b', border: '#3a2a24', textPrimary: '#f5e9e3', textSecondary: '#d6c2b9', textMuted: '#9b857c', textDim: '#6b5952' },
    light: { accent: '#bd3a13', bg: '#fdfbf9', card: '#ffffff', card2: '#f7f0eb', border: '#e8dbd2', textPrimary: '#1f1310', textSecondary: '#54423b', textMuted: '#8a7369', textDim: '#b3a096' },
  },
  {
    id: 'classicblue', name: 'Classic Blue',
    dark:  { accent: '#94b4f7', bg: '#0c0f16', card: '#141a25', card2: '#1a2130', border: '#252e3f', textPrimary: '#e6ebf5', textSecondary: '#b8c3d6', textMuted: '#76829a', textDim: '#525c72' },
    light: { accent: '#0b6bd3', bg: '#fdfdfe', card: '#ffffff', card2: '#f2f5fa', border: '#dde4ee', textPrimary: '#0e1520', textSecondary: '#3c4657', textMuted: '#6e7A8e', textDim: '#9aa4b5' },
  },
  {
    id: 'forest', name: 'Forest Green',
    dark:  { accent: '#8ecf6e', bg: '#0c110c', card: '#141b13', card2: '#1a231a', border: '#26311f', textPrimary: '#e8f0e4', textSecondary: '#bcccb5', textMuted: '#7b8b76', textDim: '#556150' },
    light: { accent: '#2f7d24', bg: '#fdfdfc', card: '#ffffff', card2: '#f2f6f0', border: '#dde6da', textPrimary: '#101710', textSecondary: '#3e4a3c', textMuted: '#6f7d6c', textDim: '#9aa697' },
  },
  {
    id: 'amethyst', name: 'Royal Amethyst',
    dark:  { accent: '#c4a2fb', bg: '#100d17', card: '#191423', card2: '#211a2d', border: '#2e253d', textPrimary: '#ece6f5', textSecondary: '#c3b8d6', textMuted: '#84789a', textDim: '#5d5372' },
    light: { accent: '#6b3fc4', bg: '#fdfcfe', card: '#ffffff', card2: '#f5f2fa', border: '#e4dcf0', textPrimary: '#150e20', textSecondary: '#453a57', textMuted: '#75698a', textDim: '#a397b5' },
  },
  {
    id: 'mono', name: 'Monochrome',
    dark:  { accent: '#e6e6e6', bg: '#0e0e0e', card: '#171717', card2: '#1f1f1f', border: '#2b2b2b', textPrimary: '#ededed', textSecondary: '#bfbfbf', textMuted: '#808080', textDim: '#585858' },
    light: { accent: '#1c1c1c', bg: '#fdfdfd', card: '#ffffff', card2: '#f4f4f4', border: '#e2e2e2', textPrimary: '#0d0d0d', textSecondary: '#424242', textMuted: '#767676', textDim: '#a3a3a3' },
  },
  {
    id: 'amoled', name: 'AMOLED Polarity',
    dark:  { accent: '#ffffff', bg: '#000000', card: '#0b0b0b', card2: '#141414', border: '#242424', textPrimary: '#ffffff', textSecondary: '#c4c4c4', textMuted: '#8a8a8a', textDim: '#5a5a5a' },
    light: { accent: '#000000', bg: '#ffffff', card: '#ffffff', card2: '#f5f5f5', border: '#e0e0e0', textPrimary: '#000000', textSecondary: '#3b3b3b', textMuted: '#707070', textDim: '#a0a0a0' },
  },
  {
    id: 'neon', name: 'Neon Pulse',
    dark:  { accent: '#4df0c0', bg: '#080f0e', card: '#0f1918', card2: '#152220', border: '#1f302d', textPrimary: '#e2f5f1', textSecondary: '#adc9c3', textMuted: '#6d8a84', textDim: '#4a635e' },
    light: { accent: '#00806a', bg: '#fdfefe', card: '#ffffff', card2: '#f0f7f6', border: '#d9e8e5', textPrimary: '#08201c', textSecondary: '#374b47', textMuted: '#6b807c', textDim: '#9aaba7' },
  },
  {
    id: 'sakura', name: 'Sakura Petal',
    dark:  { accent: '#f9a8b8', bg: '#150e11', card: '#1f1519', card2: '#281c21', border: '#372630', textPrimary: '#f5e6ea', textSecondary: '#d4bcc4', textMuted: '#987b85', textDim: '#6b545d' },
    light: { accent: '#a63248', bg: '#fefcfc', card: '#ffffff', card2: '#faf1f2', border: '#eddde0', textPrimary: '#1e1013', textSecondary: '#4f3b40', textMuted: '#846a70', textDim: '#b099a0' },
  },
  {
    id: 'dune', name: 'Desert Dune',
    dark:  { accent: '#c9a98f', bg: '#12100d', card: '#1c1814', card2: '#241f1a', border: '#332c24', textPrimary: '#efe7dd', textSecondary: '#cabdad', textMuted: '#8d8073', textDim: '#635a50' },
    light: { accent: '#7d5c45', bg: '#fdfcfa', card: '#ffffff', card2: '#f7f3ed', border: '#e8dfd3', textPrimary: '#1a1511', textSecondary: '#4c4239', textMuted: '#82766a', textDim: '#aca093' },
  },
  {
    id: 'arctic', name: 'Arctic Blue',
    dark:  { accent: '#5ec8f5', bg: '#0a1014', card: '#111a20', card2: '#172128', border: '#223038', textPrimary: '#e2eff5', textSecondary: '#b0c6d1', textMuted: '#6f8794', textDim: '#4d616c' },
    light: { accent: '#0369a1', bg: '#fdfefe', card: '#ffffff', card2: '#f1f7fa', border: '#dae7ee', textPrimary: '#0a1720', textSecondary: '#374a57', textMuted: '#6b8090', textDim: '#9aadba' },
  },
]

/* Status colours are palette-independent — an error is red in every theme */
const STATUS = {
  dark: {
    danger: '#f87171',  dangerDim: '#2a0a0a',  dangerBorder: '#7a1010',
    success: '#10b981', successDim: '#0a1e14', successBorder: '#14512f',
    warn: '#f5b545',    warnDim: '#1e1a00',    warnBorder: '#4a3d00',
    purple: '#a78bfa',  purpleDim: '#16112e',  purpleBorder: '#2a1a5c',
    blue: '#60a5fa',    blueDim: '#0c1a2e',    blueBorder: '#1a3a5c',
  },
  light: {
    danger: '#dc2626',  dangerDim: '#fef2f2',  dangerBorder: '#fbd5d5',
    success: '#15803d', successDim: '#f0fdf4', successBorder: '#bbf7d0',
    warn: '#b45309',    warnDim: '#fffbeb',    warnBorder: '#fde68a',
    purple: '#6d28d9',  purpleDim: '#f5f3ff',  purpleBorder: '#ddd6fe',
    blue: '#1d4ed8',    blueDim: '#eff6ff',    blueBorder: '#bfdbfe',
  },
}

export function buildTheme(paletteId, mode) {
  const palette = PALETTES.find(p => p.id === paletteId) || PALETTES[0]
  const s = palette[mode]
  const isDark = mode === 'dark'

  return {
    mode,
    paletteId: palette.id,
    paletteName: palette.name,

    accent:       s.accent,
    accentDim:    mix(s.accent, s.bg, isDark ? 0.88 : 0.90),
    accentBorder: mix(s.accent, s.bg, isDark ? 0.55 : 0.62),
    accentText:   isDark ? mix(s.accent, '#ffffff', 0.18) : mix(s.accent, '#000000', 0.12),
    /* text that sits ON the accent (buttons) — max-contrast, not a guess */
    onAccent:     readableOn(s.accent),

    bg: s.bg, bgCard: s.card, bgCard2: s.card2, bgInput: isDark ? s.bg : s.card,
    border: s.border, borderHover: mix(s.border, s.textMuted, 0.45),

    textPrimary: s.textPrimary, textSecondary: s.textSecondary,
    textMuted: s.textMuted, textDim: s.textDim,

    event: s.accent,
    eventDim: mix(s.accent, s.bg, isDark ? 0.88 : 0.90),
    eventBorder: mix(s.accent, s.bg, isDark ? 0.55 : 0.62),
    amber: mix(s.accent, '#ba6a36', 0.5),
    champagne: mix(s.accent, isDark ? '#ffffff' : '#000000', 0.3),

    ...STATUS[mode],

    navBg:   isDark ? mix(s.card, s.bg, 0.2) + 'd9' : mix(s.card, '#ffffff', 0.3) + 'ec',
    overlay: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(20,18,16,0.32)',
    shadow:  isDark
      ? '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)'
      : '0 8px 28px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)',
  }
}

/* ──────────────────────────────────────────────────────────────── */

const ThemeContext = createContext(null)
export function useTheme() { return useContext(ThemeContext) }

function injectTheme(t) {
  let el = document.getElementById('lifeos-theme')
  if (!el) { el = document.createElement('style'); el.id = 'lifeos-theme'; document.head.appendChild(el) }

  el.textContent = `
    :root {
      --accent: ${t.accent}; --accent-dim: ${t.accentDim}; --accent-border: ${t.accentBorder};
      --accent-text: ${t.accentText}; --on-accent: ${t.onAccent};
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
    .btn-primary { color: ${t.onAccent}; }
  `

  document.body.setAttribute('data-theme', t.mode)
  document.documentElement.setAttribute('data-theme', t.mode)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', t.bg)
}

function read(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v } catch { return fallback }
}

export function ThemeProvider({ children }) {
  const [paletteId, setPaletteIdState] = useState(() => read('lifeos_palette', 'cognac'))
  const [manualMode, setManualModeState] = useState(() => read('lifeos_mode', 'dark'))
  const [useSystem, setUseSystemState] = useState(() => read('lifeos_use_system', 'false') === 'true')
  const [systemMode, setSystemMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark')

  // follow the OS when asked to
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (e) => setSystemMode(e.matches ? 'light' : 'dark')
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler)
    return () => { mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler) }
  }, [])

  const mode = useSystem ? systemMode : manualMode
  const theme = useMemo(() => buildTheme(paletteId, mode), [paletteId, mode])

  useEffect(() => { injectTheme(theme) }, [theme])

  const setPalette = (id) => { setPaletteIdState(id); try { localStorage.setItem('lifeos_palette', id) } catch {} }
  const setMode = (m) => { setManualModeState(m); try { localStorage.setItem('lifeos_mode', m) } catch {} }
  const setUseSystem = (v) => { setUseSystemState(v); try { localStorage.setItem('lifeos_use_system', String(v)) } catch {} }
  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{
      theme, mode, toggleMode, setMode,
      paletteId, setPalette, palettes: PALETTES,
      useSystem, setUseSystem,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}
