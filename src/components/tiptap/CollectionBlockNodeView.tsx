'use client'

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { CollectionBlockRenderer } from './CollectionBlockRenderer'

export function CollectionBlockNodeView({ node }: { node: any }) {
  const { sourceType, filters, sorts, columns } = node.attrs

  return (
    <NodeViewWrapper className="collection-block-node">
      <CollectionBlockRenderer
        sourceType={sourceType}
        filtersJson={filters}
        sortsJson={sorts}
        columnsJson={columns}
      />
    </NodeViewWrapper>
  )
}
