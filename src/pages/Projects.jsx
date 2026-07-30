import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSearchParams } from 'react-router-dom'
import { fmtDate } from '../utils'
import FolderList, { FolderHeader } from '../components/FolderList'
import FolderSheet from '../components/FolderSheet'

const IMPORTANCE = ['Critical','High','Medium','Low']
const IMP_STYLES = {
  Critical: { bg: 'var(--danger-dim)', border: 'var(--danger-border)', color: 'var(--danger)' },
  High:     { bg: 'var(--accent-dim)', border: 'var(--accent-border)', color: 'var(--accent-text)' },
  Medium:   { bg: 'var(--warn-dim)', border: 'var(--warn-border)', color: 'var(--warn)' },
  Low:      { bg: 'var(--success-dim)', border: 'var(--success-border)', color: 'var(--event-color)' },
}
const SECTOR_COLORS = {
  business: '#d4520f', 'real estate': '#3b82f6', health: '#10b981',
  'personal growth': '#f59e0b', family: '#ec4899', hobbies: '#a78bfa',
}

function ProjectModal({ onClose, onSaved, project, defaultSector, defaultFolder, folderOptions = [] }) {
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
  const [importance, setImportance] = useState(project?.importance || 'Medium')
  const [sectors, setSectors] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('sectors').select('name').order('sort_order').order('name').then(({ data }) => setSectors(data || []))
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
    }
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
      <div className="modal-sheet doc-page">
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, position: 'sticky', top: 14, background: 'var(--bg)', zIndex: 5, paddingBottom: 8 }}>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' }}>{isEdit ? 'Edit project' : 'New project'}</div>
        </div>
        <div className="field"><div className="field-label">Project name</div><input type="text" placeholder="What are you working on?" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field"><div className="field-label">Objective</div><textarea placeholder="What does 'done' look like for this project?" value={goal} onChange={e => setGoal(e.target.value)} style={{ minHeight: 60 }} /></div>
        <div className="field"><div className="field-label">Description / notes</div><textarea placeholder="Context, details, anything worth remembering" value={description} onChange={e => setDescription(e.target.value)} /></div>
        <div className="field">
          <div className="field-label">Importance</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {IMPORTANCE.map(imp => {
              const s = IMP_STYLES[imp]; const active = importance === imp
              return <div key={imp} onClick={() => setImportance(imp)} style={{ flex: 1, padding: '7px 4px', borderRadius: 9, textAlign: 'center', fontSize: 11, fontWeight: 500, cursor: 'pointer', background: active ? s.bg : 'var(--bg)', border: `1px solid ${active ? s.border : 'var(--border)'}`, color: active ? s.color : 'var(--text-dim)' }}>{imp}</div>
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
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <>
            <button onClick={handleDelete} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>
            <button onClick={handleComplete} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--event-dim)', border: '1px solid var(--success)', color: 'var(--event-color)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>✓ Complete</button>
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
      <div className="modal-sheet doc-page">
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, position: 'sticky', top: 14, background: 'var(--bg)', zIndex: 5, paddingBottom: 8 }}>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>‹</div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' }}>{note ? 'Edit note' : 'New note'}</div>
        </div>
        <div className="field"><div className="field-label">Note</div><textarea placeholder="Add a note..." value={text} onChange={e => setText(e.target.value)} style={{ height: 120 }} /></div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {note && <button onClick={async () => { await supabase.from('notes').delete().eq('id', note.id); onSaved(); onClose() }} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>}
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
  const [shopping, setShopping] = useState([])
  const [newShop, setNewShop] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [noteModal, setNoteModal] = useState(null)
  const today = new Date().toISOString().split('T')[0]
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>‹</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{project.name}</div>
            {imp && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: imp.bg, border: `1px solid ${imp.border}`, color: imp.color, flexShrink: 0 }}>{project.importance}</span>}
          </div>
          {project.sector && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{project.sector}</div>}
        </div>
        {project.status !== 'completed' && (
          <div onClick={async () => { if(window.confirm('Mark as completed?')) { await supabase.from('projects').update({status:'completed'}).eq('id',project.id); onRefresh(); onBack() } }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 10, background: 'var(--event-dim)', border: '1px solid var(--success)', color: 'var(--event-color)', fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><polyline points="1,5.5 4,8.5 10,2.5" stroke="var(--event-color)" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
            Done
          </div>
        )}
        <div onClick={() => setEditModal(true)} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 1.5L11 3.5L4.5 10H2.5V8L9 1.5Z" stroke="var(--text-muted)" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {project.goal && (
        <div style={{ marginBottom: 12, padding: '13px 15px', background: 'var(--accent-dim)', borderRadius: 12, border: '1px solid var(--accent-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Objective</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{project.goal}</div>
        </div>
      )}
      {project.description && <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5, padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>{project.description}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
        {[['Tasks', tasks.length,'var(--text-primary)'],['Done', done,'var(--success)'],['Left', tasks.length-done,'var(--accent)']].map(([l,v,c]) => (
          <div key={l} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div className="prog-bar" style={{ flex: 1 }}><div className="prog-fill" style={{ width: pct+'%', background: color }} /></div>
        <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--text-muted)' }}>{pct}%</div>
        {project.due_date && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: project.due_date < today ? 'var(--danger)' : 'var(--text-dim)' }}>Due {fmtDate(project.due_date)}</div>}
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="action-btn btn-task" style={{ width: '100%' }} onClick={() => onAddTask('today', { defaultProjectId: project.id, defaultSector: project.sector })}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="1" x2="7.5" y2="14" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7.5" x2="14" y2="7.5" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add Task
        </div>
      </div>

      <div className="section-label">Tasks</div>
      {tasks.length === 0 && <div style={{ textAlign:'center',padding:'20px',color:'var(--text-dim)',fontSize:13,border:'1px dashed var(--border)',borderRadius:12,marginBottom:18 }}>No tasks yet</div>}
      <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:20 }}>
        {tasks.map(task => {
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

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
        <div className="section-label" style={{ margin:0 }}>Notes</div>
        <div onClick={()=>setNoteModal('new')} style={{ fontSize:12,color:'var(--accent)',cursor:'pointer',padding:'4px 10px',background:'var(--accent-dim)',border:'1px solid var(--accent-border)',borderRadius:8 }}>+ Add note</div>
      </div>
      {notes.length===0&&<div style={{ textAlign:'center',padding:'16px',color:'var(--text-dim)',fontSize:13,border:'1px dashed var(--border)',borderRadius:12,marginBottom:18 }}>No notes yet</div>}
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {notes.map(note=>(
          <div key={note.id} onClick={()=>setNoteModal(note)} style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:12,padding:14,cursor:'pointer' }}>
            <div style={{ fontSize:14,color:'var(--text-secondary)',lineHeight:1.5 }}>{note.text}</div>
            <div style={{ fontSize:11,color:'var(--text-dim)',fontFamily:"'DM Mono'",marginTop:6 }}>{new Date(note.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>

      {/* Shopping list — items scoped to this project */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:22,marginBottom:10 }}>
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

      {editModal&&<ProjectModal project={project} onClose={()=>setEditModal(false)} onSaved={()=>{onRefresh();onBack()}} />}
      {noteModal&&<NoteModal projectId={project.id} note={noteModal==='new'?null:noteModal} onClose={()=>setNoteModal(null)} onSaved={loadDetail} />}
    </div>
  )
}

export default function Projects({ onAddTask, onEditTask }) {
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
  const [filter, setFilter] = useState('active')
  const [folder, setFolder] = useState(null) // null = folder index, else { id, label, icon }
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

  if (selected) return <ProjectDetail project={selected} onBack={()=>setSelected(null)} onAddTask={onAddTask} onEditTask={onEditTask} onRefresh={loadProjects} />

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
        <FolderList folders={allFolder} onOpen={setFolder} />

        {/* Sectors */}
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--text-dim)', margin:'20px 4px 8px' }}>Sectors</div>
        <FolderList folders={sectorFolders} onOpen={setFolder} emptyText="No sectors yet" />

        {/* Custom folders */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'20px 4px 8px' }}>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--text-dim)' }}>Folders</div>
          <div onClick={()=>setShowFolderModal(true)} style={{ display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontSize:12.5,color:'var(--accent)',fontWeight:500 }}>
            + Folder
          </div>
        </div>
        {customFolderRows.length > 0
          ? <FolderList folders={customFolderRows} onOpen={setFolder} onDelete={(f)=>deleteFolder(f.id)} onEdit={(f)=>setEditingFolder(f._folder)} />
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
        const today=new Date().toISOString().split('T')[0]
        const isOverdue=project.due_date&&project.due_date<today
        const isSoon=project.due_date&&!isOverdue&&project.due_date<=new Date(Date.now()+14*86400000).toISOString().split('T')[0]
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
