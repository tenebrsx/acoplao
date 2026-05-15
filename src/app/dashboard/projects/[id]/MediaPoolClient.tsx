'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Layout, Plus, LinkIcon, ImageIcon, Music, Trash2, ExternalLink, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function MediaPoolClient({ projectId, isAdmin }: { projectId: string, isAdmin: boolean }) {
  const [media, setMedia] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newType, setNewType] = useState('link')
  const supabase = createClient()

  useEffect(() => {
    async function fetchMedia() {
      const { data } = await supabase
        .from('campaign_media')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      setMedia(data || [])
    }
    fetchMedia()
  }, [projectId, supabase])

  const handleAdd = async () => {
    if (!newUrl) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data: row } = await supabase
      .from('campaign_media')
      .insert({
        project_id: projectId,
        title: newTitle || 'Reference',
        url: newUrl,
        media_type: newType,
        created_by: user?.id
      })
      .select()
      .single()
    
    if (row) {
      setMedia([row, ...media])
      setIsAdding(false)
      setNewTitle('')
      setNewUrl('')
    }
  }

  const handleDelete = async (id: string) => {
    setMedia(media.filter(m => m.id !== id))
    await supabase.from('campaign_media').delete().eq('id', id)
  }

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layout size={18} color="var(--accent-primary)" /> Media Pool
        </h3>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid var(--surface-border)' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="input" style={{ fontSize: '0.8125rem' }}>
                <option value="link">Link (TikTok/YT)</option>
                <option value="image">Inspiration Image</option>
                <option value="audio">Audio Track</option>
              </select>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title..." className="input" style={{ fontSize: '0.8125rem' }} />
            </div>
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="URL..." className="input" style={{ fontSize: '0.8125rem' }} />
            <button onClick={handleAdd} className="btn btn-primary btn-sm">Add to Pool</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {media.length === 0 && (
          <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: '0.8125rem', border: '1px dashed var(--surface-border)', borderRadius: '12px' }}>
            No media assets yet. Add reference TikToks or visual refs.
          </div>
        )}
        {media.map((item) => (
          <div key={item.id} style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--surface-border)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {item.media_type === 'link' ? <LinkIcon size={14} color="var(--info)" /> : 
               item.media_type === 'image' ? <ImageIcon size={14} color="var(--accent-secondary)" /> : 
               <Music size={14} color="var(--warning)" />}
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={item.url} target="_blank" rel="noopener" className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.65rem', padding: '4px' }}>
                <ExternalLink size={10} /> Open
              </a>
              {isAdmin && (
                <button onClick={() => handleDelete(item.id)} className="btn btn-secondary btn-sm" style={{ padding: '4px', color: 'var(--error)' }}>
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
