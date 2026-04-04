import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import TaskModal from '../components/TaskModal'

const EMOJI_PICKS = ['💼','🏠','🏃','📚','🎨','❤️','💰','🌱','⚡','🎯','🔥','✨','🎵','🏋️','🧠','💡','🌍','🚀','📝','🎮','🏆','🛠️','📊','🎭','🧘','🍎','☀️','🌙','💎','🦁']
const COLOR_PICKS = ['#d4520f','#3b82f6','#10b981','#f59e0b','#ec4899','#a78bfa','#f87171','#34d399','#60a5fa','#fbbf24','#e879f9','#2dd4bf']
const URG_STYLE = { urgent:{bg:'#2a0a0a',color:'#f87171'},high:{bg:'#1e1208',color:'#e8823a'},medium:{bg:'#1e1a00',color:'#fcd34d'},low:{bg:'#0a1e14',color:'#6ee7b7'} }

function SectorModal({ sector, onClose, onSaved }) {
  const isEdit = !!sector
  const [name, setName] = useState(sector?.name || '')
  const [icon, setIcon] = useState(sector?.icon || '📁')
  const [color, setColor] = useState(sector?.color || '#d4520f')
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
        <div style={{ textAlign: 'center', fontSize: 52, marginBottom: 12 }}>{icon}</div>
        <div className="field"><div className="field-label">Name</div><input type="text" placeholder="e.g. Business..." value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field">
          <div className="field-label">Icon</div>
          <input type="text" value={icon} onChange={e => setIcon(e.target.value)} style={{ fontSize: 22, textAlign: 'center' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10, justifyContent: 'center' }}>
            {EMOJI_PICKS.map(e => <div key={e} onClick={() => setIcon(e)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: icon === e ? '#1e1208' : '#161618', border: `1px solid ${icon === e ? '#7a3410' : '#242428'}`, borderRadius: 10, cursor: 'pointer' }}>{e}</div>)}
          </div>
        </div>
        <div className="field">
          <div className="field-label">Color</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_PICKS.map(c => <div key={c} onClick={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: `3px solid ${color === c ? '#fff' : 'transparent'}`, cursor: 'pointer' }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={handleDelete} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add sector'}</button>
        </div>
      </div>
    </div>
  )
}

