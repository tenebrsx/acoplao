'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Users, Building2, FileText, FolderKanban, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function QuickCreateMenu({ isOpen: sidebarOpen }: { isOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const actions = [
    { name: 'New Client', icon: Building2, href: '/businesses', color: 'var(--success)', isRoute: true },
    { name: 'New Project', icon: FolderKanban, href: '/projects?action=new-project', color: 'var(--accent-primary)', isRoute: false },
    { name: 'New Document', icon: FileText, href: '/docs', color: 'var(--warning)', isRoute: true },
  ]

  return (
    <div ref={menuRef} style={{ position: 'relative', marginBottom: '24px', padding: '0 8px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
          gap: '12px',
          padding: '10px 12px',
          background: 'var(--text-primary)',
          color: 'var(--bg-primary)',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Plus size={18} strokeWidth={3} />
        {sidebarOpen && <span>Quick Action</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: '8px',
              right: '8px',
              marginTop: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: '12px',
              padding: '8px',
              zIndex: 100,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '0.05em' }}>
              Create New
            </div>
            {actions.map((action) => {
              const itemContent = (
                <>
                  <action.icon size={16} color={action.color} />
                  <span>{action.name}</span>
                </>
              )
              const itemStyle = {
                display: 'flex' as const,
                alignItems: 'center' as const,
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                cursor: 'pointer',
                width: '100%'
              }
              const hoverProps = {
                onMouseOver: (e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.background = 'var(--surface-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                },
                onMouseOut: (e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }
              if (action.isRoute) {
                return (
                  <Link
                    key={action.name}
                    href={action.href}
                    onClick={() => setIsOpen(false)}
                    style={itemStyle}
                    {...hoverProps}
                  >
                    {itemContent}
                  </Link>
                )
              }
              return (
                <button
                  key={action.name}
                  onClick={() => {
                    setIsOpen(false)
                    router.push(action.href)
                  }}
                  style={{ ...itemStyle, background: 'none', border: 'none' }}
                  {...hoverProps}
                >
                  {itemContent}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
