import React, { useState, useEffect, useRef } from 'react'
import { ThemeProvider, useTheme } from './ThemeContext.jsx'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Week from './pages/Week'
import Tasks from './pages/Tasks'
import Sectors from './pages/Sectors'
import Projects from './pages/Projects'
import Notes from './pages/Notes'
import Habits from './pages/Habits'
import Finance from './pages/Finance'
import Settings from './pages/Settings'
import Goals from './pages/Goals'
import Grocery from './pages/Grocery'
import FocusTimer from './pages/FocusTimer'
import Journal from './pages/Journal'
import TaskModal from './components/TaskModal'
import EventModal from './components/EventModal'

// Bottom nav — 5 items, no More
const NAV = [
  { path: '/',        label: 'Home',    icon: HomeIcon },
  { path: '/week',    label: 'Week',    icon: WeekIcon },
  { path: '/tasks',   label: 'Tasks',   icon: TasksIcon },
  { path: '/sectors', label: 'Sectors', icon: SectorsIcon },
  { path: '/habits',  label: 'Habits',  icon: HabitsIcon },
]

// Drawer menu sections
const DRAWER_ITEMS = [
  {
    section: 'Tools',
    items: [
      { path: '/projects',   label: 'Projects',    icon: '📋', desc: 'Track active projects' },
      { path: '/notes',      label: 'Notes',       icon: '📝', desc: 'Quick capture & notes' },
      { path: '/goals',      label: 'Goals',       icon: '🎯', desc: 'Long-term goals' },
      { path: '/focus',      label: 'Focus Timer', icon: '⏱️', desc: 'Deep work sessions' },
      { path: '/journal',    label: 'Journal',     icon: '📓', desc: 'Daily entries & reflection' },
    ]
  },
  {
    section: 'Life',
    items: [
      { path: '/finance',    label: 'Finance',     icon: '💰', desc: 'Income, subs & bills' },
      { path: '/grocery',    label: 'Grocery',     icon: '🛒', desc: 'Shopping list' },
    ]
  },
  {
    section: 'Account',
    items: [
      { path: '/settings',   label: 'Settings',    icon: '⚙️', desc: 'Theme & preferences' },
    ]
  },
]

const DRAWER_PATHS = DRAWER_ITEMS.flatMap(s => s.items.map(i => i.path))

