import { Node, mergeAttributes } from '@tiptap/core'

export interface CalloutOptions {
  HTMLAttributes: Record<string, any>
}

export interface CalloutAttributes {
  type: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (options?: CalloutAttributes) => ReturnType
      toggleCallout: (options?: CalloutAttributes) => ReturnType
      unsetCallout: () => ReturnType
    }
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => {
          if (!attributes.type) return {}
          return { 'data-type': attributes.type }
        },
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="callout"]' },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.type as string || 'info'
    const typeStyles: Record<string, string> = {
      info: 'border-blue-500/40 bg-blue-500/5',
      warning: 'border-yellow-500/40 bg-yellow-500/5',
      danger: 'border-red-500/40 bg-red-500/5',
      success: 'border-emerald-500/40 bg-emerald-500/5',
      note: 'border-purple-500/40 bg-purple-500/5',
    }
    const icons: Record<string, string> = {
      info: '💡',
      warning: '⚠️',
      danger: '🚫',
      success: '✅',
      note: '📝',
    }
    const style = typeStyles[type] || typeStyles.info
    const icon = icons[type] || icons.info

    return ['div', mergeAttributes(
      { class: `callout-block rounded-xl border p-4 my-3 ${style}` },
      HTMLAttributes
    ), ['div', { class: 'callout-icon text-lg mb-2' }, icon], ['div', { class: 'callout-content' }, 0]]
  },

  addCommands() {
    return {
      setCallout: (options = { type: 'info' }) => ({ commands }) => {
        return commands.wrapIn(this.name, options)
      },
      toggleCallout: (options = { type: 'info' }) => ({ commands }) => {
        return commands.toggleWrap(this.name, options)
      },
      unsetCallout: () => ({ commands }) => {
        return commands.lift(this.name)
      },
    }
  },
})
