import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_CATEGORIES = ['Produce','Meat & Fish','Dairy','Bakery','Frozen','Pantry','Drinks','Snacks','Personal Care','Household','Other']

export default function Grocery() {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [newQty, setNewQty] = useState('')
  const [newCat, setNewCat] = useState('Other')
  const [filter, setFilter] = useState('all')
  const [editItem, setEditItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('grocery_items').select('*').order('category').order('sort_order').order('created_at')
    setItems(data || []); setLoading(false)
  }

  const addItem = async () => {
    if (!newItem.trim()) return
    const { data } = await supabase.from('grocery_items').insert({ name: newItem.trim(), category: newCat, quantity: newQty || null, checked: false }).select().single()
    if (data) { setItems(prev => [...prev, data]); setNewItem(''); setNewQty('') }
  }

  const toggleCheck = async (item) => {
    await supabase.from('grocery_items').update({ checked: !item.checked }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))
  }

  const deleteItem = async (id) => {
    await supabase.from('grocery_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const clearChecked = async () => {
    const checked = items.filter(i => i.checked)
    await Promise.all(checked.map(i => supabase.from('grocery_items').delete().eq('id', i.id)))
    setItems(prev => prev.filter(i => !i.checked))
  }

  const filtered = filter === 'all' ? items : filter === 'checked' ? items.filter(i => i.checked) : items.filter(i => !i.checked)
  const grouped = filtered.reduce((acc, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc }, {})
  const checkedCount = items.filter(i => i.checked).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Grocery List</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{items.length - checkedCount} remaining · {checkedCount} checked</div>
        </div>
        {checkedCount > 0 && (
          <div onClick={clearChecked} style={{ padding: '7px 12px', borderRadius: 10, background: '#2a0a0a', border: '1px solid #7a1010', color: '#f87171', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            Clear {checkedCount} done
          </div>
        )}
      </div>

      {/* Add item */}
      <div style={{ background: '#161618', border: '1px solid #242428', borderRadius: 14, padding: 16, marginBottom: 18 }}>
        <div className="field-label" style={{ marginBottom: 10 }}>Add item</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input type="text" placeholder="Item name..." value={newItem} onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            style={{ flex: 1, background: '#0f0f11', border: '1px solid #242428', borderRadius: 10, padding: '10px 12px', fontSize: 15, color: '#e8e6e1', fontFamily: "'DM Sans'", outline: 'none' }} />
          <input type="text" placeholder="Qty" value={newQty} onChange={e => setNewQty(e.target.value)}
            style={{ width: 60, background: '#0f0f11', border: '1px solid #242428', borderRadius: 10, padding: '10px 12px', fontSize: 15, color: '#e8e6e1', fontFamily: "'DM Sans'", outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {DEFAULT_CATEGORIES.map(cat => (
            <div key={cat} onClick={() => setNewCat(cat)}
              style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: newCat === cat ? 'var(--accent-dim)' : '#0f0f11', borderColor: newCat === cat ? 'var(--accent-border)' : '#2a2a30', color: newCat === cat ? 'var(--accent)' : '#555' }}>
              {cat}
            </div>
          ))}
        </div>
        <div className="btn-primary" style={{ width: '100%', textAlign: 'center', padding: '11px', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 500 }} onClick={addItem}>
          + Add to list
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[['all','All'],['unchecked','Remaining'],['checked','Checked']].map(([val, label]) => (
          <div key={val} onClick={() => setFilter(val)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: filter === val ? 'var(--accent-dim)' : '#161618', borderColor: filter === val ? 'var(--accent-border)' : '#242428', color: filter === val ? 'var(--accent)' : '#666' }}>
            {label}
          </div>
        ))}
      </div>

      {/* Items grouped by category */}
      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#444' }}>Loading...</div>}
      {!loading && Object.keys(grouped).length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#444', fontSize: 14, border: '1px dashed #242428', borderRadius: 14 }}>
          {filter === 'all' ? 'Your list is empty — add something above' : 'Nothing here'}
        </div>
      )}
      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category} style={{ marginBottom: 20 }}>
          <div className="section-label">{category}</div>
          {catItems.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 12, marginBottom: 6 }}>
              <div onClick={() => toggleCheck(item)} style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${item.checked ? '#16a34a' : '#333'}`, background: item.checked ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
                {item.checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><polyline points="1.5,5.5 4.5,8.5 9.5,2.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, color: item.checked ? '#555' : '#e8e6e1', textDecoration: item.checked ? 'line-through' : 'none' }}>{item.name}</div>
                {item.quantity && <div style={{ fontSize: 11, color: '#555', marginTop: 1, fontFamily: "'DM Mono'" }}>Qty: {item.quantity}</div>}
              </div>
              <div onClick={() => deleteItem(item.id)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#444', fontSize: 18, borderRadius: 8 }}>×</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
