import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { EmbedBlockNodeView } from './EmbedBlockNodeView'

export interface EmbedBlockOptions {
  HTMLAttributes: Record<string, any>
}

export interface EmbedBlockAttributes {
  embedType: string
  embedUrl: string
  title?: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embedBlock: {
      setEmbedBlock: (options: EmbedBlockAttributes) => ReturnType
    }
  }
}

export const EmbedBlock = Node.create<EmbedBlockOptions>({
  name: 'embedBlock',

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
      embedType: {
        default: 'generic',
      },
      embedUrl: {
        default: '',
      },
      title: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="embed-block"]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(
      { 'data-type': 'embed-block' },
      HTMLAttributes
    )]
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedBlockNodeView)
  },

  addCommands() {
    return {
      setEmbedBlock: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
