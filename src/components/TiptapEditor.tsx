'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useCallback, useEffect, useRef } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, CheckSquare,
  Link as LinkIcon, Image as ImageIcon,
  Table as TableIcon,
  Heading1, Heading2, Heading3,
  Quote, Code, Minus, Undo, Redo,
  Highlighter, Type, Palette,
} from 'lucide-react'
import { Callout } from './tiptap/Callout'
import { CollectionBlock } from './tiptap/CollectionBlock'
import { EmbedBlock } from './tiptap/EmbedBlock'
import { SlashCommandExtension } from './tiptap/SlashCommand'
import { BlockAddButtonExtension } from './tiptap/BlockAddButton'
import { BlockMenuExtension } from './tiptap/BlockMenu'
import { BlockContextMenu } from './BlockContextMenu'

import './editor.css'

type TiptapEditorProps = {
  content: any
  onUpdate: (content: any, wordCount: number, plainText: string) => void
  editable?: boolean
}

export function TiptapEditor({ content, onUpdate, editable = true }: TiptapEditorProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'editor-link' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'editor-image' },
      }),
      Placeholder.configure({
        placeholder: "Press '/' for commands",
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Callout,
      CollectionBlock,
      EmbedBlock,
      SlashCommandExtension,
      BlockAddButtonExtension,
      BlockMenuExtension.configure({
        onMenuOpen: (pos: number, node: any, rect: DOMRect) => {
          window.dispatchEvent(new CustomEvent('open-block-menu', {
            detail: { pos, node, rect }
          }))
        }
      }),
    ],
    content: content || '<p></p>',
    editable,
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const json = editor.getJSON()
        const text = editor.getText()
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
        onUpdate(json, wordCount, text)
      }, 500)
    },
    editorProps: {
      attributes: {
        class: 'editor-content',
      },
    },
  })

  // Update content when prop changes externally (only when not focused to avoid cursor jumping and letter deletion)
  useEffect(() => {
    if (editor && content) {
      const isSameContent = JSON.stringify(editor.getJSON()) === JSON.stringify(content)
      if (!isSameContent && !editor.isFocused) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Image URL')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  const addTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const clearLists = useCallback((chain: any) => {
    if (!editor) return chain
    if (editor.isActive('taskList')) {
      chain = chain.toggleTaskList()
    }
    if (editor.isActive('bulletList')) {
      chain = chain.toggleBulletList()
    }
    if (editor.isActive('orderedList')) {
      chain = chain.toggleOrderedList()
    }
    return chain
  }, [editor])

  const toggleHeading = useCallback((level: 1 | 2 | 3) => {
    if (!editor) return
    let chain = editor.chain().focus()
    chain = clearLists(chain)
    chain.toggleHeading({ level }).run()
  }, [editor, clearLists])

  const toggleBulletList = useCallback(() => {
    if (!editor) return
    let chain = editor.chain().focus()
    if (editor.isActive('taskList')) chain = chain.toggleTaskList()
    if (editor.isActive('orderedList')) chain = chain.toggleOrderedList()
    chain.toggleBulletList().run()
  }, [editor])

  const toggleOrderedList = useCallback(() => {
    if (!editor) return
    let chain = editor.chain().focus()
    if (editor.isActive('taskList')) chain = chain.toggleTaskList()
    if (editor.isActive('bulletList')) chain = chain.toggleBulletList()
    chain.toggleOrderedList().run()
  }, [editor])

  const toggleTaskList = useCallback(() => {
    if (!editor) return
    let chain = editor.chain().focus()
    if (editor.isActive('bulletList')) chain = chain.toggleBulletList()
    if (editor.isActive('orderedList')) chain = chain.toggleOrderedList()
    chain.toggleTaskList().run()
  }, [editor])

  const toggleBlockquote = useCallback(() => {
    if (!editor) return
    let chain = editor.chain().focus()
    chain = clearLists(chain)
    chain.toggleBlockquote().run()
  }, [editor, clearLists])

  const toggleCodeBlock = useCallback(() => {
    if (!editor) return
    let chain = editor.chain().focus()
    chain = clearLists(chain)
    chain.toggleCodeBlock().run()
  }, [editor, clearLists])

  if (!editor) return null

  const ToolbarButton = ({ onClick, active, children, title }: { onClick: () => void, active?: boolean, children: React.ReactNode, title?: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`toolbar-btn${active ? ' active' : ''}`}
    >
      {children}
    </button>
  )

  const FloatingToolbarButton = ({ onClick, active, children, title }: { onClick: () => void, active?: boolean, children: React.ReactNode, title?: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`floating-toolbar-btn${active ? ' active' : ''}`}
    >
      {children}
    </button>
  )

  return (
    <div className="tiptap-wrapper">
      <EditorContent editor={editor} />

      <BlockContextMenu editor={editor} />

      {editable && editor && (
        <BubbleMenu editor={editor} className="bubble-menu">
          <div className="toolbar-group">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
              <Bold size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
              <Italic size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
              <UnderlineIcon size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
              <Strikethrough size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code">
              <Code size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
              <LinkIcon size={14} />
            </ToolbarButton>
          </div>
        </BubbleMenu>
      )}

      {editable && editor && (
        <div className="editor-floating-toolbar">
          <FloatingToolbarButton onClick={() => toggleHeading(1)} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
            <Heading1 size={14} />
          </FloatingToolbarButton>
          <FloatingToolbarButton onClick={() => toggleHeading(2)} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
            <Heading2 size={14} />
          </FloatingToolbarButton>
          <FloatingToolbarButton onClick={() => toggleHeading(3)} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
            <Heading3 size={14} />
          </FloatingToolbarButton>

          <div className="w-px h-4 bg-white/10 mx-1 self-center"></div>

          <FloatingToolbarButton onClick={toggleBulletList} active={editor.isActive('bulletList')} title="Bullet List">
            <List size={14} />
          </FloatingToolbarButton>
          <FloatingToolbarButton onClick={toggleOrderedList} active={editor.isActive('orderedList')} title="Ordered List">
            <ListOrdered size={14} />
          </FloatingToolbarButton>
          <FloatingToolbarButton onClick={toggleTaskList} active={editor.isActive('taskList')} title="Task List">
            <CheckSquare size={14} />
          </FloatingToolbarButton>

          <div className="w-px h-4 bg-white/10 mx-1 self-center"></div>

          <FloatingToolbarButton onClick={toggleBlockquote} active={editor.isActive('blockquote')} title="Blockquote">
            <Quote size={14} />
          </FloatingToolbarButton>
          <FloatingToolbarButton onClick={toggleCodeBlock} active={editor.isActive('codeBlock')} title="Code Block">
            <Code size={14} />
          </FloatingToolbarButton>
          <FloatingToolbarButton onClick={addTable} active={editor.isActive('table')} title="Insert Table">
            <TableIcon size={14} />
          </FloatingToolbarButton>
          <FloatingToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus size={14} />
          </FloatingToolbarButton>
        </div>
      )}
    </div>
  )
}
