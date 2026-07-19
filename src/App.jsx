import React, { useState, useEffect, useRef } from 'react'
import { ThemeProvider } from './ThemeContext.jsx'
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
import SortableList from './components/SortableList'

/* ── Destination registry — one source of truth for nav + drawer ────────── */

const HOME = { path: '/', label: 'Home', emoji: '🏠', desc: 'Your daily command center', Icon: HomeIcon }

const DESTINATIONS = [
  { path: '/projects', label: 'Projects',    emoji: '📋', desc: 'Track active projects' },
  { path: '/notes',    label: 'Notes',       emoji: '📝', desc: 'Quick capture & notes' },
  { path: '/journal',  label: 'Journal',     emoji: '📓', desc: 'Daily entries & reflection' },
  { path: '/goals',    label: 'Goals',       emoji: '🎯', desc: 'Long-term goals' },
  { path: '/focus',    label: 'Focus Timer', emoji: '⏱️', desc: 'Deep work sessions' },
  { path: '/week',     label: 'Week',        emoji: '🗓️', desc: 'Week & month calendar', Icon: WeekIcon },
  { path: '/tasks',    label: 'Tasks',       emoji: '✅', desc: 'Everything on your plate', Icon: TasksIcon },
  { path: '/sectors',  label: 'Sectors',     emoji: '🗂️', desc: 'Life areas', Icon: SectorsIcon },
  { path: '/habits',   label: 'Habits',      emoji: '🔁', desc: 'Streaks & routines', Icon: HabitsIcon },
  { path: '/finance',  label: 'Finance',     emoji: '💰', desc: 'Income, subs & bills' },
  { path: '/grocery',  label: 'Grocery',     emoji: '🛒', desc: 'Shopping list' },
  { path: '/settings', label: 'Settings',    emoji: '⚙️', desc: 'Theme & preferences' },
]

const byPath = (p) => DESTINATIONS.find(d => d.path === p)

const DEFAULT_NAV = ['/week', '/tasks', '/sectors', '/habits']  // slots 2–5; Home is always slot 1
const DEFAULT_ORDER = DESTINATIONS.map(d => d.path)
const NAV_SLOTS = 4

/* Reads a stored path list, drops anything unknown, appends anything new.
   Without this, adding or removing a page later would corrupt saved prefs. */
