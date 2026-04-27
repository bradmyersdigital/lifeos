import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FREQ_MULT = { weekly: 4, biweekly: 2, monthly: 1, yearly: 1/12 }
const toMonthly = (amount, freq) => (parseFloat(amount) || 0) * (FREQ_MULT[freq] || 1)
const toYearly = (amount, freq) => (parseFloat(amount) || 0) * ({ weekly: 48, biweekly: 24, monthly: 12, yearly: 1 }[freq] || 12)
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
function SubModal({ item, onClose, onSaved, categories }) {
  const isEdit = !!item
  const allCats = categories?.length ? categories : SUB_CATEGORIES.map(n => ({ name: n, color: CAT_COLORS[n]||'#555' }))
  const [name, setName] = useState(item?.name || '')
  const [amount, setAmount] = useState(item?.amount || '')
  const [frequency, setFrequency] = useState(item?.frequency || 'monthly')
  const [category, setCategory] = useState(item?.category || 'Entertainment')
  const [billingDay, setBillingDay] = useState(item?.billing_day || '')
  const [billingMonth, setBillingMonth] = useState(item?.billing_month || 1)
  const [isActive, setIsActive] = useState(item?.is_active !== false)
  const [customIcon, setCustomIcon] = useState(item?.icon || '')
  const [accountEmail, setAccountEmail] = useState(item?.account_email || '')
  const [paymentMethod, setPaymentMethod] = useState(item?.payment_method || '')
  const [saving, setSaving] = useState(false)
  const fileRef = React.useRef(null)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = { name: name.trim(), amount: parseFloat(amount)||0, frequency, category, billing_day: parseInt(billingDay)||null, billing_month: frequency==='yearly' ? parseInt(billingMonth)||1 : null, is_active: isActive, icon: customIcon || null, account_email: accountEmail || null, payment_method: paymentMethod || null }
    if (isEdit) await supabase.from('finance_subscriptions').update(payload).eq('id', item.id)
    else await supabase.from('finance_subscriptions').insert(payload)
    setSaving(false); onSaved(); onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    await supabase.from('finance_subscriptions').delete().eq('id', item.id)
    onSaved(); onClose()
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCustomIcon(ev.target.result)
    reader.readAsDataURL(file)
  }

  const autoIcon = getServiceIcon(name)
  const displayIcon = customIcon || autoIcon || '📦'
  const isImageIcon = displayIcon.startsWith('data:')

  const QUICK_EMOJIS = ['🎬','🎵','📺','🎮','📚','💪','☁️','🍔','💊','🎧','📰','⚡','🛍️','💳','🔑','🤖','🏠','✈️','🚗','🐶','🌿','🏋️','🎨','📱']

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? 'Edit subscription' : 'Add subscription'}<div className="modal-close" onClick={onClose}>×</div></div>

        {/* 1. Service name */}
        <div className="field">
          <div className="field-label">Service name</div>
          <input type="text" placeholder="e.g. Netflix, Spotify…" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* 2. Amount + frequency */}
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

        {/* 3. Billing day + status */}
        <div className="field-row">
          <div className="field">
            <div className="field-label">{frequency === 'yearly' ? 'Billing date' : 'Billing day'}</div>
            {frequency === 'yearly' ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <select value={billingMonth} onChange={e => setBillingMonth(e.target.value)} style={{ flex: 1 }}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => (
                    <option key={i} value={i+1}>{m}</option>
                  ))}
                </select>
                <select value={billingDay} onChange={e => setBillingDay(e.target.value)} style={{ flex: 1 }}>
                  <option value="">Day</option>
                  {Array.from({length:31},(_,i)=>i+1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            ) : (
              <input type="number" placeholder="e.g. 15" min="1" max="31" value={billingDay} onChange={e => setBillingDay(e.target.value)} />
            )}
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

        {/* Account + Payment method */}
        <div className="field-row">
          <div className="field">
            <div className="field-label">Account</div>
            <input type="text" placeholder="email@example.com" value={accountEmail} onChange={e => setAccountEmail(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-label">Payment method</div>
            <input type="text" placeholder="e.g. Visa ••4242" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} />
          </div>
        </div>

        {/* 4. Icon */}
        <div className="field">
          <div className="field-label">Icon</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            {/* Preview */}
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#1e1e24', border: '1px solid #242428', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, overflow: 'hidden' }}>
              {isImageIcon
                ? <img src={displayIcon} alt="icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : displayIcon}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="text" placeholder="Paste emoji…" value={customIcon && !customIcon.startsWith('data:') ? customIcon : ''} onChange={e => setCustomIcon(e.target.value)}
                style={{ fontSize: 18 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ flex: 1, padding: '8px', borderRadius: 10, background: '#161618', border: '1px solid #242428', color: '#888', fontSize: 12, cursor: 'pointer', textAlign: 'center', fontFamily: "'DM Sans'" }}>
                  📁 Upload image
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                </label>
                {customIcon && (
                  <div onClick={() => setCustomIcon('')} style={{ padding: '8px 12px', borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Clear</div>
                )}
              </div>
            </div>
          </div>
          {/* Quick emoji grid */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_EMOJIS.map(e => (
              <div key={e} onClick={() => setCustomIcon(e)}
                style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, borderRadius: 9, background: customIcon===e ? 'var(--accent-dim)' : '#0f0f11', border: `1px solid ${customIcon===e ? 'var(--accent-border)' : '#242428'}`, cursor: 'pointer' }}>
                {e}
              </div>
            ))}
          </div>
        </div>

        {/* 5. Category */}
        <div className="field">
          <div className="field-label">Category</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {allCats.map(catDef => {
              const col = catDef.color || '#555'
              const isSelected = category === catDef.name
              return (
                <div key={catDef.name} onClick={() => setCategory(catDef.name)}
                  style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', display: 'flex', alignItems: 'center', gap: 5,
                    background: isSelected ? col + '22' : '#0f0f11',
                    borderColor: isSelected ? col : '#242428',
                    color: isSelected ? col : '#555' }}>
                  {CAT_ICONS[catDef.name] || '📦'} {catDef.name}
                </div>
              )
            })}
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
  const [customIcon, setCustomIcon] = useState(item?.icon || '')
  const [accountEmail, setAccountEmail] = useState(item?.account_email || '')
  const [paymentMethod, setPaymentMethod] = useState(item?.payment_method || '')
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
  const [subView, setSubView] = useState('all') // 'all' | 'upcoming' | 'calendar'
  const [catOrder, setCatOrder] = useState(() => { try { const s = localStorage.getItem('lifeos_cat_order'); return s ? JSON.parse(s) : [] } catch { return [] } })
  const [draggingCat, setDraggingCat] = useState(null)
  const [dragOverCat, setDragOverCat] = useState(null)
  const [manageCats, setManageCats] = useState(false)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#a78bfa')
  const [editingCat, setEditingCat] = useState(null)
  const [customCats, setCustomCats] = useState(() => {
    try { const s = localStorage.getItem('lifeos_sub_cats'); return s ? JSON.parse(s) : [...SUB_CATEGORIES.map(n => ({ name: n, color: CAT_COLORS[n] || '#555' }))] }
    catch { return SUB_CATEGORIES.map(n => ({ name: n, color: CAT_COLORS[n] || '#555' })) }
  })

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

  const saveCats = (cats) => {
    setCustomCats(cats)
    localStorage.setItem('lifeos_sub_cats', JSON.stringify(cats))
  }
  const addSubCategory = () => {
    if (!newCatName.trim() || customCats.find(c => c.name === newCatName.trim())) return
    saveCats([...customCats, { name: newCatName.trim(), color: newCatColor }])
    setNewCatName(''); setShowNewCat(false)
  }
  const renameSubCat = (oldName, newName) => {
    if (!newName.trim() || newName === oldName) { setEditingCat(null); return }
    saveCats(customCats.map(c => c.name === oldName ? { ...c, name: newName.trim() } : c))
    // Update subs with this category
    subs.filter(s => s.category === oldName).forEach(s => supabase.from('finance_subscriptions').update({ category: newName.trim() }).eq('id', s.id))
    setSubs(prev => prev.map(s => s.category === oldName ? { ...s, category: newName.trim() } : s))
    setEditingCat(null)
  }
  const deleteSubCat = (name) => {
    if (!window.confirm(`Delete "${name}"? Subs will move to Other.`)) return
    saveCats(customCats.filter(c => c.name !== name))
    subs.filter(s => s.category === name).forEach(s => supabase.from('finance_subscriptions').update({ category: 'Other' }).eq('id', s.id))
    setSubs(prev => prev.map(s => s.category === name ? { ...s, category: 'Other' } : s))
  }

  const activeSubs = subs.filter(s => s.is_active !== false)
  const totalMonthly = activeSubs.reduce((sum, s) => sum + toMonthly(s.amount, s.frequency), 0)
  const totalYearly = activeSubs.reduce((sum, s) => sum + toYearly(s.amount, s.frequency), 0)
  const totalIncome = income.reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0)
  const totalBills = bills.filter(b => b.is_active !== false).reduce((sum, b) => sum + toMonthly(b.amount, b.frequency), 0)

  // Group subs by category
  // Categories present in subs, ordered by catOrder preference
  const rawCats = Array.from(new Set([...subs.map(s => s.category || 'Other')]))
  const orderedCats = [
    ...catOrder.filter(c => rawCats.includes(c)),
    ...rawCats.filter(c => !catOrder.includes(c))
  ]
  const saveCatOrder = (order) => { setCatOrder(order); localStorage.setItem('lifeos_cat_order', JSON.stringify(order)) }
  // Today's day of month for upcoming
  const todayDay = new Date().getDate()
  const upcomingSubs = subs.filter(s => {
    if (s.is_active === false) return false
    if (!s.billing_day) return false
    const daysUntil = s.billing_day >= todayDay ? s.billing_day - todayDay : (31 - todayDay + s.billing_day)
    return daysUntil <= 14
  }).sort((a,b) => {
    const da = a.billing_day >= todayDay ? a.billing_day - todayDay : 31 - todayDay + a.billing_day
    const db = b.billing_day >= todayDay ? b.billing_day - todayDay : 31 - todayDay + b.billing_day
    return da - db
  })

  // Group all subs by category, sorted by billing_day within each category
  const groupedSubs = orderedCats.reduce((acc, cat) => {
    const items = subs.filter(s => (s.category || 'Other') === cat)
      .sort((a,b) => (a.billing_day||99) - (b.billing_day||99))
    if (items.length) acc[cat] = items
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
          {/* Hero card */}
          <div style={{ background: 'linear-gradient(135deg, #1a0a24 0%, #0f0f11 100%)', border: '1px solid #2a1a4a', borderRadius: 16, padding: 20, marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: '#a78bfa', fontWeight: 500, marginBottom: 4 }}>Monthly subscriptions</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#e8e6e1', marginBottom: 2 }}>{fmt(totalMonthly)}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{fmt(totalYearly)} per year · {activeSubs.length} active</div>
            {totalMonthly > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: '#1e1e24', display: 'flex' }}>
                  {orderedCats.map(cat => {
                    const catTotal = (groupedSubs[cat]||[]).filter(s=>s.is_active!==false).reduce((sum,s)=>sum+toMonthly(s.amount,s.frequency),0)
                    const pct = (catTotal/totalMonthly)*100
                    const col = customCats.find(c=>c.name===cat)?.color || CAT_COLORS[cat] || '#555'
                    return pct > 0 ? <div key={cat} style={{ width: pct+'%', background: col }} /> : null
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  {orderedCats.map(cat => {
                    const catTotal = (groupedSubs[cat]||[]).filter(s=>s.is_active!==false).reduce((sum,s)=>sum+toMonthly(s.amount,s.frequency),0)
                    const col = customCats.find(c=>c.name===cat)?.color || CAT_COLORS[cat] || '#555'
                    return catTotal > 0 ? (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                        <span style={{ color: '#666' }}>{cat}</span>
                        <span style={{ color: '#aaa', fontFamily: "'DM Mono'" }}>{fmt(catTotal)}</span>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>

          {/* All / Upcoming / Calendar toggle */}
          <div style={{ display: 'flex', background: '#161618', border: '1px solid #242428', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div onClick={() => setSubView('all')} style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: subView==='all' ? 'var(--accent-dim)' : 'transparent', color: subView==='all' ? 'var(--accent)' : '#666' }}>All</div>
            <div onClick={() => setSubView('upcoming')} style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: subView==='upcoming' ? 'var(--accent-dim)' : 'transparent', color: subView==='upcoming' ? 'var(--accent)' : '#666' }}>
              Upcoming {upcomingSubs.length > 0 && <span style={{ marginLeft: 4, background: '#f87171', color: '#fff', borderRadius: 20, padding: '1px 6px', fontSize: 10 }}>{upcomingSubs.length}</span>}
            </div>
            <div onClick={() => setSubView('calendar')} style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: subView==='calendar' ? 'var(--accent-dim)' : 'transparent', color: subView==='calendar' ? 'var(--accent)' : '#666' }}>📅 Cal</div>
          </div>

          {/* Add + manage buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div className="action-btn btn-task" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSubModal('new')}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Add subscription
            </div>
            <div onClick={() => setManageCats(!manageCats)} style={{ padding: '10px 14px', borderRadius: 12, background: manageCats ? 'var(--accent-dim)' : '#161618', border: `1px solid ${manageCats ? 'var(--accent-border)' : '#242428'}`, color: manageCats ? 'var(--accent)' : '#888', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
              ✏️ Categories
            </div>
          </div>

          {/* Category manager */}
          {manageCats && (
            <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Categories <span style={{ fontSize: 11, color: '#555' }}>drag to reorder</span></div>
                <div onClick={() => setShowNewCat(!showNewCat)} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', padding: '4px 10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 8 }}>+ Add</div>
              </div>
              {showNewCat && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                  <input type="text" placeholder="Category name…" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key==='Enter' && addSubCategory()}
                    style={{ flex: 1, background: '#0f0f11', border: '1px solid #242428', borderRadius: 10, padding: '9px 12px', fontSize: 14, color: '#e8e6e1', fontFamily: "'DM Sans'", outline: 'none' }} />
                  <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: newCatColor, border: '2px solid #333' }} />
                    <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', border: 'none', padding: 0 }} />
                  </div>
                  <button onClick={addSubCategory} className="btn-primary" style={{ padding: '0 14px', height: 36, borderRadius: 10, fontSize: 13, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans'" }}>Add</button>
                  <button onClick={() => setShowNewCat(false)} style={{ padding: '0 12px', height: 36, borderRadius: 10, background: '#0f0f11', border: '1px solid #242428', color: '#666', fontSize: 18, cursor: 'pointer', fontFamily: "'DM Sans'" }}>×</button>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {customCats.map((cat, idx) => (
                  <div key={cat.name}
                    draggable
                    onDragStart={() => setDraggingCat(idx)}
                    onDragEnter={() => setDragOverCat(idx)}
                    onDragEnd={() => {
                      if (draggingCat === null || dragOverCat === null || draggingCat === dragOverCat) { setDraggingCat(null); setDragOverCat(null); return }
                      const newOrder = [...customCats]
                      const [moved] = newOrder.splice(draggingCat, 1)
                      newOrder.splice(dragOverCat, 0, moved)
                      saveCats(newOrder)
                      saveCatOrder(newOrder.map(c => c.name))
                      setDraggingCat(null); setDragOverCat(null)
                    }}
                    onDragOver={e => e.preventDefault()}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: draggingCat === idx ? 'var(--accent-dim)' : '#0f0f11', borderRadius: 10, border: `1px solid ${draggingCat === idx ? 'var(--accent-border)' : '#242428'}`, cursor: 'grab' }}>
                    <div style={{ fontSize: 14, color: '#333', cursor: 'grab', padding: '0 4px' }}>⠿</div>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                    {editingCat?.name === cat.name ? (
                      <>
                        <input type="text" value={editingCat.newName} onChange={e => setEditingCat({...editingCat, newName: e.target.value})}
                          onKeyDown={e => { if(e.key==='Enter') renameSubCat(cat.name, editingCat.newName); if(e.key==='Escape') setEditingCat(null) }}
                          autoFocus style={{ flex: 1, background: '#161618', border: '1px solid var(--accent-border)', borderRadius: 8, padding: '5px 10px', fontSize: 14, color: '#e8e6e1', fontFamily: "'DM Sans'", outline: 'none' }} />
                        <div onClick={() => renameSubCat(cat.name, editingCat.newName)} style={{ fontSize: 12, color: '#10b981', cursor: 'pointer', padding: '3px 8px', background: '#0a1e14', border: '1px solid #1a4a2a', borderRadius: 7 }}>Save</div>
                        <div onClick={() => setEditingCat(null)} style={{ fontSize: 16, color: '#555', cursor: 'pointer' }}>×</div>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1, fontSize: 14, color: '#d4d2cc' }}>{cat.name}</div>
                        <div style={{ fontSize: 11, color: '#444', fontFamily: "'DM Mono'" }}>{subs.filter(s=>(s.category||'Other')===cat.name).length}</div>
                        <select value={CAT_ICONS[cat.name]||'📦'} onChange={e => {
                          CAT_ICONS[cat.name] = e.target.value
                          saveCats([...customCats])
                        }} style={{ fontSize: 18, background: '#161618', border: '1px solid #242428', borderRadius: 8, padding: '2px 4px', outline: 'none', cursor: 'pointer' }}>
                          {['🎬','🎵','📺','🎮','📚','💪','☁️','🍔','💊','🎧','📰','⚡','🛍️','💳','🔑','🤖','🏠','✈️','🚗','🐶','🌿','🏋️','🎨','📱','📦','🔄','💡','🎯'].map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <div onClick={() => setEditingCat({ name: cat.name, newName: cat.name })} style={{ fontSize: 12, color: '#888', cursor: 'pointer', padding: '3px 8px', borderRadius: 6, background: '#161618', border: '1px solid #242428' }}>✏️</div>
                        <div onClick={() => deleteSubCat(cat.name)} style={{ fontSize: 12, color: '#f87171', cursor: 'pointer', padding: '3px 8px', borderRadius: 6, background: '#2a0a0a', border: '1px solid #7a1010' }}>✕</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UPCOMING VIEW */}
          {subView === 'upcoming' && (
            <div>
              {upcomingSubs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 14, border: '1px dashed #242428', borderRadius: 14 }}>
                  No subscriptions with billing dates in the next 14 days.<br/>Add a billing day to your subscriptions to see them here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcomingSubs.map(sub => {
                    const daysUntil = sub.billing_day >= todayDay ? sub.billing_day - todayDay : 31 - todayDay + sub.billing_day
                    return (
                      <div key={sub.id} onClick={() => setSubModal(sub)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#161618', border: `1px solid ${daysUntil <= 3 ? '#3a1010' : '#242428'}`, borderRadius: 14, cursor: 'pointer' }}>
                        {(() => {
                          const icon = sub.icon || getServiceIcon(sub.name) || CAT_ICONS[sub.category||'Other'] || '📦'
                          const isImg = typeof icon === 'string' && icon.startsWith('data:')
                          const col = (customCats.find(c=>c.name===(sub.category||'Other'))?.color || CAT_COLORS[sub.category||'Other'] || '#555') + '22'
                          return (
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
                              {isImg ? <img src={icon} alt={sub.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} /> : icon}
                            </div>
                          )
                        })()}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 500, color: '#e8e6e1' }}>{sub.name}</div>
                          <div style={{ fontSize: 12, color: daysUntil <= 3 ? '#f87171' : '#555', marginTop: 2 }}>
                            {daysUntil === 0 ? '🔴 Due today' : daysUntil === 1 ? '🟡 Due tomorrow' : `Due in ${daysUntil} days · ${sub.billing_day}${['st','nd','rd'][sub.billing_day-1]||'th'}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#e8e6e1', fontFamily: "'DM Mono'" }}>{fmt(sub.amount)}</div>
                          <div style={{ fontSize: 10, color: '#555' }}>{sub.frequency}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {subView === 'calendar' && <SubCalendar subs={subs} customCats={customCats} onEdit={setSubModal} />}

          {/* ALL VIEW - grouped by category */}
          {subView === 'all' && (
            <div>
              {orderedCats.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 14, border: '1px dashed #242428', borderRadius: 14 }}>
                  No subscriptions yet — add one above
                </div>
              )}
              {orderedCats.filter(cat => groupedSubs[cat]).map(cat => {
                const catDef = customCats.find(c => c.name === cat)
                const col = catDef?.color || CAT_COLORS[cat] || '#555'
                const catItems = groupedSubs[cat] || []
                const catMonthly = catItems.filter(s=>s.is_active!==false).reduce((sum,s)=>sum+toMonthly(s.amount,s.frequency),0)
                return (
                  <div key={cat} style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: col, flexShrink: 0 }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#555', fontFamily: "'DM Mono'" }}>{fmt(catMonthly)}/mo</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {catItems.map(sub => <SubCard key={sub.id} sub={sub} customCats={customCats} onEdit={() => setSubModal(sub)} />)}
                    </div>
                  </div>
                )
              })}
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
      {subModal && <SubModal item={subModal === 'new' ? null : subModal} categories={customCats} onClose={() => setSubModal(null)} onSaved={() => { setSubModal(null); load() }} />}
    </div>
  )
}


// ── Sub Calendar ──────────────────────────────────────────────────────────────
function SubCalendar({ subs, customCats, onEdit }) {
  const [calDay, setCalDay] = useState(null)
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const dayMap = {}
  subs.forEach(s => {
    if (!s.billing_day || s.is_active === false) return
    const d = s.billing_day
    if (!dayMap[d]) dayMap[d] = []
    dayMap[d].push(s)
  })

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#888', marginBottom: 14 }}>{MONTH_NAMES[month]} {year}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((d,i) => (
          <div key={i} style={{ textAlign:'center', fontSize:10, color:'#444', padding:'3px 0', fontWeight:600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 20 }}>
        {Array.from({length: firstDow}).map((_,i) => <div key={'e'+i} />)}
        {Array.from({length: daysInMonth}, (_, i) => {
          const day = i + 1
          const daySubs = dayMap[day] || []
          const isToday = day === now.getDate()
          const isSelected = calDay === day
          return (
            <div key={day} onClick={() => daySubs.length && setCalDay(isSelected ? null : day)}
              style={{ borderRadius: 8, padding: '5px 2px', minHeight: 54, background: isToday ? 'var(--accent-dim)' : isSelected ? '#1e1e2a' : '#161618', border: `1px solid ${isToday ? 'var(--accent-border)' : isSelected ? '#3a3a5a' : '#1e1e24'}`, cursor: daySubs.length ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: isToday ? 'var(--accent)' : '#666', marginBottom: 3 }}>{day}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {daySubs.slice(0, 4).map(s => {
                  const isImg = s.icon?.startsWith('data:')
                  const icon = isImg ? null : (s.icon || getServiceIcon(s.name) || '📦')
                  return (
                    <div key={s.id} style={{ width: 18, height: 18, borderRadius: 5, background: '#1e1e24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, overflow: 'hidden' }}>
                      {isImg ? <img src={s.icon} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : icon}
                    </div>
                  )
                })}
                {daySubs.length > 4 && <div style={{ fontSize: 8, color: '#555' }}>+{daySubs.length - 4}</div>}
              </div>
              {daySubs.length > 0 && (
                <div style={{ fontSize: 8, color: '#f87171', fontFamily:"'DM Mono'", marginTop: 2 }}>
                  ${daySubs.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0).toFixed(0)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {calDay && dayMap[calDay] && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10 }}>
            {MONTH_NAMES[month]} {calDay} — {dayMap[calDay].length} subscription{dayMap[calDay].length > 1 ? 's' : ''}
            <span style={{ fontFamily:"'DM Mono'", color:'#f87171', marginLeft: 10 }}>
              ${dayMap[calDay].reduce((s,x)=>s+(parseFloat(x.amount)||0),0).toFixed(2)} due
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dayMap[calDay].map(sub => (
              <SubCard key={sub.id} sub={sub} customCats={customCats} onEdit={() => onEdit(sub)} />
            ))}
          </div>
        </div>
      )}

      {Object.keys(dayMap).length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#444', fontSize: 13, border: '1px dashed #242428', borderRadius: 12 }}>
          Add billing days to your subscriptions to see them on the calendar
        </div>
      )}
    </div>
  )
}

// ── Sub Card ──────────────────────────────────────────────────────────────────
function SubCard({ sub, customCats, onEdit }) {
  const monthly = toMonthly(sub.amount, sub.frequency)
  const yearly = toYearly(sub.amount, sub.frequency)
  const isPaused = sub.is_active === false
  const catDef = customCats?.find(c => c.name === (sub.category || 'Other'))
  const catColor = catDef?.color || CAT_COLORS[sub.category || 'Other'] || '#555'
  const displayIcon = sub.icon || getServiceIcon(sub.name) || CAT_ICONS[sub.category || 'Other'] || '📦'
  const isImageIcon = sub.icon && sub.icon.startsWith('data:')

  return (
    <div onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#161618', border: '1px solid #242428', borderRadius: 14, cursor: 'pointer', opacity: isPaused ? 0.5 : 1 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: catColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
        {isImageIcon
          ? <img src={displayIcon} alt={sub.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
          : displayIcon}
      </div>
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
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#e8e6e1', fontFamily: "'DM Mono'" }}>{fmt(sub.amount)}</div>
        <div style={{ fontSize: 10, color: '#555', fontFamily: "'DM Mono'", marginTop: 2 }}>
          {sub.frequency !== 'monthly' ? `${fmt(monthly)}/mo` : `${fmt(yearly)}/yr`}
        </div>
      </div>
    </div>
  )
}
