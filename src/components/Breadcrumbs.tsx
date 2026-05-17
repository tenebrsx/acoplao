'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { motion } from 'framer-motion'

const ROUTE_MAP: Record<string, string> = {
  'leads': 'CRM & Leads',
  'businesses': 'Clients',
  'projects': 'Campaigns',
  'drive': 'Global Drive',
  'capacity': 'Capacity',
  'finances': 'Finances',
  'calendar': 'Calendar',
  'docs': 'Docs',
  'automations': 'Automations',
  'inbox': 'Inbox',
  'team': 'Team',
  'settings': 'Preferences',
  'workspace': 'Workspace'
}

export function Breadcrumbs() {
  const pathname = usePathname()
  
  if (pathname === '/') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.8125rem', fontWeight: 500 }}>
        <Home size={14} />
        <span>Overview</span>
      </div>
    )
  }

  const segments = pathname.split('/').filter(Boolean)
  
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 500 }}>
      <Link 
        href="/" 
        style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
        onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseOut={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
      >
        <Home size={14} />
      </Link>
      
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`
        const isLast = index === segments.length - 1
        const label = ROUTE_MAP[segment] || segment.replace(/-/g, ' ')
        
        // Handle UUIDs or IDs by shortening them if they look like one
        const displayLabel = segment.length > 20 ? 'Detail' : label

        return (
          <div key={href} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChevronRight size={14} color="var(--text-tertiary)" />
            {isLast ? (
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                {displayLabel}
              </span>
            ) : (
              <Link
                href={href}
                style={{ color: 'var(--text-tertiary)', textDecoration: 'none', transition: 'color 0.2s', textTransform: 'capitalize' }}
                onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                {displayLabel}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
