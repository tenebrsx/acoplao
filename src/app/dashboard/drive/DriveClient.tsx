'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UploadCloud, FileImage, FileText, FileVideo, FileAudio, 
  File as FileIcon, X, Tag, Plus, Download, Trash2, 
  FolderKanban, Building2, AlignLeft, Search, Loader2 
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type Business = { id: string, name: string }
type Project = { id: string, title: string, business_id: string }

type DriveFile = {
  id: string
  name: string
  storage_path: string
  size_bytes: number
  mime_type: string
  file_category: string
  business_id: string | null
  project_id: string | null
  tags: string[]
  notes: string | null
  profiles?: { email: string }
  projects?: { id: string, title: string }
  businesses?: { id: string, name: string }
  created_at: string
}

export function DriveClient({ 
  initialFiles, 
  businesses, 
  projects,
  userId
}: { 
  initialFiles: DriveFile[]
  businesses: Business[]
  projects: Project[]
  userId: string
}) {
  const [files, setFiles] = useState<DriveFile[]>(initialFiles)
  const [isUploading, setIsUploading] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBusiness, setFilterBusiness] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // Selection & Details Drawer
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [isUpdatingMeta, setIsUpdatingMeta] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Upload Logic ────────────────────────────────────────────────
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (!uploadedFiles || uploadedFiles.length === 0) return
    setIsUploading(true)

    const newDbFiles: DriveFile[] = []

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i]
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
      const storagePath = `${userId}/${fileName}`

      // Determine category
      let category = 'other'
      if (file.type.startsWith('image/')) category = 'image'
      else if (file.type.startsWith('video/')) category = 'video'
      else if (file.type.startsWith('audio/')) category = 'audio'
      else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) category = 'document'

      try {
        // Upload to bucket
        const { error: uploadError } = await supabase.storage
          .from('agency_drive')
          .upload(storagePath, file, { cacheControl: '3600', upsert: false })

        if (uploadError) {
          console.error("Upload failed", uploadError)
          alert(`Upload failed for ${file.name}: ${uploadError.message}`)
          continue
        }

        // Insert DB record
        const dbPayload = {
          name: file.name,
          storage_path: storagePath,
          size_bytes: file.size,
          mime_type: file.type,
          file_category: category,
          uploaded_by: userId,
          business_id: filterBusiness || null,
          project_id: filterProject || null
        }

        const { data, error: dbError } = await supabase
          .from('drive_files')
          .insert(dbPayload)
          .select('*, projects(id, title), businesses(id, name), profiles(email)')
          .single()

        if (!dbError && data) {
          newDbFiles.push(data as DriveFile)
        } else if (dbError) {
          alert(`Database record creation failed: ${dbError.message}`)
        }
      } catch (err: any) {
        alert(`An unexpected error occurred: ${err.message}`)
      }
    }

    setFiles(prev => [...newDbFiles, ...prev])
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── File Actions ────────────────────────────────────────────────
  const handleDownload = async (file: DriveFile) => {
    const { data, error } = await supabase.storage.from('agency_drive').createSignedUrl(file.storage_path, 60)
    if (error) return alert("Failed to get download URL")
    
    // Create an invisible anchor tag to trigger download
    const a = document.createElement('a')
    a.href = data.signedUrl
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDelete = async (file: DriveFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return
    
    // Delete from bucket
    await supabase.storage.from('agency_drive').remove([file.storage_path])
    
    // Delete from DB
    await supabase.from('drive_files').delete().eq('id', file.id)
    
    setFiles(prev => prev.filter(f => f.id !== file.id))
    if (selectedFile?.id === file.id) setSelectedFile(null)
  }

  const updateFileMeta = async (updates: Partial<DriveFile>) => {
    if (!selectedFile) return
    setIsUpdatingMeta(true)
    
    const { error } = await supabase.from('drive_files').update(updates).eq('id', selectedFile.id)
    if (!error) {
      const updated = { ...selectedFile, ...updates }
      setSelectedFile(updated)
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? updated : f))
    }
    setIsUpdatingMeta(false)
  }

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tagInput.trim() || !selectedFile) return
    const newTags = [...(selectedFile.tags || []), tagInput.trim().toLowerCase()]
    await updateFileMeta({ tags: newTags })
    setTagInput('')
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedFile) return
    const newTags = (selectedFile.tags || []).filter(t => t !== tagToRemove)
    await updateFileMeta({ tags: newTags })
  }

  // ── Filter Logic ────────────────────────────────────────────────
  const filteredFiles = files.filter(f => {
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(f.tags || []).some(t => t.includes(searchQuery.toLowerCase()))) return false
    if (filterBusiness && f.business_id !== filterBusiness) return false
    if (filterProject && f.project_id !== filterProject) return false
    if (filterCategory && f.file_category !== filterCategory) return false
    return true
  })

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get File Icon
  const getFileIcon = (category: string) => {
    switch(category) {
      case 'image': return <FileImage size={24} color="#a855f7" />
      case 'video': return <FileVideo size={24} color="#f59e0b" />
      case 'audio': return <FileAudio size={24} color="#10b981" />
      case 'document': return <FileText size={24} color="#3b82f6" />
      default: return <FileIcon size={24} color="var(--text-tertiary)" />
    }
  }

  return (
    <div style={{ display: 'flex', gap: '32px', height: 'calc(100vh - 160px)', overflow: 'hidden' }}>
      
      {/* ── Main Drive Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
        
        {/* Filters Top Bar */}
        <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', flex: 1, minWidth: '200px' }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search files or tags..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.875rem' }} />
          </div>
          
          <select value={filterBusiness} onChange={e => { setFilterBusiness(e.target.value); setFilterProject('') }} className="input" style={{ width: '180px', padding: '10px 16px' }}>
            <option value="">All Businesses</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="input" style={{ width: '180px', padding: '10px 16px' }} disabled={!filterBusiness}>
            <option value="">All Projects</option>
            {projects.filter(p => p.business_id === filterBusiness).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>

          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input" style={{ width: '140px', padding: '10px 16px' }}>
            <option value="">All Types</option>
            <option value="video">Videos</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="audio">Audio</option>
          </select>
        </div>

        {/* Upload Dropzone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            padding: '40px', border: '2px dashed var(--surface-border)', borderRadius: '16px', 
            background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple style={{ display: 'none' }} />
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Loader2 size={32} color="var(--accent-primary)" className="animate-spin" />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Uploading to Drive...</div>
            </div>
          ) : (
            <>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0,225,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <UploadCloud size={24} color="var(--accent-primary)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '8px' }}>Click or drag files here to upload</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Files will be saved to {filterProject ? 'the selected project' : 'the global drive'}</div>
            </>
          )}
        </div>

        {/* File Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {filteredFiles.map(file => (
            <div 
              key={file.id} 
              onClick={() => { setSelectedFile(file); setNotesInput(file.notes || '') }}
              style={{ 
                background: selectedFile?.id === file.id ? 'var(--surface-hover)' : 'var(--bg-primary)', 
                border: selectedFile?.id === file.id ? '1px solid var(--accent-primary)' : '1px solid var(--surface-border)', 
                borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', background: 'var(--surface)', borderRadius: '8px', marginBottom: '12px' }}>
                {/* Real thumbnails could be loaded here via signedUrls for images/videos */}
                {getFileIcon(file.file_category)}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                {file.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                <span>{formatBytes(file.size_bytes)}</span>
                <span style={{ textTransform: 'capitalize' }}>{file.file_category}</span>
              </div>
            </div>
          ))}
          {filteredFiles.length === 0 && !isUploading && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No files found matching your filters.
            </div>
          )}
        </div>
      </div>

      {/* ── Metadata Drawer ── */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            className="glass-panel" 
            style={{ width: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid var(--surface-border)' }}
          >
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, wordBreak: 'break-all', marginBottom: '4px' }}>{selectedFile.name}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{formatBytes(selectedFile.size_bytes)} • Uploaded {new Date(selectedFile.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}><X size={18} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Organization Links */}
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Organization</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                    <Building2 size={14} color="var(--text-tertiary)" />
                    <select 
                      value={selectedFile.business_id || ''} 
                      onChange={e => updateFileMeta({ business_id: e.target.value || null, project_id: null })}
                      style={{ flex: 1, background: 'transparent', border: '1px solid transparent', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="">Unlinked Business</option>
                      {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                    <FolderKanban size={14} color="var(--text-tertiary)" />
                    <select 
                      value={selectedFile.project_id || ''} 
                      onChange={e => updateFileMeta({ project_id: e.target.value || null })}
                      disabled={!selectedFile.business_id}
                      style={{ flex: 1, background: 'transparent', border: '1px solid transparent', color: selectedFile.business_id ? 'var(--text-primary)' : 'var(--text-tertiary)', outline: 'none', cursor: selectedFile.business_id ? 'pointer' : 'not-allowed' }}
                    >
                      <option value="">Unlinked Project</option>
                      {projects.filter(p => p.business_id === selectedFile.business_id).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tags System */}
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={12} /> Labels & Tags
                </h4>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {(selectedFile.tags || []).map(tag => (
                    <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,225,255,0.1)', color: 'var(--accent-primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex', marginLeft: '4px' }}><X size={10} /></button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '8px' }}>
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add a tag... (e.g. final)" className="input" style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem' }} />
                  <button type="submit" disabled={isUpdatingMeta || !tagInput} className="btn btn-secondary" style={{ padding: '8px' }}><Plus size={14} /></button>
                </form>
              </div>

              {/* Content Notes */}
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlignLeft size={12} /> Content Notes
                </h4>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    value={notesInput} 
                    onChange={e => setNotesInput(e.target.value)} 
                    onBlur={() => { if(notesInput !== selectedFile.notes) updateFileMeta({ notes: notesInput }) }}
                    placeholder="Write contextual notes about this file..." 
                    className="input" 
                    style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontSize: '0.875rem', padding: '12px' }} 
                  />
                  {isUpdatingMeta && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--accent-primary)' }} />}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>Notes auto-save when you click away.</p>
              </div>

            </div>

            {/* Actions Footer */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--surface-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => handleDownload(selectedFile)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}>
                <Download size={14} /> Download
              </button>
              <button onClick={() => handleDelete(selectedFile)} style={{ background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
