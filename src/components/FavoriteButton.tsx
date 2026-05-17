'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from './ToastProvider'

export function FavoriteButton({ 
  entityId, 
  entityType, 
  initialIsFavorite 
}: { 
  entityId: string, 
  entityType: 'project' | 'business' | 'document',
  initialIsFavorite?: boolean
}) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return
    setIsLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast("Please log in to favorite items", "error")
      setIsLoading(false)
      return
    }

    if (isFavorite) {
      // Remove
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)

      if (!error) {
        setIsFavorite(false)
        toast("Removed from favorites", "info")
      } else {
        toast("Failed to update favorite", "error")
      }
    } else {
      // Add
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          entity_id: entityId,
          entity_type: entityType
        })

      if (!error) {
        setIsFavorite(true)
        toast("Added to favorites", "success")
      } else {
        toast("Failed to update favorite", "error")
      }
    }
    
    setIsLoading(false)
    // Dispatch custom event for sidebar to refresh
    window.dispatchEvent(new CustomEvent('favorites-updated'))
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        transition: 'all 0.2s',
        color: isFavorite ? 'var(--warning)' : 'var(--text-tertiary)',
      }}
      onMouseOver={(e) => !isFavorite && (e.currentTarget.style.color = 'var(--text-secondary)')}
      onMouseOut={(e) => !isFavorite && (e.currentTarget.style.color = 'var(--text-tertiary)')}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star size={16} fill={isFavorite ? 'var(--warning)' : 'none'} strokeWidth={isFavorite ? 0 : 2} />
    </button>
  )
}
