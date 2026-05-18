import React, { useEffect, useRef } from 'react'
import { Extension } from '@tiptap/core'
import {
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Quote, Code, Minus, AlertCircle, Table, Image, Video,
  Layers, Link, Database, FileText
} from 'lucide-react'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import type { Editor } from '@tiptap/core'

export type SlashCommandItem = {
  title: string
  description: string
  icon: string
  command: (props: { editor: Editor; range: { from: number; to: number } }) => void
}

export const slashCommands: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
    },
  },
  {
    title: 'Bullet List',
    description: 'Simple bullet list',
    icon: 'List',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered list with numbers',
    icon: 'ListOrdered',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'To-Do List',
    description: 'Task list with checkboxes',
    icon: 'CheckSquare',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote or citation',
    icon: 'Quote',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Code Block',
    description: 'Syntax-highlighted code',
    icon: 'Code',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal rule to separate content',
    icon: 'Minus',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: 'Callout',
    description: 'Info box with icon',
    icon: 'AlertCircle',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout({ type: 'info' }).run()
    },
  },
  {
    title: 'Table',
    description: 'Insert a table',
    icon: 'Table',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
  },
  {
    title: 'Image',
    description: 'Upload or embed an image',
    icon: 'Image',
    command: ({ editor, range }) => {
      const url = window.prompt('Image URL')
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run()
      }
    },
  },
  {
    title: 'YouTube',
    description: 'Embed a YouTube video',
    icon: 'Vid',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setEmbedBlock({
        embedType: 'youtube',
        embedUrl: '',
      }).run()
    },
  },
  {
    title: 'Figma',
    description: 'Embed a Figma design',
    icon: 'Fig',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setEmbedBlock({
        embedType: 'figma',
        embedUrl: '',
      }).run()
    },
  },
  {
    title: 'Loom',
    description: 'Embed a Loom video',
    icon: 'Vid',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setEmbedBlock({
        embedType: 'loom',
        embedUrl: '',
      }).run()
    },
  },
  {
    title: 'Google Sheets',
    description: 'Embed a spreadsheet',
    icon: 'Sheet',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setEmbedBlock({
        embedType: 'sheets',
        embedUrl: '',
      }).run()
    },
  },
  {
    title: 'Miro',
    description: 'Embed a Miro board',
    icon: 'Board',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setEmbedBlock({
        embedType: 'miro',
        embedUrl: '',
      }).run()
    },
  },
  {
    title: 'Generic Embed',
    description: 'Embed any URL via iframe',
    icon: 'Link',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setEmbedBlock({
        embedType: 'generic',
        embedUrl: '',
      }).run()
    },
  },
  {
    title: 'Projects Collection',
    description: 'Live table of projects',
    icon: 'DB',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCollectionBlock({
        sourceType: 'projects',
        filters: '[]',
        sorts: '[]',
        columns: '["title","status","budget","due_date"]',
      }).run()
    },
  },
  {
    title: 'Tasks Collection',
    description: 'Live table of tasks',
    icon: 'DB',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCollectionBlock({
        sourceType: 'tasks',
        filters: '[]',
        sorts: '[]',
        columns: '["title","is_completed","due_date","priority"]',
      }).run()
    },
  },
  {
    title: 'Invoices Collection',
    description: 'Live table of invoices',
    icon: 'DB',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCollectionBlock({
        sourceType: 'invoices',
        filters: '[]',
        sorts: '[]',
        columns: '["description","amount","status","due_date"]',
      }).run()
    },
  },
  {
    title: 'Events Collection',
    description: 'Live table of calendar events',
    icon: 'DB',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCollectionBlock({
        sourceType: 'events',
        filters: '[]',
        sorts: '[]',
        columns: '["title","start_time","all_day"]',
      }).run()
    },
  },
]

