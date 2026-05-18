'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, Copy, Type, Palette } from 'lucide-react'

interface BlockMenuState {
  open: boolean
  x: number
  y: number
  pos: number
}

export function BlockContextMenu({ editor }: { editor: any }) {
  const [menu, setMenu] = useState<BlockMenuState>({ open: false, x: 0, y: 0, pos: 0 })

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      const { pos, rect } = e.detail
      setMenu({
        open: true,
        x: rect.right + 8,
        y: rect.top,
        pos,
      })
    }

    window.addEventListener('open-block-menu', handleOpen as EventListener)
    return () => window.removeEventListener('open-block-menu', handleOpen as EventListener)
  }, [])

  useEffect(() => {
    const handleClick = () => setMenu(m => ({ ...m, open: false }))
    if (menu.open) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [menu.open])

  const handleDelete = useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteNodeAtPos(menu.pos).run()
    setMenu(m => ({ ...m, open: false }))
  }, [editor, menu.pos])

  const handleDuplicate = useCallback(() => {
    if (!editor) return
    const node = editor.state.doc.nodeAt(menu.pos)
    if (node) {
      editor.chain().focus().insertContentAt(menu.pos + node.nodeSize, node.toJSON()).run()
    }
    setMenu(m => ({ ...m, open: false }))
  }, [editor, menu.pos])

  const handleTurnInto = useCallback((type: string) => {
    if (!editor) return
    switch (type) {
      case 'heading1':
        editor.chain().focus().setHeading({ level: 1 }).run()
        break
      case 'heading2':
        editor.chain().focus().setHeading({ level: 2 }).run()
        break
      case 'heading3':
        editor.chain().focus().setHeading({ level: 3 }).run()
        break
      case 'paragraph':
        editor.chain().focus().setParagraph().run()
        break
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run()
        break
      case 'taskList':
        editor.chain().focus().toggleTaskList().run()
        break
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run()
        break
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run()
        break
    }
    setMenu(m => ({ ...m, open: false }))
  }, [editor])

  if (!menu.open) return null

  return (
    <div
      className="fixed z-50 bg-[#2a2a26] border border-[rgba(55,53,47,0.15)] rounded-lg shadow-xl py-1 min-w-[200px]"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleDelete}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[rgba(247,246,243,0.06)] transition-colors"
      >
        <Trash2 size={14} /> Delete
      </button>
      <button
        onClick={handleDuplicate}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-[rgba(247,246,243,0.06)] transition-colors"
      >
        <Copy size={14} /> Duplicate
      </button>
      <div className="h-px bg-[rgba(55,53,47,0.15)] my-1" />
      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Turn into
      </div>
      <button onClick={() => handleTurnInto('paragraph')} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-[rgba(247,246,243,0.06)] transition-colors">
        <Type size={14} /> Text
      </button>
      <button onClick={() => handleTurnInto('heading1')} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-[rgba(247,246,243,0.06)] transition-colors">
        <span className="text-xs font-bold w-4">H1</span> Heading 1
      </button>
      <button onClick={() => handleTurnInto('heading2')} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-[rgba(247,246,243,0.06)] transition-colors">
        <span className="text-xs font-bold w-4">H2</span> Heading 2
      </button>
      <button onClick={() => handleTurnInto('heading3')} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-[rgba(247,246,243,0.06)] transition-colors">
        <span className="text-xs font-bold w-4">H3</span> Heading 3
      </button>
      <button onClick={() => handleTurnInto('bulletList')} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-[rgba(247,246,243,0.06)] transition-colors">
        <span className="w-4">•</span> Bulleted list
      </button>
      <button onClick={() => handleTurnInto('orderedList')} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-[rgba(247,246,243,0.06)] transition-colors">
        <span className="w-4">1.</span> Numbered list
      </button>
      <button onClick={() => handleTurnInto('taskList')} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-[rgba(247,246,243,0.06)] transition-colors">
        <span className="w-4">☐</span> To-do list
      </button>
      <button onClick={() => handleTurnInto('blockquote')} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-[rgba(247,246,243,0.06)] transition-colors">
        <span className="w-4">"</span> Quote
      </button>
      <button onClick={() => handleTurnInto('codeBlock')} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-[rgba(247,246,243,0.06)] transition-colors">
        <span className="w-4 font-mono text-xs">{ }</span> Code block
      </button>
    </div>
  )
}