function SectorDetail({ sector, onBack, onEditTask }) {
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [projects, setProjects] = useState([])
  const [tab, setTab] = useState('tasks')
  const [taskModal, setTaskModal] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    supabase.from('tasks').select('*, projects(name)').eq('sector', sector.name).order('start_date').order('time_block').then(({ data }) => setTasks(data || []))
    supabase.from('notes').select('*').eq('category', sector.name).order('created_at', { ascending: false }).then(({ data }) => setNotes(data || []))
    supabase.from('projects').select('*, tasks(*)').eq('sector', sector.name).then(({ data }) => setProjects(data || []))
  }, [sector.name])

  const toggleTask = async (task) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
  }

  const reload = () => {
    supabase.from('tasks').select('*, projects(name)').eq('sector', sector.name).order('start_date').order('time_block').then(({ data }) => setTasks(data || []))
  }

  const todayTasks = tasks.filter(t => t.start_date === today && !t.completed)
  const upcomingTasks = tasks.filter(t => t.start_date > today && !t.completed)
  const doneTasks = tasks.filter(t => t.completed)
  const overdueTasks = tasks.filter(t => t.start_date < today && !t.completed)

  const TaskRow = ({ task }) => {
    const urg = URG_STYLE[task.urgency] || URG_STYLE.medium
    const isOverdue = task.start_date < today && !task.completed
    return (
      <div onClick={() => onEditTask(task)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 12, marginBottom: 6, opacity: task.completed ? 0.4 : 1, cursor: 'pointer' }}>
        <div onClick={e => { e.stopPropagation(); toggleTask(task) }} style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${task.completed ? '#d4520f' : '#333'}`, background: task.completed ? '#d4520f' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {task.completed && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: '#d4d2cc' }}>{task.name}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
            {task.time_block && <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#555' }}>{task.time_block}</span>}
            {task.start_date && <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: isOverdue ? '#f87171' : '#555' }}>{task.start_date}</span>}
            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: urg.bg, color: urg.color }}>{task.urgency}</span>
            {task.projects && <span style={{ fontSize: 11, color: '#d4520f' }}>{task.projects.name} →</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>‹</div>
        <div style={{ fontSize: 28 }}>{sector.icon}</div>
        <div><div style={{ fontSize: 20, fontWeight: 500 }}>{sector.name}</div><div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>{tasks.length} tasks · {notes.length} notes · {projects.length} projects</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="action-btn" style={{ background: '#1e1208', border: '1px solid #7a3410', color: '#e8823a' }} onClick={() => setTaskModal({ mode: 'today' })}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Create Task
        </div>
        <div className="action-btn" style={{ background: '#161618', border: '1px solid #2a2a30', color: '#aaa' }} onClick={async () => {
          const name = window.prompt('Project name?')
          if (!name?.trim()) return
          await supabase.from('projects').insert({ name: name.trim(), sector: sector.name, status: 'active' })
          supabase.from('projects').select('*, tasks(*)').eq('sector', sector.name).then(({ data }) => setProjects(data || []))
          setTab('projects')
        }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="2" width="11" height="11" rx="2" stroke="#aaa" strokeWidth="1.4"/><line x1="7.5" y1="5" x2="7.5" y2="10" stroke="#aaa" strokeWidth="1.4" strokeLinecap="round"/><line x1="5" y1="7.5" x2="10" y2="7.5" stroke="#aaa" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Create Project
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
        {[['Today', todayTasks.length,'#d4520f'],['Upcoming',upcomingTasks.length,'#a78bfa'],['Overdue',overdueTasks.length,'#f87171'],['Done',doneTasks.length,'#10b981']].map(([l,v,c]) => (
          <div key={l} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: '10px 8px' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: c }}>{v}</div>
            <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['tasks','notes','projects'].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: tab === t ? '#1e1208' : '#161618', borderColor: tab === t ? '#7a3410' : '#242428', color: tab === t ? '#d4520f' : '#666' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {tab === 'tasks' && (
        <div>
          {tasks.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: '#444', fontSize: 13 }}>No tasks yet</div>}
          {overdueTasks.length > 0 && <><div className="section-label" style={{ color: '#f87171' }}>Overdue</div>{overdueTasks.map(t => <TaskRow key={t.id} task={t} />)}</>}
          {todayTasks.length > 0 && <><div className="section-label">Today</div>{todayTasks.map(t => <TaskRow key={t.id} task={t} />)}</>}
          {upcomingTasks.length > 0 && <><div className="section-label">Upcoming</div>{upcomingTasks.map(t => <TaskRow key={t.id} task={t} />)}</>}
          {doneTasks.length > 0 && <><div className="section-label">Completed</div>{doneTasks.map(t => <TaskRow key={t.id} task={t} />)}</>}
        </div>
      )}
      {tab === 'notes' && (
        <div>
          {notes.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: '#444', fontSize: 13 }}>No notes</div>}
          {notes.map(note => (
            <div key={note.id} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 14, color: '#d4d2cc', lineHeight: 1.5 }}>{note.text}</div>
              <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'", marginTop: 6 }}>{new Date(note.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
      {tab === 'projects' && (
        <div>
          {projects.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: '#444', fontSize: 13 }}>No projects</div>}
          {projects.map(p => {
            const pt = p.tasks || [], done = pt.filter(t => t.completed).length, pct = pt.length ? Math.round(done/pt.length*100) : 0
            return (
              <div key={p.id} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16, marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div className="prog-bar" style={{ flex: 1 }}><div className="prog-fill" style={{ width: pct + '%', background: sector.color || '#d4520f' }} /></div>
                  <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#666' }}>{pct}%</div>
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>{done} of {pt.length} tasks done</div>
              </div>
            )
          })}
        </div>
      )}

      {taskModal && (
        <TaskModal mode={taskModal.mode} task={null} defaultSector={sector.name}
          onClose={() => setTaskModal(null)}
          onSaved={() => { setTaskModal(null); reload() }}
        />
      )}
    </div>
  )
}

export default function Sectors({ onEditTask }) {
  const [sectors, setSectors] = useState([])
  const [selected, setSelected] = useState(null)
  const [sectorModal, setSectorModal] = useState(null)
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  useEffect(() => { loadSectors() }, [])
  const loadSectors = async () => {
    const { data: sd } = await supabase.from('sectors').select('*').order('sort_order').order('name')
    if (!sd) return setSectors([])
    // Get counts for each sector
    const [{ data: td }, { data: pd }] = await Promise.all([
      supabase.from('tasks').select('sector').eq('completed', false),
      supabase.from('projects').select('sector').eq('status', 'active'),
    ])
    const taskCounts = {}
    const projCounts = {}
    ;(td||[]).forEach(t => { if(t.sector) taskCounts[t.sector] = (taskCounts[t.sector]||0)+1 })
    ;(pd||[]).forEach(p => { if(p.sector) projCounts[p.sector] = (projCounts[p.sector]||0)+1 })
    setSectors(sd.map(s => ({ ...s, _taskCount: taskCounts[s.name]||0, _projCount: projCounts[s.name]||0 })))
  }

  const handleDragStart = (idx) => { dragItem.current = idx }
  const handleDragEnter = (idx) => { dragOver.current = idx }
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null) return
    const reordered = [...sectors]
    const [moved] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, moved)
    setSectors(reordered)
    dragItem.current = null; dragOver.current = null
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('sectors').update({ sort_order: i }).eq('id', reordered[i].id)
    }
  }

  if (selected) return <SectorDetail sector={selected} onBack={() => setSelected(null)} onEditTask={onEditTask} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Sectors</div>
        <div onClick={() => setSectorModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1208', border: '1px solid #7a3410', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#d4520f', fontWeight: 500 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="#d4520f" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="#d4520f" strokeWidth="1.8" strokeLinecap="round"/></svg>
          New sector
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#444', marginBottom: 16 }}>Hold and drag to reorder</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {sectors.map((s, idx) => (
          <div key={s.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={e => e.preventDefault()}
            onClick={() => setSelected(s)}
            style={{ background: '#161618', border: '1px solid #242428', borderRadius: 16, padding: 20, cursor: 'grab', position: 'relative', userSelect: 'none' }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{s.name}</div>
            <div style={{ width: 32, height: 3, background: s.color || '#d4520f', borderRadius: 2, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ fontSize: 11, color: '#555' }}>{s._taskCount || 0} tasks</div>
              <div style={{ fontSize: 11, color: '#555' }}>{s._projCount || 0} projects</div>
            </div>
            <div onClick={e => { e.stopPropagation(); setSectorModal(s) }} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 8, background: '#1e1e24', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 1.5L10.5 3L4.5 9H3V7.5L9 1.5Z" stroke="#666" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        ))}
      </div>
      {sectorModal && <SectorModal sector={sectorModal === 'new' ? null : sectorModal} onClose={() => setSectorModal(null)} onSaved={loadSectors} />}
    </div>
  )
}
