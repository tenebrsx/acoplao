import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, Search, Calendar, Globe, Lock } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function DocsDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // if (!user) redirect('/login')

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false })

  async function createDocument() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: 'Untitled Document',
        content: '<p></p>',
        created_by: user?.id || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error("Failed to create document:", error)
      return
    }

    if (data) {
      redirect(`/dashboard/docs/${data.id}`)
    }
  }

  return (
    <div className="animate-in delay-100">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Documents</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Collaborative rich-text documents for your agency.
          </p>
        </div>
        <form action={createDocument}>
          <button type="submit" className="btn btn-primary">
            <Plus size={16} /> New Document
          </button>
        </form>
      </div>

      {/* Docs Grid */}
      {(!documents || documents.length === 0) ? (
        <div className="glass-panel" style={{ padding: '64px 32px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid var(--surface-border)' }}>
            <FileText size={28} color="var(--text-primary)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No Documents Yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Create your first document to start collaborating, taking notes, or writing briefs.
          </p>
          <form action={createDocument}>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Create Blank Document
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {documents.map((doc: any) => (
            <Link 
              key={doc.id} 
              href={`/dashboard/docs/${doc.id}`}
              className="glass-panel"
              style={{ padding: '24px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%', transition: 'border-color 0.2s, transform 0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--surface-border)' }}>
                  <FileText size={20} color="var(--text-primary)" />
                </div>
                {doc.is_public ? (
                  <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }} title="Public link enabled">
                    <Globe size={12} style={{ marginRight: '4px' }} /> Public
                  </div>
                ) : (
                  <div className="badge" style={{ background: 'var(--surface)', color: 'var(--text-tertiary)' }} title="Private document">
                    <Lock size={12} style={{ marginRight: '4px' }} /> Private
                  </div>
                )}
              </div>
              
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>
                {doc.title}
              </h3>
              
              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  {new Date(doc.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span>{doc.word_count || 0} words</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
