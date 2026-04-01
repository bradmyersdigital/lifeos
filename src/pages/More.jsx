import React from 'react'
import { useNavigate } from 'react-router-dom'

const MENU_ITEMS = [
  { label: 'Projects', icon: '📋', desc: 'Track goals and multi-step work', path: '/projects', color: '#d4520f' },
  { label: 'Notes', icon: '📝', desc: 'Quick capture and category notes', path: '/notes', color: '#a78bfa' },
  { label: 'Real Estate', icon: '🏠', desc: 'Deals, properties, pipeline', path: '/realestate', color: '#3b82f6' },
]

export default function More() {
  const navigate = useNavigate()

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 6 }}>More</div>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>All your other spaces in one place</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MENU_ITEMS.map(item => (
          <div key={item.label} onClick={() => navigate(item.path)} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'border-color 0.15s' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: item.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#e8e6e1', marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{item.desc}</div>
            </div>
            <div style={{ color: '#444', fontSize: 20 }}>›</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: '16px 20px', background: '#161618', border: '1px dashed #2a2a30', borderRadius: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#444', marginBottom: 6 }}>More sections coming soon</div>
        <div style={{ fontSize: 12, color: '#333' }}>Finance · Contacts · Goals · Journal</div>
      </div>
    </div>
  )
}
