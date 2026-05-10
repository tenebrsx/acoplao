import { createClient } from '@/utils/supabase/server'
import { ReviewRoomClient } from './ReviewRoomClient'

export default async function PublicReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  // Fetch the review link + deliverable + project + business info
  const { data: reviewLink, error } = await supabase
    .from('review_links')
    .select('*, deliverables(id, title, description, file_url, status_v2, projects(title, businesses(name)))')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (error || !reviewLink) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Link Not Found</h1>
          <p style={{ color: 'var(--text-secondary)' }}>This review link is invalid, expired, or has been deactivated.</p>
        </div>
      </div>
    )
  }

  const deliverable = reviewLink.deliverables
  const project = deliverable?.projects
  const business = project?.businesses

  // Check if already responded
  const { data: existingResponse } = await supabase
    .from('review_responses')
    .select('decision, feedback, responded_at')
    .eq('review_link_id', reviewLink.id)
    .order('responded_at', { ascending: false })
    .limit(1)
    .single()

  const alreadyResponded = !!existingResponse

  return (
    <ReviewRoomClient 
      token={token} 
      deliverable={deliverable} 
      project={project} 
      business={business} 
      existingResponse={existingResponse} 
    />
  )
}
