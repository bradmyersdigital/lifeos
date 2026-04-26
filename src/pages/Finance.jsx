import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FREQ_MULT = { weekly: 52/12, biweekly: 26/12, monthly: 1, yearly: 1/12 }
const toMonthly = (amount, freq) => (parseFloat(amount) || 0) * (FREQ_MULT[freq] || 1)
const toYearly = (amount, freq) => (parseFloat(amount) || 0) * ({ weekly: 52, biweekly: 26, monthly: 12, yearly: 1 }[freq] || 12)
const fmt = (n) => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const SUB_CATEGORIES = ['Entertainment','Music','News & Reading','Health & Fitness','Productivity','Cloud Storage','Food & Drink','Shopping','Finance','Gaming','Education','Other']

const CAT_ICONS = {
  'Entertainment': '🎬', 'Music': '🎵', 'News & Reading': '📰',
  'Health & Fitness': '💪', 'Productivity': '⚡', 'Cloud Storage': '☁️',
  'Food & Drink': '🍔', 'Shopping': '🛍️', 'Finance': '💳',
  'Gaming': '🎮', 'Education': '📚', 'Other': '📦'
}

const CAT_COLORS = {
  'Entertainment': '#f43f5e', 'Music': '#a78bfa', 'News & Reading': '#06b6d4',
  'Health & Fitness': '#10b981', 'Productivity': '#f59e0b', 'Cloud Storage': '#3b82f6',
  'Food & Drink': '#f97316', 'Shopping': '#ec4899', 'Finance': '#10b981',
  'Gaming': '#8b5cf6', 'Education': '#06b6d4', 'Other': '#555'
}

// Known service logos/icons
const SERVICE_ICONS = {
  netflix: '🎬', spotify: '🎵', 'apple music': '🎵', hulu: '📺', 'disney+': '🏰', 'disney plus': '🏰',
  'hbo max': '🎭', youtube: '▶️', 'youtube premium': '▶️', amazon: '📦', 'amazon prime': '📦',
  'apple tv': '📺', 'apple tv+': '📺', 'apple icloud': '☁️', icloud: '☁️',
  'google one': '☁️', dropbox: '☁️', 'microsoft 365': '💼', office: '💼',
  'adobe': '🎨', 'adobe creative': '🎨', figma: '🎨', notion: '📝', slack: '💬',
  zoom: '📹', 'linkedin premium': '👔', audible: '🎧', kindle: '📚',
  duolingo: '🦜', 'peloton': '🚴', 'calm': '🧘', headspace: '🧘',
  'planet fitness': '💪', 'nytimes': '📰', 'wsj': '📰', 'chatgpt': '🤖',
  'chatgpt plus': '🤖', 'openai': '🤖', '1password': '🔑', lastpass: '🔑',
  'nintendo': '🎮', 'xbox': '🎮', 'playstation': '🎮', 'ea play': '🎮',
  instacart: '🛒', doordash: '🍔', 'grubhub': '🍔', 'hims': '💊', 'noom': '⚖️',
}

function getServiceIcon(name) {
  if (!name) return null
  const lower = name.toLowerCase()
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return null
}

