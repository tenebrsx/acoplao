'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowUp, Loader2, Bot, User } from 'lucide-react'

export function AuraCopilotClient() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'aura', content: string }[]>([
    { role: 'aura', content: "I'm Aura, your agency's AI intelligence. I have full context on your CRM, Gantt charts, and deliverables. How can I assist you today?" }
  ])
  
  const inputRef = useRef<HTMLInputElement>(null)

  // Global Cmd+J listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsTyping(true)

    // Simulate AI thinking and reading the DB context
    setTimeout(() => {
      let response = "I've analyzed the request. What would you like me to execute?"
      
      // Hardcoded smart responses for demo perfection
      if (userMessage.toLowerCase().includes('capacity') || userMessage.toLowerCase().includes('edit')) {
        response = "Based on the Global Gantt Chart, Sarah has 15 hours of availability next week. Shall I assign the Nike video edit to her?"
      } else if (userMessage.toLowerCase().includes('lead') || userMessage.toLowerCase().includes('draft')) {
        response = "I have read the latest lead from 'Acme Corp'. I've drafted a Project Scope document in your Workspace. Would you like to review it?"
      } else if (userMessage.toLowerCase().includes('client') || userMessage.toLowerCase().includes('feedback')) {
        response = "Analyzing the Review Room for 'Project Alpha'... The client sentiment is mostly positive, but they are frustrated with the color grading in scene 3. I recommend addressing that first."
      }

      setMessages(prev => [...prev, { role: 'aura', content: response }])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setIsOpen(false)}
          />

          {/* Copilot UI */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{ 
              position: 'relative', width: '100%', maxWidth: '700px', height: '600px', 
              background: 'var(--surface)', border: '1px solid var(--accent-primary)', 
              borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 60px rgba(0, 225, 255, 0.1)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-primary)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} color="#000" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Aura Intelligence</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Global Agency Context Active</div>
              </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: msg.role === 'aura' ? 'rgba(0, 225, 255, 0.1)' : 'var(--surface-border)',
                    border: msg.role === 'aura' ? '1px solid var(--accent-primary)' : '1px solid var(--text-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {msg.role === 'aura' ? <Bot size={16} color="var(--accent-primary)" /> : <User size={16} color="var(--text-secondary)" />}
                  </div>
                  
                  <div style={{ 
                    background: msg.role === 'user' ? 'var(--surface-hover)' : 'transparent',
                    padding: msg.role === 'user' ? '12px 16px' : '6px 0',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    maxWidth: '80%'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0, 225, 255, 0.1)', border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={16} color="var(--accent-primary)" />
                  </div>
                  <Loader2 size={16} color="var(--accent-primary)" className="animate-spin" />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--surface-border)', background: 'var(--bg-primary)' }}>
              <form onSubmit={handleSend} style={{ position: 'relative' }}>
                <input 
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask Aura anything... (Cmd+J to close)"
                  style={{ 
                    width: '100%', padding: '16px 56px 16px 24px', background: 'var(--surface)', 
                    border: '1px solid var(--surface-border)', borderRadius: '16px', 
                    color: 'white', outline: 'none', fontSize: '1rem',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                  }} 
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  style={{ 
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    width: '32px', height: '32px', borderRadius: '8px', 
                    background: input.trim() && !isTyping ? 'var(--accent-primary)' : 'var(--surface-border)',
                    color: input.trim() && !isTyping ? '#000' : 'var(--text-tertiary)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: input.trim() && !isTyping ? 'pointer' : 'default', transition: 'all 0.2s'
                  }}
                >
                  <ArrowUp size={16} />
                </button>
              </form>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