const renderSlashIcon = (iconName: string) => {
  switch (iconName) {
    case 'H1': return <Heading1 size={14} className="text-primary" />
    case 'H2': return <Heading2 size={14} className="text-primary" />
    case 'H3': return <Heading3 size={14} className="text-primary" />
    case 'List': return <List size={14} className="text-primary" />
    case 'ListOrdered': return <ListOrdered size={14} className="text-primary" />
    case 'CheckSquare': return <CheckSquare size={14} className="text-primary" />
    case 'Quote': return <Quote size={14} className="text-primary" />
    case 'Code': return <Code size={14} className="text-primary" />
    case 'Minus': return <Minus size={14} className="text-primary" />
    case 'AlertCircle': return <AlertCircle size={14} className="text-primary" />
    case 'Table': return <Table size={14} className="text-primary" />
    case 'Image': return <Image size={14} className="text-primary" />
    case 'Vid': return <Video size={14} className="text-primary" />
    case 'Fig': return <Layers size={14} className="text-primary" />
    case 'Sheet': return <FileText size={14} className="text-primary" />
    case 'Board': return <Layers size={14} className="text-primary" />
    case 'Link': return <Link size={14} className="text-primary" />
    case 'DB': return <Database size={14} className="text-primary" />
    default: return <FileText size={14} className="text-primary" />
  }
}

const SlashMenuComponent = ({
  items,
  command,
  selectedIndex,
}: {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
  selectedIndex: number
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const selectedElement = container.children[selectedIndex] as HTMLElement
    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [selectedIndex])

  if (!items.length) return (
    <div className="p-3 text-xs text-muted-foreground">No results</div>
  )

  return (
    <div 
      ref={containerRef}
      className="bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-[320px] min-w-[240px] p-1 custom-scrollbar"
    >
      {items.map((item, index) => (
        <button
          key={item.title}
          onClick={() => command(item)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
            index === selectedIndex ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'
          }`}
        >
          <span className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center shrink-0">
            {renderSlashIcon(item.icon)}
          </span>
          <div>
            <div className="font-semibold text-xs text-foreground/90">{item.title}</div>
            <div className="text-[10px] text-muted-foreground/60">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: SlashCommandItem }) => {
          props.command({ editor, range })
        },
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase()
          return slashCommands.filter(item =>
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
          ).slice(0, 10)
        },
        render: () => {
          let component: ReactRenderer | null = null
          let popup: any = null
          let currentItems: SlashCommandItem[] = []
          let currentSelectedIndex = 0

          return {
            onStart: (props: any) => {
              currentItems = props.items
              currentSelectedIndex = 0
              component = new ReactRenderer(SlashMenuComponent, {
                props: {
                  items: currentItems,
                  command: props.command,
                  selectedIndex: currentSelectedIndex,
                },
                editor: props.editor,
              })

              if (!props.clientRect) return

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },
            onUpdate: (props: any) => {
              currentItems = props.items
              currentSelectedIndex = 0
              component?.updateProps({
                items: currentItems,
                command: props.command,
                selectedIndex: currentSelectedIndex,
              })

              if (!props.clientRect) return
              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              })
            },
            onKeyDown: (props: any) => {
              const { event } = props

              if (event.key === 'ArrowUp') {
                currentSelectedIndex = (currentSelectedIndex - 1 + currentItems.length) % currentItems.length
                component?.updateProps({ selectedIndex: currentSelectedIndex })
                return true
              }
              if (event.key === 'ArrowDown') {
                currentSelectedIndex = (currentSelectedIndex + 1) % currentItems.length
                component?.updateProps({ selectedIndex: currentSelectedIndex })
                return true
              }
              if (event.key === 'Enter') {
                if (currentItems[currentSelectedIndex]) {
                  props.command(currentItems[currentSelectedIndex])
                }
                return true
              }
              if (event.key === 'Escape') {
                popup[0].hide()
                return true
              }
              return false
            },
            onExit: () => {
              popup?.[0]?.destroy()
              component?.destroy()
            },
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
