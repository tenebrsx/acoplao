import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { InvoiceBuilderClient } from './InvoiceBuilderClient'

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // We need to fetch businesses so the user can select who the invoice is for
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <div className="h-full">
      <InvoiceBuilderClient businesses={businesses || []} />
    </div>
  )
}
