import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// We use the service role key here to bypass RLS entirely for public submissions,
// or we can rely on the public INSERT policy we just created.
// To be safe and ensure it works across configurations, using anon key + public policy is best.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.company_name || !body.contact_name || !body.email) {
      return NextResponse.json({ error: 'Missing required fields (company_name, contact_name, email)' }, { status: 400 })
    }

    // Initialize Supabase using the Anon Key so it uses the public INSERT policy
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('leads')
      .insert({
        company_name: body.company_name,
        contact_name: body.contact_name,
        email: body.email,
        phone: body.phone || null,
        budget: body.budget || null,
        project_type: body.project_type || null,
        message: body.message || null,
        status: 'new'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error inserting lead:', error)
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    // CORS Headers to allow cross-origin requests from the agency's actual marketing website
    return NextResponse.json(
      { success: true, lead_id: data.id }, 
      { 
        status: 201, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )

  } catch (err) {
    console.error('Lead API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
