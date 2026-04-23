import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import TaskModal from '../components/TaskModal'

const EMOJI_PICKS = ['💼','🏠','🏃','📚','🎨','❤️','💰','🌱','⚡','🎯','🔥','✨','🎵','🏋️','🧠','💡','🌍','🚀','📝','🎮','🏆','🛠️','📊','🎭','🧘','🍎','☀️','🌙','💎','🦁']
const COLOR_PICKS = ['#d4520f','#3b82f6','#10b981','#f59e0b','#ec4899','#a78bfa','#f87171','#34d399','#60a5fa','#fbbf24','#e879f9','#2dd4bf']
const URG_STYLE = { urgent:{bg:'#2a0a0a',color:'#f87171'},high:{bg:'#1e1208',color:'#e8823a'},medium:{bg:'#1e1a00',color:'#fcd34d'},low:{bg:'#0a1e14',color:'#6ee7b7'} }

function NoteTextInput({ note, projectId, onClose, onSaved }) {
  const [text, setText] = React.useState(note?.text || '')
  const [saving, setSaving] = React.useState(false)
  const handleSave = async () => {
    if (!text.trim()) return; setSaving(true)
    if (note) await supabase.from('notes').update({ text: text.trim() }).eq('id', note.id)
    else await supabase.from('notes').insert({ text: text.trim(), project_id: projectId, category: 'Projects' })
    setSaving(false); onSaved()
  }
  const handleDelete = async () => {
    if (!note) return
    await supabase.from('notes').delete().eq('id', note.id)
    onSaved()
  }
  return (
    <>
      <div className="field"><div className="field-label">Note</div><textarea placeholder="Add a note..." value={text} onChange={e => setText(e.target.value)} style={{ height: 120 }} /></div>
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        {note && <button onClick={handleDelete} style={{ flex:1,padding:11,borderRadius:10,background:'#2a0a0a',border:'1px solid #7a1010',color:'#f87171',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans'" }}>Delete</button>}
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : note ? 'Save' : 'Add note'}</button>
      </div>
    </>
  )
}

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

function SectorDetail({ sector, onEditTask, onAddTask, onBack }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [projects, setProjects] = useState([])
  const [tab, setTab] = useState('projects')
  const [taskModal, setTaskModal] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectTasks, setProjectTasks] = useState([])
  const [projectNotes, setProjectNotes] = useState([])
  const [editProjectModal, setEditProjectModal] = useState(false)
  const [noteModal, setNoteModal] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (selectedProject) {
      supabase.from('tasks').select('*').eq('project_id', selectedProject.id).order('start_date').order('time_block').then(({ data }) => setProjectTasks(data || []))
      supabase.from('notes').select('*').eq('project_id', selectedProject.id).order('created_at', { ascending: false }).then(({ data }) => setProjectNotes(data || []))
    }
  }, [selectedProject?.id])

  useEffect(() => {
    supabase.from('tasks').select('*, projects(name)').eq('sector', sector.name).order('start_date').order('time_block').then(({ data }) => setTasks(data || []))
    supabase.from('notes').select('*').eq('category', sector.name).order('created_at', { ascending: false }).then(({ data }) => setNotes(data || []))
    supabase.from('projects').select('*, tasks(*)').eq('sector', sector.name).order('created_at', { ascending: false }).then(({ data }) => setProjects(data || []))
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
          </div>
        </div>
      </div>
    )
  }

  if (selectedProject) {
    const done = projectTasks.filter(t => t.completed).length
    const pct = projectTasks.length ? Math.round(done/projectTasks.length*100) : 0
    const color = sector.color || '#d4520f'
    const today = new Date().toISOString().split('T')[0]

    const toggleProjectTask = async (task) => {
      const updated = !task.completed
      await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
      setProjectTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
    }

    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div onClick={() => { setSelectedProject(null); setProjectTasks([]); setProjectNotes([]) }} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>‹</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{selectedProject.name}</div>
            {selectedProject.sector && <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>{selectedProject.sector}</div>}
          </div>
          {selectedProject.status !== 'completed' && (
            <div onClick={async () => { if(window.confirm('Mark as completed?')) { await supabase.from('projects').update({status:'completed'}).eq('id',selectedProject.id); reload(); setSelectedProject(null) } }} style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 10px',borderRadius:10,background:'#0a1e14',border:'1px solid #10b981',color:'#6ee7b7',fontSize:12,fontWeight:500,cursor:'pointer',flexShrink:0 }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><polyline points="1,5.5 4,8.5 10,2.5" stroke="var(--event-color)" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
              Done
            </div>
          )}
          <div onClick={() => setEditProjectModal(true)} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 1.5L11 3.5L4.5 10H2.5V8L9 1.5Z" stroke="#888" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>

        {selectedProject.description && <div style={{ fontSize:14,color:'#666',marginBottom:16,lineHeight:1.5,padding:'12px 14px',background:'#161618',borderRadius:12,border:'1px solid #242428' }}>{selectedProject.description}</div>}

        {/* Stats */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:18 }}>
          {[['Tasks',projectTasks.length,'#e8e6e1'],['Done',done,'#10b981'],['Left',projectTasks.length-done,'#d4520f']].map(([l,v,c]) => (
            <div key={l} style={{ background:'#161618',border:'1px solid #242428',borderRadius:12,padding:12 }}>
              <div style={{ fontSize:11,color:'#555',marginBottom:3 }}>{l}</div>
              <div style={{ fontSize:22,fontWeight:500,color:c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:20 }}>
          <div className="prog-bar" style={{ flex:1 }}><div className="prog-fill" style={{ width:pct+'%',background:color }} /></div>
          <div style={{ fontFamily:"'DM Mono'",fontSize:12,color:'#666' }}>{pct}%</div>
          {selectedProject.due_date && <div style={{ fontFamily:"'DM Mono'",fontSize:11,color:selectedProject.due_date<today?'#f87171':'#555' }}>Due {selectedProject.due_date}</div>}
        </div>

        {/* Add Task */}
        <div style={{ marginBottom:18 }}>
          <div className="action-btn" style={{ background:'var(--accent-dim)',border:'1px solid var(--accent-border)',color:'var(--accent-text)',width:'100%',justifyContent:'center' }} onClick={() => setTaskModal({ mode:'today', forProject: selectedProject })}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Add Task
          </div>
        </div>

        {/* Tasks */}
        <div className="section-label">Tasks</div>
        {projectTasks.length === 0 && <div style={{textAlign:'center',padding:'20px',color:'#444',fontSize:13,border:'1px dashed #242428',borderRadius:12,marginBottom:18}}>No tasks yet — add one above</div>}
        <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:20 }}>
          {projectTasks.map(task => {
            const isOverdue = task.start_date < today && !task.completed
            return (
              <div key={task.id} onClick={() => onEditTask(task)} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',background:'#161618',border:'1px solid #242428',borderRadius:12,opacity:task.completed?0.4:1,cursor:'pointer'}}>
                <div onClick={e=>{e.stopPropagation();toggleProjectTask(task)}} style={{width:20,height:20,borderRadius:'50%',border:`1.5px solid ${task.completed?'#d4520f':'#333'}`,background:task.completed?'#d4520f':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {task.completed&&<svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,color:task.completed?'#555':'#d4d2cc',textDecoration:task.completed?'line-through':'none'}}>{task.name}</div>
                  <div style={{display:'flex',gap:8,marginTop:2,flexWrap:'wrap'}}>
                    {task.time_block&&<span style={{fontFamily:"'DM Mono'",fontSize:11,color:'#555'}}>{task.time_block}</span>}
                    {task.start_date&&<span style={{fontFamily:"'DM Mono'",fontSize:11,color:isOverdue?'#f87171':'#555'}}>{task.start_date}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Notes */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
          <div className="section-label" style={{margin:0}}>Notes</div>
          <div onClick={()=>setNoteModal('new')} style={{fontSize:12,color:'var(--accent)',cursor:'pointer',padding:'4px 10px',background:'var(--accent-dim)',border:'1px solid var(--accent-border)',borderRadius:8}}>+ Add note</div>
        </div>
        {projectNotes.length===0&&<div style={{textAlign:'center',padding:'16px',color:'#444',fontSize:13,border:'1px dashed #242428',borderRadius:12,marginBottom:14}}>No notes yet</div>}
        {projectNotes.map(note=>(
          <div key={note.id} onClick={()=>setNoteModal(note)} style={{background:'#161618',border:'1px solid #242428',borderRadius:12,padding:14,marginBottom:8,cursor:'pointer'}}>
            <div style={{fontSize:14,color:'#d4d2cc',lineHeight:1.5}}>{note.text}</div>
            <div style={{fontSize:11,color:'#444',fontFamily:"'DM Mono'",marginTop:6}}>{new Date(note.created_at).toLocaleDateString()}</div>
          </div>
        ))}

        {/* Note modal */}
        {noteModal && (
          <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setNoteModal(null)}>
            <div className="modal-sheet">
              <div className="modal-handle"/>
              <div className="modal-title">{noteModal==='new'?'Add note':'Edit note'}<div className="modal-close" onClick={()=>setNoteModal(null)}>×</div></div>
              <NoteTextInput note={noteModal==='new'?null:noteModal} projectId={selectedProject.id}
                onClose={()=>setNoteModal(null)}
                onSaved={()=>{
                  supabase.from('notes').select('*').eq('project_id',selectedProject.id).order('created_at',{ascending:false}).then(({data})=>setProjectNotes(data||[]))
                  setNoteModal(null)
                }}
              />
            </div>
          </div>
        )}

        {taskModal && (
          <TaskModal mode={taskModal.mode} task={null}
            defaultSector={sector.name}
            defaultProjectId={taskModal.forProject?.id}
            onClose={() => setTaskModal(null)}
            onSaved={() => {
              setTaskModal(null)
              supabase.from('tasks').select('*').eq('project_id', selectedProject.id).order('start_date').order('time_block').then(({ data }) => setProjectTasks(data || []))
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div onClick={() => onBack()} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>‹</div>
        <div style={{ fontSize: 28 }}>{sector.icon}</div>
        <div><div style={{ fontSize: 20, fontWeight: 500 }}>{sector.name}</div><div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>{tasks.length} tasks · {notes.length} notes · {projects.length} projects</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="action-btn" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' }} onClick={() => setTaskModal({ mode: 'today' })}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add Task
        </div>
        <div className="action-btn" style={{ background: '#161618', border: '1px solid #2a2a30', color: '#aaa' }} onClick={async () => {
          const name = window.prompt('Project name?')
          if (!name?.trim()) return
          await supabase.from('projects').insert({ name: name.trim(), sector: sector.name, status: 'active' })
          reload()
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
        {['projects','tasks','notes'].map(t => (
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
          {projects.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: '#444', fontSize: 13 }}>No projects yet</div>}
          {projects.map(p => {
            const pt = p.tasks || [], done = pt.filter(t => t.completed).length, pct = pt.length ? Math.round(done/pt.length*100) : 0
            return (
              <div key={p.id} onClick={() => setSelectedProject(p)} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{p.name}</div>
                {p.description && <div style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>{p.description}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div className="prog-bar" style={{ flex: 1 }}><div className="prog-fill" style={{ width: pct + '%', background: sector.color || '#d4520f' }} /></div>
                  <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#666' }}>{pct}%</div>
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>{done} of {pt.length} tasks · tap to open →</div>
              </div>
            )
          })}
        </div>
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
  const touchStartY = useRef(null)
  const touchDragIdx = useRef(null)

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

  // Desktop drag
  const handleDragStart = idx => { dragItem.current = idx }
  const handleDragEnter = idx => { dragOver.current = idx }
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) return
    const reordered = [...sectors]
    const [moved] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, moved)
    setSectors(reordered)
    dragItem.current = null; dragOver.current = null
    await saveOrder(reordered)
  }

  // Mobile long-press drag
  const longPressTimer = useRef(null)
  const isDragging = useRef(false)

  const handleTouchStart = (e, idx) => {
    touchStartY.current = e.touches[0].clientY
    touchDragIdx.current = idx
    isDragging.current = false
    longPressTimer.current = setTimeout(() => {
      isDragging.current = true
    }, 300)
  }
  const handleTouchMove = (e) => {
    if (!isDragging.current) {
      clearTimeout(longPressTimer.current)
      return
    }
    e.preventDefault()
    e.stopPropagation()
    const y = e.touches[0].clientY
    const cardH = 160
    const newIdx = Math.max(0, Math.min(sectors.length - 1,
      Math.floor((y - (e.currentTarget.getBoundingClientRect?.()?.top || 0)) / cardH)
    ))
    const delta = Math.round((y - touchStartY.current) / cardH)
    const targetIdx = Math.max(0, Math.min(sectors.length - 1, touchDragIdx.current + delta))
    if (targetIdx !== touchDragIdx.current) {
      const reordered = [...sectors]
      const [moved] = reordered.splice(touchDragIdx.current, 1)
      reordered.splice(targetIdx, 0, moved)
      setSectors(reordered)
      touchDragIdx.current = targetIdx
      touchStartY.current = y
    }
  }
  const handleTouchEnd = async () => {
    clearTimeout(longPressTimer.current)
    if (isDragging.current) await saveOrder(sectors)
    isDragging.current = false
    touchDragIdx.current = null
    touchStartY.current = null
  }

  if (selected) return <SectorDetail sector={selected} onEditTask={onEditTask} onAddTask={() => {}} onBack={() => setSelected(null)} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Sectors</div>
        <div onClick={() => setSectorModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/></svg>
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
            onTouchStart={e => handleTouchStart(e, idx)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setSelected(s)}
            style={{ background: '#161618', border: '1px solid #242428', borderRadius: 16, padding: 20, cursor: 'grab', position: 'relative', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none', WebkitTouchCallout: 'none' }}
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
