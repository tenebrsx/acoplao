import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface BlockMenuItem {
  label: string
  icon: string
  action: (editor: any, pos: number) => void
}

let activeEditorRef: any = null
let activeViewRef: any = null

export function getBlockMenuPosition() {
  return { editor: activeEditorRef, view: activeViewRef }
}

export const BlockMenuExtension = Extension.create({
  name: 'blockMenu',

  addOptions() {
    return {
      onMenuOpen: null as ((pos: number, node: any, rect: DOMRect) => void) | null,
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: new PluginKey('blockMenu'),

        view() {
          return {
            update: (view) => {
              activeViewRef = view
              if (extension.editor) {
                activeEditorRef = extension.editor
              }
            },
            destroy: () => {
              activeViewRef = null
            },
          }
        },

        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, set) {
            set = set.map(tr.mapping, tr.doc)
            const decorations: Decoration[] = []

            tr.doc.descendants((node, pos) => {
              if (node.isBlock && node.type.name !== 'doc') {
                const handle = document.createElement('div')
                handle.className = 'block-drag-handle'
                handle.contentEditable = 'false'
                handle.innerHTML = '⋮⋮'
                handle.style.cssText = `
                  position: absolute;
                  left: 2px;
                  top: 50%;
                  transform: translateY(-50%);
                  font-size: 10px;
                  letter-spacing: -1px;
                  color: rgba(255, 255, 255, 0.15);
                  cursor: grab;
                  padding: 4px 2px;
                  line-height: 1;
                  user-select: none;
                  border-radius: 3px;
                  opacity: 0;
                  transition: opacity 150ms ease;
                `

                handle.addEventListener('mouseenter', () => {
                  handle.style.background = 'rgba(255, 255, 255, 0.06)'
                  handle.style.color = 'rgba(255, 255, 255, 0.4)'
                })

                handle.addEventListener('mouseleave', () => {
                  handle.style.background = 'transparent'
                  handle.style.color = 'rgba(255, 255, 255, 0.15)'
                })

                handle.addEventListener('click', (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const rect = handle.getBoundingClientRect()
                  if (extension.options.onMenuOpen) {
                    extension.options.onMenuOpen(pos, node, rect)
                  }
                })

                decorations.push(Decoration.widget(pos, handle, {
                  side: -1,
                  key: `handle-${pos}`,
                }))
              }
              return false
            })

            return DecorationSet.create(tr.doc, decorations)
          },
        },

        props: {
          decorations(state) {
            return this.getState(state)
          },

          handleDOMEvents: {
            mouseover(view, event) {
              const target = event.target as HTMLElement
              const block = target.closest('.tiptap > *')
              if (block) {
                const handle = block.querySelector('.block-drag-handle') as HTMLElement
                if (handle) handle.style.opacity = '1'
              }
              return false
            },
            mouseout(view, event) {
              const target = event.target as HTMLElement
              const block = target.closest('.tiptap > *')
              if (block) {
                const handle = block.querySelector('.block-drag-handle') as HTMLElement
                if (handle) handle.style.opacity = '0'
              }
              return false
            },
          },
        },
      }),
    ]
  },
})
