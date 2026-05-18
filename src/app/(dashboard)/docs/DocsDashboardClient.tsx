'use client'

import { useState, useMemo } from 'react'
import { FileText, Search, Grid, List, ArrowUpDown, Plus } from 'lucide-react'
import { DocCard } from './DocCard'
import { DocListRow } from './DocListRow'
import { QuickStartTemplates } from './QuickStartTemplates'
import { NewDocButton } from './NewDocButton'

type ViewMode = 'grid' | 'list'
type FilterTab = 'all' | 'mine' | 'shared'
type SortOption = 'updated' | 'created' | 'title'

export function DocsDashboardClient({ 
  initialDocuments, 
  userId,
  favoriteIds = []
}: { 
  initialDocuments: any[], 
  userId: string | null,
  favoriteIds?: string[]
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [sortBy, setSortBy] = useState<SortOption>('updated')

  const childCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    initialDocuments.forEach((doc: any) => {
      if (doc.parent_id) {
        counts[doc.parent_id] = (counts[doc.parent_id] || 0) + 1
      }
    })
    return counts
  }, [initialDocuments])

  const filteredAndSortedDocs = useMemo(() => {
    let docs = [...initialDocuments]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      docs = docs.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.tags?.some((t: string) => t.toLowerCase().includes(query))
      )
    }

    if (activeTab === 'mine') {
      docs = docs.filter(doc => doc.created_by === userId)
    } else if (activeTab === 'shared') {
      docs = docs.filter(doc => doc.is_public)
    }

    docs.sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      } else if (sortBy === 'created') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return a.title.localeCompare(b.title)
      }
    })

    return docs
  }, [initialDocuments, searchQuery, activeTab, sortBy, userId])

  return (
    <div className="animate-in delay-100">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>Documents</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Collaborative rich-text documents for your agency.
          </p>
        </div>
        <NewDocButton />
      </div>

      <QuickStartTemplates />

      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px', 
        marginBottom: '32px',
        background: 'var(--surface)',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid var(--surface-border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--surface-hover)', padding: '4px', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
            {(['all', 'mine', 'shared'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeTab === tab ? 'var(--surface)' : 'transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  boxShadow: activeTab === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Docs
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '10px 12px 10px 40px',
                  borderRadius: '10px',
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface-hover)',
                  fontSize: '0.875rem',
                  width: '240px',
                  transition: 'all 0.2s'
                }}
              />
            </div>

            {/* Sort */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ArrowUpDown size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{
                  padding: '10px 12px 10px 36px',
                  borderRadius: '10px',
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface-hover)',
                  fontSize: '0.875rem',
                  appearance: 'none',
                  cursor: 'pointer',
                  minWidth: '160px'
                }}
              >
                <option value="updated">Recently Updated</option>
                <option value="created">Recently Created</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>

            {/* View Toggle */}
            <div style={{ display: 'flex', background: 'var(--surface-hover)', padding: '4px', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'grid' ? 'var(--surface)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredAndSortedDocs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '80px 32px', textAlign: 'center', background: 'var(--surface)', border: '1px dashed var(--surface-border)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--surface-border)' }}>
            <FileText size={32} color="var(--text-tertiary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
            {searchQuery ? 'No results found' : 'No Documents Yet'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 32px', lineHeight: 1.6, fontSize: '1.0625rem' }}>
            {searchQuery 
              ? `We couldn't find any documents matching "${searchQuery}". Try a different search term.`
              : 'Create your first document to start collaborating, taking notes, or writing briefs.'
            }
          </p>
          {!searchQuery && <NewDocButton label="Create Blank Document" />}
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="btn btn-secondary"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {filteredAndSortedDocs.map((doc: any) => (
                <DocCard key={doc.id} doc={doc} isFavorite={favoriteIds.includes(doc.id)} childCount={childCounts[doc.id] || 0} />
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1.5fr 1fr 1fr 120px 40px',
                padding: '12px 16px',
                background: 'var(--surface-hover)',
                borderBottom: '1px solid var(--surface-border)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <span>Title</span>
                <span>Author</span>
                <span>Last Modified</span>
                <span>Status</span>
                <span></span>
              </div>
              {filteredAndSortedDocs.map((doc: any) => (
                <DocListRow key={doc.id} doc={doc} isFavorite={favoriteIds.includes(doc.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