function usePersistedPaths(key, fallback, { fill = false } = {}) {
  const [value, setValue] = useState(() => {
    let stored = null
    try { stored = JSON.parse(localStorage.getItem(key)) } catch {}
    if (!Array.isArray(stored)) return fallback
    const valid = stored.filter(p => byPath(p))
    return fill ? [...valid, ...DEFAULT_ORDER.filter(p => !valid.includes(p))] : valid
  })
  const save = (next) => {
    setValue(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
  }
  return [value, save]
}

/* ── Drawer ─────────────────────────────────────────────────────────────── */

function Drawer({ open, onClose, navigate, location, order, setOrder, nav, setNav }) {
  const [notice, setNotice] = useState('')
  const draggedRef = useRef(false)

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 2200)
    return () => clearTimeout(t)
  }, [notice])

  if (!open) return null

  const go = (path) => {
    if (draggedRef.current) return   // ignore the click that follows a drag
    navigate(path); onClose()
  }

  const togglePin = (path) => {
    if (nav.includes(path)) setNav(nav.filter(p => p !== path))
    else if (nav.length >= NAV_SLOTS) setNotice('Tab bar is full — unpin one first')
    else setNav([...nav, path])
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 200, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />

      <div className="drawer-panel"
        style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 288, background: 'var(--bg)', borderRight: '1px solid var(--border)', zIndex: 201, display: 'flex', flexDirection: 'column', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Header */}
        <div style={{ padding: '56px 20px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>LifeOS</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your personal operating system</div>
            </div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</div>
          </div>
        </div>

        {/* Home — always present, always first in the tab bar */}
        <div onClick={() => go(HOME.path)}
          style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px', cursor: 'pointer', background: location.pathname === '/' ? 'var(--accent-dim)' : 'transparent', borderLeft: `3px solid ${location.pathname === '/' ? 'var(--accent)' : 'transparent'}` }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{HOME.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 500, color: location.pathname === '/' ? 'var(--accent)' : 'var(--text-primary)' }}>{HOME.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{HOME.desc}</div>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 5px', flexShrink: 0 }}>PINNED</div>
        </div>

        {/* Reorderable list */}
        <div style={{ padding: '14px 20px 6px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Menu</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.45 }}>
            Hold to reorder · tap ☆ to pin to the tab bar ({nav.length}/{NAV_SLOTS})
          </div>
          {notice && <div style={{ fontSize: 10.5, color: 'var(--warn)', marginTop: 5 }}>{notice}</div>}
        </div>

        <div style={{ flex: 1, padding: '0 0 12px' }}>
          <SortableList
            items={order.map(p => ({ id: p, ...byPath(p) })).filter(d => d.path)}
            gap={2}
            onReorder={(next) => {
              draggedRef.current = true
              setTimeout(() => { draggedRef.current = false }, 260)
              setOrder(next.map(d => d.path))
            }}
            renderItem={(d, { dragging }) => {
              const isActive = location.pathname === d.path
              const pinned = nav.includes(d.path)
              return (
                <div onClick={() => go(d.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 13,
                    padding: '11px 20px',
                    background: dragging ? 'var(--bg-card2)' : isActive ? 'var(--accent-dim)' : 'transparent',
                    borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    borderRadius: dragging ? 14 : 0,
                  }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: isActive ? 'var(--accent-dim)' : 'var(--bg-card)', border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{d.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 500, color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>{d.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.desc}</div>
                  </div>
                  <div onClick={e => { e.stopPropagation(); togglePin(d.path) }}
                    style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 15, color: pinned ? 'var(--accent)' : 'var(--text-dim)', background: pinned ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${pinned ? 'var(--accent-border)' : 'transparent'}` }}>
                    {pinned ? '★' : '☆'}
                  </div>
                </div>
              )
            }}
          />
        </div>

        <div style={{ padding: '14px 20px 32px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Beyond Horizons · Brad Myers</div>
        </div>
      </div>
    </>
  )
}

/* ── Shell ──────────────────────────────────────────────────────────────── */

function Shell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [taskModal, setTaskModal] = useState(null)
  const [eventModal, setEventModal] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [navPaths, setNavPaths] = usePersistedPaths('lifeos_nav', DEFAULT_NAV)
  const [order, setOrder] = usePersistedPaths('lifeos_menu_order', DEFAULT_ORDER, { fill: true })

  useEffect(() => {
    if (taskModal || drawerOpen) document.documentElement.style.overflow = 'hidden'
    else document.documentElement.style.overflow = ''
    return () => { document.documentElement.style.overflow = '' }
  }, [taskModal, drawerOpen])

  const openAdd = (mode, ctx = {}) => setTaskModal({ mode, task: null, ...ctx })
  const openAddEvent = () => setEventModal({ event: null, date: new Date().toISOString().split('T')[0] })
  const openEdit = (task) => setTaskModal({ mode: 'scheduled', task })
  const closeModal = () => setTaskModal(null)
  const onSaved = () => { setRefreshKey(k => k + 1); closeModal() }

  const navItems = [HOME, ...navPaths.map(byPath).filter(Boolean).slice(0, NAV_SLOTS)]
  const activeNav = navItems.some(n => n.path === location.pathname) ? location.pathname : null

  return (
    <div className="app-shell">
      <div onClick={() => setDrawerOpen(true)} className="hamburger-btn"
        style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 44px) + 10px)', left: 16, zIndex: 100, width: 40, height: 40, borderRadius: 14, background: 'var(--nav-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', boxShadow: 'var(--shadow-float)' }}>
        <div style={{ width: 15, height: 1.5, background: 'var(--text-muted)', borderRadius: 2 }} />
        <div style={{ width: 15, height: 1.5, background: 'var(--text-muted)', borderRadius: 2 }} />
        <div style={{ width: 10, height: 1.5, background: 'var(--text-muted)', borderRadius: 2 }} />
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        navigate={navigate} location={location}
        order={order} setOrder={setOrder}
        nav={navPaths} setNav={setNavPaths} />

      <div className="page-scroll">
        <Routes>
          <Route path="/"         element={<Home key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} onAddEvent={openAddEvent} />} />
          <Route path="/week"     element={<Week key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/tasks"    element={<Tasks key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/sectors"  element={<Sectors key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/projects" element={<Projects key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/notes"    element={<Notes key={refreshKey} />} />
          <Route path="/habits"   element={<Habits key={refreshKey} />} />
          <Route path="/finance"  element={<Finance key={refreshKey} />} />
          <Route path="/goals"    element={<Goals key={refreshKey} />} />
          <Route path="/grocery"  element={<Grocery key={refreshKey} />} />
          <Route path="/focus"    element={<FocusTimer key={refreshKey} />} />
          <Route path="/journal"  element={<Journal key={refreshKey} />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>

      <nav className="bottom-nav">
        {navItems.map(({ path, label, emoji, Icon }) => {
          const active = activeNav === path
          return (
            <div key={path} className={`nav-item${active ? ' active' : ''}`} onClick={() => navigate(path)}>
              {Icon
                ? <Icon active={active} />
                : <span style={{ fontSize: 17, lineHeight: '20px', filter: active ? 'none' : 'grayscale(0.7)' }}>{emoji}</span>}
              <span>{label}</span>
            </div>
          )
        })}
      </nav>

      {taskModal && <TaskModal mode={taskModal.mode} task={taskModal.task} defaultProjectId={taskModal.defaultProjectId} defaultSector={taskModal.defaultSector} onClose={closeModal} onSaved={onSaved} />}
      {eventModal && <EventModal event={eventModal.event} date={eventModal.date} onClose={() => setEventModal(null)} onSaved={() => { setRefreshKey(k=>k+1); setEventModal(null) }} />}
    </div>
  )
}

export default function App() {
  return <ThemeProvider><BrowserRouter><Shell /></BrowserRouter></ThemeProvider>
}

/* ── Nav icons ──────────────────────────────────────────────────────────── */

function HomeIcon({ active }) {
  const c = active ? 'var(--accent)' : 'var(--text-muted)'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill={c}/><rect x="11" y="2" width="7" height="7" rx="2" fill={c} opacity="0.5"/><rect x="2" y="11" width="7" height="7" rx="2" fill={c} opacity="0.5"/><rect x="11" y="11" width="7" height="7" rx="2" fill={c} opacity="0.5"/></svg>
}
function WeekIcon({ active }) {
  const c = active ? 'var(--accent)' : 'var(--text-muted)'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="2" stroke={c} strokeWidth="1.5"/><line x1="2" y1="8" x2="18" y2="8" stroke={c} strokeWidth="1.5"/><line x1="7" y1="2" x2="7" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><line x1="13" y1="2" x2="13" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function TasksIcon({ active }) {
  const c = active ? 'var(--accent)' : 'var(--text-muted)'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="6" r="1.5" fill={c}/><line x1="8" y1="6" x2="18" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><circle cx="5" cy="10" r="1.5" fill={c} opacity="0.6"/><line x1="8" y1="10" x2="15" y2="10" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/><circle cx="5" cy="14" r="1.5" fill={c} opacity="0.4"/><line x1="8" y1="14" x2="13" y2="14" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></svg>
}
function SectorsIcon({ active }) {
  const c = active ? 'var(--accent)' : 'var(--text-muted)'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.7"/><rect x="2" y="11" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.7"/><rect x="11" y="11" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.4"/></svg>
}
function HabitsIcon({ active }) {
  const c = active ? 'var(--accent)' : 'var(--text-muted)'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.5"/><polyline points="7,10 9,12 13,8" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