// ── Side Drawer ───────────────────────────────────────────────────────────────
function Drawer({ open, onClose, navigate, location }) {
  const drawerRef = useRef(null)
  const startX = useRef(null)

  // Close on backdrop tap
  // Swipe left to close
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (dx < -50) onClose()
    startX.current = null
  }

  if (!open) return null

  const go = (path) => { navigate(path); onClose() }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />

      {/* Drawer panel */}
      <div ref={drawerRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="drawer-panel"
        style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, background: 'var(--bg)', borderRight: '1px solid #1e1e24', zIndex: 201, display: 'flex', flexDirection: 'column', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Drawer header */}
        <div style={{ padding: '56px 20px 20px', borderBottom: '1px solid #1a1a20' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>LifeOS</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your personal operating system</div>
            </div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</div>
          </div>
        </div>

        {/* Nav sections */}
        <div style={{ flex: 1, padding: '12px 0' }}>
          {DRAWER_ITEMS.map(({ section, items }) => (
            <div key={section} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 20px 6px' }}>{section}</div>
              {items.map(({ path, label, icon, desc }) => {
                const isActive = location.pathname === path
                return (
                  <div key={path} onClick={() => go(path)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', cursor: 'pointer', background: isActive ? 'var(--accent-dim)' : 'transparent', borderRight: isActive ? '3px solid var(--accent)' : '3px solid transparent', transition: 'background 0.1s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: isActive ? 'var(--accent-dim)' : 'var(--bg-card)', border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: isActive ? 'var(--accent)' : '#d4d2cc' }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{desc}</div>
                    </div>
                    {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Bottom branding */}
        <div style={{ padding: '16px 20px 32px', borderTop: '1px solid #1a1a20' }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Beyond Horizons · Brad Myers</div>
        </div>
      </div>
    </>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────
function Shell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mode } = useTheme()
  const [taskModal, setTaskModal] = useState(null)
  const [eventModal, setEventModal] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (taskModal || drawerOpen) document.documentElement.style.overflow = 'hidden'
    else document.documentElement.style.overflow = ''
    return () => { document.documentElement.style.overflow = '' }
  }, [taskModal, drawerOpen])

  // Sync body class with theme mode for CSS overrides
  useEffect(() => {
    document.body.classList.toggle('light-mode', mode === 'light')
    document.body.classList.toggle('dark-mode', mode === 'dark')
  }, [mode])

  const openAdd = (mode, ctx = {}) => setTaskModal({ mode, task: null, ...ctx })
  const openAddEvent = () => setEventModal({ event: null, date: new Date().toISOString().split('T')[0] })
  const openEdit = (task) => setTaskModal({ mode: 'scheduled', task })
  const closeModal = () => setTaskModal(null)
  const onSaved = () => { setRefreshKey(k => k + 1); closeModal() }

  const isDrawerPath = DRAWER_PATHS.includes(location.pathname)
  const activeNav = isDrawerPath ? null : location.pathname

  return (
    <div className="app-shell">
      {/* Hamburger button — always visible top-left */}
      <div onClick={() => setDrawerOpen(true)} className="hamburger-btn"
        style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 44px) + 10px)', left: 16, zIndex: 100, width: 40, height: 40, borderRadius: 14, background: 'rgba(22,22,20,0.82)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
        <div style={{ width: 15, height: 1.5, background: 'var(--text-muted)', borderRadius: 2 }} />
        <div style={{ width: 15, height: 1.5, background: 'var(--text-muted)', borderRadius: 2 }} />
        <div style={{ width: 10, height: 1.5, background: 'var(--text-muted)', borderRadius: 2 }} />
      </div>

      {/* Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} navigate={navigate} location={location} />

      {/* Page content */}
      <div className="page-scroll">
        <Routes>
          <Route path="/"            element={<Home key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} onAddEvent={openAddEvent} />} />
          <Route path="/week"        element={<Week key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/tasks"       element={<Tasks key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/sectors"     element={<Sectors key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/projects"    element={<Projects key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/notes"       element={<Notes key={refreshKey} />} />
          <Route path="/habits"      element={<Habits key={refreshKey} />} />
} />
          <Route path="/finance"     element={<Finance key={refreshKey} />} />
          <Route path="/goals"       element={<Goals key={refreshKey} />} />
          <Route path="/grocery"     element={<Grocery key={refreshKey} />} />
          <Route path="/focus"       element={<FocusTimer key={refreshKey} />} />
          <Route path="/journal"     element={<Journal key={refreshKey} />} />
          <Route path="/settings"    element={<Settings />} />
        </Routes>
      </div>

      {/* Bottom nav — 5 tabs, no More */}
      <nav className="bottom-nav">
        {NAV.map(({ path, label, icon: Icon }) => (
          <div key={path} className={`nav-item${activeNav === path ? ' active' : ''}`} onClick={() => navigate(path)}>
            <Icon active={activeNav === path} />
            <span>{label}</span>
          </div>
        ))}
      </nav>

      {taskModal && <TaskModal mode={taskModal.mode} task={taskModal.task} defaultProjectId={taskModal.defaultProjectId} defaultSector={taskModal.defaultSector} onClose={closeModal} onSaved={onSaved} />}
      {eventModal && <EventModal event={eventModal.event} date={eventModal.date} onClose={() => setEventModal(null)} onSaved={() => { setRefreshKey(k=>k+1); setEventModal(null) }} />}
    </div>
  )
}

export default function App() {
  return <ThemeProvider><BrowserRouter><Shell /></BrowserRouter></ThemeProvider>
}

function HomeIcon({ active }) {
  const c = active ? 'var(--accent)' : '#666'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill={c}/><rect x="11" y="2" width="7" height="7" rx="2" fill={c} opacity="0.5"/><rect x="2" y="11" width="7" height="7" rx="2" fill={c} opacity="0.5"/><rect x="11" y="11" width="7" height="7" rx="2" fill={c} opacity="0.5"/></svg>
}
function WeekIcon({ active }) {
  const c = active ? 'var(--accent)' : '#666'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="2" stroke={c} strokeWidth="1.5"/><line x1="2" y1="8" x2="18" y2="8" stroke={c} strokeWidth="1.5"/><line x1="7" y1="2" x2="7" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><line x1="13" y1="2" x2="13" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function TasksIcon({ active }) {
  const c = active ? 'var(--accent)' : '#666'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="6" r="1.5" fill={c}/><line x1="8" y1="6" x2="18" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><circle cx="5" cy="10" r="1.5" fill={c} opacity="0.6"/><line x1="8" y1="10" x2="15" y2="10" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/><circle cx="5" cy="14" r="1.5" fill={c} opacity="0.4"/><line x1="8" y1="14" x2="13" y2="14" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></svg>
}
function SectorsIcon({ active }) {
  const c = active ? 'var(--accent)' : '#666'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.7"/><rect x="2" y="11" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.7"/><rect x="11" y="11" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.4"/></svg>
}
function HabitsIcon({ active }) {
  const c = active ? 'var(--accent)' : '#666'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.5"/><polyline points="7,10 9,12 13,8" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
