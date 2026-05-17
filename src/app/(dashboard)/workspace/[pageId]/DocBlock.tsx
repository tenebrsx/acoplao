'use client'

import { TiptapEditor } from '@/components/TiptapEditor'

export function DocBlock({ content, onUpdate }: { content: any, onUpdate: (data: any) => void }) {
  // If content is empty object, pass empty string to tiptap
  const safeContent = Object.keys(content).length === 0 ? '' : content

  return (
    <div className="glass-panel" style={{ minHeight: '600px' }}>
      <TiptapEditor 
        content={safeContent} 
        onUpdate={(html) => onUpdate(html)} 
        editable={true} 
      />
    </div>
  )
}
