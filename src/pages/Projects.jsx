import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadProjects() }, [])

  const loadProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*, tasks(*), notes(*)')
      .order('created_at', { ascending: false })
    setProjects(data || [])
  }

  const toggleTask = async (task, projectId) => {
    const updated = !task.completed
    await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
    setProjects(prev => prev.map(p => p.id === projectId
      ? { ...p, tasks: p.tasks.map(t => t.id === task.id ? { ...t, completed: updated } : t) }
      : p
    ))
  }

  const SECTOR_PILLS = {
    business: 'pill-biz', 'real estate': 'pill-re', health: 'pill-health',
    'personal growth': 'pill-growth', family: 'pill-family', hobbies: 'pill-hobbies',
  }

  const filtered = projects.filter(p => filter === 'all' || p.status === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Projects</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1208', border: '1px solid #7a3410', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#d4520f', fontWeight: 500 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="#d4520f" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="#d4520f" strokeWidth="1.8" strokeLinecap="round"/></svg>
          New project
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {['all','active','backlog','completed'].map(f => (
          <div key={f} onClick={() => setFilter(f)} style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: filter === f ? '#1e1208' : '#161618', borderColor: filter === f ? '#7a3410' : '#242428', color: filter === f ? '#d4520f' : '#666' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {[['Active', projects.filter(p=>p.status==='active').length],['Backlog', projects.filter(p=>p.status==='backlog').length],['Done', projects.filter(p=>p.status==='completed').length]].map(([label, val]) => (
          <div key={label} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 11, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{val}</div>
          </div>
        ))}
      </div>

      {filtered.map(project => {
        const tasks = project.tasks || []
        const notes = project.notes || []
        const done = tasks.filter(t => t.completed).length
        const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
        const isExpanded = expanded === project.id
        const pillClass = SECTOR_PILLS[project.sector?.toLowerCase()] || 'pill-biz'
        const today = new Date().toISOString().split('T')[0]
        const isOverdue = project.due_date && project.due_date < today
        const isSoon = project.due_date && !isOverdue && project.due_date <= new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

        return (
          <div key={project.id} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16, marginBottom: 10, cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : project.id)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{project.name}</div>
              <span className={`pill ${pillClass}`}>{project.sector}</span>
            </div>
            {project.description && <div style={{ fontSize: 13, color: '#555', marginBottom: 12, lineHeight: 1.5 }}>{project.description}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div className="prog-bar" style={{ flex: 1 }}><div className="prog-fill" style={{ width: pct + '%' }} /></div>
              <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: '#666', minWidth: 32, textAlign: 'right' }}>{pct}%</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 12, color: '#555' }}>{done} of {tasks.length} tasks done</div>
              {project.due_date && <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: isOverdue ? '#f87171' : isSoon ? '#f59e0b' : '#555', marginLeft: 'auto' }}>Due {project.due_date}{isOverdue ? ' ↑' : ''}</div>}
            </div>

            {isExpanded && (
              <div style={{ marginTop: 14, borderTop: '1px solid #1e1e24', paddingTop: 14 }}>
                {/* Tasks */}
                {tasks.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>Tasks</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                      {tasks.map(task => (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#0f0f11', border: '1px solid #1e1e24', borderRadius: 10 }} onClick={e => { e.stopPropagation(); toggleTask(task, project.id) }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${task.completed ? '#d4520f' : '#333'}`, background: task.completed ? '#d4520f' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {task.completed && <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                          </div>
                          <span style={{ fontSize: 13, color: task.completed ? '#555' : '#c0bdb7', textDecoration: task.completed ? 'line-through' : 'none', flex: 1 }}>{task.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {/* Notes */}
                {notes.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>Linked notes</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {notes.map(note => (
                        <div key={note.id} style={{ padding: '8px 10px', background: '#0f0f11', border: '1px solid #1e1e24', borderRadius: 10, fontSize: 13, color: '#c0bdb7' }}>
                          {note.text}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
