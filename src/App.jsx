import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Week from './pages/Week'
import Tasks from './pages/Tasks'
import Sectors from './pages/Sectors'
import Projects from './pages/Projects'
import Notes from './pages/Notes'
import Habits from './pages/Habits'
import More from './pages/More'
import TaskModal from './components/TaskModal'

const NAV = [
  { path: '/',         label: 'Home',    icon: HomeIcon },
  { path: '/week',     label: 'Week',    icon: WeekIcon },
  { path: '/tasks',    label: 'Tasks',   icon: TasksIcon },
  { path: '/sectors',  label: 'Sectors', icon: SectorsIcon },
  { path: '/habits',   label: 'Habits',  icon: HabitsIcon },
  { path: '/more',     label: 'More',    icon: MoreIcon },
]

function Shell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [taskModal, setTaskModal] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (taskModal) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [taskModal])

  const openAdd = (mode) => setTaskModal({ mode, task: null })
  const openEdit = (task) => setTaskModal({ mode: 'scheduled', task })
  const closeModal = () => setTaskModal(null)
  const onSaved = () => { setRefreshKey(k => k + 1); closeModal() }

  const isMore = ['/projects','/notes','/realestate'].includes(location.pathname)
  const activeNav = isMore ? '/more' : location.pathname

  return (
    <div className="app-shell">
      <div className="page-scroll">
        <Routes>
          <Route path="/"            element={<Home key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/week"        element={<Week key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/tasks"       element={<Tasks key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/sectors"     element={<Sectors key={refreshKey} onAddTask={openAdd} onEditTask={openEdit} />} />
          <Route path="/projects"    element={<Projects key={refreshKey} />} />
          <Route path="/notes"       element={<Notes key={refreshKey} />} />
          <Route path="/habits"      element={<Habits key={refreshKey} />} />
          <Route path="/more"        element={<More />} />
          <Route path="/realestate"  element={<More />} />
        </Routes>
      </div>

      <nav className="bottom-nav">
        {NAV.map(({ path, label, icon: Icon }) => (
          <div key={path} className={`nav-item${activeNav === path ? ' active' : ''}`} onClick={() => navigate(path)}>
            <Icon active={activeNav === path} />
            <span>{label}</span>
          </div>
        ))}
      </nav>

      {taskModal && (
        <TaskModal mode={taskModal.mode} task={taskModal.task} onClose={closeModal} onSaved={onSaved} />
      )}
    </div>
  )
}

export default function App() {
  return <BrowserRouter><Shell /></BrowserRouter>
}

function HomeIcon({ active }) {
  const c = active ? '#d4520f' : '#666'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill={c}/><rect x="11" y="2" width="7" height="7" rx="2" fill={c} opacity="0.5"/><rect x="2" y="11" width="7" height="7" rx="2" fill={c} opacity="0.5"/><rect x="11" y="11" width="7" height="7" rx="2" fill={c} opacity="0.5"/></svg>
}
function WeekIcon({ active }) {
  const c = active ? '#d4520f' : '#666'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="2" stroke={c} strokeWidth="1.5"/><line x1="2" y1="8" x2="18" y2="8" stroke={c} strokeWidth="1.5"/><line x1="7" y1="2" x2="7" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><line x1="13" y1="2" x2="13" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function TasksIcon({ active }) {
  const c = active ? '#d4520f' : '#666'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="6" r="1.5" fill={c}/><line x1="8" y1="6" x2="18" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><circle cx="5" cy="10" r="1.5" fill={c} opacity="0.6"/><line x1="8" y1="10" x2="15" y2="10" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/><circle cx="5" cy="14" r="1.5" fill={c} opacity="0.4"/><line x1="8" y1="14" x2="13" y2="14" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></svg>
}
function SectorsIcon({ active }) {
  const c = active ? '#d4520f' : '#666'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.7"/><rect x="2" y="11" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.7"/><rect x="11" y="11" width="7" height="7" rx="2" stroke={c} strokeWidth="1.5" opacity="0.4"/></svg>
}
function HabitsIcon({ active }) {
  const c = active ? '#d4520f' : '#666'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.5"/><polyline points="7,10 9,12 13,8" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function MoreIcon({ active }) {
  const c = active ? '#d4520f' : '#666'
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="10" r="1.5" fill={c}/><circle cx="10" cy="10" r="1.5" fill={c}/><circle cx="15" cy="10" r="1.5" fill={c}/></svg>
}
