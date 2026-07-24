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
  const allCats = categories?.length ? categories : SUB_CATEGORIES.map(n => ({ name: n, color: CAT_COLORS[n]||'var(--text-dim)' }))
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
            <div onClick={() => setIsActive(!isActive)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer' }}>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: isActive ? 'var(--accent-dim)' : 'var(--border)', border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border-hover)'}`, position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: isActive ? 'var(--accent)' : 'var(--text-dim)', position: 'absolute', top: 1, left: isActive ? 17 : 1, transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: 13, color: isActive ? 'var(--accent)' : 'var(--text-dim)' }}>{isActive ? 'Active' : 'Paused'}</span>
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
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--border)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, overflow: 'hidden' }}>
              {isImageIcon
                ? <img src={displayIcon} alt="icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : displayIcon}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="text" placeholder="Paste emoji…" value={customIcon && !customIcon.startsWith('data:') ? customIcon : ''} onChange={e => setCustomIcon(e.target.value)}
                style={{ fontSize: 18 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textAlign: 'center', fontFamily: "'DM Sans'" }}>
                  📁 Upload image
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                </label>
                {customIcon && (
                  <div onClick={() => setCustomIcon('')} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Clear</div>
                )}
              </div>
            </div>
          </div>
          {/* Quick emoji grid */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_EMOJIS.map(e => (
              <div key={e} onClick={() => setCustomIcon(e)}
                style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, borderRadius: 9, background: customIcon===e ? 'var(--accent-dim)' : 'var(--bg-input)', border: `1px solid ${customIcon===e ? 'var(--accent-border)' : 'var(--border)'}`, cursor: 'pointer' }}>
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
              const col = catDef.color || 'var(--text-dim)'
              const isSelected = category === catDef.name
              return (
                <div key={catDef.name} onClick={() => setCategory(catDef.name)}
                  style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', display: 'flex', alignItems: 'center', gap: 5,
                    background: isSelected ? col + '22' : 'var(--bg-input)',
                    borderColor: isSelected ? col : 'var(--border)',
                    color: isSelected ? col : 'var(--text-dim)' }}>
                  {CAT_ICONS[catDef.name] || '📦'} {catDef.name}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={handleDelete} style={{ flex:1, padding:11, borderRadius:10, background:'var(--danger-dim)', border:'1px solid var(--danger-border)', color:'var(--danger)', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans'" }}>Delete</button>}
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
          {isEdit && <button onClick={handleDelete} style={{ flex:1, padding:11, borderRadius:10, background:'var(--danger-dim)', border:'1px solid var(--danger-border)', color:'var(--danger)', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Finance ─────────────────────────────────────────────────────────────
// ── Account kinds ────────────────────────────────────────────────────────────
const ACCOUNT_KINDS = [
  { id: 'checking',   label: 'Checking',   icon: '🏦', asset: true,  liquid: true  },
  { id: 'savings',    label: 'Savings',    icon: '🐷', asset: true,  liquid: true  },
  { id: 'cash',       label: 'Cash',       icon: '💵', asset: true,  liquid: true  },
  { id: 'investment', label: 'Investment', icon: '📈', asset: true,  liquid: false },
  { id: 'property',   label: 'Property',   icon: '🏠', asset: true,  liquid: false },
  { id: 'credit',     label: 'Credit card',icon: '💳', asset: false, liquid: false },
  { id: 'loan',       label: 'Loan',       icon: '🧾', asset: false, liquid: false },
]
const kindDef = (k) => ACCOUNT_KINDS.find(x => x.id === k) || ACCOUNT_KINDS[0]

/* Category list used across the page. Kept as a shape ({name,color}) so a
   user-defined category table can drop in later without touching consumers. */
const customCats = SUB_CATEGORIES.map(n => ({ name: n, color: CAT_COLORS[n] || 'var(--text-dim)' }))

/** Next time this item actually hits the account. Null if we can't know. */
function nextChargeDate(item, kind) {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  if (kind === 'bill') {
    if (!item.due_date) return null
    const d = new Date(item.due_date + 'T00:00:00')
    const step = { weekly: () => d.setDate(d.getDate() + 7), biweekly: () => d.setDate(d.getDate() + 14),
                   monthly: () => d.setMonth(d.getMonth() + 1), yearly: () => d.setFullYear(d.getFullYear() + 1) }[item.frequency]
    if (!step) return d
    let guard = 0
    while (d < today && guard++ < 400) step()
    return d
  }

  if (!item.billing_day) return null
  const day = item.billing_day
  const clamp = (y, m) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()))

  if (item.frequency === 'yearly') {
    const m = (item.billing_month || 1) - 1
    let d = clamp(today.getFullYear(), m)
    if (d < today) d = clamp(today.getFullYear() + 1, m)
    return d
  }
  let d = clamp(today.getFullYear(), today.getMonth())
  if (d < today) d = clamp(today.getFullYear(), today.getMonth() + 1)
  return d
}

const daysUntil = (d) => Math.round((d - new Date().setHours(0, 0, 0, 0)) / 86400000)
const dueLabel = (n) =>
  n < 0  ? `${Math.abs(n)}d overdue`
: n === 0 ? 'Today'
: n === 1 ? 'Tomorrow'
: `In ${n} days`

// ── Account modal ────────────────────────────────────────────────────────────
function AccountModal({ item, onClose, onSaved }) {
  const isEdit = !!item
  const [name, setName] = useState(item?.name || '')
  const [kind, setKind] = useState(item?.kind || 'checking')
  const [balance, setBalance] = useState(item?.balance ?? '')
  const [institution, setInstitution] = useState(item?.institution || '')
  const [saving, setSaving] = useState(false)

  const def = kindDef(kind)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      name: name.trim(), kind,
      balance: Math.abs(parseFloat(balance) || 0),
      institution: institution.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (isEdit) await supabase.from('finance_accounts').update(payload).eq('id', item.id)
    else await supabase.from('finance_accounts').insert(payload)
    setSaving(false); onSaved(); onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    await supabase.from('finance_accounts').delete().eq('id', item.id)
    onSaved(); onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">{isEdit ? 'Edit account' : 'Add account'}<div className="modal-close" onClick={onClose}>×</div></div>

        <div className="field">
          <div className="field-label">Type</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ACCOUNT_KINDS.map(k => (
              <div key={k.id} onClick={() => setKind(k.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                  background: kind === k.id ? 'var(--accent-dim)' : 'var(--bg-input)',
                  border: `1px solid ${kind === k.id ? 'var(--accent-border)' : 'var(--border)'}`,
                  color: kind === k.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                <span>{k.icon}</span>{k.label}
              </div>
            ))}
          </div>
        </div>

        <div className="field"><div className="field-label">Account name</div>
          <input type="text" placeholder="e.g. Main checking" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="field">
          <div className="field-label">{def.asset ? 'Current balance ($)' : 'Amount owed ($)'}</div>
          <input type="number" inputMode="decimal" placeholder="0.00" value={balance} onChange={e => setBalance(e.target.value)} />
          {!def.asset && <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 6 }}>Enter what you owe as a positive number — it's counted against you.</div>}
        </div>

        <div className="field"><div className="field-label">Institution (optional)</div>
          <input type="text" placeholder="e.g. Chase" value={institution} onChange={e => setInstitution(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {isEdit && <button onClick={handleDelete} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans'" }}>Delete</button>}
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving || !name.trim()}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add account'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Small building blocks ────────────────────────────────────────────────────
function StatTile({ label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 600, color: color || 'var(--text-primary)', fontFamily: "'DM Mono'", letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function Row({ icon, iconBg, title, subtitle, right, rightSub, onClick, dim }) {
  const isImg = typeof icon === 'string' && icon.startsWith('data:')
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 7, cursor: onClick ? 'pointer' : 'default', opacity: dim ? 0.5 : 1 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: iconBg || 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0, overflow: 'hidden' }}>
        {isImg ? <img src={icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, fontFamily: "'DM Mono'", color: 'var(--text-primary)' }}>{right}</div>
        {rightSub && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{rightSub}</div>}
      </div>
    </div>
  )
}

function EmptyState({ icon, text, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '30px 20px', border: '1px dashed var(--border)', borderRadius: 14 }}>
      <div style={{ fontSize: 26, marginBottom: 8, opacity: 0.6 }}>{icon}</div>
      <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: action ? 14 : 0, lineHeight: 1.5 }}>{text}</div>
      {action && (
        <div onClick={onAction} className="btn-primary" style={{ display: 'inline-block', padding: '9px 18px', borderRadius: 11, fontSize: 13.5, cursor: 'pointer' }}>{action}</div>
      )}
    </div>
  )
}

// ── Main Finance ─────────────────────────────────────────────────────────────
export default function Finance() {
  const [subs, setSubs] = useState([])
  const [bills, setBills] = useState([])
  const [income, setIncome] = useState([])
  const [savings, setSavings] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const [tab, setTab] = useState('overview')
  const [modal, setModal] = useState(null)        // { type, item }
  const [subModal, setSubModal] = useState(null)
  const [acctModal, setAcctModal] = useState(null)
  const [recurView, setRecurView] = useState('list')  // list | calendar
  const [showPaused, setShowPaused] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const [s, b, i, sv, a] = await Promise.all([
      supabase.from('finance_subscriptions').select('*').order('amount', { ascending: false }),
      supabase.from('finance_bills').select('*').order('amount', { ascending: false }),
      supabase.from('finance_income').select('*'),
      supabase.from('finance_savings').select('*'),
      supabase.from('finance_accounts').select('*').order('sort_order').order('created_at'),
    ])
    setSubs(s.data || []); setBills(b.data || []); setIncome(i.data || [])
    setSavings(sv.data || []); setAccounts(a.data || [])
    setLoading(false)
  }

  // ── The money maths ────────────────────────────────────────────────────────
  const activeSubs  = subs.filter(s => s.is_active !== false)
  const pausedSubs  = subs.filter(s => s.is_active === false)
  const activeBills = bills.filter(b => b.is_active !== false)

  const mIncome  = income.reduce((n, x) => n + toMonthly(x.amount, x.frequency), 0)
  const mSubs    = activeSubs.reduce((n, x) => n + toMonthly(x.amount, x.frequency), 0)
  const mBills   = activeBills.reduce((n, x) => n + toMonthly(x.amount, x.frequency), 0)
  const mSavings = savings.reduce((n, x) => n + (parseFloat(x.monthly_target) || 0), 0)

  const committed = mBills + mSubs + mSavings
  const free      = mIncome - committed
  const burn      = mBills + mSubs                       // what you must pay to exist

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1)
  const perDay = free / daysLeft

  const assets = accounts.filter(a => kindDef(a.kind).asset).reduce((n, a) => n + (parseFloat(a.balance) || 0), 0)
  const debts  = accounts.filter(a => !kindDef(a.kind).asset).reduce((n, a) => n + (parseFloat(a.balance) || 0), 0)
  const netWorth = assets - debts
  const liquid = accounts.filter(a => kindDef(a.kind).liquid).reduce((n, a) => n + (parseFloat(a.balance) || 0), 0)
  const runway = burn > 0 ? liquid / burn : null

  // Upcoming 30 days, merged and sorted
  const upcoming = [
    ...activeSubs.map(s => ({ ...s, _kind: 'sub',  _date: nextChargeDate(s, 'sub') })),
    ...activeBills.map(b => ({ ...b, _kind: 'bill', _date: nextChargeDate(b, 'bill') })),
  ].filter(x => x._date && daysUntil(x._date) <= 30)
   .sort((a, b) => a._date - b._date)

  const upcomingTotal = upcoming.reduce((n, x) => n + (parseFloat(x.amount) || 0), 0)

  // Category spread across everything recurring
  const catTotals = {}
  activeSubs.forEach(s => {
    const c = s.category || 'Other'
    catTotals[c] = (catTotals[c] || 0) + toMonthly(s.amount, s.frequency)
  })
  if (mBills > 0) catTotals['Bills & Utilities'] = mBills
  const catList = Object.entries(catTotals).sort((a, b) => b[1] - a[1])
  const catMax = catList.length ? catList[0][1] : 1

  const biggestSub = activeSubs.slice().sort((a, b) => toYearly(b.amount, b.frequency) - toYearly(a.amount, a.frequency))[0]

  const hasAnyData = subs.length || bills.length || income.length || savings.length || accounts.length

  // ── Where-it-goes bar ──────────────────────────────────────────────────────
  const segments = [
    { label: 'Bills',    value: mBills,   color: 'var(--danger)' },
    { label: 'Subs',     value: mSubs,    color: 'var(--warn)' },
    { label: 'Savings',  value: mSavings, color: 'var(--success)' },
    { label: 'Free',     value: Math.max(0, free), color: 'var(--accent)' },
  ].filter(s => s.value > 0)
  const segTotal = segments.reduce((n, s) => n + s.value, 0) || 1

  const TABS = [
    ['overview',  'Overview'],
    ['recurring', 'Recurring'],
    ['income',    'Income'],
    ['accounts',  'Accounts'],
  ]

  if (loading) return <div style={{ textAlign: 'center', padding: 50, color: 'var(--text-dim)' }}>Loading…</div>

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 16, letterSpacing: '-0.3px' }}>Finance</div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
        {TABS.map(([id, label]) => (
          <div key={id} onClick={() => setTab(id)}
            style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 20, fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
              background: tab === id ? 'var(--accent-dim)' : 'var(--bg-card)',
              border: `1px solid ${tab === id ? 'var(--accent-border)' : 'var(--border)'}`,
              color: tab === id ? 'var(--accent)' : 'var(--text-muted)' }}>
            {label}
          </div>
        ))}
      </div>

      {/* ══════════════════ OVERVIEW ══════════════════ */}
      {tab === 'overview' && (
        <div>
          {!hasAnyData && (
            <EmptyState icon="💰" text="Add your income and recurring costs and this page will tell you exactly what's left every month." action="Add income" onAction={() => setModal({ type: 'income' })} />
          )}

          {hasAnyData && (
            <>
              {/* Hero — free to spend */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, marginBottom: 12 }}>
                {mIncome === 0 ? (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>MONTHLY COMMITMENTS</div>
                    <div style={{ fontSize: 38, fontWeight: 600, fontFamily: "'DM Mono'", letterSpacing: '-1.5px', color: 'var(--text-primary)' }}>{fmt(committed)}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                      Add your income and I can show you what's actually left over each month.
                    </div>
                    <div onClick={() => setModal({ type: 'income' })} className="btn-primary" style={{ display: 'inline-block', marginTop: 12, padding: '9px 16px', borderRadius: 11, fontSize: 13.5, cursor: 'pointer' }}>Add income</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.03em' }}>FREE TO SPEND THIS MONTH</div>
                    <div style={{ fontSize: 40, fontWeight: 600, fontFamily: "'DM Mono'", letterSpacing: '-1.5px', color: free < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {free < 0 ? '−' : ''}{fmt(free)}
                    </div>
                    <div style={{ fontSize: 13, color: free < 0 ? 'var(--danger)' : 'var(--text-muted)', marginTop: 6 }}>
                      {free < 0
                        ? `You're committed to ${fmt(Math.abs(free))} more than you earn`
                        : `${fmt(perDay)} a day for the ${daysLeft} days left`}
                    </div>

                    {/* Where it goes */}
                    <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 18, background: 'var(--bg-card2)' }}>
                      {segments.map(s => (
                        <div key={s.label} style={{ width: `${(s.value / segTotal) * 100}%`, background: s.color }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 12 }}>
                      {segments.map(s => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
                          <span style={{ fontSize: 12, fontFamily: "'DM Mono'", color: 'var(--text-secondary)' }}>{fmt(s.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Key numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <StatTile label="Money in" value={fmt(mIncome)} sub="per month" color="var(--success)" onClick={() => setTab('income')} />
                <StatTile label="Money out" value={fmt(burn)} sub="bills + subscriptions" color="var(--danger)" onClick={() => setTab('recurring')} />
                <StatTile label="Net worth" value={(netWorth < 0 ? '−' : '') + fmt(netWorth)} sub={accounts.length ? `${accounts.length} account${accounts.length === 1 ? '' : 's'}` : 'Add accounts'} color={netWorth < 0 ? 'var(--danger)' : 'var(--text-primary)'} onClick={() => setTab('accounts')} />
                <StatTile label="Runway"
                  value={runway === null ? '—' : runway >= 24 ? '24+ mo' : `${runway.toFixed(1)} mo`}
                  sub={runway === null ? 'Add costs' : 'if income stopped'}
                  color={runway !== null && runway < 3 ? 'var(--warn)' : 'var(--text-primary)'}
                  onClick={() => setTab('accounts')} />
              </div>

              {/* Upcoming */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, marginTop: 22 }}>
                <div className="section-label" style={{ margin: 0 }}>Next 30 days</div>
                {upcoming.length > 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Mono'" }}>{fmt(upcomingTotal)}</div>}
              </div>
              {upcoming.length === 0 ? (
                <EmptyState icon="🗓️" text="Nothing scheduled. Add billing dates to your subscriptions and bills to see them here." />
              ) : upcoming.slice(0, 8).map(x => {
                const n = daysUntil(x._date)
                const icon = x.icon || getServiceIcon(x.name) || (x._kind === 'bill' ? '🧾' : CAT_ICONS[x.category || 'Other'] || '📦')
                const color = x._kind === 'bill' ? 'var(--danger)' : (CAT_COLORS[x.category || 'Other'] || 'var(--text-dim)')
                return (
                  <Row key={x._kind + x.id}
                    icon={icon} iconBg={color + '22'}
                    title={x.name}
                    subtitle={x._date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    right={fmt(x.amount)}
                    rightSub={<span style={{ color: n < 0 ? 'var(--danger)' : n <= 3 ? 'var(--warn)' : 'var(--text-dim)' }}>{dueLabel(n)}</span>}
                    onClick={() => x._kind === 'sub' ? setSubModal(x) : setModal({ type: 'bill', item: x })}
                  />
                )
              })}

              {/* Where money goes by category */}
              {catList.length > 0 && (
                <>
                  <div className="section-label" style={{ marginTop: 24 }}>Monthly spend by category</div>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                    {catList.map(([cat, amt]) => {
                      const color = cat === 'Bills & Utilities' ? 'var(--danger)' : (customCats.find(c => c.name === cat)?.color || CAT_COLORS[cat] || 'var(--text-dim)')
                      return (
                        <div key={cat} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{cat === 'Bills & Utilities' ? '🧾' : (CAT_ICONS[cat] || '📦')} {cat}</span>
                            <span style={{ fontSize: 13, fontFamily: "'DM Mono'", color: 'var(--text-primary)' }}>{fmt(amt)}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-card2)', overflow: 'hidden' }}>
                            <div style={{ width: `${(amt / catMax) * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* The annual reframe — this is what drives cancellations */}
              {activeSubs.length > 0 && (
                <div style={{ background: 'var(--warn-dim)', border: '1px solid var(--warn-border)', borderRadius: 14, padding: 16, marginTop: 16 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Your {activeSubs.length} active subscription{activeSubs.length === 1 ? '' : 's'} cost{activeSubs.length === 1 ? 's' : ''}{' '}
                    <strong style={{ color: 'var(--warn)', fontFamily: "'DM Mono'" }}>{fmt(mSubs * 12)}</strong> a year.
                    {biggestSub && <> The biggest is <strong style={{ color: 'var(--text-primary)' }}>{biggestSub.name}</strong> at {fmt(toYearly(biggestSub.amount, biggestSub.frequency))}/yr.</>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════ RECURRING ══════════════════ */}
      {tab === 'recurring' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <StatTile label="Every month" value={fmt(burn)} sub={`${activeSubs.length + activeBills.length} items`} />
            <StatTile label="Every year" value={fmt(burn * 12)} sub="same commitments" color="var(--warn)" />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div onClick={() => setSubModal('new')} className="btn-primary" style={{ flex: 1, textAlign: 'center', padding: '11px', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>+ Subscription</div>
            <div onClick={() => setModal({ type: 'bill' })} style={{ flex: 1, textAlign: 'center', padding: '11px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>+ Bill</div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[['list', 'List'], ['calendar', 'Calendar']].map(([v, l]) => (
              <div key={v} onClick={() => setRecurView(v)}
                style={{ padding: '6px 14px', borderRadius: 18, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                  background: recurView === v ? 'var(--accent-dim)' : 'var(--bg-card)',
                  border: `1px solid ${recurView === v ? 'var(--accent-border)' : 'var(--border)'}`,
                  color: recurView === v ? 'var(--accent)' : 'var(--text-muted)' }}>{l}</div>
            ))}
          </div>

          {recurView === 'calendar' ? (
            <SubCalendar subs={activeSubs} customCats={customCats} onEdit={setSubModal} />
          ) : (
            <>
              {/* Bills */}
              {activeBills.length > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <div className="section-label" style={{ margin: 0 }}>Bills & utilities</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>{fmt(mBills)}/mo</div>
                  </div>
                  {activeBills.map(b => {
                    const next = nextChargeDate(b, 'bill')
                    return (
                      <Row key={b.id} icon="🧾" iconBg="var(--danger-dim)"
                        title={b.name}
                        subtitle={next ? `${next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${b.frequency}` : b.frequency}
                        right={fmt(b.amount)}
                        rightSub={next ? dueLabel(daysUntil(next)) : null}
                        onClick={() => setModal({ type: 'bill', item: b })} />
                    )
                  })}
                </>
              )}

              {/* Subscriptions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, marginTop: activeBills.length ? 22 : 0 }}>
                <div className="section-label" style={{ margin: 0 }}>Subscriptions</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>{fmt(mSubs)}/mo</div>
              </div>

              {activeSubs.length === 0 && activeBills.length === 0 ? (
                <EmptyState icon="🔁" text="Nothing recurring yet. Add your subscriptions and bills to see the real monthly cost." action="Add subscription" onAction={() => setSubModal('new')} />
              ) : activeSubs.map(s => (
                <SubCard key={s.id} sub={s} customCats={customCats} onEdit={() => setSubModal(s)} />
              ))}

              {/* Paused */}
              {pausedSubs.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div onClick={() => setShowPaused(!showPaused)}
                    style={{ textAlign: 'center', padding: '11px', borderRadius: 12, fontSize: 13, cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    {showPaused ? 'Hide' : 'View'} {pausedSubs.length} paused
                  </div>
                  {showPaused && <div style={{ marginTop: 10 }}>
                    {pausedSubs.map(s => <SubCard key={s.id} sub={s} customCats={customCats} onEdit={() => setSubModal(s)} />)}
                  </div>}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════ INCOME ══════════════════ */}
      {tab === 'income' && (
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>MONTHLY INCOME</div>
            <div style={{ fontSize: 34, fontWeight: 600, fontFamily: "'DM Mono'", letterSpacing: '-1px', color: 'var(--success)' }}>{fmt(mIncome)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 5 }}>{fmt(mIncome * 12)} a year across {income.length} source{income.length === 1 ? '' : 's'}</div>
          </div>

          <div onClick={() => setModal({ type: 'income' })} className="btn-primary" style={{ textAlign: 'center', padding: '11px', borderRadius: 12, fontSize: 14, cursor: 'pointer', marginBottom: 18 }}>+ Add income source</div>

          {income.length === 0 ? (
            <EmptyState icon="💵" text="Add every source — salary, commission, side work. Everything else on this page depends on it." />
          ) : income.map(i => (
            <Row key={i.id} icon="💵" iconBg="var(--success-dim)"
              title={i.name}
              subtitle={i.frequency}
              right={fmt(i.amount)}
              rightSub={i.frequency !== 'monthly' ? `${fmt(toMonthly(i.amount, i.frequency))}/mo` : null}
              onClick={() => setModal({ type: 'income', item: i })} />
          ))}

          {/* Savings targets live here — they come out of income */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 26, marginBottom: 10 }}>
            <div className="section-label" style={{ margin: 0 }}>Savings targets</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>{fmt(mSavings)}/mo</div>
          </div>
          <div onClick={() => setModal({ type: 'savings' })}
            style={{ textAlign: 'center', padding: '10px', borderRadius: 12, fontSize: 13, cursor: 'pointer', background: 'var(--bg-card)', border: '1px dashed var(--border)', color: 'var(--text-muted)', marginBottom: 12 }}>+ Add savings target</div>
          {savings.map(s => (
            <Row key={s.id} icon="🎯" iconBg="var(--success-dim)"
              title={s.name}
              subtitle="monthly target"
              right={fmt(s.monthly_target)}
              onClick={() => setModal({ type: 'savings', item: s })} />
          ))}
        </div>
      )}

      {/* ══════════════════ ACCOUNTS ══════════════════ */}
      {tab === 'accounts' && (
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>NET WORTH</div>
            <div style={{ fontSize: 38, fontWeight: 600, fontFamily: "'DM Mono'", letterSpacing: '-1.5px', color: netWorth < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {netWorth < 0 ? '−' : ''}{fmt(netWorth)}
            </div>
            {accounts.length > 0 && (
              <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Assets</div>
                  <div style={{ fontSize: 15, fontFamily: "'DM Mono'", color: 'var(--success)', marginTop: 2 }}>{fmt(assets)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Debts</div>
                  <div style={{ fontSize: 15, fontFamily: "'DM Mono'", color: 'var(--danger)', marginTop: 2 }}>{fmt(debts)}</div>
                </div>
              </div>
            )}
          </div>

          {runway !== null && liquid > 0 && (
            <div style={{ background: runway < 3 ? 'var(--warn-dim)' : 'var(--bg-card)', border: `1px solid ${runway < 3 ? 'var(--warn-border)' : 'var(--border)'}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                If your income stopped today, your {fmt(liquid)} in cash covers{' '}
                <strong style={{ color: runway < 3 ? 'var(--warn)' : 'var(--text-primary)', fontFamily: "'DM Mono'" }}>
                  {runway >= 24 ? 'over 24' : runway.toFixed(1)} months
                </strong> of bills and subscriptions.
              </div>
            </div>
          )}

          <div onClick={() => setAcctModal('new')} className="btn-primary" style={{ textAlign: 'center', padding: '11px', borderRadius: 12, fontSize: 14, cursor: 'pointer', marginBottom: 18 }}>+ Add account</div>

          {accounts.length === 0 ? (
            <EmptyState icon="🏦" text="Add your accounts — checking, savings, credit cards, investments — to track net worth. Balances are manual, so update them whenever you like." />
          ) : (
            <>
              {['asset', 'debt'].map(group => {
                const list = accounts.filter(a => kindDef(a.kind).asset === (group === 'asset'))
                if (!list.length) return null
                const total = list.reduce((n, a) => n + (parseFloat(a.balance) || 0), 0)
                return (
                  <div key={group} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                      <div className="section-label" style={{ margin: 0 }}>{group === 'asset' ? 'What you have' : 'What you owe'}</div>
                      <div style={{ fontSize: 11.5, fontFamily: "'DM Mono'", color: group === 'asset' ? 'var(--success)' : 'var(--danger)' }}>{fmt(total)}</div>
                    </div>
                    {list.map(a => {
                      const def = kindDef(a.kind)
                      const stale = a.updated_at ? Math.round((Date.now() - new Date(a.updated_at)) / 86400000) : null
                      return (
                        <Row key={a.id} icon={def.icon} iconBg={group === 'asset' ? 'var(--success-dim)' : 'var(--danger-dim)'}
                          title={a.name}
                          subtitle={[a.institution, def.label].filter(Boolean).join(' · ')}
                          right={(group === 'debt' ? '−' : '') + fmt(a.balance)}
                          rightSub={stale !== null && stale > 7 ? `${stale}d ago` : null}
                          onClick={() => setAcctModal(a)} />
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {modal && <EntryModal type={modal.type} item={modal.item} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />}
      {subModal && <SubModal item={subModal === 'new' ? null : subModal} categories={customCats} onClose={() => setSubModal(null)} onSaved={() => { setSubModal(null); load() }} />}
      {acctModal && <AccountModal item={acctModal === 'new' ? null : acctModal} onClose={() => setAcctModal(null)} onSaved={() => { setAcctModal(null); load() }} />}
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
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14 }}>{MONTH_NAMES[month]} {year}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((d,i) => (
          <div key={i} style={{ textAlign:'center', fontSize:10, color:'var(--text-dim)', padding:'3px 0', fontWeight:600 }}>{d}</div>
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
              style={{ borderRadius: 8, padding: '5px 2px', minHeight: 54, background: isToday ? 'var(--accent-dim)' : isSelected ? 'var(--bg-card2)' : 'var(--bg-card)', border: `1px solid ${isToday ? 'var(--accent-border)' : isSelected ? 'var(--blue-border)' : 'var(--border)'}`, cursor: daySubs.length ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: isToday ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 3 }}>{day}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {daySubs.slice(0, 4).map(s => {
                  const isImg = s.icon?.startsWith('data:')
                  const icon = isImg ? null : (s.icon || getServiceIcon(s.name) || '📦')
                  return (
                    <div key={s.id} style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, overflow: 'hidden' }}>
                      {isImg ? <img src={s.icon} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : icon}
                    </div>
                  )
                })}
                {daySubs.length > 4 && <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>+{daySubs.length - 4}</div>}
              </div>
              {daySubs.length > 0 && (
                <div style={{ fontSize: 8, color: 'var(--danger)', fontFamily:"'DM Mono'", marginTop: 2 }}>
                  ${daySubs.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0).toFixed(0)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {calDay && dayMap[calDay] && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
            {MONTH_NAMES[month]} {calDay} — {dayMap[calDay].length} subscription{dayMap[calDay].length > 1 ? 's' : ''}
            <span style={{ fontFamily:"'DM Mono'", color:'var(--danger)', marginLeft: 10 }}>
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
        <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-dim)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 12 }}>
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
  const catColor = catDef?.color || CAT_COLORS[sub.category || 'Other'] || 'var(--text-dim)'
  const displayIcon = sub.icon || getServiceIcon(sub.name) || CAT_ICONS[sub.category || 'Other'] || '📦'
  const isImageIcon = sub.icon && sub.icon.startsWith('data:')

  return (
    <div onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, cursor: 'pointer', opacity: isPaused ? 0.5 : 1 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: catColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
        {isImageIcon
          ? <img src={displayIcon} alt={sub.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
          : displayIcon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.name}</div>
          {isPaused && <div style={{ fontSize: 9, color: 'var(--text-dim)', background: 'var(--border)', borderRadius: 4, padding: '2px 5px', flexShrink: 0 }}>PAUSED</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: catColor + '22', color: catColor, fontWeight: 500 }}>{sub.category || 'Other'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{sub.frequency}</div>
          {sub.billing_day && <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>bills {sub.billing_day}{['st','nd','rd'][sub.billing_day-1]||'th'}</div>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'DM Mono'" }}>{fmt(sub.amount)}</div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'DM Mono'", marginTop: 2 }}>
          {sub.frequency !== 'monthly' ? `${fmt(monthly)}/mo` : `${fmt(yearly)}/yr`}
        </div>
      </div>
    </div>
  )
}
