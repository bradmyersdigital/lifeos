import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const IMPORTANCE = ['Critical','High','Medium','Low']
const IMP_STYLES = {
  Critical: { bg: '#2a0a0a', border: '#7a1010', color: '#f87171' },
  High:     { bg: '#1e1208', border: '#7a3410', color: '#e8823a' },
  Medium:   { bg: '#1e1a00', border: '#4a3d00', color: '#fcd34d' },
  Low:      { bg: '#0a1e14', border: '#0f4a2a', color: '#6ee7b7' },
}
const SECTOR_COLORS = {
  business: '#d4520f', 'real estate': '#3b82f6', health: '#10b981',
  'personal growth': '#f59e0b', family: '#ec4899', hobbies: '#a78bfa',
}

function ProjectModal({ onClose, onSaved, project }) {
  const isEdit = !!project
  const [name, setName] = useState(project?.name || '')
  const [sector, setSector] = useState(project?.sector || '')
  const [description, setDescription] = useState(project?.description || '')
  const [dueDate, setDueDate] = useState(project?.due_date || '')
  const [status, setStatus] = useState(project?.status || 'active')
  const [importance, setImportance] = useState(project?.importance || 'Medium')
  const [sectors, setSectors] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('sectors').select('name').order('sort_order').order('name').then(({ data }) => setSectors(data || []))
  }, [])

  const handleSave = async () => {
    if (!name.trim()) return; setSaving(true)
    const payload = { name: name.trim(), sector, description, due_date: dueDate || null, status, importance }
    if (isEdit) await supabase.from('projects').update(payload).eq('id', project.id)
    else await supabase.from('projects').insert(payload)
    setSaving(false); onSaved(); onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${project.name}"?`)) return
    await supabase.from('projects').delete().eq('id', project.id)
    onSaved(); onClose()
  }

  const handleComplete = async () => {
    if (!window.confirm('Mark this project as completed?')) return
    await supabase.from('projects').update({ status: 'completed' }).eq('id', project.id)
    onSaved(); onClose()
  }

  const sectorList = sectors.length > 0 ? sectors.map(s => s.name) : ['Business','Real Estate','Health','Personal Growth','Hobbies','Family']

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? 'Edit project' : 'New project'}<div className="modal-close" onClick={onClose}>×</div></div>
        <div className="field"><div className="field-label">Project name</div><input type="text" placeholder="What are you working on?" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field"><div className="field-label">Description</div><textarea placeholder="What's the goal?" value={description} onChange={e => setDescription(e.target.value)} /></div>
        <div className="field">
          <div className="field-label">Importance</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {IMPORTANCE.map(imp => {
              const s = IMP_STYLES[imp]; const active = importance === imp
              return <div key={imp} onClick={() => setImportance(imp)} style={{ flex: 1, padding: '7px 4px', borderRadius: 9, textAlign: 'center', fontSize: 11, fontWeight: 500, cursor: 'pointer', background: active ? s.bg : '#0f0f11', border: `1px solid ${active ? s.border : '#242428'}`, color: active ? s.color : '#555' }}>{imp}</div>
            })}
          </div>
        </div>
        <div className="field-row">
          <div className="field"><div className="field-label">Sector</div>
            <select value={sector} onChange={e => setSector(e.target.value)}><option value="">Select...</option>{sectorList.map(s => <option key={s}>{s}</option>)}</select>
          </div>
          <div className="field"><div className="field-label">Status</div>
            <select value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="backlog">Backlog</option><option value="completed">Completed</option></select>
          </div>
        </div>
        <div className="field"><div className="field-label">Due date</div><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <>
            <button onClick={handleDelete} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>
            <button onClick={handleComplete} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#0a1e14', border: '1px solid #10b981', color: '#6ee7b7', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>✓ Complete</button>
          </>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}</button>
        </div>
      </div>
    </div>
  )
}

