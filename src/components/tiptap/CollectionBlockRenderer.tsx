'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowUpDown, Filter, X, Settings, Loader2
} from 'lucide-react'
import { format } from 'date-fns'

type CollectionSource = 'projects' | 'tasks' | 'invoices' | 'events'

interface CollectionBlockRendererProps {
  sourceType: CollectionSource
  filtersJson: string
  sortsJson: string
  columnsJson: string
}

const SOURCE_CONFIG: Record<CollectionSource, {
  table: string
  columns: { key: string; label: string; format?: (val: any) => string }[]
  defaultColumns: string[]
}> = {
  projects: {
    table: 'projects',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'budget', label: 'Budget', format: (v) => v ? `$${v.toLocaleString()}` : '-' },
      { key: 'start_date', label: 'Start', format: (v) => v ? format(new Date(v), 'MMM d') : '-' },
      { key: 'due_date', label: 'Due', format: (v) => v ? format(new Date(v), 'MMM d') : '-' },
    ],
    defaultColumns: ['title', 'status', 'budget', 'due_date'],
  },
  tasks: {
    table: 'todos',
    columns: [
      { key: 'title', label: 'Task' },
      { key: 'is_completed', label: 'Done', format: (v) => v ? '✅' : '⬜' },
      { key: 'due_date', label: 'Due', format: (v) => v ? format(new Date(v), 'MMM d') : '-' },
      { key: 'priority', label: 'Priority' },
    ],
    defaultColumns: ['title', 'is_completed', 'due_date', 'priority'],
  },
  invoices: {
    table: 'invoices',
    columns: [
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount', format: (v) => `$${v?.toLocaleString() || 0}` },
      { key: 'status', label: 'Status' },
      { key: 'due_date', label: 'Due', format: (v) => v ? format(new Date(v), 'MMM d') : '-' },
    ],
    defaultColumns: ['description', 'amount', 'status', 'due_date'],
  },
  events: {
    table: 'calendar_events',
    columns: [
      { key: 'title', label: 'Event' },
      { key: 'start_time', label: 'Date', format: (v) => v ? format(new Date(v), 'MMM d, h:mm a') : '-' },
      { key: 'all_day', label: 'All Day', format: (v) => v ? 'Yes' : 'No' },
      { key: 'color', label: 'Color' },
    ],
    defaultColumns: ['title', 'start_time', 'all_day'],
  },
}

export function CollectionBlockRenderer({
  sourceType,
  filtersJson,
  sortsJson,
  columnsJson,
}: CollectionBlockRendererProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showFilters, setShowFilters] = useState(false)

  const supabase = createClient()
  const config = SOURCE_CONFIG[sourceType] || SOURCE_CONFIG.projects

  const activeColumns = useMemo(() => {
    try {
      const parsed = JSON.parse(columnsJson)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return config.columns.filter(c => parsed.includes(c.key))
      }
    } catch {}
    return config.columns.filter(c => config.defaultColumns.includes(c.key))
  }, [columnsJson, config])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: rows, error } = await supabase
        .from(config.table)
        .select('*')
        .limit(50)

      if (!error && rows) {
        setData(rows)
      }
      setLoading(false)
    }
    fetchData()
  }, [sourceType, config.table, supabase])

  const filteredData = useMemo(() => {
    let result = [...data]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(row =>
        activeColumns.some(col => {
          const val = row[col.key]
          if (val == null) return false
          return String(val).toLowerCase().includes(q)
        })
      )
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]
        if (aVal == null) return 1
        if (bVal == null) return -1
        if (typeof aVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        }
        return sortDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal))
      })
    }

    return result
  }, [data, searchQuery, sortKey, sortDirection, activeColumns])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  if (loading) {
    return (
      <div className="border rounded-xl p-8 bg-card/30 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading {sourceType}...</span>
      </div>
    )
  }

  return (
    <div className="border rounded-xl bg-card/30 overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold capitalize">{sourceType}</span>
          <Badge variant="secondary" className="text-xs">{filteredData.length}</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-7 w-40 text-xs"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {activeColumns.map(col => (
                <TableHead key={col.key} className="text-xs cursor-pointer hover:text-foreground" onClick={() => handleSort(col.key)}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown size={10} className={sortKey === col.key ? 'text-primary' : 'text-muted-foreground/40'} />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeColumns.length} className="text-center text-sm text-muted-foreground py-8">
                  No {sourceType} found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, i) => (
                <TableRow key={row.id || i} className="hover:bg-secondary/30 transition-colors">
                  {activeColumns.map(col => (
                    <TableCell key={col.key} className="text-xs">
                      {col.format ? col.format(row[col.key]) : row[col.key] || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
