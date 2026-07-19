import React, { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Long-press to pick up, drag to reorder — modelled on the iOS home screen.
 *
 * How it works: on pick-up the row lifts (scale + shadow) and follows your
 * finger via translateY. The other rows slide out of the way by exactly one
 * row height. Nothing is committed until you let go, so the underlying array
 * never thrashes mid-drag.
 *
 *   items      — array of objects, each with a stable `id`
 *   onReorder  — (nextItems) => void, fired once on release
 *   renderItem — (item, { dragging, index }) => node
 *   gap        — vertical gap between rows, px (must match your layout)
 */
export default function SortableList({
  items,
  onReorder,
  renderItem,
  gap = 0,
  longPressMs = 240,
  disabled = false,
}) {
  const [dragIndex, setDragIndex] = useState(null)
  const [targetIndex, setTargetIndex] = useState(null)
  const [offsetY, setOffsetY] = useState(0)

  const containerRef = useRef(null)
  const rowRefs = useRef([])
  const timerRef = useRef(null)
  const startRef = useRef({ x: 0, y: 0 })
  const rowHeightRef = useRef(0)
  // mirrors dragIndex for the non-passive touchmove listener, which closes
  // over its first render otherwise
  const draggingRef = useRef(false)

  const cancelPress = () => { clearTimeout(timerRef.current); timerRef.current = null }

  const endDrag = useCallback(() => {
    cancelPress()
    if (dragIndex !== null && targetIndex !== null && dragIndex !== targetIndex) {
      const next = [...items]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(targetIndex, 0, moved)
      onReorder(next)
    }
    draggingRef.current = false
    setDragIndex(null); setTargetIndex(null); setOffsetY(0)
  }, [dragIndex, targetIndex, items, onReorder])

  // While a row is lifted we must stop the page from scrolling. touch-action
  // alone is too late — the gesture has already begun — so preventDefault on a
  // non-passive listener.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const block = (e) => { if (draggingRef.current) e.preventDefault() }
    el.addEventListener('touchmove', block, { passive: false })
    return () => el.removeEventListener('touchmove', block)
  }, [])

  useEffect(() => () => cancelPress(), [])

  const pointFrom = (e) => e.touches ? e.touches[0] : e

  const handleStart = (e, index) => {
    if (disabled) return
    const p = pointFrom(e)
    startRef.current = { x: p.clientX, y: p.clientY }

    const row = rowRefs.current[index]
    rowHeightRef.current = row ? row.getBoundingClientRect().height + gap : 0

    cancelPress()
    timerRef.current = setTimeout(() => {
      draggingRef.current = true
      setDragIndex(index)
      setTargetIndex(index)
      setOffsetY(0)
      if (navigator.vibrate) navigator.vibrate(10)
    }, longPressMs)
  }

  const handleMove = (e) => {
    const p = pointFrom(e)

    // Not lifted yet: any real movement means the user is scrolling, not dragging.
    if (!draggingRef.current) {
      const dx = Math.abs(p.clientX - startRef.current.x)
      const dy = Math.abs(p.clientY - startRef.current.y)
      if (dx > 6 || dy > 6) cancelPress()
      return
    }

    const dy = p.clientY - startRef.current.y
    setOffsetY(dy)

    const h = rowHeightRef.current || 1
    const shift = Math.round(dy / h)
    const next = Math.max(0, Math.min(items.length - 1, dragIndex + shift))
    setTargetIndex(next)
  }

  return (
    <div ref={containerRef}
      style={{
        display: 'flex', flexDirection: 'column', gap,
        touchAction: dragIndex !== null ? 'none' : 'auto',
      }}>
      {items.map((item, i) => {
        const isDragging = dragIndex === i
        let translate = 0

        if (dragIndex !== null && targetIndex !== null && !isDragging) {
          const h = rowHeightRef.current
          if (dragIndex < i && i <= targetIndex) translate = -h
          else if (targetIndex <= i && i < dragIndex) translate = h
        }

        return (
          <div key={item.id}
            ref={el => (rowRefs.current[i] = el)}
            onTouchStart={e => handleStart(e, i)}
            onTouchMove={handleMove}
            onTouchEnd={endDrag}
            onTouchCancel={endDrag}
            onMouseDown={e => handleStart(e, i)}
            onMouseMove={e => dragIndex !== null && handleMove(e)}
            onMouseUp={endDrag}
            onMouseLeave={() => dragIndex === i && endDrag()}
            style={{
              transform: isDragging
                ? `translateY(${offsetY}px) scale(1.04)`
                : `translateY(${translate}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
              zIndex: isDragging ? 20 : 1,
              position: 'relative',
              boxShadow: isDragging ? '0 12px 28px rgba(0,0,0,0.35)' : 'none',
              borderRadius: isDragging ? 14 : undefined,
              opacity: isDragging ? 0.96 : 1,
              userSelect: 'none', WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              cursor: isDragging ? 'grabbing' : 'pointer',
            }}>
            {renderItem(item, { dragging: isDragging, index: i })}
          </div>
        )
      })}
    </div>
  )
}

/** True while a drag just ended — lets callers suppress the click that follows. */
export function useDragClickGuard() {
  const ref = useRef(false)
  return {
    suppress: () => { ref.current = true; setTimeout(() => { ref.current = false }, 250) },
    shouldIgnoreClick: () => ref.current,
  }
}
