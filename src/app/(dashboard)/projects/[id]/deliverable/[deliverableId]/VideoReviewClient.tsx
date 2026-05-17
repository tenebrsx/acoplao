'use client'

import { useRef, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Play, Pause, MessageSquare, Clock, Trash2, Send } from 'lucide-react'

type Comment = {
  id: string
  content: string
  timestamp_seconds: number
  created_at: string
  profiles?: { email: string }
}

export function VideoReviewClient({ deliverableId, fileUrl }: { deliverableId: string, fileUrl: string }) {
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null)

  // Fetch existing comments
  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('video_comments')
        .select(`*, profiles:user_id(email)`)
        .eq('deliverable_id', deliverableId)
        .order('timestamp_seconds', { ascending: true })
      if (data) setComments(data as any)
    }
    fetchComments()
  }, [deliverableId, supabase])

  // Realtime subscription for comments
  useEffect(() => {
    const channel = supabase.channel(`comments_${deliverableId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'video_comments', filter: `deliverable_id=eq.${deliverableId}` }, async (payload) => {
        // Fetch the user email for the new comment
        const { data: user } = await supabase.from('profiles').select('email').eq('id', payload.new.user_id).single()
        const newC = { ...payload.new, profiles: user } as Comment
        setComments(prev => [...prev, newC].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'video_comments', filter: `deliverable_id=eq.${deliverableId}` }, (payload) => {
        setComments(prev => prev.filter(c => c.id !== payload.old.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [deliverableId, supabase])

  // Video Handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause()
      else videoRef.current.play()
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Comment Handlers
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const timeToSave = activeTimestamp !== null ? activeTimestamp : currentTime
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('video_comments').insert({
      deliverable_id: deliverableId,
      user_id: user?.id,
      timestamp_seconds: timeToSave,
      content: newComment.trim()
    })

    setNewComment('')
    setActiveTimestamp(null)
  }

  const deleteComment = async (id: string) => {
    await supabase.from('video_comments').delete().eq('id', id)
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    seekTo(percent * duration)
  }

  return (
    <div style={{ display: 'flex', gap: '24px', width: '100%', height: '100%' }}>
      
      {/* Player Area */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="glass-panel" style={{ overflow: 'hidden', background: '#000', position: 'relative', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
          <video 
            ref={videoRef}
            src={fileUrl}
            style={{ width: '100%', display: 'block', maxHeight: '600px' }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration)
            }}
            onClick={togglePlay}
          />
          
          {/* Custom Controls */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 24px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
            
            {/* Scrubber */}
            <div 
              style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', cursor: 'pointer', marginBottom: '16px', position: 'relative' }}
              onClick={handleTimelineClick}
            >
              {/* Progress */}
              <div style={{ height: '100%', background: 'var(--accent-primary)', width: `${(currentTime / duration) * 100}%`, borderRadius: '3px' }} />
              
              {/* Comment Markers */}
              {comments.map(c => (
                <div 
                  key={c.id} 
                  style={{ position: 'absolute', top: '-4px', left: `${(c.timestamp_seconds / duration) * 100}%`, width: '14px', height: '14px', borderRadius: '50%', background: 'var(--accent-secondary)', border: '2px solid #000', cursor: 'pointer', transform: 'translateX(-50%)' }}
                  title={c.content}
                  onClick={(e) => { e.stopPropagation(); seekTo(c.timestamp_seconds); }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={togglePlay} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <div style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              <button 
                onClick={() => {
                  if (isPlaying) togglePlay()
                  setActiveTimestamp(currentTime)
                  document.getElementById('comment-input')?.focus()
                }}
                className="btn btn-primary btn-sm"
              >
                <MessageSquare size={14} /> Leave Note
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Panel */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <MessageSquare size={18} color="var(--accent-secondary)" /> Review Thread ({comments.length})
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '40px' }}>
              No comments yet. Play the video and leave a note.
            </div>
          ) : (
            comments.map(c => (
              <div 
                key={c.id} 
                style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onClick={() => seekTo(c.timestamp_seconds)}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--text-secondary)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge" style={{ background: 'var(--surface-hover)', color: 'var(--accent-secondary)', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                      {formatTime(c.timestamp_seconds)}
                    </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {c.profiles?.email?.split('@')[0] || 'Unknown'}
                    </span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteComment(c.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  {c.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--surface-border)', background: 'var(--surface)' }}>
          {activeTimestamp !== null && (
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> Commenting at {formatTime(activeTimestamp)}
              <button onClick={() => setActiveTimestamp(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', textDecoration: 'underline', cursor: 'pointer', marginLeft: 'auto' }}>Cancel</button>
            </div>
          )}
          <form onSubmit={submitComment} style={{ display: 'flex', gap: '12px', margin: 0 }}>
            <input 
              id="comment-input"
              type="text" 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder={activeTimestamp !== null ? "Type your note..." : "Pause video to comment..."}
              style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '10px 16px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
              onClick={() => {
                if (isPlaying) togglePlay()
                if (activeTimestamp === null) setActiveTimestamp(currentTime)
              }}
            />
            <button type="submit" disabled={!newComment.trim()} className="btn btn-primary" style={{ padding: '0 16px' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}
