import React, { useState, useEffect, useRef } from 'react'

/**
 * IconPicker — searchable, categorized picker over the /svg/Outline icon set.
 *
 * Icons live in the app's public folder as:  /svg/Outline/<Category>/<Name>.svg
 * A manifest at /svg/manifest.json lists them so we don't have to guess filenames.
 * Generate the manifest once (see build note) — it looks like:
 *   { "Brands": ["Apple","Android",...], "General": ["Home","Star",...], ... }
 *
 * value  — the stored icon reference, e.g. "Outline/General/Home" (no extension)
 *          (emoji values still render too, for backward compatibility)
 * onPick(ref) — called with the chosen "Outline/<Cat>/<Name>" string
 */

// Render one theme-coloured SVG icon by its ref. Fetches the file, strips the
// hardcoded fill so it inherits `currentColor` (which we set to the theme).
export function SvgIcon({ iconRef, size = 24, color = 'currentColor' }) {
  const [markup, setMarkup] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    if (!iconRef || typeof iconRef !== 'string' || !iconRef.includes('/')) { setFailed(true); return }
    fetch(`/svg/${iconRef}.svg`)
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(txt => {
        if (!alive) return
        // strip hardcoded fills/strokes so the icon takes the current text colour
        let s = txt
          .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
          .replace(/stroke="(?!none)(?!currentColor)[^"]*"/g, 'stroke="currentColor"')
        // ensure it scales to our box
        s = s.replace(/<svg([^>]*)width="[^"]*"/, '<svg$1').replace(/<svg([^>]*)height="[^"]*"/, '<svg$1')
        setMarkup(s)
      })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [iconRef])

  if (failed) {
    // fall back to showing an emoji value directly, or a neutral dot
    const isEmoji = iconRef && !iconRef.includes('/')
    return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{isEmoji ? iconRef : '•'}</span>
  }
  if (!markup) return <span style={{ display: 'inline-block', width: size, height: size }} />

  return (
    <span
      style={{ display: 'inline-flex', width: size, height: size, color }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}

export default function IconPicker({ value, onPick, accent = 'var(--accent)' }) {
  const [manifest, setManifest] = useState(null)
  const [cat, setCat] = useState(null)      // active category, null = All
  const [query, setQuery] = useState('')
  const [err, setErr] = useState(false)

  useEffect(() => {
    fetch('/svg/manifest.json')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setManifest)
      .catch(() => setErr(true))
  }, [])

  if (err) {
    return (
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, padding: '12px', border: '1px dashed var(--border)', borderRadius: 12 }}>
        Icon set not found. Make sure <code>/public/svg/manifest.json</code> exists (see setup note).
      </div>
    )
  }
  if (!manifest) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: 13 }}>Loading icons…</div>
  }

  const categories = Object.keys(manifest)

  // build the flat list of {ref, name, cat} filtered by category + query
  const q = query.trim().toLowerCase()
  let items = []
  categories.forEach(cName => {
    if (cat && cat !== cName) return
    manifest[cName].forEach(iconName => {
      if (q && !iconName.toLowerCase().includes(q)) return
      items.push({ ref: `Outline/${cName}/${iconName}`, name: iconName, cat: cName })
    })
  })
  // cap render count for performance; search narrows it
  const CAP = 120
  const shown = items.slice(0, CAP)

  return (
    <div>
      {/* search */}
      <input
        type="text"
        placeholder="Search icons…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />

      {/* category pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 8, marginBottom: 10 }}>
        <Pill label="All" active={!cat} onClick={() => setCat(null)} accent={accent} />
        {categories.map(c => <Pill key={c} label={c} active={cat === c} onClick={() => setCat(c)} accent={accent} />)}
      </div>

      {/* grid */}
      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)', fontSize: 13 }}>No icons match “{query}”.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, maxHeight: 260, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {shown.map(it => {
            const selected = value === it.ref
            return (
              <div key={it.ref} onClick={() => onPick(it.ref)} title={it.name}
                style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, cursor: 'pointer',
                  background: selected ? 'var(--accent-dim)' : 'var(--bg-card)',
                  border: `1px solid ${selected ? 'var(--accent-border)' : 'var(--border)'}`,
                  color: selected ? accent : 'var(--text-secondary)' }}>
                <SvgIcon iconRef={it.ref} size={22} />
              </div>
            )
          })}
        </div>
      )}
      {items.length > CAP && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
          Showing {CAP} of {items.length} — search to narrow down.
        </div>
      )}
    </div>
  )
}

function Pill({ label, active, onClick, accent }) {
  return (
    <div onClick={onClick}
      style={{ flexShrink: 0, padding: '6px 13px', borderRadius: 16, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
        background: active ? 'var(--accent-dim)' : 'transparent',
        border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
        color: active ? accent : 'var(--text-muted)' }}>
      {label}
    </div>
  )
}
