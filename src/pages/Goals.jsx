import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TIMEFRAMES = [
  { key: '1month',  label: '1 Month',  section: 'Current Focus', prominent: true },
  { key: '3month',  label: '3 Month',  section: 'Current Focus', prominent: true },
  { key: '6month',  label: '6 Month',  section: 'Near Term', prominent: false },
  { key: '1year',   label: '1 Year',   section: 'Near Term', prominent: false },
  { key: '5year',   label: '5 Year',   section: 'Long Term', prominent: false },
  { key: '10year',  label: '10 Year',  section: 'Long Term', prominent: false },
  { key: '15year',  label: '15 Year',  section: 'Vision', prominent: false },
  { key: '20year',  label: '20 Year',  section: 'Vision', prominent: false },
]

const SECTIONS = ['Current Focus', 'Near Term', 'Long Term', 'Vision']

const SECTION_STYLES = {
  'Current Focus': { borderColor: '#7a3410', bg: '#1e1208', labelColor: '#d4520f' },
  'Near Term':     { borderColor: '#1a3a5c', bg: '#0c1a2e', labelColor: '#3b82f6' },
  'Long Term':     { borderColor: '#1a3a2a', bg: '#0a1e14', labelColor: '#10b981' },
  'Vision':        { borderColor: '#2a1a5c', bg: '#16112e', labelColor: '#a78bfa' },
}

function GoalEditModal({ tf, goal, onClose, onSaved }) {
  const [text, setText] = useState(goal?.goal_text || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    if (goal) {
      await supabase.from('goals').update({ goal_text: text.trim(), updated_at: new Date().toISOString() }).eq('id', goal.id)
    } else {
      await supabase.from('goals').insert({ timeframe: tf.key, goal_text: text.trim() })
    }
    setSaving(false); onSaved(); onClose()
  }

  const handleClear = async () => {
    if (!goal) return
    if (!window.confirm('Clear this goal?')) return
    await supabase.from('goals').delete().eq('id', goal.id)
    onSaved(); onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">
          {tf.label} Goal
          <div className="modal-close" onClick={onClose}>×</div>
        </div>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>What do you want to achieve in {tf.label.toLowerCase()}?</div>
        <div className="field">
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={`Set your ${tf.label.toLowerCase()} goal...`} style={{ height: 120 }} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {goal && <button onClick={handleClear} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Clear</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving || !text.trim()}>{saving ? 'Saving…' : 'Save goal'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Goals() {
  const [goals, setGoals] = useState({})
  const [editModal, setEditModal] = useState(null)

  useEffect(() => { loadGoals() }, [])

  const loadGoals = async () => {
    const { data } = await supabase.from('goals').select('*')
    const map = {}
    ;(data || []).forEach(g => { map[g.timeframe] = g })
    setGoals(map)
  }

  const fmtDate = (d) => {
    if (!d) return null
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Goals</div>
        <div style={{ fontSize: 13, color: '#555', marginTop: 3 }}>Your long-term direction</div>
      </div>

      {SECTIONS.map(section => {
        const tfs = TIMEFRAMES.filter(t => t.section === section)
        const styles = SECTION_STYLES[section]
        return (
          <div key={section} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: styles.labelColor, textTransform: 'uppercase', marginBottom: 12 }}>{section}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tfs.map(tf => {
                const goal = goals[tf.key]
                const hasGoal = !!(goal?.goal_text)
                return (
                  <div key={tf.key} onClick={() => setEditModal({ tf, goal })} style={{ background: hasGoal ? styles.bg : '#161618', border: `1px solid ${hasGoal ? styles.borderColor : '#242428'}`, borderRadius: 14, padding: tf.prominent ? 20 : 16, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hasGoal ? 10 : 0 }}>
                      <div style={{ fontSize: tf.prominent ? 13 : 12, fontWeight: 600, color: hasGoal ? styles.labelColor : '#444', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{tf.label}</div>
                      <div style={{ fontSize: 18, color: '#333' }}>›</div>
                    </div>
                    {hasGoal
                      ? <>
                          <div style={{ fontSize: tf.prominent ? 16 : 14, color: '#e8e6e1', lineHeight: 1.5, fontWeight: tf.prominent ? 500 : 400 }}>{goal.goal_text}</div>
                          {goal.updated_at && <div style={{ fontSize: 11, color: '#444', marginTop: 8, fontFamily: "'DM Mono'" }}>Updated {fmtDate(goal.updated_at)}</div>}
                        </>
                      : <div style={{ fontSize: 13, color: '#3a3a3a', marginTop: 4 }}>Set your {tf.label.toLowerCase()} goal →</div>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {editModal && <GoalEditModal tf={editModal.tf} goal={editModal.goal} onClose={() => setEditModal(null)} onSaved={loadGoals} />}
    </div>
  )
}
