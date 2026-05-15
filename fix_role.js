const supabaseUrl = 'https://zuxhmwlnknhdvwgcscwt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eGhtd2xua25oZHZ3Z2NzY3d0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkxNDQ5NywiZXhwIjoyMDkzNDkwNDk3fQ.b34Pl0m7Ig0Wl7-UIyaz26OlSP_1piO2WZcYYUWl5MA'

async function fix() {
  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?role=eq.contractor`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ role: 'admin' })
  })

  const data = await res.json()
  console.log(data)
}

fix()
