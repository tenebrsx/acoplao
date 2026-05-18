import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CollectionBlockNodeView } from './CollectionBlockNodeView'

export interface CollectionBlockOptions {
  HTMLAttributes: Record<string, any>
}

export interface CollectionBlockAttributes {
  sourceType: string
  filters: string
  sorts: string
  columns: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    collectionBlock: {
      setCollectionBlock: (options: CollectionBlockAttributes) => ReturnType
    }
  }
}

export const CollectionBlock = Node.create<CollectionBlockOptions>({
  name: 'collectionBlock',

  group: 'block',

  atom: true,

  selectable: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      sourceType: {
        default: 'projects',
      },
      filters: {
        default: '[]',
      },
      sorts: {
        default: '[]',
      },
      columns: {
        default: '[]',
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="collection-block"]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(
      { 'data-type': 'collection-block' },
      HTMLAttributes
    )]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CollectionBlockNodeView)
  },

  addCommands() {
    return {
      setCollectionBlock: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
