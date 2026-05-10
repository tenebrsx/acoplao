import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { deliverableId, businessId, decision, feedback } = await request.json()

    if (!deliverableId || !businessId || !decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Initialize admin client to bypass RLS since the client is anonymous on the portal
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the deliverable belongs to a project that belongs to the business
    const { data: deliverable } = await supabase
      .from('deliverables')
      .select('projects!inner(business_id)')
      .eq('id', deliverableId)
      .single()

    if (!deliverable || (deliverable.projects as any).business_id !== businessId && (deliverable.projects as any)[0]?.business_id !== businessId) {
      return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 })
    }

    // Update status
    const { error: updateError } = await supabase
      .from('deliverables')
      .update({ status_v2: decision })
      .eq('id', deliverableId)

    if (updateError) throw updateError

    // TODO: If feedback exists, log it to a comments table or review_responses table
    // For now, updating the status is the priority

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Portal Decision Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
