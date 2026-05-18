'use client'

import { NodeViewWrapper } from '@tiptap/react'
import { EmbedBlockRenderer } from './EmbedBlockRenderer'

export function EmbedBlockNodeView({ node, updateAttributes, deleteNode }: { node: any; updateAttributes: (attrs: any) => void; deleteNode: () => void }) {
  const { embedType, embedUrl, title } = node.attrs

  return (
    <NodeViewWrapper className="embed-block-node">
      <EmbedBlockRenderer
        embedType={embedType}
        embedUrl={embedUrl}
        title={title}
        onUpdate={(updates) => updateAttributes(updates)}
        onDelete={deleteNode}
        editable={true}
      />
    </NodeViewWrapper>
  )
}
