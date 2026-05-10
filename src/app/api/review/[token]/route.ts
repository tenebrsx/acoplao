import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  
  try {
    const formData = await request.formData()
    const decision = formData.get('decision') as string
    let feedback = formData.get('feedback') as string
    const commentsStr = formData.get('comments') as string

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
    }

    if (commentsStr) {
      try {
        const commentsArr = JSON.parse(commentsStr)
        if (Array.isArray(commentsArr) && commentsArr.length > 0) {
          const formattedComments = commentsArr.map(c => `[${c.timeStr}] ${c.text}`).join('\n')
          feedback = feedback ? `${feedback}\n\nTime-stamped Comments:\n${formattedComments}` : `Time-stamped Comments:\n${formattedComments}`
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    const supabase = await createClient()

    // Find the review link by token
    const { data: reviewLink, error: linkError } = await supabase
      .from('review_links')
      .select('id, deliverable_id, is_active')
      .eq('token', token)
      .single()

    if (linkError || !reviewLink || !reviewLink.is_active) {
      return NextResponse.json({ error: 'Invalid or inactive review link' }, { status: 404 })
    }

    // Insert the response
    const { error: responseError } = await supabase
      .from('review_responses')
      .insert({
        review_link_id: reviewLink.id,
        decision,
        feedback: feedback || null,
      })

    if (responseError) {
      console.error('Error inserting review response:', responseError)
      return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
    }

    // The database trigger (handle_review_response) will automatically update
    // the deliverable's status_v2 to 'approved' or 'rejected'.

    // Redirect back to the review page to show the confirmation
    return NextResponse.redirect(new URL(`/review/${token}`, request.url))

  } catch (err) {
    console.error('Review API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
