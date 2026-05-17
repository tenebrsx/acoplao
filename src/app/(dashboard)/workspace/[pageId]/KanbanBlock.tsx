'use client'

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, GripHorizontal, AlignLeft, Calendar, User, MoreHorizontal } from 'lucide-react'

// --- Types ---
type ColumnType = { id: string; title: string; color?: string }
type CardType = { id: string; columnId: string; title: string; description?: string; due_date?: string; assignee?: string }

// --- Column Component ---
function Column({ col, cards, addCard }: { col: ColumnType; cards: CardType[]; addCard: (colId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id, data: { type: 'Column', col } })
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={{ ...style, width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--surface-border)', overflow: 'hidden' }} className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
            <GripHorizontal size={14} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {col.color && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />}
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{col.title}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{cards.length}</span>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}><MoreHorizontal size={14} /></button>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', minHeight: '150px', background: 'rgba(0, 0, 0, 0.1)' }}>
        {cards.map(card => (
          <Card key={card.id} card={card} />
        ))}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid var(--surface-border)' }}>
        <button onClick={() => addCard(col.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)', background: 'var(--surface-hover)', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', fontWeight: 500, transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-border)'} onMouseOut={e => e.currentTarget.style.background = 'var(--surface-hover)'}>
          <Plus size={14} /> Add Card
        </button>
      </div>
    </div>
  )
}

// --- Card Component ---
function Card({ card, isOverlay }: { card: CardType, isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, data: { type: 'Card', card } })
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    opacity: isDragging ? 0.3 : 1,
    boxShadow: isOverlay ? '0 12px 24px rgba(0,0,0,0.3)' : 'none',
    cursor: isOverlay ? 'grabbing' : 'grab',
  }

  return (
    <div ref={setNodeRef} style={{ ...style, padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '8px' }} {...attributes} {...listeners} className="glass-panel">
      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {card.title}
      </div>
      
      {card.description && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          <AlignLeft size={12} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.description}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {card.due_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: 'var(--text-secondary)', background: 'var(--surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--surface-border)' }}>
              <Calendar size={10} /> {card.due_date}
            </div>
          )}
        </div>
        {card.assignee && (
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: '#000' }}>
            {card.assignee.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main Kanban Block ---
export function KanbanBlock({ content, onUpdate }: { content: any, onUpdate: (data: any) => void }) {
  const [columns, setColumns] = useState<ColumnType[]>(content?.columns || [
    { id: 'col-1', title: 'To Do', color: '#64748b' }, 
    { id: 'col-2', title: 'Doing', color: '#eab308' }, 
    { id: 'col-3', title: 'Done', color: '#22c55e' }
  ])
  const [cards, setCards] = useState<CardType[]>(content?.cards || [])
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (JSON.stringify(content?.columns) !== JSON.stringify(columns) || JSON.stringify(content?.cards) !== JSON.stringify(cards)) {
      onUpdate({ columns, cards })
    }
  }, [columns, cards])

  const addCard = (columnId: string) => {
    const title = window.prompt('Card Title:')
    if (!title) return
    setCards([...cards, { id: `card-${Date.now()}`, columnId, title, assignee: 'User' }])
  }

  const addColumn = () => {
    const title = window.prompt('Column Title:')
    if (!title) return
    setColumns([...columns, { id: `col-${Date.now()}`, title, color: '#00e1ff' }])
  }

  const handleDragStart = (event: any) => setActiveId(event.active.id)

  const handleDragOver = (event: any) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id
    if (activeId === overId) return

    const isActiveCard = active.data.current?.type === 'Card'
    const isOverCard = over.data.current?.type === 'Card'
    const isOverColumn = over.data.current?.type === 'Column'

    if (isActiveCard && isOverCard) {
      setCards((cards) => {
        const activeIndex = cards.findIndex((t) => t.id === activeId)
        const overIndex = cards.findIndex((t) => t.id === overId)
        if (cards[activeIndex].columnId !== cards[overIndex].columnId) {
          const newCards = [...cards]
          newCards[activeIndex].columnId = cards[overIndex].columnId
          return arrayMove(newCards, activeIndex, overIndex)
        }
        return arrayMove(cards, activeIndex, overIndex)
      })
    }

    if (isActiveCard && isOverColumn) {
      setCards((cards) => {
        const activeIndex = cards.findIndex((t) => t.id === activeId)
        const newCards = [...cards]
        newCards[activeIndex].columnId = overId
        return arrayMove(newCards, activeIndex, activeIndex)
      })
    }
  }

  const handleDragEnd = (event: any) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id
    if (activeId === overId) return

    const isActiveColumn = active.data.current?.type === 'Column'
    if (isActiveColumn) {
      setColumns((columns) => {
        const activeIndex = columns.findIndex((col) => col.id === activeId)
        const overIndex = columns.findIndex((col) => col.id === overId)
        return arrayMove(columns, activeIndex, overIndex)
      })
    }
  }

  const dropAnimation = { sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }

  return (
    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '24px', minHeight: '600px', alignItems: 'flex-start', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          {columns.map(col => (
            <Column key={col.id} col={col} cards={cards.filter(c => c.columnId === col.id)} addCard={addCard} />
          ))}
        </SortableContext>

        <button onClick={addColumn} className="glass-panel" style={{ width: '320px', flexShrink: 0, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', border: '1px dashed var(--surface-border)' }}>
          <Plus size={16} /> Add Column
        </button>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeId ? (
            columns.find(c => c.id === activeId) ? (
              <Column col={columns.find(c => c.id === activeId)!} cards={cards.filter(c => c.columnId === activeId)} addCard={() => {}} />
            ) : (
              <Card card={cards.find(c => c.id === activeId)!} isOverlay />
            )
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
