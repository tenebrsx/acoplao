'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Plus, Move, MousePointer2, Type, Square, Circle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type CanvasElement = {
  id: string
  type: 'text' | 'shape' | 'note'
  x: number
  y: number
  width?: number
  height?: number
  content?: string
  color?: string
}

export function CanvasBlock({ pageId, initialContent }: { pageId: string, initialContent: any }) {
  const [elements, setElements] = useState<CanvasElement[]>(initialContent?.elements || [])
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Realtime saving (debounced)
  useEffect(() => {
    const save = setTimeout(() => {
      supabase.from('workspace_page_content').upsert({
        page_id: pageId,
        content_data: { elements }
      }).then()
    }, 1000)
    return () => clearTimeout(save)
  }, [elements, pageId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`canvas_${pageId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'workspace_page_content', filter: `page_id=eq.${pageId}` }, (payload) => {
        if (payload.new.content_data?.elements) {
          setElements(payload.new.content_data.elements)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [pageId])

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const newScale = Math.min(Math.max(0.1, scale - e.deltaY * 0.01), 3)
      setScale(newScale)
    } else {
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }))
    }
  }

  const addElement = (type: CanvasElement['type']) => {
    const newEl: CanvasElement = {
      id: Date.now().toString(),
      type,
      x: -pan.x / scale + window.innerWidth / 2 - 100,
      y: -pan.y / scale + window.innerHeight / 2 - 100,
      width: 200,
      height: type === 'shape' ? 200 : 100,
      content: type === 'text' ? 'Double click to edit' : '',
      color: 'var(--surface)'
    }
    setElements([...elements, newEl])
  }

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }

  return (
    <div 
      style={{ width: '100%', height: 'calc(100vh - 120px)', position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)', cursor: isPanning ? 'grabbing' : 'default' }}
      onWheel={handleWheel}
      onMouseDown={(e) => { if (e.button === 1 || e.shiftKey || e.target === containerRef.current) setIsPanning(true) }}
      onMouseUp={() => setIsPanning(false)}
      onMouseLeave={() => setIsPanning(false)}
      onMouseMove={(e) => {
        if (isPanning) {
          setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }))
        }
      }}
    >
      {/* Background Dot Grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(var(--surface-border) 1px, transparent 0)',
        backgroundSize: `${40 * scale}px ${40 * scale}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`
      }} />

      {/* Toolbar */}
      <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', padding: '8px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)', zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <button onClick={() => addElement('text')} className="btn" style={{ background: 'transparent', border: 'none', padding: '8px', color: 'var(--text-secondary)' }} title="Add Text"><Type size={20} /></button>
        <button onClick={() => addElement('note')} className="btn" style={{ background: 'transparent', border: 'none', padding: '8px', color: 'var(--text-secondary)' }} title="Add Sticky Note"><Square size={20} /></button>
        <button onClick={() => addElement('shape')} className="btn" style={{ background: 'transparent', border: 'none', padding: '8px', color: 'var(--text-secondary)' }} title="Add Shape"><Circle size={20} /></button>
        <div style={{ width: '1px', background: 'var(--surface-border)', margin: '0 8px' }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Infinite Canvas */}
      <div 
        ref={containerRef}
        style={{
          position: 'absolute',
          transformOrigin: '0 0',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          width: '10000px', height: '10000px'
        }}
      >
        {elements.map(el => (
          <motion.div
            key={el.id}
            drag
            dragMomentum={false}
            onDragEnd={(e, info) => updateElement(el.id, { x: el.x + info.offset.x / scale, y: el.y + info.offset.y / scale })}
            style={{
              position: 'absolute',
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              background: el.type === 'note' ? '#fde047' : el.type === 'shape' ? 'var(--surface)' : 'transparent',
              border: el.type === 'shape' ? '2px solid var(--accent-primary)' : 'none',
              borderRadius: el.type === 'shape' ? '50%' : '8px',
              padding: '16px',
              color: el.type === 'note' ? '#000' : 'var(--text-primary)',
              boxShadow: el.type === 'note' ? '0 12px 24px rgba(0,0,0,0.3)' : 'none',
              cursor: 'grab'
            }}
            whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 100 }}
          >
            {(el.type === 'text' || el.type === 'note') && (
              <textarea
                value={el.content}
                onChange={e => updateElement(el.id, { content: e.target.value })}
                placeholder="Type here..."
                style={{
                  width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none',
                  color: 'inherit', resize: 'none', fontFamily: 'inherit', fontSize: '1rem', fontWeight: 500
                }}
                onPointerDown={e => e.stopPropagation()} // Let user click to edit without dragging
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
