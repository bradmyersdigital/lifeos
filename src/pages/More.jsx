import React from 'react'
import { useNavigate } from 'react-router-dom'

const ITEMS = [
  { label: 'Projects', icon: '📋', desc: 'Track active projects', path: '/projects', color: '#d4520f' },
  { label: 'Notes', icon: '📝', desc: 'Quick capture & notes', path: '/notes', color: '#a78bfa' },
  { label: 'Finance', icon: '💰', desc: 'Income, bills, savings', path: '/finance', color: '#10b981' },
  { label: 'Goals', icon: '🎯', desc: 'Short and long-term goals', path: '/goals', color: '#f59e0b' },
  { label: 'Grocery List', icon: '🛒', desc: 'Shopping list by category', path: '/grocery', color: '#06b6d4' },
  { label: 'Focus Timer', icon: '⏱️', desc: 'Pomodoro & focus sessions', path: '/focus', color: '#8b5cf6' },
  { label: 'Settings', icon: '⚙️', desc: 'Colors, themes, preferences', path: '/settings', color: '#888888' },
]

export default function More() {
  const navigate = useNavigate()
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 20 }}>More</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ITEMS.map(item => (
          <div key={item.label} onClick={() => navigate(item.path)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#161618', border: '1px solid #242428', borderRadius: 14, cursor: 'pointer' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: item.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{item.desc}</div>
            </div>
            <div style={{ fontSize: 18, color: '#333' }}>›</div>
          </div>
        ))}
      </div>
    </div>
  )
}
