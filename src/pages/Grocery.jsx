import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BASE_CATEGORIES = ['Produce','Meat & Fish','Dairy','Bakery','Frozen','Pantry','Drinks','Snacks','Personal Care','Household','Other']
const CAT_STORAGE_KEY = 'lifeos_grocery_categories'

function loadCategories() {
  try { const s = localStorage.getItem(CAT_STORAGE_KEY); return s ? JSON.parse(s) : [...BASE_CATEGORIES] }
  catch { return [...BASE_CATEGORIES] }
}

export default function Grocery() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState(loadCategories)
  const [newItem, setNewItem] = useState('')
  const [newQty, setNewQty] = useState('')
  const [newCat, setNewCat] = useState('Other')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingCat, setEditingCat] = useState(null) // { name, newName }
  const [manageCats, setManageCats] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('grocery_items').select('*').order('category').order('sort_order').order('created_at')
    setItems(data || []); setLoading(false)
  }

  const saveCategories = (cats) => {
    setCategories(cats)
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(cats))
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

  const addCategory = () => {
    if (!newCatName.trim() || categories.includes(newCatName.trim())) return
    saveCategories([...categories, newCatName.trim()])
    setNewCatName(''); setShowAddCat(false)
  }

  const renameCategory = async (oldName, newName) => {
    if (!newName.trim() || newName === oldName) { setEditingCat(null); return }
    // Update all items with this category
    const affected = items.filter(i => i.category === oldName)
    await Promise.all(affected.map(i => supabase.from('grocery_items').update({ category: newName.trim() }).eq('id', i.id)))
    setItems(prev => prev.map(i => i.category === oldName ? { ...i, category: newName.trim() } : i))
    const newCats = categories.map(c => c === oldName ? newName.trim() : c)
    saveCategories(newCats)
    if (newCat === oldName) setNewCat(newName.trim())
    setEditingCat(null)
  }

  const deleteCategory = async (name) => {
    if (!window.confirm(`Delete "${name}" and move its items to Other?`)) return
    const affected = items.filter(i => i.category === name)
    await Promise.all(affected.map(i => supabase.from('grocery_items').update({ category: 'Other' }).eq('id', i.id)))
    setItems(prev => prev.map(i => i.category === name ? { ...i, category: 'Other' } : i))
    saveCategories(categories.filter(c => c !== name))
    if (newCat === name) setNewCat('Other')
  }

  const filtered = filter === 'all' ? items : filter === 'checked' ? items.filter(i => i.checked) : items.filter(i => !i.checked)
  const grouped = filtered.reduce((acc, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc }, {})
  const checkedCount = items.filter(i => i.checked).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Grocery List</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{items.length - checkedCount} remaining · {checkedCount} checked</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div onClick={() => setManageCats(!manageCats)} style={{ padding: '7px 12px', borderRadius: 10, background: manageCats ? 'var(--accent-dim)' : 'var(--bg-card)', border: `1px solid ${manageCats ? 'var(--accent-border)' : 'var(--border)'}`, color: manageCats ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            ✏️ Categories
          </div>
          {checkedCount > 0 && (
            <div onClick={clearChecked} style={{ padding: '7px 12px', borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              Clear {checkedCount}
            </div>
          )}
        </div>
      </div>

      {/* Manage Categories Panel */}
      {manageCats && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Manage categories</div>
            <div onClick={() => { setShowAddCat(true); setManageCats(true) }} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', padding: '4px 10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 8 }}>+ Add</div>
          </div>
          {showAddCat && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input type="text" placeholder="Category name..." value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key==='Enter' && addCategory()}
                style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: "'DM Sans'", outline: 'none' }} />
              <button onClick={addCategory} className="btn-primary" style={{ padding: '0 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans'" }}>Add</button>
              <button onClick={() => { setShowAddCat(false); setNewCatName('') }} style={{ padding: '0 12px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', fontFamily: "'DM Sans'" }}>×</button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {categories.map(cat => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)' }}>
                {editingCat?.name === cat ? (
                  <>
                    <input type="text" value={editingCat.newName} onChange={e => setEditingCat({ ...editingCat, newName: e.target.value })}
                      onKeyDown={e => { if(e.key==='Enter') renameCategory(cat, editingCat.newName); if(e.key==='Escape') setEditingCat(null) }}
                      autoFocus style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--accent-border)', borderRadius: 8, padding: '6px 10px', fontSize: 14, color: 'var(--text-primary)', fontFamily: "'DM Sans'", outline: 'none' }} />
                    <div onClick={() => renameCategory(cat, editingCat.newName)} style={{ fontSize: 12, color: 'var(--success)', cursor: 'pointer', padding: '4px 10px', background: 'var(--success-dim)', border: '1px solid var(--success-border)', borderRadius: 8 }}>Save</div>
                    <div onClick={() => setEditingCat(null)} style={{ fontSize: 16, color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 8px' }}>×</div>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>{cat}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'DM Mono'" }}>{items.filter(i => i.category === cat).length} items</div>
                    <div onClick={() => setEditingCat({ name: cat, newName: cat })} style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>✏️</div>
                    <div onClick={() => deleteCategory(cat)} style={{ fontSize: 12, color: 'var(--danger)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: 'var(--danger-dim)', border: '1px solid var(--danger-border)' }}>✕</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add item */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 18 }}>
        <div className="field-label" style={{ marginBottom: 10 }}>Add item</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input type="text" placeholder="Item name..." value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()}
            style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 15, color: 'var(--text-primary)', fontFamily: "'DM Sans'", outline: 'none' }} />
          <input type="text" placeholder="Qty" value={newQty} onChange={e => setNewQty(e.target.value)}
            style={{ width: 60, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 15, color: 'var(--text-primary)', fontFamily: "'DM Sans'", outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {categories.map(cat => (
            <div key={cat} onClick={() => setNewCat(cat)}
              style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: newCat === cat ? 'var(--accent-dim)' : 'var(--bg-input)', borderColor: newCat === cat ? 'var(--accent-border)' : 'var(--border)', color: newCat === cat ? 'var(--accent)' : 'var(--text-dim)' }}>
              {cat}
            </div>
          ))}
        </div>
        <div className="btn-primary" style={{ width: '100%', textAlign: 'center', padding: '11px', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 500, border: 'none' }} onClick={addItem}>
          + Add to list
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[['all','All'],['unchecked','Remaining'],['checked','Checked']].map(([val, label]) => (
          <div key={val} onClick={() => setFilter(val)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', background: filter === val ? 'var(--accent-dim)' : 'var(--bg-card)', borderColor: filter === val ? 'var(--accent-border)' : 'var(--border)', color: filter === val ? 'var(--accent)' : 'var(--text-muted)' }}>
            {label}
          </div>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Loading...</div>}
      {!loading && Object.keys(grouped).length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontSize: 14, border: '1px dashed var(--border)', borderRadius: 14 }}>
          {filter === 'all' ? 'Your list is empty — add something above' : 'Nothing here'}
        </div>
      )}

      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category} style={{ marginBottom: 20 }}>
          <div className="section-label">{category}</div>
          {catItems.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 6 }}>
              <div onClick={() => toggleCheck(item)} style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${item.checked ? 'var(--success)' : 'var(--border-hover)'}`, background: item.checked ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
                {item.checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><polyline points="1.5,5.5 4.5,8.5 9.5,2.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, color: item.checked ? 'var(--text-dim)' : 'var(--text-primary)', textDecoration: item.checked ? 'line-through' : 'none' }}>{item.name}</div>
                {item.quantity && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1, fontFamily: "'DM Mono'" }}>Qty: {item.quantity}</div>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>{item.category}</div>
              <div onClick={() => deleteItem(item.id)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 18, borderRadius: 8 }}>×</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
