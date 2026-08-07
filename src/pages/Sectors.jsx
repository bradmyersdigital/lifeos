import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SortableList from '../components/SortableList'
import { SectorGlyph, ICON_REGISTRY } from '../components/Icons'
import { todayLocal } from '../utils'
import IconPicker from '../components/IconPicker'
import { fmtDate } from '../utils'
import TaskModal from '../components/TaskModal'
import { ProjectDetail } from './Projects'
import { firstPageSubtitle } from './Notes'

const EMOJI_PICKS = ['💼','🏠','🏃','📚','🎨','❤️','💰','🌱','⚡','🎯','🔥','✨','🎵','🏋️','🧠','💡','🌍','🚀','📝','🎮','🏆','🛠️','📊','🎭','🧘','🍎','☀️','🌙','💎','🦁']
const COLOR_PICKS = ['#d4520f','#3b82f6','#10b981','#f59e0b','#ec4899','#a78bfa','#f87171','#34d399','#60a5fa','#fbbf24','#e879f9','#2dd4bf']
const URG_STYLE = { urgent:{bg:'var(--danger-dim)',color:'var(--danger)'},high:{bg:'var(--accent-dim)',color:'var(--accent)'},medium:{bg:'var(--warn-dim)',color:'var(--warn)'},low:{bg:'var(--success-dim)',color:'var(--success)'} }

function SectorModal({ sector, onClose, onSaved }) {
  const isEdit = !!sector
  const [name, setName] = useState(sector?.name || '')
  const [icon, setIcon] = useState(sector?.icon || '')
  const [color, setColor] = useState(sector?.color || 'var(--accent)')
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    if (!name.trim()) return; setSaving(true)
    if (isEdit) await supabase.from('sectors').update({ name: name.trim(), icon, color }).eq('id', sector.id)
    else await supabase.from('sectors').insert({ name: name.trim(), icon, color, sort_order: 999 })
    setSaving(false); onSaved(); onClose()
  }
  const handleDelete = async () => {
    if (!window.confirm(`Delete "${sector.name}"?`)) return
    await supabase.from('sectors').delete().eq('id', sector.id)
    onSaved(); onClose()
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? `Edit ${sector.name}` : 'New sector'}<div className="modal-close" onClick={onClose}>×</div></div>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          {(() => {
            if (icon && icon.startsWith('icon:')) {
              const Chosen = ICON_REGISTRY[icon.slice(5)]
              if (Chosen) return <div style={{ display: 'inline-flex' }}><Chosen active size={52} /></div>
            }
            return <span style={{ fontSize: 52 }}>{icon || '📁'}</span>
          })()}
        </div>
        <div className="field"><div className="field-label">Name</div><input type="text" placeholder="e.g. Business..." value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field">
          <div className="field-label">Icon</div>
          <IconPicker value={icon} onPick={setIcon} accent={color} />
        </div>
        <div className="field">
          <div className="field-label">Color</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_PICKS.map(c => <div key={c} onClick={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: `3px solid ${color === c ? '#fff' : 'transparent'}`, cursor: 'pointer' }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={handleDelete} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add sector'}</button>
        </div>
      </div>
    </div>
  )
}

