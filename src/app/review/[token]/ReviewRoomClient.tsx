'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Play, Pause, MessageSquare, Clock, Send, PlayCircle } from 'lucide-react'

type Comment = {
  id: string
  text: string
  timestamp: number
  author: string
  timeStr: string
}

export function ReviewRoomClient({ token, deliverable, project, business, existingResponse }: any) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [comments, setComments] = useState<Comment[]>([])
  const [draftComment, setDraftComment] = useState('')
  const [decision, setDecision] = useState<string | null>(existingResponse?.decision || null)
  
  const videoRef = useRef<HTMLVideoElement>(null)

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause()
      else videoRef.current.play()
      setIsPlaying(!isPlaying)
    }
  }

  const handleAddComment = () => {
    if (!draftComment.trim()) return
    if (videoRef.current) videoRef.current.pause()
    setIsPlaying(false)

    const newComment: Comment = {
      id: Date.now().toString(),
      text: draftComment,
      timestamp: currentTime,
      author: 'Client',
      timeStr: formatTime(currentTime)
    }
    
    setComments(prev => [...prev, newComment].sort((a, b) => a.timestamp - b.timestamp))
    setDraftComment('')
  }

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const isVideo = deliverable?.file_url?.match(/\.(mp4|webm|mov)$/i)
  const mockVideo = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', overflow: 'hidden', flexWrap: 'wrap' }}>
      {/* Left: Video Player */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
        
        {/* Top Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', zIndex: 10, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {business?.name} • {project?.title}
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>{deliverable?.title}</h1>
          </div>
        </div>

        {/* Video Canvas */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <video 
            ref={videoRef}
            src={isVideo ? deliverable.file_url : mockVideo} 
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
            style={{ width: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'pointer' }}
          />
          {!isPlaying && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                <Play size={32} color="white" style={{ marginLeft: '4px' }} />
              </div>
            </div>
          )}
        </div>

        {/* Custom Video Controls */}
        <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={togglePlay} style={{ background: 'var(--text-primary)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--bg-primary)' }}>
              {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
            </button>
            <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 600 }}>
              {formatTime(currentTime)}
            </div>
            
            {/* Timeline Scrubber */}
            <div style={{ flex: 1, height: '4px', background: 'var(--surface-border)', borderRadius: '2px', position: 'relative', cursor: 'pointer' }} onClick={(e) => {
              if (videoRef.current) {
                const rect = e.currentTarget.getBoundingClientRect()
                const percent = (e.clientX - rect.left) / rect.width
                videoRef.current.currentTime = percent * videoRef.current.duration
              }
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--accent-primary)', width: `${videoRef.current ? (currentTime / videoRef.current.duration) * 100 : 0}%`, borderRadius: '2px' }} />
              {/* Comment Markers */}
              {comments.map(c => (
                <div key={c.id} style={{ position: 'absolute', top: '-4px', left: `${(c.timestamp / (videoRef.current?.duration || 1)) * 100}%`, width: '12px', height: '12px', background: 'var(--accent-primary)', borderRadius: '50%', border: '2px solid var(--bg-secondary)', cursor: 'pointer', transform: 'translateX(-50%)' }} onClick={(e) => { e.stopPropagation(); jumpToTime(c.timestamp); }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Comments & Approval Sidebar */}
      <div style={{ width: 'min(400px, 100vw)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--surface-border)', background: 'var(--bg-primary)' }}>
        
        {/* Comments List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <MessageSquare size={16} /> Time-stamped Comments
          </h3>

          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px 0', fontSize: '0.875rem' }}>
              No comments yet. Play the video and drop a comment below.
            </div>
          ) : (
            comments.map(c => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={c.id} style={{ padding: '16px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{c.author}</span>
                  <button onClick={() => jumpToTime(c.timestamp)} style={{ background: 'rgba(0,225,255,0.1)', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PlayCircle size={12} /> {c.timeStr}
                  </button>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {c.text}
                </p>
              </motion.div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div style={{ padding: '24px', borderTop: '1px solid var(--surface-border)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                value={draftComment}
                onChange={e => setDraftComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                placeholder="Leave a comment..."
                style={{ width: '100%', padding: '12px 16px', paddingLeft: '48px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '24px', color: 'var(--text-primary)', outline: 'none' }}
              />
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                {formatTime(currentTime)}
              </div>
            </div>
            <button onClick={handleAddComment} style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--text-primary)', border: 'none', color: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Global Action */}
        <div style={{ padding: '24px', borderTop: '1px solid var(--surface-border)' }}>
          {decision ? (
            <div style={{ padding: '16px', background: decision === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: decision === 'approved' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
              {decision === 'approved' ? <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} /> : <XCircle size={32} color="var(--error)" style={{ margin: '0 auto 8px' }} />}
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: decision === 'approved' ? 'var(--success)' : 'var(--error)', textTransform: 'capitalize' }}>{decision}</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>You have submitted your final review.</p>
            </div>
          ) : (
            <form action={`/api/review/${token}`} method="POST" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Pass comments as JSON string back to server */}
              <input type="hidden" name="comments" value={JSON.stringify(comments)} />
              <button type="submit" name="decision" value="approved" style={{ padding: '16px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> Approve
              </button>
              <button type="submit" name="decision" value="rejected" style={{ padding: '16px', background: 'transparent', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <XCircle size={18} /> Req. Changes
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