// ── Sub Modal ────────────────────────────────────────────────────────────────
function SubModal({ item, onClose, onSaved }) {
  const isEdit = !!item
  const [name, setName] = useState(item?.name || '')
  const [amount, setAmount] = useState(item?.amount || '')
  const [frequency, setFrequency] = useState(item?.frequency || 'monthly')
  const [category, setCategory] = useState(item?.category || 'Entertainment')
  const [billingDay, setBillingDay] = useState(item?.billing_day || '')
  const [isActive, setIsActive] = useState(item?.is_active !== false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = { name: name.trim(), amount: parseFloat(amount)||0, frequency, category, billing_day: parseInt(billingDay)||null, is_active: isActive }
    if (isEdit) await supabase.from('finance_subscriptions').update(payload).eq('id', item.id)
    else await supabase.from('finance_subscriptions').insert(payload)
    setSaving(false); onSaved(); onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    await supabase.from('finance_subscriptions').delete().eq('id', item.id)
    onSaved(); onClose()
  }

  const serviceIcon = getServiceIcon(name)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? 'Edit subscription' : 'Add subscription'}<div className="modal-close" onClick={onClose}>×</div></div>

        {/* Name with auto-icon preview */}
        <div className="field">
          <div className="field-label">Service name</div>
          <div style={{ position: 'relative' }}>
            {serviceIcon && <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>{serviceIcon}</div>}
            <input type="text" placeholder="e.g. Netflix, Spotify…" value={name} onChange={e => setName(e.target.value)}
              style={{ paddingLeft: serviceIcon ? 38 : 12 }} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <div className="field-label">Amount ($)</div>
            <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-label">Frequency</div>
            <select value={frequency} onChange={e => setFrequency(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className="field">
          <div className="field-label">Category</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SUB_CATEGORIES.map(cat => (
              <div key={cat} onClick={() => setCategory(cat)}
                style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', display: 'flex', alignItems: 'center', gap: 5,
                  background: category === cat ? CAT_COLORS[cat] + '22' : '#0f0f11',
                  borderColor: category === cat ? CAT_COLORS[cat] : '#242428',
                  color: category === cat ? CAT_COLORS[cat] : '#555' }}>
                <span>{CAT_ICONS[cat]}</span> {cat}
              </div>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <div className="field-label">Billing day (optional)</div>
            <input type="number" placeholder="e.g. 15" min="1" max="31" value={billingDay} onChange={e => setBillingDay(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-label">Status</div>
            <div onClick={() => setIsActive(!isActive)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#0f0f11', border: '1px solid #242428', borderRadius: 10, cursor: 'pointer' }}>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: isActive ? 'var(--accent-dim)' : '#1e1e24', border: `1px solid ${isActive ? 'var(--accent-border)' : '#333'}`, position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: isActive ? 'var(--accent)' : '#555', position: 'absolute', top: 1, left: isActive ? 17 : 1, transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: 13, color: isActive ? 'var(--accent)' : '#555' }}>{isActive ? 'Active' : 'Paused'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={handleDelete} style={{ flex:1, padding:11, borderRadius:10, background:'#2a0a0a', border:'1px solid #7a1010', color:'#f87171', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Finance Modal (income/bills/savings) ─────────────────────────────────────
function EntryModal({ type, item, onClose, onSaved }) {
  const isEdit = !!item
  const [name, setName] = useState(item?.name || '')
  const [amount, setAmount] = useState(item?.amount || item?.monthly_target || '')
  const [dueDate, setDueDate] = useState(item?.due_date || '')
  const [frequency, setFrequency] = useState(item?.frequency || 'monthly')
  const [isActive, setIsActive] = useState(item?.is_active !== false)
  const [saving, setSaving] = useState(false)
  const table = type === 'income' ? 'finance_income' : type === 'bill' ? 'finance_bills' : 'finance_savings'
  const handleSave = async () => {
    if (!name.trim()) return; setSaving(true)
    const payload = type === 'savings'
      ? { name: name.trim(), monthly_target: parseFloat(amount)||0 }
      : type === 'income'
      ? { name: name.trim(), amount: parseFloat(amount)||0, frequency }
      : { name: name.trim(), amount: parseFloat(amount)||0, frequency, is_active: isActive, due_date: dueDate||null }
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
        <div className="field"><div className="field-label">Name</div><input type="text" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field"><div className="field-label">{type==='savings'?'Monthly target ($)':'Amount ($)'}</div><input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        {type !== 'savings' && <div className="field"><div className="field-label">Frequency</div><select value={frequency} onChange={e => setFrequency(e.target.value)}><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>}
        {type === 'bill' && <div className="field"><div className="field-label">Due date</div><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={handleDelete} style={{ flex:1, padding:11, borderRadius:10, background:'#2a0a0a', border:'1px solid #7a1010', color:'#f87171', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Finance ─────────────────────────────────────────────────────────────
export default function Finance() {
  const [subs, setSubs] = useState([])
  const [bills, setBills] = useState([])
  const [income, setIncome] = useState([])
  const [savings, setSavings] = useState([])
  const [tab, setTab] = useState('subscriptions')
  const [modal, setModal] = useState(null)
  const [subModal, setSubModal] = useState(null)
  const [subFilter, setSubFilter] = useState('All')
  const [subSort, setSubSort] = useState('name') // 'name' | 'amount' | 'category'

  useEffect(() => { load() }, [])

  const load = async () => {
    const [s, b, inc, sav] = await Promise.all([
      supabase.from('finance_subscriptions').select('*').order('name'),
      supabase.from('finance_bills').select('*').order('due_date'),
      supabase.from('finance_income').select('*').order('name'),
      supabase.from('finance_savings').select('*').order('name'),
    ])
    setSubs(s.data || [])
    setBills(b.data || [])
    setIncome(inc.data || [])
    setSavings(sav.data || [])
  }

  const activeSubs = subs.filter(s => s.is_active !== false)
  const totalMonthly = activeSubs.reduce((sum, s) => sum + toMonthly(s.amount, s.frequency), 0)
  const totalYearly = activeSubs.reduce((sum, s) => sum + toYearly(s.amount, s.frequency), 0)
  const totalIncome = income.reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0)
  const totalBills = bills.filter(b => b.is_active !== false).reduce((sum, b) => sum + toMonthly(b.amount, b.frequency), 0)

  // Group subs by category
  const allCategories = ['All', ...Array.from(new Set(subs.map(s => s.category || 'Other')))]
  const filteredSubs = (subFilter === 'All' ? subs : subs.filter(s => (s.category || 'Other') === subFilter))
    .sort((a, b) => {
      if (subSort === 'amount') return toMonthly(b.amount, b.frequency) - toMonthly(a.amount, a.frequency)
      if (subSort === 'category') return (a.category || 'Other').localeCompare(b.category || 'Other')
      return a.name.localeCompare(b.name)
    })

  const groupedSubs = filteredSubs.reduce((acc, s) => {
    const cat = s.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const todayStr = new Date().toISOString().split('T')[0]
  const soonStr = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
  const dueSoon = bills.filter(b => b.due_date >= todayStr && b.due_date <= soonStr)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>Finance</div>
        <div style={{ fontSize: 12, color: '#555' }}>Monthly snapshot</div>
      </div>

      {/* Top summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Monthly income</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#10b981' }}>{fmt(totalIncome)}</div>
        </div>
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Total out</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#f87171' }}>{fmt(totalMonthly + totalBills)}</div>
        </div>
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Subscriptions</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#a78bfa' }}>{fmt(totalMonthly)}<span style={{ fontSize: 12, color: '#555', fontWeight: 400 }}>/mo</span></div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>{fmt(totalYearly)}/yr · {activeSubs.length} active</div>
        </div>
        <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Left over</div>
          {(() => { const left = totalIncome - totalMonthly - totalBills; return <div style={{ fontSize: 22, fontWeight: 600, color: left >= 0 ? '#10b981' : '#f87171' }}>{fmt(left)}</div> })()}
          {dueSoon.length > 0 && <div style={{ fontSize: 11, color: '#f87171', marginTop: 3 }}>⚠ {dueSoon.length} bill{dueSoon.length>1?'s':''} due soon</div>}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', background: '#161618', border: '1px solid #242428', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        {[['subscriptions','🔄 Subs'],['bills','📋 Bills'],['income','💰 Income'],['savings','🏦 Savings']].map(([key,label]) => (
          <div key={key} onClick={() => setTab(key)} style={{ flex: 1, textAlign: 'center', padding: '10px 4px', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: tab===key ? 'var(--accent-dim)' : 'transparent', color: tab===key ? 'var(--accent)' : '#666', transition: 'all 0.15s' }}>
            {label}
          </div>
        ))}
      </div>

      {/* ── SUBSCRIPTIONS TAB ── */}
      {tab === 'subscriptions' && (
        <div>
          {/* Sub header */}
          <div style={{ background: 'linear-gradient(135deg, #1a0a24 0%, #0f0f11 100%)', border: '1px solid #2a1a4a', borderRadius: 16, padding: 20, marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: '#a78bfa', fontWeight: 500, marginBottom: 4 }}>Monthly subscriptions</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#e8e6e1', marginBottom: 2 }}>{fmt(totalMonthly)}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{fmt(totalYearly)} per year · {activeSubs.length} active, {subs.filter(s=>s.is_active===false).length} paused</div>

            {/* Monthly bar breakdown */}
            {totalMonthly > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: '#1e1e24', display: 'flex' }}>
                  {Object.entries(groupedSubs).map(([cat, items]) => {
                    const catTotal = items.filter(s=>s.is_active!==false).reduce((sum,s)=>sum+toMonthly(s.amount,s.frequency),0)
                    const pct = (catTotal/totalMonthly)*100
                    return pct > 0 ? <div key={cat} style={{ width: pct+'%', background: CAT_COLORS[cat]||'#555', transition: 'width 0.4s' }} /> : null
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  {Object.entries(groupedSubs).map(([cat, items]) => {
                    const catTotal = items.filter(s=>s.is_active!==false).reduce((sum,s)=>sum+toMonthly(s.amount,s.frequency),0)
                    return catTotal > 0 ? (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[cat]||'#555', flexShrink: 0 }} />
                        <span style={{ color: '#666' }}>{cat}</span>
                        <span style={{ color: '#aaa', fontFamily: "'DM Mono'" }}>{fmt(catTotal)}</span>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sort + Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
              {allCategories.map(cat => (
                <div key={cat} onClick={() => setSubFilter(cat)}
                  style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap',
                    background: subFilter===cat ? (CAT_COLORS[cat]||'var(--accent-dim)') + '22' : '#161618',
                    borderColor: subFilter===cat ? (CAT_COLORS[cat]||'var(--accent-border)') : '#242428',
                    color: subFilter===cat ? (CAT_COLORS[cat]||'var(--accent)') : '#666' }}>
                  {cat !== 'All' ? CAT_ICONS[cat]||'📦' : ''} {cat}
                </div>
              ))}
            </div>
            <div style={{ marginLeft: 8, flexShrink: 0 }}>
              <select value={subSort} onChange={e => setSubSort(e.target.value)} style={{ background: '#161618', border: '1px solid #242428', borderRadius: 8, padding: '5px 8px', color: '#888', fontSize: 11, outline: 'none', fontFamily: "'DM Sans'" }}>
                <option value="name">A–Z</option>
                <option value="amount">$ High</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>

          {/* Add button */}
          <div className="action-btn btn-task" style={{ marginBottom: 16, justifyContent: 'center', width: '100%' }} onClick={() => setSubModal('new')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Add subscription
          </div>

          {/* Grouped subscription list */}
          {subSort === 'category' ? (
            Object.entries(groupedSubs).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 16 }}>{CAT_ICONS[cat]||'📦'}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: CAT_COLORS[cat]||'#888', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>{cat}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#555', fontFamily: "'DM Mono'" }}>
                    {fmt(items.filter(s=>s.is_active!==false).reduce((sum,s)=>sum+toMonthly(s.amount,s.frequency),0))}/mo
                  </div>
                </div>
                {items.map(sub => <SubCard key={sub.id} sub={sub} onEdit={() => setSubModal(sub)} />)}
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredSubs.map(sub => <SubCard key={sub.id} sub={sub} onEdit={() => setSubModal(sub)} />)}
            </div>
          )}

          {subs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 14, border: '1px dashed #242428', borderRadius: 14 }}>
              No subscriptions yet — add one above
            </div>
          )}
        </div>
      )}

      {/* ── BILLS TAB ── */}
      {tab === 'bills' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Bills &amp; utilities</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{fmt(totalBills)}/mo total</div>
            </div>
            <div onClick={() => setModal({ type: 'bill', item: null })} className="action-btn btn-task" style={{ gap: 5 }}>+ Add bill</div>
          </div>
          {dueSoon.length > 0 && (
            <div style={{ background: '#2a0a0a', border: '1px solid #7a1010', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#f87171', fontWeight: 500, marginBottom: 8 }}>⚠ Due within 7 days</div>
              {dueSoon.map(b => <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#d4d2cc', marginBottom: 4 }}><span>{b.name}</span><span style={{ fontFamily:"'DM Mono'", color:'#f87171' }}>{b.due_date}</span></div>)}
            </div>
          )}
          {bills.map(b => (
            <div key={b.id} onClick={() => setModal({ type:'bill', item:b })} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#161618', border:'1px solid #242428', borderRadius:12, marginBottom:8, cursor:'pointer', opacity:b.is_active===false?0.5:1 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, color:'#e8e6e1' }}>{b.name}</div>
                <div style={{ fontSize:11, color:'#555', fontFamily:"'DM Mono'", marginTop:2 }}>{b.frequency}{b.due_date ? ` · due ${b.due_date}` : ''}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:15, fontWeight:500, color:'#f87171', fontFamily:"'DM Mono'" }}>{fmt(b.amount)}</div>
                <div style={{ fontSize:10, color:'#555' }}>{fmt(toMonthly(b.amount,b.frequency))}/mo</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── INCOME TAB ── */}
      {tab === 'income' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Income</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{fmt(totalIncome)}/mo total</div>
            </div>
            <div onClick={() => setModal({ type:'income', item:null })} className="action-btn btn-task" style={{ gap: 5 }}>+ Add income</div>
          </div>
          {income.map(i => (
            <div key={i.id} onClick={() => setModal({ type:'income', item:i })} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#161618', border:'1px solid #242428', borderRadius:12, marginBottom:8, cursor:'pointer' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, color:'#e8e6e1' }}>{i.name}</div>
                <div style={{ fontSize:11, color:'#555', fontFamily:"'DM Mono'", marginTop:2 }}>{i.frequency}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:15, fontWeight:500, color:'#10b981', fontFamily:"'DM Mono'" }}>{fmt(i.amount)}</div>
                <div style={{ fontSize:10, color:'#555' }}>{fmt(toMonthly(i.amount,i.frequency))}/mo</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SAVINGS TAB ── */}
      {tab === 'savings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Savings goals</div>
            <div onClick={() => setModal({ type:'savings', item:null })} className="action-btn btn-task" style={{ gap: 5 }}>+ Add goal</div>
          </div>
          {savings.map(s => (
            <div key={s.id} onClick={() => setModal({ type:'savings', item:s })} style={{ background:'#161618', border:'1px solid #242428', borderRadius:12, padding:16, marginBottom:8, cursor:'pointer' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ fontSize:15, color:'#e8e6e1' }}>{s.name}</div>
                <div style={{ fontSize:15, fontWeight:500, color:'#10b981', fontFamily:"'DM Mono'" }}>{fmt(s.monthly_target)}/mo</div>
              </div>
              <div style={{ height:5, background:'#1e1e24', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:Math.min(100,(s.saved_this_month/s.monthly_target)*100||0)+'%', background:'#10b981', borderRadius:3 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <EntryModal type={modal.type} item={modal.item} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />}
      {subModal && <SubModal item={subModal === 'new' ? null : subModal} onClose={() => setSubModal(null)} onSaved={() => { setSubModal(null); load() }} />}
    </div>
  )
}

// ── Sub Card ──────────────────────────────────────────────────────────────────
function SubCard({ sub, onEdit }) {
  const monthly = toMonthly(sub.amount, sub.frequency)
  const yearly = toYearly(sub.amount, sub.frequency)
  const isPaused = sub.is_active === false
  const catColor = CAT_COLORS[sub.category || 'Other'] || '#555'
  const serviceIcon = getServiceIcon(sub.name) || CAT_ICONS[sub.category || 'Other'] || '📦'

  return (
    <div onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#161618', border: '1px solid #242428', borderRadius: 14, cursor: 'pointer', opacity: isPaused ? 0.5 : 1 }}>
      {/* Icon */}
      <div style={{ width: 44, height: 44, borderRadius: 12, background: catColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
        {serviceIcon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#e8e6e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.name}</div>
          {isPaused && <div style={{ fontSize: 9, color: '#555', background: '#1e1e24', borderRadius: 4, padding: '2px 5px', flexShrink: 0 }}>PAUSED</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: catColor + '22', color: catColor, fontWeight: 500 }}>{sub.category || 'Other'}</div>
          <div style={{ fontSize: 11, color: '#555' }}>{sub.frequency}</div>
          {sub.billing_day && <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'" }}>bills {sub.billing_day}{['st','nd','rd'][sub.billing_day-1]||'th'}</div>}
        </div>
      </div>

      {/* Amount */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#e8e6e1', fontFamily: "'DM Mono'" }}>{fmt(sub.amount)}</div>
        <div style={{ fontSize: 10, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>
          {sub.frequency !== 'monthly' ? `${fmt(monthly)}/mo` : `${fmt(yearly)}/yr`}
        </div>
      </div>
    </div>
  )
}
