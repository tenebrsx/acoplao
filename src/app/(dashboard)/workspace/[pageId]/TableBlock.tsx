'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, AlignLeft, Hash } from 'lucide-react'

type Column = { id: string; title: string; type: 'text' | 'number' }
type Row = { id: string; cells: Record<string, string> }

export function TableBlock({ content, onUpdate }: { content: any, onUpdate: (data: any) => void }) {
  const [columns, setColumns] = useState<Column[]>(content?.columns || [
    { id: 'col-1', title: 'Task Name', type: 'text' },
    { id: 'col-2', title: 'Status', type: 'text' },
    { id: 'col-3', title: 'Estimate (hrs)', type: 'number' },
  ])
  const [rows, setRows] = useState<Row[]>(content?.rows || [
    { id: 'row-1', cells: { 'col-1': 'Onboarding Document', 'col-2': 'Done', 'col-3': '2' } }
  ])

  useEffect(() => {
    if (JSON.stringify(content?.columns) !== JSON.stringify(columns) || JSON.stringify(content?.rows) !== JSON.stringify(rows)) {
      onUpdate({ columns, rows })
    }
  }, [columns, rows])

  const addColumn = () => {
    const title = window.prompt("Column Name:")
    if (!title) return
    const type = window.prompt("Type (text / number):", "text")
    setColumns([...columns, { id: `col-${Date.now()}`, title, type: type === 'number' ? 'number' : 'text' }])
  }

  const addRow = () => {
    setRows([...rows, { id: `row-${Date.now()}`, cells: {} }])
  }

  const updateCell = (rowId: string, colId: string, value: string) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r))
  }

  const deleteRow = (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId))
  }

  return (
    <div className="glass-panel" style={{ padding: '0', overflowX: 'auto', minHeight: '600px', background: 'var(--surface)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th style={{ width: '40px', borderBottom: '1px solid var(--surface-border)', background: 'var(--bg-secondary)' }}></th>
            {columns.map(col => (
              <th key={col.id} style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--surface-border)', borderRight: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontWeight: 500, background: 'var(--bg-secondary)', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {col.type === 'number' ? <Hash size={14} color="var(--text-tertiary)" /> : <AlignLeft size={14} color="var(--text-tertiary)" />}
                  {col.title}
                </div>
              </th>
            ))}
            <th style={{ borderBottom: '1px solid var(--surface-border)', background: 'var(--bg-secondary)', padding: '0 16px', textAlign: 'left' }}>
              <button onClick={addColumn} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '8px', borderRadius: '6px' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                <Plus size={14} /> Add Property
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-primary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ textAlign: 'center', borderRight: '1px solid var(--surface-border)', color: 'var(--text-tertiary)' }}>
                {i + 1}
              </td>
              {columns.map(col => (
                <td key={col.id} style={{ padding: '0', borderRight: '1px solid var(--surface-border)' }}>
                  <input
                    type={col.type === 'number' ? 'number' : 'text'}
                    value={row.cells[col.id] || ''}
                    onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                    placeholder="Empty"
                    style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                    onFocus={e => e.currentTarget.style.background = 'rgba(0, 225, 255, 0.05)'}
                    onBlur={e => e.currentTarget.style.background = 'transparent'}
                  />
                </td>
              ))}
              <td style={{ padding: '0 16px' }}>
                <button onClick={() => deleteRow(row.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.5, padding: '8px' }} onMouseOver={e => e.currentTarget.style.opacity = '1'} onMouseOut={e => e.currentTarget.style.opacity = '0.5'}>
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
          {/* Add Row Button Row */}
          <tr>
            <td colSpan={columns.length + 2} style={{ padding: '12px 16px' }}>
              <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', padding: '6px 12px', borderRadius: '6px' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                <Plus size={14} /> New
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
