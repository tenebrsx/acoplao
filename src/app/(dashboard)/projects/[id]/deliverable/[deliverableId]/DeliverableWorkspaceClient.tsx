'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UploadCloud, Video, FileText, Image as ImageIcon, CheckCircle2, MessageSquare, Clock, Plus, MoreHorizontal, Trash2, Settings2 } from 'lucide-react'

type Asset = {
  id: string
  deliverable_id: string
  file_name: string
  file_type: string
  file_url: string
  version_number: number
  type?: string
}

type Task = {
  id: string
  title: string
  is_completed: boolean
}

export function DeliverableWorkspaceClient({ 
  deliverable 
}: { 
  deliverable: any 
}) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'tasks' | 'details' | 'chat'>('tasks')
  
  // Assets state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [assets, setAssets] = useState<Asset[]>([])
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)

  // Fetch initial data
  useEffect(() => {
    fetchAssets()
    fetchTasks()
  }, [deliverable.id])

  const fetchAssets = async () => {
    const { data } = await supabase
      .from('deliverable_assets')
      .select('*')
      .eq('deliverable_id', deliverable.id)
      .order('version_number', { ascending: true })
    if (data) setAssets(data)
  }

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('todos')
      .select('id, title, is_completed')
      .eq('deliverable_id', deliverable.id)
      .order('created_at', { ascending: true })
    if (data) setTasks(data)
  }

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(10)
    
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${deliverable.id}/${Date.now()}_v${assets.length + 1}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      setUploadProgress(50)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('deliverables')
        .getPublicUrl(fileName)

      setUploadProgress(80)

      // 2. Insert into deliverable_assets
      const { data: assetData, error: dbError } = await supabase
        .from('deliverable_assets')
        .insert({
          deliverable_id: deliverable.id,
          file_name: file.name,
          file_type: file.type.includes('video') ? 'video' : file.type.includes('image') ? 'image' : 'document',
          file_size_bytes: file.size,
          file_url: publicUrl,
          version_number: assets.length + 1
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Refresh assets
      if (assetData) {
        setAssets(prev => [...prev, assetData])
      }
      
      // Update deliverable status to delivered if it was in_progress
      if (deliverable.status_v2 === 'in_progress') {
        await supabase.from('deliverables').update({ status_v2: 'delivered' }).eq('id', deliverable.id)
      }

    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload asset. Make sure the storage bucket exists and you have permissions.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [deliverable.id, assets.length, supabase])

  // --- Task Management ---
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const { data } = await supabase
      .from('todos')
      .insert({
        title: newTaskTitle,
        deliverable_id: deliverable.id
      })
      .select()
      .single()

    if (data) {
      setTasks(prev => [...prev, data])
      setNewTaskTitle('')
      setIsAddingTask(false)
    }
  }

  const toggleTask = async (task: Task) => {
    const newStatus = !task.is_completed
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t))
    
    await supabase
      .from('todos')
      .update({ is_completed: newStatus })
      .eq('id', task.id)
  }

  const activeAsset = assets[assets.length - 1]

  return (
    <div className="flex h-full w-full gap-6 animate-in fade-in duration-500" style={{ height: 'calc(100vh - 180px)' }}>
      
      {/* LEFT COLUMN: Digital Asset Management & Viewer */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Video size={18} className="text-blue-400" /> 
            Primary Asset
          </h2>
          {assets.length > 0 && (
            <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold tracking-wide">
              V{assets.length} Ready
            </span>
          )}
        </div>

        {assets.length === 0 ? (
          <div className="flex-1 rounded-2xl border-2 border-dashed border-[var(--surface-border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer shadow-inner">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              onChange={handleFileUpload}
              accept="video/*,image/*,.pdf"
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center gap-4 w-full px-12">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-[var(--text-secondary)] font-medium">Encrypting & Uploading...</p>
                <div className="w-full bg-[var(--surface-border)] h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center p-8 transition-transform duration-300 group-hover:scale-105">
                <div className="w-24 h-24 rounded-2xl bg-black/40 border border-[var(--surface-border)] flex items-center justify-center shadow-2xl">
                  <UploadCloud size={48} className="text-blue-500 group-hover:text-blue-400 transition-colors drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-white">Drop deliverable asset here</h3>
                  <p className="text-[var(--text-secondary)] max-w-md mx-auto text-sm leading-relaxed">
                    Upload high-res MP4, JPG, or PDF files. They will be securely synced to the client portal for instant review.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 rounded-2xl bg-black border border-[var(--surface-border)] overflow-hidden relative flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            
            {/* Asset Viewer */}
            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-black/50">
              {/* Background Blur Effect */}
              {activeAsset.type === 'image' && (
                <div className="absolute inset-0 opacity-20 blur-[100px] scale-110 pointer-events-none" 
                     style={{ backgroundImage: `url(${activeAsset.file_url})`, backgroundPosition: 'center', backgroundSize: 'cover' }} />
              )}
              
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                {activeAsset.type === 'video' ? (
                  <video 
                    src={activeAsset.file_url} 
                    controls 
                    className="max-h-full max-w-full rounded-xl shadow-2xl border border-white/10"
                  />
                ) : activeAsset.type === 'image' ? (
                  <img 
                    src={activeAsset.file_url} 
                    className="max-h-full max-w-full rounded-xl shadow-2xl object-contain border border-white/10"
                    alt={activeAsset.file_name}
                  />
                ) : (
                  <div className="flex flex-col items-center text-white bg-[var(--surface)] p-12 rounded-2xl border border-[var(--surface-border)]">
                    <FileText size={80} className="mb-6 opacity-80 text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
                    <p className="font-mono text-lg">{activeAsset.file_name}</p>
                    <a href={activeAsset.file_url} target="_blank" rel="noreferrer" className="mt-4 text-blue-400 hover:text-blue-300 text-sm underline">
                      Open Document
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Controls Toolbar */}
            <div className="h-16 bg-[#0A0A0A] border-t border-[var(--surface-border)] flex items-center justify-between px-6 z-20">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">History</span>
                  <div className="flex -space-x-2">
                    {assets.map((a, i) => (
                      <div key={a.id} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-black transition-transform hover:scale-110 cursor-pointer ${i === assets.length - 1 ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}>
                        V{i + 1}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="w-[1px] h-6 bg-[var(--surface-border)]"></div>
                
                {isUploading ? (
                  <span className="text-xs text-blue-400 animate-pulse">Uploading V{assets.length + 1}...</span>
                ) : (
                  <button className="text-xs font-medium text-[var(--text-secondary)] hover:text-white transition-colors flex items-center gap-1.5 relative overflow-hidden group bg-[var(--surface)] px-3 py-1.5 rounded-md border border-[var(--surface-border)] hover:border-white/20">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
                    <Plus size={14} /> Upload Revision
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                <button className="btn btn-secondary btn-sm bg-transparent border-none text-[var(--text-secondary)] hover:text-white">
                  <MessageSquare size={16} /> <span className="opacity-70">Internal</span>
                </button>
                <button className="btn btn-primary btn-sm bg-blue-600 hover:bg-blue-500 text-white border-none shadow-[0_0_20px_rgba(37,99,235,0.4)] px-6">
                  Ready for Client
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: The Control Deck */}
      <div className="w-[420px] flex flex-col bg-[#0A0A0A] border border-[var(--surface-border)] rounded-2xl overflow-hidden shadow-2xl relative">
        
        {/* Glow effect at top */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        {/* Tabs */}
        <div className="flex p-2 gap-1 border-b border-[var(--surface-border)] bg-black/40 backdrop-blur-md">
          {['tasks', 'details'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-[var(--surface)] text-white shadow-sm border border-[var(--surface-border)]' 
                  : 'text-[var(--text-tertiary)] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[var(--background)]">
          
          {activeTab === 'tasks' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-white/90">Action Items</h3>
                <button 
                  onClick={() => setIsAddingTask(!isAddingTask)}
                  className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-2 py-1 rounded border border-blue-500/20 font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Add Task
                </button>
              </div>

              {isAddingTask && (
                <form onSubmit={addTask} className="mb-4">
                  <input
                    type="text"
                    autoFocus
                    placeholder="E.g. Record voiceover..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder-[var(--text-tertiary)] shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                  />
                </form>
              )}

              <div className="flex flex-col gap-2 flex-1">
                {tasks.length === 0 && !isAddingTask ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 pt-12">
                    <CheckCircle2 size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">No action items yet.</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Break this deliverable down into smaller tasks.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => toggleTask(task)}
                      className={`p-3.5 rounded-xl border ${task.is_completed ? 'border-green-500/10 bg-green-500/5' : 'border-[var(--surface-border)] bg-[var(--surface)]'} flex items-start gap-3 group transition-all hover:border-[var(--text-tertiary)] cursor-pointer shadow-sm`}
                    >
                      <div className={`w-5 h-5 mt-0.5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${task.is_completed ? 'border-green-500 bg-green-500' : 'border-[var(--text-tertiary)] group-hover:border-white/50'}`}>
                        {task.is_completed && <CheckCircle2 size={12} className="text-black" />}
                      </div>
                      <span className={`text-sm flex-1 leading-relaxed ${task.is_completed ? 'line-through text-[var(--text-secondary)] opacity-60' : 'text-white/90 font-medium'}`}>
                        {task.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="flex flex-col gap-8 text-sm">
              <div>
                <h4 className="text-[var(--text-tertiary)] uppercase text-xs font-bold tracking-widest mb-3 flex items-center gap-2">
                  <FileText size={14} /> Description
                </h4>
                <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl p-4 text-[var(--text-secondary)] leading-relaxed shadow-sm">
                  {deliverable.description || 'No description provided for this deliverable.'}
                </div>
              </div>
              
              <div>
                <h4 className="text-[var(--text-tertiary)] uppercase text-xs font-bold tracking-widest mb-3 flex items-center gap-2">
                  <Settings2 size={14} /> System Metadata
                </h4>
                <div className="space-y-1 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl overflow-hidden shadow-sm">
                  <div className="flex justify-between p-3 border-b border-[var(--surface-border)]">
                    <span className="text-[var(--text-secondary)]">Database ID</span>
                    <span className="font-mono text-xs opacity-70">{deliverable.id.split('-')[0]}...</span>
                  </div>
                  <div className="flex justify-between p-3 border-b border-[var(--surface-border)] bg-black/20">
                    <span className="text-[var(--text-secondary)]">Current Phase</span>
                    <span className="capitalize font-medium text-white/90">{(deliverable.status_v2 || 'in_progress').replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-[var(--text-secondary)]">Created On</span>
                    <span className="text-white/80">{new Date(deliverable.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
