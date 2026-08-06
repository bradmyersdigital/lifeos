import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSearchParams } from 'react-router-dom'
import { fmtDate , todayLocal } from '../utils'
import FolderList, { FolderHeader } from '../components/FolderList'
import FolderSheet from '../components/FolderSheet'

const IMPORTANCE = ['Low', 'Medium', 'High', 'Urgent']
const IMP_STYLES = {
  Low:    { bg: 'var(--success-dim)', border: 'var(--success-border)', color: 'var(--event-color)' },
  Medium: { bg: 'var(--warn-dim)', border: 'var(--warn-border)', color: 'var(--warn)' },
  High:   { bg: 'var(--accent-dim)', border: 'var(--accent-border)', color: 'var(--accent-text)' },
  Urgent: { bg: 'var(--danger-dim)', border: 'var(--danger-border)', color: 'var(--danger)' },
}
const SECTOR_COLORS = {
  business: '#d4520f', 'real estate': '#3b82f6', health: '#10b981',
  'personal growth': '#f59e0b', family: '#ec4899', hobbies: '#a78bfa',
}

export function ProjectModal({ onClose, onSaved, project, defaultSector, defaultFolder, folderOptions = [] }) {
  const isEdit = !!project
  const [name, setName] = useState(project?.name || '')
  // combined placement: one home, either a sector or a custom folder
  const initialPlacement = project?.folder ? `folder:${project.folder}`
    : project?.sector ? `sector:${project.sector}`
    : defaultFolder ? `folder:${defaultFolder}`
    : defaultSector ? `sector:${defaultSector}`
    : ''
  const [placement, setPlacement] = useState(initialPlacement)
  const [goal, setGoal] = useState(project?.goal || '')
  const [description, setDescription] = useState(project?.description || '')
  const [dueDate, setDueDate] = useState(project?.due_date || '')
  const [status, setStatus] = useState(project?.status || 'active')
  const [importance, setImportance] = useState(project?.importance === 'Critical' ? 'Urgent' : (project?.importance || 'Medium'))
  const [goalId, setGoalId] = useState(project?.goal_id || '')
  const [goals, setGoals] = useState([])
  const [sectors, setSectors] = useState([])
  const [saving, setSaving] = useState(false)
  const isComplete = status === 'completed'

  useEffect(() => {
    supabase.from('sectors').select('name').order('sort_order').order('name').then(({ data }) => setSectors(data || []))
    supabase.from('goals').select('id, goal_text, timeframe').order('timeframe').then(({ data }) => setGoals(data || []))
  }, [])

  const handleSave = async () => {
    if (!name.trim()) return; setSaving(true)
    const isFolder = placement.startsWith('folder:')
    const isSector = placement.startsWith('sector:')
    const payload = {
      name: name.trim(),
      sector: isSector ? placement.slice(7) : null,
      folder: isFolder ? placement.slice(7) : null,
      goal: goal.trim() || null, description, due_date: dueDate || null, status, importance,
      goal_id: goalId || null,
    }
    let saved = null
    let error = null
    if (isEdit) { const r = await supabase.from('projects').update(payload).eq('id', project.id).select().single(); saved = r.data; error = r.error }
    else { const r = await supabase.from('projects').insert(payload).select().single(); saved = r.data; error = r.error }
    // projects.goal_id may not exist yet in the DB — retry without it rather than losing the rest of the edit
    if (error?.code === '42703' || error?.code === 'PGRST204') {
      const { goal_id, ...fallback } = payload
      if (isEdit) { const r = await supabase.from('projects').update(fallback).eq('id', project.id).select().single(); saved = r.data }
      else { const r = await supabase.from('projects').insert(fallback).select().single(); saved = r.data }
      console.warn('projects.goal_id column is missing — everything saved except the goal link. Add "goal_id uuid references goals(id)" to the projects table.')
    }
    setSaving(false); onSaved(saved); onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${project.name}"?`)) return
    await supabase.from('projects').delete().eq('id', project.id)
    onSaved(); onClose()
  }

  const toggleComplete = async () => {
    if (!isEdit) return
    const next = isComplete ? 'active' : 'completed'
    setStatus(next)
    await supabase.from('projects').update({ status: next }).eq('id', project.id)
  }

  const sectorList = sectors.length > 0 ? sectors.map(s => s.name) : ['Business','Real Estate','Health','Personal Growth','Hobbies','Family']

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet doc-page">
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, position: 'sticky', top: 14, background: 'var(--bg)', zIndex: 5, paddingBottom: 8 }}>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
          <div style={{ flex: 1, fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' }}>{isEdit ? 'Edit project' : 'New project'}</div>
          {isEdit && (
            <div onClick={toggleComplete}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 11, cursor: 'pointer', flexShrink: 0,
                background: isComplete ? 'var(--success-dim)' : 'var(--bg-card)',
                border: `1px solid ${isComplete ? 'var(--success-border)' : 'var(--border)'}`,
                color: isComplete ? 'var(--success)' : 'var(--text-muted)' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${isComplete ? 'var(--success)' : 'var(--border-hover)'}`, background: isComplete ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isComplete && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{isComplete ? 'Completed' : 'Complete'}</span>
            </div>
          )}
        </div>
        <div className="field"><div className="field-label">Project name</div><input type="text" placeholder="What are you working on?" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field"><div className="field-label">Objective</div><textarea placeholder="What does 'done' look like for this project?" value={goal} onChange={e => setGoal(e.target.value)} style={{ minHeight: 60 }} /></div>
        <div className="field"><div className="field-label">Description / notes</div><textarea placeholder="Context, details, anything worth remembering" value={description} onChange={e => setDescription(e.target.value)} /></div>
        <div className="field">
          <div className="field-label">Importance</div>
          <div style={{ display: 'flex', gap: 7 }}>
            {IMPORTANCE.map(imp => {
              const s = IMP_STYLES[imp]; const active = importance === imp
              return <div key={imp} onClick={() => setImportance(imp)} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', background: active ? s.bg : 'var(--bg-input)', border: `1px solid ${active ? s.border : 'var(--border)'}`, color: active ? s.color : 'var(--text-dim)' }}>{imp}</div>
            })}
          </div>
        </div>
        <div className="field-row">
          <div className="field"><div className="field-label">Sector / Folder</div>
            <select value={placement} onChange={e => setPlacement(e.target.value)}>
              <option value="">Select...</option>
              <optgroup label="Sectors">
                {sectorList.map(s => <option key={'s'+s} value={`sector:${s}`}>{s}</option>)}
              </optgroup>
              {folderOptions.length > 0 && (
                <optgroup label="Folders">
                  {folderOptions.map(f => <option key={'f'+f} value={`folder:${f}`}>{f}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          <div className="field"><div className="field-label">Status</div>
            <select value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="backlog">Backlog</option><option value="completed">Completed</option></select>
          </div>
        </div>
        <div className="field"><div className="field-label">Due date</div><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
        <div className="field">
          <div className="field-label">Link to goal</div>
          <select value={goalId} onChange={e => setGoalId(e.target.value)}>
            <option value="">No goal linked</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.timeframe?.replace('month','mo ').replace('year','yr ')} — {g.goal_text?.substring(0,40)}{g.goal_text?.length>40?'…':''}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && (
            <button onClick={handleDelete} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>
          )}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}</button>
        </div>
      </div>
    </div>
  )
}

export function ProjectDetail({ project, onBack, onAddTask, onEditTask, onEditNote, onRefresh }) {
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [shopping, setShopping] = useState([])
  const [newShop, setNewShop] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [taskTab, setTaskTab] = useState('active')  // 'active' | 'completed'
  const [bodyTab, setBodyTab] = useState('tasks')    // 'tasks' | 'notes' | 'shopping'
  const today = todayLocal()
  const color = SECTOR_COLORS[project.sector?.toLowerCase()] || 'var(--accent)'

  useEffect(() => { loadDetail() }, [project.id])

  const loadDetail = async () => {
    const [{ data: t }, { data: n }, { data: g }] = await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', project.id).order('start_date').order('time_block'),
      supabase.from('notes').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabase.from('grocery_items').select('*').eq('project_id', project.id).order('checked').order('created_at'),
    ])
    setTasks(t || []); setNotes(n || []); setShopping(g || [])
  }

  const toggleTask = async (task) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
  }

  const addShop = async () => {
    const name = newShop.trim()
    if (!name) return
    const { data } = await supabase.from('grocery_items').insert({ name, project_id: project.id, category: project.name, checked: false }).select().single()
    if (data) setShopping(prev => [...prev, data])
    setNewShop('')
  }
  const toggleShop = async (it) => {
    await supabase.from('grocery_items').update({ checked: !it.checked }).eq('id', it.id)
    setShopping(prev => prev.map(x => x.id === it.id ? { ...x, checked: !x.checked } : x))
  }
  const removeShop = async (id) => {
    await supabase.from('grocery_items').delete().eq('id', id)
    setShopping(prev => prev.filter(x => x.id !== id))
  }

  const done = tasks.filter(t => t.completed).length
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0
  const imp = project.importance ? IMP_STYLES[project.importance] : null

  const statusMeta = project.status === 'completed'
    ? { label: 'Completed', color: 'var(--success)', bg: 'var(--event-dim)', border: 'var(--success)' }
    : project.status === 'backlog'
    ? { label: 'Backlog', color: 'var(--text-muted)', bg: 'var(--bg-card)', border: 'var(--border)' }
    : { label: 'Active', color: 'var(--accent)', bg: 'var(--accent-dim)', border: 'var(--accent-border)' }

  return (
    <div className="doc-page" style={{ paddingBottom: 40 }}>
      {/* ── Command bar: back · edit · complete ───────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
        <div style={{ flex: 1 }} />
        <div onClick={() => setEditModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 13px', borderRadius: 11, background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 1.5L11 3.5L4.5 10H2.5V8L9 1.5Z" stroke="var(--text-muted)" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Edit
        </div>
        {project.status !== 'completed' && (
          <div onClick={async () => { if(window.confirm('Mark this project as completed?')) { await supabase.from('projects').update({status:'completed'}).eq('id',project.id); onRefresh(); onBack() } }} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 11, background: 'var(--event-dim)', border: '1px solid var(--success)', color: 'var(--event-color)', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 11 11" fill="none"><polyline points="1,5.5 4,8.5 10,2.5" stroke="var(--event-color)" strokeWidth="1.7" fill="none" strokeLinecap="round"/></svg>
            Complete
          </div>
        )}
      </div>

      {/* ── Title block ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7, background: statusMeta.bg, border: `1px solid ${statusMeta.border}`, color: statusMeta.color }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusMeta.color }} />
            {statusMeta.label}
          </span>
          {imp && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7, background: imp.bg, border: `1px solid ${imp.border}`, color: imp.color }}>{project.importance}</span>}
          {project.sector && <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 7, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{project.sector}</span>}
          {project.folder && <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 7, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>📁 {project.folder}</span>}
        </div>
        <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1.15, color: 'var(--text-primary)' }}>{project.name}</div>
      </div>

      {project.goal && (
        <div style={{ marginBottom: 14, padding: '14px 16px', background: 'var(--accent-dim)', borderRadius: 14, border: '1px solid var(--accent-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 6 }}>Objective</div>
          <div style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{project.goal}</div>
        </div>
      )}
      {project.description && <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.55, padding: '13px 15px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)' }}>{project.description}</div>}

      {/* ── Progress hero ─────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-1px', color: color }}>{pct}%</span>
            <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>complete</span>
          </div>
          {project.due_date && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Due</div>
              <div style={{ fontFamily: "'DM Mono'", fontSize: 13, fontWeight: 500, color: project.due_date < today ? 'var(--danger)' : 'var(--text-secondary)' }}>{fmtDate(project.due_date)}</div>
            </div>
          )}
        </div>
        <div className="prog-bar" style={{ marginBottom: 16, height: 8 }}><div className="prog-fill" style={{ width: pct+'%', background: color }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[['Total', tasks.length,'var(--text-primary)'],['Done', done,'var(--success)'],['Left', tasks.length-done,'var(--accent)']].map(([l,v,c]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: c, fontFamily: "'DM Mono'" }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body tabs: Tasks · Notes · Shopping */}
      <div style={{ display:'flex', gap:6, marginBottom:18, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:4 }}>
        {[['tasks',`Tasks`],['notes',`Notes`],['shopping',`Shopping`]].map(([v,label])=>(
          <div key={v} onClick={()=>setBodyTab(v)} style={{ flex:1, textAlign:'center', padding:'9px 4px', borderRadius:9, fontSize:13, fontWeight:500, cursor:'pointer', background:bodyTab===v?'var(--accent-dim)':'transparent', color:bodyTab===v?'var(--accent)':'var(--text-muted)', transition:'all 0.15s' }}>{label}</div>
        ))}
      </div>

      {bodyTab === 'tasks' && (<>
      <div style={{ marginBottom: 18 }}>
        <div className="action-btn btn-task" style={{ width: '100%' }} onClick={() => onAddTask('today', { defaultProjectId: project.id, defaultSector: project.sector })}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add Task
        </div>
      </div>

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
        <div className="section-label" style={{ margin:0 }}>Tasks</div>
        <div style={{ display:'flex',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:9,overflow:'hidden' }}>
          {[['active',`Active (${tasks.filter(t=>!t.completed).length})`],['completed',`Done (${tasks.filter(t=>t.completed).length})`]].map(([v,label])=>(
            <div key={v} onClick={()=>setTaskTab(v)} style={{ padding:'6px 12px',fontSize:12,fontWeight:500,cursor:'pointer',background:taskTab===v?'var(--accent-dim)':'transparent',color:taskTab===v?'var(--accent)':'var(--text-muted)' }}>{label}</div>
          ))}
        </div>
      </div>
      {(() => {
        const shown = tasks.filter(t => taskTab === 'completed' ? t.completed : !t.completed)
        if (shown.length === 0) return <div style={{ textAlign:'center',padding:'20px',color:'var(--text-dim)',fontSize:13,border:'1px dashed var(--border)',borderRadius:12,marginBottom:18 }}>{taskTab==='completed'?'No completed tasks':'No active tasks'}</div>
        return (
      <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:20 }}>
        {shown.map(task => {
          const isOverdue = task.start_date < today && !task.completed
          return (
            <div key={task.id} onClick={() => onEditTask(task)} style={{ display:'flex',alignItems:'center',gap:10,padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,opacity:task.completed?0.4:1,cursor:'pointer' }}>
              <div onClick={e=>{e.stopPropagation();toggleTask(task)}} style={{ width:20,height:20,borderRadius:'50%',border:`1.5px solid ${task.completed?'var(--accent)':'var(--border-hover)'}`,background:task.completed?'var(--accent)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                {task.completed&&<svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:14,color:task.completed?'var(--text-dim)':'var(--text-secondary)',textDecoration:task.completed?'line-through':'none' }}>{task.name}</div>
                <div style={{ display:'flex',gap:8,marginTop:2,flexWrap:'wrap' }}>
                  {task.time_block&&<span style={{ fontFamily:"'DM Mono'",fontSize:11,color:'var(--text-dim)' }}>{task.time_block}</span>}
                  {task.start_date&&<span style={{ fontFamily:"'DM Mono'",fontSize:11,color:isOverdue?'var(--danger)':'var(--text-dim)' }}>{fmtDate(task.start_date)}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
        )
      })()}
      </>)}

      {bodyTab === 'notes' && (<>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
        <div className="section-label" style={{ margin:0 }}>Notes</div>
        <div onClick={()=>onEditNote({ newNoteProjectId: project.id, newNoteSector: project.sector })} style={{ fontSize:12,color:'var(--accent)',cursor:'pointer',padding:'4px 10px',background:'var(--accent-dim)',border:'1px solid var(--accent-border)',borderRadius:8 }}>+ Add note</div>
      </div>
      {notes.length===0&&<div style={{ textAlign:'center',padding:'16px',color:'var(--text-dim)',fontSize:13,border:'1px dashed var(--border)',borderRadius:12,marginBottom:18 }}>No notes yet</div>}
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {notes.map(note=>(
          <div key={note.id} onClick={()=>onEditNote({ openNoteId: note.id })} style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:14,cursor:'pointer' }}>
            <div style={{ fontSize:14,fontWeight:600,color:'var(--text-primary)',marginBottom:2 }}>{note.title || 'Untitled'}</div>
            <div style={{ fontSize:13,color:'var(--text-secondary)',lineHeight:1.5,overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>{note.text}</div>
            <div style={{ fontSize:11,color:'var(--text-dim)',fontFamily:"'DM Mono'",marginTop:6 }}>{new Date(note.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
      </>)}

      {bodyTab === 'shopping' && (<>
      {/* Shopping list — items scoped to this project */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
        <div className="section-label" style={{ margin:0 }}>Shopping list</div>
        {shopping.length>0 && <div style={{ fontSize:11.5,color:'var(--text-dim)',fontFamily:"'DM Mono'" }}>{shopping.filter(s=>!s.checked).length} to buy</div>}
      </div>
      <div style={{ display:'flex',gap:8,marginBottom:10 }}>
        <input type="text" placeholder="Add something to buy…" value={newShop}
          onChange={e=>setNewShop(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addShop() } }}
          style={{ flex:1,background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px',fontSize:16,color:'var(--text-primary)',fontFamily:"'DM Sans'",outline:'none' }} />
        <button onClick={addShop} style={{ background:'var(--accent-dim)',border:'1px solid var(--accent-border)',borderRadius:10,padding:'0 16px',color:'var(--accent)',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans'" }}>Add</button>
      </div>
      {shopping.length===0 ? (
        <div style={{ textAlign:'center',padding:'16px',color:'var(--text-dim)',fontSize:13,border:'1px dashed var(--border)',borderRadius:12 }}>
          Nothing to buy for this project yet — supplies, materials, whatever it needs.
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
          {shopping.map(it=>(
            <div key={it.id} style={{ display:'flex',alignItems:'center',gap:11,padding:'11px 14px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,opacity:it.checked?0.5:1 }}>
              <div onClick={()=>toggleShop(it)} style={{ width:20,height:20,borderRadius:6,border:`1.5px solid ${it.checked?'var(--success)':'var(--border-hover)'}`,background:it.checked?'var(--success)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer' }}>
                {it.checked && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>}
              </div>
              <div style={{ flex:1,fontSize:14,color:it.checked?'var(--text-dim)':'var(--text-secondary)',textDecoration:it.checked?'line-through':'none' }}>{it.name}</div>
              <div onClick={()=>removeShop(it.id)} style={{ fontSize:16,color:'var(--text-dim)',cursor:'pointer',padding:'0 4px' }}>×</div>
            </div>
          ))}
        </div>
      )}
      </>)}

      {editModal&&<ProjectModal project={project} onClose={()=>setEditModal(false)} onSaved={()=>{onRefresh();onBack()}} />}
    </div>
  )
}

export default function Projects({ onAddTask, onEditTask, onEditNote }) {
  const [projects, setProjects] = useState([])
  const [sectors, setSectors] = useState([])
  const [selected, setSelected] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId && projects.length) {
      const match = projects.find(p => String(p.id) === String(openId))
      if (match) { setSelected(match); setSearchParams({}, { replace: true }) }
    }
  }, [searchParams, projects])
  const [filter, setFilter] = useState('all')
  const [folder, setFolder] = useState(null) // null = folder index, else { id, label, icon }
  const openFolder = (f) => { setFolder(f); setFilter('all') }
  const [customFolders, setCustomFolders] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('nd_project_folders')) || []
      // back-compat: old entries were plain strings
      return raw.map(f => typeof f === 'string' ? { name: f, icon: '' } : f)
    } catch { return [] }
  })
  const [showFolderModal, setShowFolderModal] = useState(false)
  const persistFolders = (next) => { setCustomFolders(next); try { localStorage.setItem('nd_project_folders', JSON.stringify(next)) } catch {} }
  const addFolder = ({ name, icon }) => { persistFolders([...customFolders, { name, icon: icon || '' }]) }
  const deleteFolder = (name) => {
    const count = projects.filter(p => p.folder === name).length
    if (!window.confirm(count > 0 ? `"${name}" has ${count} project${count===1?'':'s'} inside. Delete the folder anyway? The projects will move to Unsorted.` : `Delete the folder "${name}"?`)) return
    persistFolders(customFolders.filter(f => f.name !== name))
  }
  const [editingFolder, setEditingFolder] = useState(null)
  const saveFolderEdit = async ({ name, icon, _original }) => {
    const oldName = _original?.name
    // update the folder record
    persistFolders(customFolders.map(f => f.name === oldName ? { name, icon: icon || '' } : f))
    // if the name changed, re-point every project that referenced the old name
    if (oldName && oldName !== name) {
      const affected = projects.filter(p => p.folder === oldName)
      if (affected.length) {
        await supabase.from('projects').update({ folder: name }).eq('folder', oldName)
        loadProjects()
      }
    }
    setEditingFolder(null)
  }
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadProjects()
    supabase.from('sectors').select('*').order('sort_order').order('name').then(({ data }) => setSectors(data || []))
  }, [])

  const loadProjects = async () => {
    const { data } = await supabase.from('projects').select('*, tasks(*), notes(*)').order('created_at', { ascending: false })
    setProjects(data || [])
  }

  if (selected) return <ProjectDetail project={selected} onBack={()=>setSelected(null)} onAddTask={onAddTask} onEditTask={onEditTask} onEditNote={onEditNote} onRefresh={loadProjects} />

  const inFolder = (p) => {
    if (!folder) return true
    if (folder.id === '__all__') return true
    if (folder.id === '__none__') return !p.folder
    if (folder._isSector) return p.sector === folder.id   // sector folder groups by sector
    return p.folder === folder.id                          // custom folder groups by folder
  }
  const filtered = projects.filter(p => {
    if (filter === 'all') { if (p.status === 'completed') return false }
    else if (p.status !== filter) return false
    return inFolder(p)
  })

  // ── Folder index ──────────────────────────────────────────────────────────
  if (!folder) {
    // All Projects (top, standalone)
    const allFolder = [{ id: '__all__', icon: 'icon:folder', label: 'All Projects', count: projects.filter(p => p.status !== 'completed').length, color: 'var(--accent)' }]

    // Sector folders — ALWAYS shown, even at zero, so every life sector appears
    const sectorFolders = sectors.map(s => ({
      id: s.name,
      icon: s.icon || '\u{1F4C1}',
      label: s.name,
      count: projects.filter(p => p.sector === s.name && p.status !== 'completed').length,
      _isSector: true,
    }))

    // Custom (non-sector) folders + Unsorted
    const customFolderRows = customFolders.map(f => ({
      id: f.name, icon: f.icon || '\u{1F4C1}', label: f.name, count: projects.filter(p => p.folder === f.name && p.status !== 'completed').length,
      _deletable: true, _folder: f,
    }))
    // Unsorted = projects with no custom folder assigned
    const noSector = projects.filter(p => (p.status !== 'completed') && !p.folder).length
    if (noSector > 0) customFolderRows.push({ id: '__none__', icon: '\u{1F4C4}', label: 'Unsorted', count: noSector })

    return (
      <div>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
          <div style={{ fontSize:20,fontWeight:500 }}>Projects</div>
          <div onClick={()=>setShowModal(true)} style={{ display:'flex',alignItems:'center',gap:6,background:'var(--accent-dim)',border:'1px solid var(--accent-border)',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontSize:13,color:'var(--accent)',fontWeight:500 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/></svg>
            New project
          </div>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:20 }}>
          {[['Active',projects.filter(p=>p.status==='active').length],['Backlog',projects.filter(p=>p.status==='backlog').length],['Done',projects.filter(p=>p.status==='completed').length]].map(([label,val])=>(
            <div key={label} style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:11,padding:12 }}>
              <div style={{ fontSize:11,color:'var(--text-dim)',marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:22,fontWeight:500 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* All Projects */}
        <FolderList folders={allFolder} onOpen={openFolder} />

        {/* Sectors */}
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--text-dim)', margin:'20px 4px 8px' }}>Sectors</div>
        <FolderList folders={sectorFolders} onOpen={openFolder} emptyText="No sectors yet" />

        {/* Custom folders */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'20px 4px 8px' }}>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--text-dim)' }}>Folders</div>
          <div onClick={()=>setShowFolderModal(true)} style={{ display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontSize:12.5,color:'var(--accent)',fontWeight:500 }}>
            + Folder
          </div>
        </div>
        {customFolderRows.length > 0
          ? <FolderList folders={customFolderRows} onOpen={openFolder} onDelete={(f)=>deleteFolder(f.id)} onEdit={(f)=>setEditingFolder(f._folder)} />
          : <div onClick={()=>setShowFolderModal(true)} style={{ textAlign:'center', padding:'16px', color:'var(--text-dim)', fontSize:13, border:'1px dashed var(--border)', borderRadius:14, cursor:'pointer' }}>Make a folder that isn't tied to a sector</div>}

        {showModal&&<ProjectModal onClose={()=>setShowModal(false)} onSaved={loadProjects} folderOptions={customFolders.map(f=>f.name)} />}
        {showFolderModal && <FolderSheet onClose={()=>setShowFolderModal(false)} onCreate={addFolder} />}
        {editingFolder && <FolderSheet folder={editingFolder} onClose={()=>setEditingFolder(null)} onCreate={saveFolderEdit} />}
      </div>
    )
  }

  // ── Inside a folder ───────────────────────────────────────────────────────
  return (
    <div>
      <FolderHeader
        icon={folder.icon}
        title={folder.label}
        subtitle={`${filtered.length} project${filtered.length===1?'':'s'}`}
        onBack={()=>setFolder(null)}
        right={
        <div onClick={()=>setShowModal(true)} style={{ display:'flex',alignItems:'center',gap:6,background:'var(--accent-dim)',border:'1px solid var(--accent-border)',borderRadius:10,padding:'7px 12px',cursor:'pointer',fontSize:12,color:'var(--accent)',fontWeight:500,flexShrink:0 }}>
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/></svg>
            New
          </div>
        }
      />

      <div style={{ display:'flex',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden',marginBottom:18 }}>
        {['all','active','backlog','completed'].map(f=>(
          <div key={f} onClick={()=>setFilter(f)} style={{ flex:1,textAlign:'center',padding:'10px 4px',fontSize:13,fontWeight:500,cursor:'pointer',background:filter===f?'var(--accent-dim)':'transparent',color:filter===f?'var(--accent)':'var(--text-muted)',transition:'all 0.15s' }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </div>
        ))}
      </div>

      {filtered.length===0&&<div style={{ textAlign:'center',padding:'40px 20px',color:'var(--text-dim)',fontSize:14 }}>No projects found</div>}

      {filtered.map(project=>{
        const tasks=project.tasks||[], done=tasks.filter(t=>t.completed).length, pct=tasks.length?Math.round(done/tasks.length*100):0
        const color=SECTOR_COLORS[project.sector?.toLowerCase()]||'var(--accent)'
        const today=todayLocal()
        const isOverdue=project.due_date&&project.due_date<today
        const isSoon=project.due_date&&!isOverdue&&project.due_date<=todayLocal(new Date(Date.now()+14*86400000))
        const imp=project.importance?IMP_STYLES[project.importance]:null
        return (
          <div key={project.id} onClick={()=>setSelected(project)} style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:14,padding:16,marginBottom:10,cursor:'pointer' }}>
            <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10,gap:10 }}>
              <div>
                <div style={{ fontSize:15,fontWeight:500,marginBottom:4 }}>{project.name}</div>
                <div style={{ display:'flex',gap:6,flexWrap:'wrap',alignItems:'center' }}>
                  {project.sector&&<span style={{ fontSize:11,color:'var(--text-dim)',background:'var(--border)',padding:'2px 8px',borderRadius:6 }}>{project.sector}</span>}
                  {imp&&<span style={{ fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:6,background:imp.bg,border:`1px solid ${imp.border}`,color:imp.color }}>{project.importance}</span>}
                </div>
              </div>
            </div>
            {project.description&&<div style={{ fontSize:13,color:'var(--text-dim)',marginBottom:12,lineHeight:1.5 }}>{project.description}</div>}
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
              <div className="prog-bar" style={{ flex:1 }}><div className="prog-fill" style={{ width:pct+'%',background:color }} /></div>
              <div style={{ fontFamily:"'DM Mono'",fontSize:11,color:'var(--text-muted)',minWidth:32,textAlign:'right' }}>{pct}%</div>
            </div>
            <div style={{ display:'flex',alignItems:'center' }}>
              <div style={{ fontSize:12,color:'var(--text-dim)' }}>{done} of {tasks.length} tasks done</div>
              {project.due_date&&<div style={{ fontFamily:"'DM Mono'",fontSize:11,color:isOverdue?'var(--danger)':isSoon?'var(--warn)':'var(--text-dim)',marginLeft:'auto' }}>Due {fmtDate(project.due_date)}{isOverdue?' ↑':''}</div>}
            </div>
          </div>
        )
      })}

      {showModal&&<ProjectModal
        onClose={()=>setShowModal(false)}
        onSaved={loadProjects}
        folderOptions={customFolders.map(f=>f.name)}
        defaultSector={folder && folder._isSector ? folder.id : undefined}
        defaultFolder={folder && !folder._isSector && folder.id !== '__all__' && folder.id !== '__none__' ? folder.id : undefined}
      />}
    </div>
  )
}