function SectorDetail({ sector, onEditTask: onEditTaskRaw, onAddTask, onEditNote, onBack }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // open a task but tell it to return to THIS sector (via ?open=<name>)
  const onEditTask = (task) => navigate(`/task/${task.id}`, { state: { task, from: `/sectors?open=${encodeURIComponent(sector.name)}` } })
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [projects, setProjects] = useState([])
  const [goals, setGoals] = useState([])
  const [tab, setTab] = useState('projects')
  const [taskModal, setTaskModal] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const today = todayLocal()

  // Restore the specific project within this sector (e.g. after backing out of a note opened from it)
  useEffect(() => {
    const openProjectId = searchParams.get('openProject')
    if (openProjectId && projects.length) {
      const match = projects.find(p => String(p.id) === String(openProjectId))
      if (match) setSelectedProject(match)
    }
  }, [searchParams, projects])

  useEffect(() => {
    supabase.from('tasks').select('*, projects(name)').eq('sector', sector.name).order('start_date').order('time_block').then(({ data }) => setTasks(data || []))
    supabase.from('notes').select('*').eq('sector', sector.name).order('updated_at', { ascending: false }).then(({ data }) => setNotes(data || []))
    supabase.from('projects').select('*, tasks(*)').eq('sector', sector.name).order('created_at', { ascending: false }).then(({ data }) => setProjects(data || []))
    supabase.from('goals').select('*').eq('sector', sector.name).order('created_at', { ascending: false }).then(({ data, error }) => setGoals(error ? [] : (data || [])))
  }, [sector.name])

  const toggleTask = async (task) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
  }

  const reload = () => {
    supabase.from('tasks').select('*, projects(name)').eq('sector', sector.name).order('start_date').order('time_block').then(({ data }) => setTasks(data || []))
    supabase.from('projects').select('*, tasks(*)').eq('sector', sector.name).order('created_at', { ascending: false }).then(({ data }) => setProjects(data || []))
  }

  const todayTasks = tasks.filter(t => t.start_date === today && !t.completed)
  const upcomingTasks = tasks.filter(t => t.start_date > today && !t.completed)
  const doneTasks = tasks.filter(t => t.completed)
  const overdueTasks = tasks.filter(t => t.start_date < today && !t.completed)

  const TaskRow = ({ task }) => {
    const urg = URG_STYLE[task.urgency] || URG_STYLE.medium
    const isOverdue = task.start_date < today && !task.completed
    return (
      <div onClick={() => onEditTask(task)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 6, opacity: task.completed ? 0.4 : 1, cursor: 'pointer' }}>
        <div onClick={e => { e.stopPropagation(); toggleTask(task) }} style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${task.completed ? 'var(--accent)' : 'var(--border-hover)'}`, background: task.completed ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {task.completed && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{task.name}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
            {task.time_block && <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--text-dim)' }}>{task.time_block}</span>}
            {task.start_date && <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: isOverdue ? 'var(--danger)' : 'var(--text-dim)' }}>{fmtDate(task.start_date)}</span>}
            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: urg.bg, color: urg.color }}>{task.urgency}</span>
          </div>
        </div>
      </div>
    )
  }

  if (selectedProject) {
    const onEditNoteHere = (opts) => onEditNote({ ...opts, from: `/sectors?open=${encodeURIComponent(sector.name)}&openProject=${selectedProject.id}` })
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
        onEditNote={onEditNoteHere}
        onRefresh={reload}
      />
    )
  }

  return (
    <div>
      {taskModal && (
        <TaskModal mode={taskModal.mode} task={null}
          defaultSector={sector.name}
          onClose={() => setTaskModal(null)}
          onSaved={() => { setTaskModal(null); reload() }}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div onClick={() => onBack()} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>‹</div>
        <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}><SectorGlyph name={sector.name} emoji={sector.icon} size={26} /></div>
        <div><div style={{ fontSize: 20, fontWeight: 500 }}>{sector.name}</div><div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 1 }}>{tasks.length} tasks · {notes.length} notes · {projects.length} projects</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="action-btn" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' }} onClick={() => setTaskModal({ mode: 'today' })}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add Task
        </div>
        <div className="action-btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={async () => {
          const name = window.prompt('Project name?')
          if (!name?.trim()) return
          await supabase.from('projects').insert({ name: name.trim(), sector: sector.name, status: 'active' })
          reload()
          setTab('projects')
        }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="2" width="11" height="11" rx="2" stroke="var(--text-secondary)" strokeWidth="1.4"/><line x1="7.5" y1="5" x2="7.5" y2="10" stroke="var(--text-secondary)" strokeWidth="1.4" strokeLinecap="round"/><line x1="5" y1="7.5" x2="10" y2="7.5" stroke="var(--text-secondary)" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Create Project
        </div>
      </div>

      {(sector.name === 'Finance / Wealth Management' || sector.name === 'Finance') && (
        <div onClick={() => navigate('/finance')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px', marginBottom: 16, borderRadius: 14, cursor: 'pointer', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
          <div style={{ fontSize: 22 }}>💰</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--accent)' }}>Finance dashboard</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>Free to spend, bills, net worth, vehicles</div>
          </div>
          <div style={{ fontSize: 20, color: 'var(--accent)' }}>›</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
        {[['Today', todayTasks.length,'var(--accent)'],['Upcoming',upcomingTasks.length,'var(--purple)'],['Overdue',overdueTasks.length,'var(--danger)'],['Done',doneTasks.length,'var(--success)']].map(([l,v,c]) => (
          <div key={l} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 8px' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: c }}>{v}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
        {['projects','tasks','goals','notes'].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: 14, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--text-primary)' : 'var(--text-dim)' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</div>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: tab === t ? 'var(--accent)' : 'transparent', margin: '4px auto 0' }} />
          </div>
        ))}
      </div>

      {tab === 'tasks' && (
        <div>
          {tasks.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: 13 }}>No tasks yet</div>}
          {overdueTasks.length > 0 && <><div className="section-label" style={{ color: 'var(--danger)' }}>Overdue</div>{overdueTasks.map(t => <TaskRow key={t.id} task={t} />)}</>}
          {todayTasks.length > 0 && <><div className="section-label">Today</div>{todayTasks.map(t => <TaskRow key={t.id} task={t} />)}</>}
          {upcomingTasks.length > 0 && <><div className="section-label">Upcoming</div>{upcomingTasks.map(t => <TaskRow key={t.id} task={t} />)}</>}
          {doneTasks.length > 0 && <><div className="section-label">Completed</div>{doneTasks.map(t => <TaskRow key={t.id} task={t} />)}</>}
        </div>
      )}

      {tab === 'goals' && (
        <div>
          {goals.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: 13 }}>No goals yet</div>}
          {goals.map(g => {
            const overdue = g.due_date && g.due_date < today && g.status === 'active'
            return (
              <div key={g.id} onClick={() => navigate(`/goals?open=${g.id}`)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: g.due_date ? 4 : 0 }}>{g.goal_text}</div>
                {g.due_date && <div style={{ fontSize: 11, fontFamily: "'DM Mono'", color: overdue ? 'var(--danger)' : 'var(--text-dim)' }}>{overdue ? 'Overdue' : `Due ${fmtDate(g.due_date)}`}</div>}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'notes' && (
        <div>
          {notes.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: 13 }}>No notes</div>}
          {notes.map(note => {
            const subtitle = firstPageSubtitle(note.body_html)
            return (
              <div key={note.id} onClick={() => navigate('/notes', { state: { openNoteId: note.id, from: `/sectors?open=${encodeURIComponent(sector.name)}` } })} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: subtitle ? 2 : 4 }}>{note.title || 'Untitled'}</div>
                {subtitle && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>{fmtDate((note.updated_at || note.created_at)?.substring(0,10))}</div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'projects' && (
        <div>
          {projects.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: 13 }}>No projects yet</div>}
          {projects.map(p => {
            const pt = p.tasks || [], done = pt.filter(t => t.completed).length, pct = pt.length ? Math.round(done/pt.length*100) : 0
            return (
              <div key={p.id} onClick={() => setSelectedProject(p)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{p.name}</div>
                {p.description && <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>{p.description}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div className="prog-bar" style={{ flex: 1 }}><div className="prog-fill" style={{ width: pct + '%', background: sector.color || 'var(--accent)' }} /></div>
                  <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--text-muted)' }}>{pct}%</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{done} of {pt.length} tasks · tap to open →</div>
              </div>
            )
          })}
        </div>
      )}


    </div>
  )
}


// Row wrapper: quick horizontal swipe reveals Edit + Delete; freezes page scroll
// while swiping so the page doesn't move under your finger.
function SectorSwipeRow({ children, onEdit, onDelete }) {
  const [offset, setOffset] = useState(0)
  const startX = useRef(null); const startY = useRef(null); const swiping = useRef(false)
  const ACTION_W = 78; const REVEAL = ACTION_W * 2
  const ts = (e) => { startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY; swiping.current = false }
  const tm = (e) => {
    if (startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    if (!swiping.current && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.6) swiping.current = true
    if (swiping.current) {
      e.preventDefault(); e.stopPropagation()
      document.body.style.overflow = 'hidden'
      const base = offset < 0 ? -REVEAL : 0
      setOffset(Math.min(0, Math.max(-REVEAL - 20, base + dx)))
    }
  }
  const te = () => { setOffset(offset < -REVEAL/2 ? -REVEAL : 0); startX.current = null; document.body.style.overflow = '' }
  const close = () => { setOffset(0); document.body.style.overflow = '' }
  return (
    <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: REVEAL, display: 'flex' }}>
        <div onClick={() => { close(); onEdit() }} style={{ width: ACTION_W, background: 'var(--accent)', color: 'var(--on-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Edit</div>
        <div onClick={() => { close(); onDelete() }} style={{ width: ACTION_W, background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Delete</div>
      </div>
      <div onTouchStart={ts} onTouchMove={tm} onTouchEnd={te}
        style={{ transform: `translateX(${offset}px)`, transition: startX.current === null ? 'transform 0.22s cubic-bezier(0.22,1,0.36,1)' : 'none' }}>
        {children({ closeSwipe: close, swipeOpen: offset < 0 })}
      </div>
    </div>
  )
}

export default function Sectors({ onAddTask, onEditTask, onEditNote }) {
  const [sectors, setSectors] = useState([])
  const [selected, setSelected] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const openName = searchParams.get('open')
    if (openName && sectors.length) {
      const match = sectors.find(s => s.name === openName || s.name.startsWith(openName))
      if (match) setSelected(match)
    }
  }, [searchParams, sectors])
  const [sectorModal, setSectorModal] = useState(null)
  const [modifyMode, setModifyMode] = useState(false)
  const draggedRef = useRef(false)
  const deleteSector = async (s) => {
    if (!window.confirm(`Delete the "${s.name}" sector? Tasks and projects in it won't be deleted, but they'll lose this sector.`)) return
    await supabase.from('sectors').delete().eq('id', s.id)
    loadSectors()
  }

  useEffect(() => { loadSectors() }, [])

  const loadSectors = async () => {
    const { data: sd } = await supabase.from('sectors').select('*').order('sort_order').order('name')
    if (!sd) return setSectors([])
    const [{ data: td }, { data: pd }] = await Promise.all([
      supabase.from('tasks').select('sector').eq('completed', false),
      supabase.from('projects').select('sector').eq('status', 'active'),
    ])
    const taskCounts = {}, projCounts = {}
    ;(td||[]).forEach(t => { if(t.sector) taskCounts[t.sector] = (taskCounts[t.sector]||0)+1 })
    ;(pd||[]).forEach(p => { if(p.sector) projCounts[p.sector] = (projCounts[p.sector]||0)+1 })
    setSectors(sd.map(s => ({ ...s, _taskCount: taskCounts[s.name]||0, _projCount: projCounts[s.name]||0 })))
  }

  const saveOrder = async (reordered) => {
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('sectors').update({ sort_order: i }).eq('id', reordered[i].id)
    }
  }

  if (selected) return <SectorDetail sector={selected} onEditTask={onEditTask} onAddTask={onAddTask} onEditNote={onEditNote} onBack={() => setSelected(null)} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Sectors</div>
        <div onClick={() => setSectorModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/></svg>
          New
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>Swipe a sector for edit &amp; delete · hold and drag to reorder</div>

      <SortableList
        items={sectors}
        gap={8}
        onReorder={(next) => {
          draggedRef.current = true
          setTimeout(() => { draggedRef.current = false }, 260)
          setSectors(next)
          saveOrder(next)
        }}
        renderItem={(s, { dragging }) => (
          <SectorSwipeRow onEdit={() => setSectorModal(s)} onDelete={() => deleteSector(s)}>
            {({ closeSwipe, swipeOpen }) => (
              <div onClick={() => { if (draggedRef.current) return; if (swipeOpen) { closeSwipe(); return } setSelected(s) }}
                style={{ background: dragging ? 'var(--bg-card2)' : 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 13, borderLeft: `3px solid ${s.color || 'var(--accent)'}` }}>
                <div style={{ width: 30, flexShrink: 0, display: 'flex', justifyContent: 'center' }}><SectorGlyph name={s.name} emoji={s.icon} size={24} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{s._taskCount || 0} tasks · {s._projCount || 0} projects</div>
                </div>
                <div style={{ fontSize: 17, color: 'var(--text-dim)', flexShrink: 0, lineHeight: 1 }}>›</div>
              </div>
            )}
          </SectorSwipeRow>
        )}
      />

      {sectorModal && <SectorModal sector={sectorModal === 'new' ? null : sectorModal} onClose={() => setSectorModal(null)} onSaved={loadSectors} />}
    </div>
  )
}
