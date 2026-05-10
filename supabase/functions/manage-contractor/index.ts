import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Create a Supabase client with the service_role key to bypass RLS and access admin APIs
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the user making the request is an admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin in public.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile.role !== 'admin') {
      throw new Error('Forbidden: Admin access required')
    }

    const { userId, action } = await req.json()

    if (!userId || !action) {
      throw new Error('Missing required parameters: userId, action')
    }

    if (action === 'deactivate') {
      // 1. Update public.profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId)

      if (updateError) throw updateError

      // 2. Ban the user (prevents future logins)
      // ban_duration: '87600h' is roughly 10 years
      const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: '87600h'
      })

      if (banError) throw banError

      // 3. Kill active sessions
      const { error: signOutError } = await supabase.auth.admin.signOut(userId, 'global')
      
      if (signOutError) {
        console.warn('Failed to sign out globally, possibly no active sessions:', signOutError)
      }

      return new Response(JSON.stringify({ success: true, message: 'Contractor deactivated and banned' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (action === 'activate') {
      // 1. Update public.profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId)

      if (updateError) throw updateError

      // 2. Unban the user
      const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      })

      if (unbanError) throw unbanError

      return new Response(JSON.stringify({ success: true, message: 'Contractor activated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (action === 'update_role') {
      const { newRole } = await req.json()
      
      if (!newRole || !['admin', 'manager', 'contractor', 'client'].includes(newRole)) {
        throw new Error('Invalid role specified')
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (updateError) throw updateError

      return new Response(JSON.stringify({ success: true, message: `Role updated to ${newRole}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      throw new Error('Invalid action')
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