function NoteModal({ projectId, note, onClose, onSaved }) {
  const [text, setText] = useState(note?.text || '')
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    if (!text.trim()) return; setSaving(true)
    if (note) await supabase.from('notes').update({ text: text.trim() }).eq('id', note.id)
    else await supabase.from('notes').insert({ text: text.trim(), project_id: projectId, category: 'Projects' })
    setSaving(false); onSaved(); onClose()
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{note ? 'Edit note' : 'Add note'}<div className="modal-close" onClick={onClose}>×</div></div>
        <div className="field"><div className="field-label">Note</div><textarea placeholder="Add a note..." value={text} onChange={e => setText(e.target.value)} style={{ height: 120 }} /></div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {note && <button onClick={async () => { await supabase.from('notes').delete().eq('id', note.id); onSaved(); onClose() }} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : note ? 'Save' : 'Add note'}</button>
        </div>
      </div>
    </div>
  )
}

function ProjectDetail({ project, onBack, onAddTask, onEditTask, onRefresh }) {
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [editModal, setEditModal] = useState(false)
  const [noteModal, setNoteModal] = useState(null)
  const today = new Date().toISOString().split('T')[0]
  const color = SECTOR_COLORS[project.sector?.toLowerCase()] || '#d4520f'

  useEffect(() => { loadDetail() }, [project.id])

  const loadDetail = async () => {
    const [{ data: t }, { data: n }] = await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', project.id).order('start_date').order('time_block'),
      supabase.from('notes').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
    ])
    setTasks(t || []); setNotes(n || [])
  }

  const toggleTask = async (task) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
  }

  const done = tasks.filter(t => t.completed).length
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0
  const imp = project.importance ? IMP_STYLES[project.importance] : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#888' }}>‹</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 500 }}>{project.name}</div>
            {imp && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: imp.bg, border: `1px solid ${imp.border}`, color: imp.color }}>{project.importance}</span>}
          </div>
          {project.sector && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{project.sector}</div>}
        </div>
        <div onClick={() => setEditModal(true)} style={{ width: 34, height: 34, borderRadius: 10, background: '#161618', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 1.5L11 3.5L4.5 10H2.5V8L9 1.5Z" stroke="#888" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {project.description && <div style={{ fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 1.5, padding: '12px 14px', background: '#161618', borderRadius: 12, border: '1px solid #242428' }}>{project.description}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
        {[['Tasks', tasks.length,'#e8e6e1'],['Done', done,'#10b981'],['Left', tasks.length-done,'#d4520f']].map(([l,v,c]) => (
          <div key={l} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div className="prog-bar" style={{ flex: 1 }}><div className="prog-fill" style={{ width: pct+'%', background: color }} /></div>
        <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: '#666' }}>{pct}%</div>
        {project.due_date && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: project.due_date < today ? '#f87171' : '#555' }}>Due {project.due_date}</div>}
      </div>

      <div className="action-row" style={{ marginBottom: 18 }}>
        <div className="action-btn" style={{ background: '#1e1208', border: '1px solid #7a3410', color: '#e8823a' }} onClick={() => onAddTask('today')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="#e8823a" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add task for today
        </div>
        <div className="action-btn" style={{ background: '#161618', border: '1px solid #2a2a30', color: '#aaa' }} onClick={() => onAddTask('scheduled')}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="2" stroke="#aaa" strokeWidth="1.4"/><line x1="1.5" y1="6.5" x2="13.5" y2="6.5" stroke="#aaa" strokeWidth="1.4"/><line x1="5" y1="1" x2="5" y2="4" stroke="#aaa" strokeWidth="1.4" strokeLinecap="round"/><line x1="10" y1="1" x2="10" y2="4" stroke="#aaa" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Schedule a task
        </div>
      </div>

      <div className="section-label">Tasks</div>
      {tasks.length === 0 && <div style={{ textAlign:'center',padding:'20px',color:'#444',fontSize:13,border:'1px dashed #242428',borderRadius:12,marginBottom:18 }}>No tasks yet</div>}
      <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:20 }}>
        {tasks.map(task => {
          const isOverdue = task.start_date < today && !task.completed
          return (
            <div key={task.id} onClick={() => onEditTask(task)} style={{ display:'flex',alignItems:'center',gap:10,padding:'11px 14px',background:'#161618',border:'1px solid #242428',borderRadius:12,opacity:task.completed?0.4:1,cursor:'pointer' }}>
              <div onClick={e=>{e.stopPropagation();toggleTask(task)}} style={{ width:20,height:20,borderRadius:'50%',border:`1.5px solid ${task.completed?'#d4520f':'#333'}`,background:task.completed?'#d4520f':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                {task.completed&&<svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:14,color:task.completed?'#555':'#d4d2cc',textDecoration:task.completed?'line-through':'none' }}>{task.name}</div>
                <div style={{ display:'flex',gap:8,marginTop:2,flexWrap:'wrap' }}>
                  {task.time_block&&<span style={{ fontFamily:"'DM Mono'",fontSize:11,color:'#555' }}>{task.time_block}</span>}
                  {task.start_date&&<span style={{ fontFamily:"'DM Mono'",fontSize:11,color:isOverdue?'#f87171':'#555' }}>{task.start_date}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
        <div className="section-label" style={{ margin:0 }}>Notes</div>
        <div onClick={()=>setNoteModal('new')} style={{ fontSize:12,color:'#d4520f',cursor:'pointer',padding:'4px 10px',background:'#1e1208',border:'1px solid #7a3410',borderRadius:8 }}>+ Add note</div>
      </div>
      {notes.length===0&&<div style={{ textAlign:'center',padding:'16px',color:'#444',fontSize:13,border:'1px dashed #242428',borderRadius:12,marginBottom:18 }}>No notes yet</div>}
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {notes.map(note=>(
          <div key={note.id} onClick={()=>setNoteModal(note)} style={{ background:'#161618',border:'1px solid #242428',borderRadius:12,padding:14,cursor:'pointer' }}>
            <div style={{ fontSize:14,color:'#d4d2cc',lineHeight:1.5 }}>{note.text}</div>
            <div style={{ fontSize:11,color:'#444',fontFamily:"'DM Mono'",marginTop:6 }}>{new Date(note.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>

      {editModal&&<ProjectModal project={project} onClose={()=>setEditModal(false)} onSaved={()=>{onRefresh();onBack()}} />}
      {noteModal&&<NoteModal projectId={project.id} note={noteModal==='new'?null:noteModal} onClose={()=>setNoteModal(null)} onSaved={loadDetail} />}
    </div>
  )
}

export default function Projects({ onAddTask, onEditTask }) {
  const [projects, setProjects] = useState([])
  const [sectors, setSectors] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadProjects()
    supabase.from('sectors').select('name').order('sort_order').order('name').then(({ data }) => setSectors(data || []))
  }, [])

  const loadProjects = async () => {
    const { data } = await supabase.from('projects').select('*, tasks(*), notes(*)').order('created_at', { ascending: false })
    setProjects(data || [])
  }

  if (selected) return <ProjectDetail project={selected} onBack={()=>setSelected(null)} onAddTask={onAddTask} onEditTask={onEditTask} onRefresh={loadProjects} />

  const filtered = projects.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false
    if (sectorFilter !== 'all' && p.sector !== sectorFilter) return false
    return true
  })

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
        <div style={{ fontSize:20,fontWeight:500 }}>Projects</div>
        <div onClick={()=>setShowModal(true)} style={{ display:'flex',alignItems:'center',gap:6,background:'#1e1208',border:'1px solid #7a3410',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontSize:13,color:'#d4520f',fontWeight:500 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="#d4520f" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="#d4520f" strokeWidth="1.8" strokeLinecap="round"/></svg>
          New project
        </div>
      </div>

      <div style={{ display:'flex',gap:6,marginBottom:10,flexWrap:'wrap' }}>
        {['all','active','backlog','completed'].map(f=>(
          <div key={f} onClick={()=>setFilter(f)} style={{ padding:'5px 13px',borderRadius:20,fontSize:12,fontWeight:500,cursor:'pointer',border:'1px solid',transition:'all 0.15s',background:filter===f?'#1e1208':'#161618',borderColor:filter===f?'#7a3410':'#242428',color:filter===f?'#d4520f':'#666' }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </div>
        ))}
      </div>

      <div style={{ display:'flex',gap:6,marginBottom:18,flexWrap:'wrap' }}>
        <div onClick={()=>setSectorFilter('all')} style={{ padding:'4px 11px',borderRadius:20,fontSize:11,fontWeight:500,cursor:'pointer',border:'1px solid',background:sectorFilter==='all'?'#0c1a2e':'#161618',borderColor:sectorFilter==='all'?'#1a3a5c':'#242428',color:sectorFilter==='all'?'#93c5fd':'#555' }}>All sectors</div>
        {sectors.map(s=>(
          <div key={s.name} onClick={()=>setSectorFilter(s.name)} style={{ padding:'4px 11px',borderRadius:20,fontSize:11,fontWeight:500,cursor:'pointer',border:'1px solid',whiteSpace:'nowrap',background:sectorFilter===s.name?'#0c1a2e':'#161618',borderColor:sectorFilter===s.name?'#1a3a5c':'#242428',color:sectorFilter===s.name?'#93c5fd':'#555' }}>{s.name}</div>
        ))}
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:20 }}>
        {[['Active',projects.filter(p=>p.status==='active').length],['Backlog',projects.filter(p=>p.status==='backlog').length],['Done',projects.filter(p=>p.status==='completed').length]].map(([label,val])=>(
          <div key={label} style={{ background:'#161618',border:'1px solid #242428',borderRadius:11,padding:12 }}>
            <div style={{ fontSize:11,color:'#555',marginBottom:3 }}>{label}</div>
            <div style={{ fontSize:22,fontWeight:500 }}>{val}</div>
          </div>
        ))}
      </div>

      {filtered.length===0&&<div style={{ textAlign:'center',padding:'40px 20px',color:'#444',fontSize:14 }}>No projects found</div>}

      {filtered.map(project=>{
        const tasks=project.tasks||[], done=tasks.filter(t=>t.completed).length, pct=tasks.length?Math.round(done/tasks.length*100):0
        const color=SECTOR_COLORS[project.sector?.toLowerCase()]||'#d4520f'
        const today=new Date().toISOString().split('T')[0]
        const isOverdue=project.due_date&&project.due_date<today
        const isSoon=project.due_date&&!isOverdue&&project.due_date<=new Date(Date.now()+14*86400000).toISOString().split('T')[0]
        const imp=project.importance?IMP_STYLES[project.importance]:null
        return (
          <div key={project.id} onClick={()=>setSelected(project)} style={{ background:'#161618',border:'1px solid #242428',borderRadius:14,padding:16,marginBottom:10,cursor:'pointer' }}>
            <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10,gap:10 }}>
              <div>
                <div style={{ fontSize:15,fontWeight:500,marginBottom:4 }}>{project.name}</div>
                <div style={{ display:'flex',gap:6,flexWrap:'wrap',alignItems:'center' }}>
                  {project.sector&&<span style={{ fontSize:11,color:'#555',background:'#1e1e24',padding:'2px 8px',borderRadius:6 }}>{project.sector}</span>}
                  {imp&&<span style={{ fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:6,background:imp.bg,border:`1px solid ${imp.border}`,color:imp.color }}>{project.importance}</span>}
                </div>
              </div>
            </div>
            {project.description&&<div style={{ fontSize:13,color:'#555',marginBottom:12,lineHeight:1.5 }}>{project.description}</div>}
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
              <div className="prog-bar" style={{ flex:1 }}><div className="prog-fill" style={{ width:pct+'%',background:color }} /></div>
              <div style={{ fontFamily:"'DM Mono'",fontSize:11,color:'#666',minWidth:32,textAlign:'right' }}>{pct}%</div>
            </div>
            <div style={{ display:'flex',alignItems:'center' }}>
              <div style={{ fontSize:12,color:'#555' }}>{done} of {tasks.length} tasks done</div>
              {project.due_date&&<div style={{ fontFamily:"'DM Mono'",fontSize:11,color:isOverdue?'#f87171':isSoon?'#f59e0b':'#555',marginLeft:'auto' }}>Due {project.due_date}{isOverdue?' ↑':''}</div>}
            </div>
          </div>
        )
      })}

      {showModal&&<ProjectModal onClose={()=>setShowModal(false)} onSaved={loadProjects} />}
    </div>
  )
}
