'use client'

import { useEffect, useState } from 'react'
import { X, Command } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const SHORTCUTS = [
  { category: 'Navigation', items: [
    { keys: ['Cmd', 'K'], description: 'Open command palette' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
    { keys: ['Esc'], description: 'Close modal or menu' },
  ]},
  { category: 'Editor', items: [
    { keys: ['/'], description: 'Open slash command menu' },
    { keys: ['Cmd', 'B'], description: 'Bold' },
    { keys: ['Cmd', 'I'], description: 'Italic' },
    { keys: ['Cmd', 'U'], description: 'Underline' },
    { keys: ['Cmd', 'Shift', 'S'], description: 'Strikethrough' },
    { keys: ['Cmd', 'K'], description: 'Add link' },
    { keys: ['Cmd', 'V'], description: 'Paste as link (over selection)' },
  ]},
  { category: 'Blocks', items: [
    { keys: ['#', 'Space'], description: 'Heading 1' },
    { keys: ['##', 'Space'], description: 'Heading 2' },
    { keys: ['-', 'Space'], description: 'Bullet list' },
    { keys: ['1.', 'Space'], description: 'Numbered list' },
    { keys: ['>', 'Space'], description: 'Quote' },
    { keys: ['---', 'Space'], description: 'Divider' },
    { keys: ['[]', 'Space'], description: 'To-do list' },
  ]},
  { category: 'Formatting', items: [
    { keys: ['Cmd', 'Shift', 'M'], description: 'Inline code' },
    { keys: ['Cmd', 'Shift', 'H'], description: 'Highlight' },
    { keys: ['Cmd', '+'], description: 'Increase font size' },
    { keys: ['Cmd', '-'], description: 'Decrease font size' },
  ]},
]

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#1a1a18] border-[rgba(55,53,47,0.15)] max-w-2xl max-h-[80vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 border-b border-[rgba(55,53,47,0.09)]">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Command size={18} className="text-muted-foreground" />
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 grid grid-cols-2 gap-8">
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {group.category}
              </h3>
              <div className="space-y-2.5">
                {group.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, kidx) => (
                        <kbd key={kidx} className="px-1.5 py-0.5 bg-[rgba(247,246,243,0.08)] border border-[rgba(55,53,47,0.15)] rounded text-[10px] font-mono text-muted-foreground min-w-[20px] text-center">
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
