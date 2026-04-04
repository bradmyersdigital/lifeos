import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const FREQ_MULT = { weekly: 4, biweekly: 2, monthly: 1, yearly: 1/12 }
const toMonthly = (amount, freq) => (parseFloat(amount) || 0) * (FREQ_MULT[freq] || 1)

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function EntryModal({ type, item, onClose, onSaved }) {
  const isEdit = !!item
  const [name, setName] = useState(item?.name || '')
  const [amount, setAmount] = useState(item?.amount || '')
  const [dueDate, setDueDate] = useState(item?.due_date || '')
  const [frequency, setFrequency] = useState(item?.frequency || 'monthly')
  const [isActive, setIsActive] = useState(item?.is_active !== false)
  const [saving, setSaving] = useState(false)

  const table = type === 'income' ? 'finance_income' : type === 'subscription' ? 'finance_subscriptions' : type === 'bill' ? 'finance_bills' : 'finance_savings'

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = type === 'savings'
      ? { name: name.trim(), monthly_target: parseFloat(amount) || 0 }
      : type === 'income'
      ? { name: name.trim(), amount: parseFloat(amount) || 0, frequency }
      : { name: name.trim(), amount: parseFloat(amount) || 0, frequency, is_active: isActive, due_date: dueDate || null }
    if (isEdit) await supabase.from(table).update(payload).eq('id', item.id)
    else await supabase.from(table).insert(payload)
    setSaving(false); onSaved(); onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    await supabase.from(table).delete().eq('id', item.id)
    onSaved(); onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? `Edit ${type}` : `Add ${type}`}<div className="modal-close" onClick={onClose}>×</div></div>
        <div className="field"><div className="field-label">Name</div><input type="text" placeholder={`e.g. ${type === 'income' ? 'Salary' : type === 'subscription' ? 'Netflix' : type === 'bill' ? 'Rent' : 'Emergency fund'}`} value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field"><div className="field-label">{type === 'savings' ? 'Monthly target ($)' : 'Amount ($)'}</div><input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        {type !== 'savings' && (
          <div className="field-row">
            <div className="field"><div className="field-label">Frequency</div>
              <select value={frequency} onChange={e => setFrequency(e.target.value)}>
                <option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
              </select>
            </div>
            {(type === 'subscription' || type === 'bill') && (<div className="field"><div className="field-label">Due date</div><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ minHeight: 40 }} /></div>)}
          </div>
        )}
        {(type === 'subscription' || type === 'bill') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div onClick={() => setIsActive(!isActive)} style={{ width: 36, height: 20, borderRadius: 10, background: isActive ? '#1e1208' : '#1e1e24', border: `1px solid ${isActive ? '#7a3410' : '#333'}`, position: 'relative', cursor: 'pointer' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: isActive ? '#d4520f' : '#555', position: 'absolute', top: 1, left: isActive ? 17 : 1, transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: 13, color: '#888' }}>{isActive ? 'Active' : 'Inactive'}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={handleDelete} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Finance() {
  const [subs, setSubs] = useState([])
  const [bills, setBills] = useState([])
  const [income, setIncome] = useState([])
  const [savings, setSavings] = useState([])
  const [modal, setModal] = useState(null)
  const [currentSavings, setCurrentSavings] = useState('')
  const [section, setSection] = useState(null) // expanded section

  const now = new Date()
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const [{ data: s }, { data: b }, { data: i }, { data: sv }] = await Promise.all([
      supabase.from('finance_subscriptions').select('*').order('name'),
      supabase.from('finance_bills').select('*').order('due_date'),
      supabase.from('finance_income').select('*').order('name'),
      supabase.from('finance_savings').select('*').order('name'),
    ])
    setSubs(s || []); setBills(b || []); setIncome(i || []); setSavings(sv || [])
  }

  const totalIncome = income.reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0)
  const totalSubs = subs.filter(s => s.is_active !== false).reduce((sum, s) => sum + toMonthly(s.amount, s.frequency), 0)
  const totalBills = bills.filter(b => b.is_active !== false).reduce((sum, b) => sum + toMonthly(b.amount, b.frequency), 0)
  const totalSavings = savings.reduce((sum, s) => sum + (parseFloat(s.monthly_target) || 0), 0)
  const totalExpenses = totalSubs + totalBills
  const savedThisMonth = parseFloat(currentSavings) || 0
  const leftOver = totalIncome - totalExpenses - totalSavings - savedThisMonth

  const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const soon = new Date(); soon.setDate(soon.getDate() + 7)
  const todayStr = now.toISOString().split('T')[0]
  const soonStr = soon.toISOString().split('T')[0]
  const dueSoon = [...subs.filter(s => s.due_date >= todayStr && s.due_date <= soonStr), ...bills.filter(b => b.due_date >= todayStr && b.due_date <= soonStr)].sort((a, b) => a.due_date?.localeCompare(b.due_date))

  const TILES = [
    { key: 'subscription', label: 'Subscriptions', icon: '🔄', summary: `${fmt(totalSubs)}/mo · ${subs.filter(s=>s.is_active!==false).length} active`, color: '#a78bfa' },
    { key: 'bill', label: 'Bills', icon: '🧾', summary: `${fmt(totalBills)}/mo · ${bills.filter(b=>b.is_active!==false).length} items`, color: '#3b82f6' },
    { key: 'income', label: 'Income', icon: '💰', summary: `${fmt(totalIncome)}/mo`, color: '#10b981' },
    { key: 'savings', label: 'Savings', icon: '🏦', summary: `${fmt(totalSavings)} goal/mo`, color: '#f59e0b' },
  ]

  const getItems = (key) => key === 'subscription' ? subs : key === 'bill' ? bills : key === 'income' ? income : savings

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Finances</div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 2, fontFamily: "'DM Mono'" }}>{monthLabel}</div>
        </div>
      </div>

      {/* Main overview card */}
      <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', marginBottom: 16 }}>Monthly snapshot</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[['Income', totalIncome, '#10b981'],['Expenses', totalExpenses, '#f87171'],['Monthly Savings Goal', totalSavings, '#f59e0b'],['Saved This Month', parseFloat(currentSavings)||0, '#10b981']].map(([l,v,c]) => (
            <div key={l}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: c }}>{fmt(v)}</div>
            </div>
          ))}
          <div style={{ gridColumn: '1/-1', borderTop: '1px solid #2a2a30', paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Left over</div>
            <div style={{ fontSize: 32, fontWeight: 500, color: leftOver >= 0 ? '#10b981' : '#f87171' }}>{fmt(leftOver)}</div>
            {leftOver < 0 && <div style={{ fontSize: 13, color: '#f87171', marginTop: 6, fontWeight: 500 }}>⚠️ You are overspending by {fmt(Math.abs(leftOver))}</div>}
            {leftOver > 0 && leftOver < totalIncome * 0.1 && <div style={{ fontSize: 13, color: '#f59e0b', marginTop: 6 }}>💡 Tight this month — only {fmt(leftOver)} remaining</div>}
            {leftOver >= totalIncome * 0.1 && totalIncome > 0 && <div style={{ fontSize: 13, color: '#10b981', marginTop: 6 }}>✅ Looking good! {fmt(leftOver)} left after expenses</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: '#1e1e24', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: totalIncome > 0 ? Math.min(100, totalExpenses / totalIncome * 100) + '%' : '0%', background: totalExpenses > totalIncome ? '#f87171' : '#d4520f', borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 6, fontFamily: "'DM Mono'" }}>{totalIncome > 0 ? Math.round(totalExpenses / totalIncome * 100) : 0}% of income spent</div>
      </div>

      {/* Stat chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
        {[['Subs', fmt(totalSubs), `${subs.filter(s=>s.is_active!==false).length} active`,'#a78bfa'],['Bills', fmt(totalBills), `${bills.filter(b=>b.is_active!==false).length} items`,'#3b82f6'],['Due soon', dueSoon.length, 'next 7 days','#f87171'],['Goal', fmt(totalSavings), 'monthly','#f59e0b']].map(([l,v,s,cc])=>(
          <div key={l} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: cc }}>{v}</div>
            <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#161618', border: '1px solid #1a3a2a', borderRadius: 12, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Current savings balance</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: '#10b981', fontFamily: "'DM Mono'" }}>$</span>
            <input type="number" placeholder="0" value={currentSavings} onChange={e => setCurrentSavings(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 22, fontWeight: 500, color: '#10b981', fontFamily: "'DM Mono'", width: '100%' }} />
          </div>
        </div>
        <div style={{ fontSize: 24 }}>🏦</div>
      </div>

      {/* Action tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {TILES.map(tile => (
          <div key={tile.key}>
            <div onClick={() => setSection(section === tile.key ? null : tile.key)} style={{ background: '#161618', border: `1px solid ${section === tile.key ? tile.color + '66' : '#242428'}`, borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'border-color 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 24 }}>{tile.icon}</div>
                <div onClick={e => { e.stopPropagation(); setModal({ type: tile.key, item: null }) }} style={{ width: 26, height: 26, borderRadius: 8, background: '#1e1e24', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><line x1="5.5" y1="1" x2="5.5" y2="10" stroke="#666" strokeWidth="1.6" strokeLinecap="round"/><line x1="1" y1="5.5" x2="10" y2="5.5" stroke="#666" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{tile.label}</div>
              <div style={{ fontSize: 12, color: '#555' }}>{tile.summary}</div>
            </div>
            {section === tile.key && (
              <div style={{ background: '#0f0f11', border: '1px solid #1e1e24', borderRadius: '0 0 14px 14px', padding: '10px 14px', marginTop: -4 }}>
                {getItems(tile.key).length === 0
                  ? <div style={{ fontSize: 13, color: '#444', textAlign: 'center', padding: '8px 0' }}>None added yet</div>
                  : getItems(tile.key).map(item => (
                    <div key={item.id} onClick={() => setModal({ type: tile.key, item })} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e1e24', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#d4d2cc' }}>{item.name}</div>
                        {item.due_date && <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>Due {item.due_date}</div>}
                      </div>
                      <div style={{ fontSize: 13, color: tile.color, fontFamily: "'DM Mono'" }}>
                        {tile.key === 'savings' ? fmt(item.monthly_target || 0) : fmt(toMonthly(item.amount, item.frequency))}/mo
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom two cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', marginBottom: 10 }}>Due soon</div>
          {dueSoon.length === 0
            ? <div style={{ fontSize: 12, color: '#444', textAlign: 'center', padding: '8px 0' }}>Nothing due</div>
            : dueSoon.slice(0, 5).map((item, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#d4d2cc' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <div style={{ fontSize: 11, color: '#555', fontFamily: "'DM Mono'" }}>{item.due_date}</div>
                  <div style={{ fontSize: 11, color: '#d4520f', fontFamily: "'DM Mono'" }}>{fmt(item.amount)}</div>
                </div>
              </div>
            ))
          }
        </div>
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', marginBottom: 10 }}>Breakdown</div>
          {[['Subscriptions', totalSubs, '#a78bfa'],['Bills', totalBills, '#3b82f6'],['Total out', totalExpenses, '#f87171'],['Left over', leftOver, leftOver >= 0 ? '#10b981' : '#f87171']].map(([l,v,c])=>(
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#555' }}>{l}</div>
              <div style={{ fontSize: 12, color: c, fontFamily: "'DM Mono'" }}>{fmt(v)}</div>
            </div>
          ))}
        </div>
      </div>

      {modal && <EntryModal type={modal.type} item={modal.item} onClose={() => setModal(null)} onSaved={loadAll} />}
    </div>
  )
}
