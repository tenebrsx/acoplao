'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { MessageSquare, Send, Clock, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

type Comment = {
  id: string
  deliverable_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: { email: string }
}

export function DeliverableComments({ deliverableId, projectMembers }: { deliverableId: string, projectMembers: { id: string, email: string }[] }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('deliverable_comments')
        .select('*, profiles(email)')
        .eq('deliverable_id', deliverableId)
        .order('created_at', { ascending: true })
      setComments(data || [])
      setIsLoading(false)
    }
    fetchComments()

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    fetchUser()

    const channel = supabase
      .channel(`comments-${deliverableId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'deliverable_comments', filter: `deliverable_id=eq.${deliverableId}` },
        (payload) => {
          setComments(prev => [...prev, payload.new as Comment])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [deliverableId, supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('deliverable_comments')
      .insert({
        deliverable_id: deliverableId,
        user_id: user.id,
        content: newComment.trim()
      })
      .select('*, profiles(email)')
      .single()

    if (data) {
      setComments(prev => [...prev, data])
      setNewComment('')
    }
  }

  const handleDelete = async (commentId: string) => {
    await supabase.from('deliverable_comments').delete().eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const getInitials = (email: string) => email.split('@')[0].slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '40px' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={16} /> Discussion ({comments.length})
      </h3>

      <div 
        ref={scrollRef}
        style={{ 
          display: 'flex', flexDirection: 'column', gap: '12px',
          maxHeight: '400px', overflowY: 'auto', paddingRight: '8px'
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', fontSize: '0.875rem', border: '1px dashed var(--surface-border)', borderRadius: '12px' }}>
            No comments yet. Start the conversation.
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  padding: '12px', background: 'var(--bg-primary)', 
                  borderRadius: '10px', border: '1px solid var(--surface-border)'
                }}
              >
                <div style={{ 
                  width: '28px', height: '28px', borderRadius: '6px', 
                  background: 'var(--surface-border)', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, flexShrink: 0
                }}>
                  {getInitials(comment.profiles?.email || 'U')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {comment.profiles?.email.split('@')[0] || 'Unknown'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} /> {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                      {comment.user_id === currentUserId && (
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px', opacity: 0.5 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, wordBreak: 'break-word' }}>
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-secondary/30"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <Button type="submit" size="icon" disabled={!newComment.trim()}>
          <Send size={14} />
        </Button>
      </form>
    </div>
  )
}
