import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

let editorViewRef: any = null

export const BlockAddButtonExtension = Extension.create({
  name: 'blockAddButton',

  addProseMirrorPlugins() {
    const editor = this.editor

    return [
      new Plugin({
        key: new PluginKey('blockAddButton'),

        view() {
          return {
            update: (view) => {
              editorViewRef = view
            },
            destroy: () => {
              editorViewRef = null
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
                const widget = document.createElement('div')
                widget.className = 'block-add-button'
                widget.contentEditable = 'false'
                widget.innerHTML = `
                  <div class="block-add-line"></div>
                  <button class="block-add-trigger" contenteditable="false">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2V14M2 8H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </button>
                `

                const button = widget.querySelector('.block-add-trigger')
                if (button) {
                  button.addEventListener('click', (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (editorViewRef) {
                      const slashPos = pos + node.nodeSize
                      const tr = editorViewRef.state.tr
                      tr.insertText('/', slashPos)
                      editorViewRef.dispatch(tr)
                      editorViewRef.focus()
                      if (editor && editor.commands.focus) {
                        editor.commands.focus()
                      }
                    }
                  })
                }

                decorations.push(Decoration.widget(pos + node.nodeSize, widget, {
                  side: -1,
                  key: `add-btn-${pos}`,
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
        },
      }),
    ]
  },
})
