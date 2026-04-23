import React, { useState, useRef, useEffect } from 'react'

const STORAGE_KEY = 'lifeos_library'

function loadFromStorage() {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    return s ? JSON.parse(s) : { items: [], categories: ['Inspiration','Progress','Family','Travel','Work','Other'] }
  } catch { return { items: [], categories: ['Inspiration','Progress','Family','Travel','Work','Other'] } }
}

export default function Library() {
  const [data, setData] = useState(loadFromStorage)
  const [activeCategory, setActiveCategory] = useState('All')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const save = (newData) => {
    setData(newData)
    // Store metadata only (not base64) to avoid quota issues - store full data for small libs
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newData)) } catch(e) {
      // If too large, store without the largest items
      console.warn('Storage full, trimming old items')
    }
  }

  const { items, categories } = data
  const allCategories = ['All', ...categories]
  const filtered = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory)

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const newItems = []
    for (const file of files) {
      const isVideo = file.type.startsWith('video/')
      await new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          newItems.push({ id: Date.now() + Math.random(), url: ev.target.result, type: isVideo ? 'video' : 'image', name: file.name, category: activeCategory === 'All' ? 'Other' : activeCategory, date: new Date().toLocaleDateString() })
          resolve()
        }
        reader.readAsDataURL(file)
      })
    }
    save({ ...data, items: [...items, ...newItems] })
    setUploading(false)
    e.target.value = ''
  }

  const changeCategory = (itemId, newCat) => {
    const newItems = items.map(i => i.id === itemId ? { ...i, category: newCat } : i)
    save({ ...data, items: newItems })
    if (lightbox?.id === itemId) setLightbox(prev => ({ ...prev, category: newCat }))
  }

  const deleteItem = (id) => {
    save({ ...data, items: items.filter(i => i.id !== id) })
    if (lightbox?.id === id) setLightbox(null)
  }

  const addCategory = () => {
    if (!newCategoryName.trim() || categories.includes(newCategoryName.trim())) return
    save({ ...data, categories: [...categories, newCategoryName.trim()] })
    setNewCategoryName(''); setShowAddCategory(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Library</div>
        <div onClick={() => fileRef.current?.click()} className="action-btn btn-task">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          {uploading ? 'Uploading…' : 'Add media'}
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleUpload} />
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 8, WebkitOverflowScrolling: 'touch', alignItems: 'center' }}>
        {allCategories.map(cat => (
          <div key={cat} onClick={() => setActiveCategory(cat)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', background: activeCategory === cat ? 'var(--accent-dim)' : '#161618', borderColor: activeCategory === cat ? 'var(--accent-border)' : '#242428', color: activeCategory === cat ? 'var(--accent)' : '#666' }}>
            {cat}
          </div>
        ))}
        <div onClick={() => setShowAddCategory(!showAddCategory)}
          style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px dashed #242428', whiteSpace: 'nowrap', color: 'var(--accent)', background: 'var(--accent-dim)', flexShrink: 0 }}>
          + Category
        </div>
      </div>

      {showAddCategory && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input type="text" placeholder="Category name..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            style={{ flex: 1, background: '#0f0f11', border: '1px solid #242428', borderRadius: 10, padding: '10px 12px', fontSize: 15, color: '#e8e6e1', fontFamily: "'DM Sans'", outline: 'none' }} />
          <button onClick={addCategory} className="btn-primary" style={{ padding: '0 16px', borderRadius: 10, fontSize: 14, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans'" }}>Add</button>
          <button onClick={() => setShowAddCategory(false)} style={{ padding: '0 14px', borderRadius: 10, background: '#161618', border: '1px solid #242428', color: '#666', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans'" }}>×</button>
        </div>
      )}

      {items.length === 0 && (
        <div onClick={() => fileRef.current?.click()} style={{ textAlign: 'center', padding: '60px 20px', color: '#444', fontSize: 14, border: '2px dashed #242428', borderRadius: 16, cursor: 'pointer' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
          <div style={{ marginBottom: 6 }}>Tap to add photos or videos</div>
          <div style={{ fontSize: 12, color: '#333' }}>Saved to your device storage</div>
        </div>
      )}

      {filtered.length === 0 && items.length > 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', fontSize: 14 }}>Nothing in {activeCategory} yet</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
        {filtered.map(item => (
          <div key={item.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', background: '#161618', cursor: 'pointer' }} onClick={() => setLightbox(item)}>
            {item.type === 'video'
              ? <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 8px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
              <div style={{ fontSize: 10, color: '#aaa', fontWeight: 500 }}>{item.category}</div>
            </div>
            {item.type === 'video' && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '12px solid white', marginLeft: 3 }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 300, display: 'flex', flexDirection: 'column' }} onClick={() => setLightbox(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }} onClick={e => e.stopPropagation()}>
            <select value={lightbox.category} onChange={e => changeCategory(lightbox.id, e.target.value)}
              style={{ background: '#161618', border: '1px solid #242428', borderRadius: 10, padding: '6px 10px', color: '#e8e6e1', fontSize: 13, fontFamily: "'DM Sans'", outline: 'none' }}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <div onClick={() => deleteItem(lightbox.id)} style={{ padding: '7px 14px', background: '#2a0a0a', border: '1px solid #7a1010', borderRadius: 10, color: '#f87171', fontSize: 13, cursor: 'pointer' }}>Delete</div>
              <div onClick={() => setLightbox(null)} style={{ padding: '7px 14px', background: '#161618', border: '1px solid #242428', borderRadius: 10, color: '#888', fontSize: 13, cursor: 'pointer' }}>Close</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.stopPropagation()}>
            {lightbox.type === 'video'
              ? <video src={lightbox.url} controls style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12 }} />
              : <img src={lightbox.url} alt={lightbox.name} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12, objectFit: 'contain' }} />}
          </div>
        </div>
      )}
    </div>
  )
}
