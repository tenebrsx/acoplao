'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckSquare, Square, ClipboardList, CheckCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type List = {
  id: string
  title: string
  description: string | null
  color: string
  icon: string
  is_pinned: boolean
  created_at: string
}

type ListItem = {
  id: string
  list_id: string
  content: string
  is_checked: boolean
  sort_order: number
}

const colorMap: Record<string, { border: string; bg: string; text: string; progress: string }> = {
  emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', progress: 'bg-emerald-500' },
  blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', progress: 'bg-blue-500' },
  purple: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', progress: 'bg-purple-500' },
  amber: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', progress: 'bg-amber-500' },
  red: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700', progress: 'bg-red-500' },
  pink: { border: 'border-pink-200', bg: 'bg-pink-50', text: 'text-pink-700', progress: 'bg-pink-500' }
}

export function ListsClient({ initialLists, userId }: { initialLists: List[]; userId: string }) {
  const [lists, setLists] = useState<List[]>(initialLists)
  const [items, setItems] = useState<Record<string, ListItem[]>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState('emerald')
  const supabase = createClient()

  useEffect(() => {
    async function loadItems() {
      if (initialLists.length === 0) return
      const { data } = await supabase
        .from('list_items')
        .select('*')
        .in('list_id', initialLists.map(l => l.id))
        .order('created_at', { ascending: true })

      const grouped: Record<string, ListItem[]> = {}
      data?.forEach(item => {
        if (!grouped[item.list_id]) grouped[item.list_id] = []
        grouped[item.list_id].push(item)
      })
      setItems(grouped)
    }
    loadItems()
  }, [initialLists, supabase])

  const createList = async () => {
    if (!newTitle.trim()) return
    const { data: list } = await supabase.from('lists').insert({
      user_id: userId,
      title: newTitle.trim(),
      color: newColor
    }).select('*').single()

    if (list) {
      setLists(prev => [list, ...prev])
      setNewTitle('')
      setShowAdd(false)
    }
  }

  const deleteList = async (listId: string) => {
    setLists(prev => prev.filter(l => l.id !== listId))
    await supabase.from('lists').delete().eq('id', listId)
  }

  const addItem = async (listId: string, content: string) => {
    if (!content.trim()) return
    const { data: item } = await supabase.from('list_items').insert({
      list_id: listId,
      content: content.trim()
    }).select('*').single()

    if (item) {
      setItems(prev => ({ ...prev, [listId]: [...(prev[listId] || []), item] }))
    }
  }

  const toggleItem = async (listId: string, itemId: string, checked: boolean) => {
    setItems(prev => ({
      ...prev,
      [listId]: prev[listId]?.map(i => i.id === itemId ? { ...i, is_checked: !checked } : i) || []
    }))
    await supabase.from('list_items').update({ is_checked: !checked, checked_at: !checked ? new Date().toISOString() : null }).eq('id', itemId)
  }

  const deleteItem = async (listId: string, itemId: string) => {
    setItems(prev => ({ ...prev, [listId]: prev[listId]?.filter(i => i.id !== itemId) || [] }))
    await supabase.from('list_items').delete().eq('id', itemId)
  }

  const clearCompleted = async (listId: string) => {
    const listItems = items[listId] || []
    const completedIds = listItems.filter(i => i.is_checked).map(i => i.id)
    if (completedIds.length === 0) return
    setItems(prev => ({ ...prev, [listId]: prev[listId]?.filter(i => !i.is_checked) || [] }))
    await supabase.from('list_items').delete().in('id', completedIds)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Lists</h1>
          <p className="text-muted-foreground text-sm">Checklists for anything and everything.</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-2" /> New List</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="List name..." value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && createList()} />
              <div className="flex gap-2">
                {Object.keys(colorMap).map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      newColor === c ? 'border-foreground scale-110' : 'border-transparent'
                    } ${colorMap[c].progress}`}
                  />
                ))}
              </div>
              <Button onClick={createList} className="w-full" disabled={!newTitle.trim()}>Create List</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {lists.length === 0 ? (
          <Card className="col-span-full p-16 text-center border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No lists yet</h3>
            <p className="text-muted-foreground text-sm">Create your first checklist to get organized.</p>
          </Card>
        ) : (
          lists.map(list => {
            const listItemsArr = items[list.id] || []
            const checkedCount = listItemsArr.filter(i => i.is_checked).length
            const totalCount = listItemsArr.length
            const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0
            const colors = colorMap[list.color] || colorMap.emerald

            return (
              <Card key={list.id} className={`border ${colors.border} overflow-hidden`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors.progress}`} />
                      <CardTitle className="text-base">{list.title}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => deleteList(list.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground font-medium shrink-0">{checkedCount}/{totalCount}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 pt-0">
                  {listItemsArr.slice(0, 6).map(item => (
                    <div key={item.id} className="flex items-center gap-2 group py-0.5">
                      <button onClick={() => toggleItem(list.id, item.id, item.is_checked)} className="shrink-0">
                        {item.is_checked ? (
                          <CheckSquare size={16} className="text-emerald-500" />
                        ) : (
                          <Square size={16} className="text-muted-foreground" />
                        )}
                      </button>
                      <span className={`text-sm flex-1 truncate ${item.is_checked ? 'line-through text-muted-foreground' : ''}`}>
                        {item.content}
                      </span>
                      <button onClick={() => deleteItem(list.id, item.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity p-0.5">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {listItemsArr.length > 6 && (
                    <p className="text-xs text-muted-foreground pl-6">+{listItemsArr.length - 6} more items</p>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const input = e.currentTarget.elements.namedItem('item') as HTMLInputElement
                      addItem(list.id, input.value)
                      input.value = ''
                    }}
                    className="flex gap-2 pt-2"
                  >
                    <Input name="item" placeholder="Add item..." className="h-8 text-sm" />
                    <Button type="submit" size="sm" className="h-8 px-2.5"><Plus size={14} /></Button>
                  </form>
                  {checkedCount > 0 && (
                    <button onClick={() => clearCompleted(list.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
                      <CheckCheck size={12} /> Clear {checkedCount} completed
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
