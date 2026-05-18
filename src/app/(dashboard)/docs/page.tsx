import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DocumentTree } from '@/components/DocumentTree'

export default async function DocsDashboard() {
  const supabase = await createClient()

  // Fetch all docs for the tree
  const { data: allDocs } = await supabase
    .from('documents')
    .select('id, title, parent_id, icon, is_public, created_by, tags, updated_at, created_at')
    .neq('is_deleted', true)
    .order('title', { ascending: true })

  if (allDocs && allDocs.length > 0) {
    // Notion behavior: if there are documents, redirect to the first one
    redirect(`/docs/${allDocs[0].id}`)
  }

  return (
    <div className="flex h-full w-full bg-[#1a1a18] absolute inset-0 z-50">
      <aside className="w-[240px] shrink-0 border-r border-[rgba(55,53,47,0.09)] bg-[#232320] overflow-hidden flex flex-col relative z-20">
        <DocumentTree
          documents={[]}
          currentDocId=""
        />
      </aside>

      <main className="flex-1 overflow-y-auto relative flex flex-col items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-xl bg-[rgba(247,246,243,0.05)] flex items-center justify-center mx-auto mb-6 border border-[rgba(55,53,47,0.1)]">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-xl font-semibold mb-3 text-foreground tracking-tight">Welcome to your workspace</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Start writing by creating your first page. Use <kbd className="px-1.5 py-0.5 bg-[rgba(247,246,243,0.08)] rounded text-xs font-mono">/</kbd> for commands and <kbd className="px-1.5 py-0.5 bg-[rgba(247,246,243,0.08)] rounded text-xs font-mono">Cmd+K</kbd> to search.
          </p>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground/70">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[rgba(247,246,243,0.04)] transition-colors cursor-pointer">
              <span className="w-5 h-5 rounded bg-[rgba(247,246,243,0.08)] flex items-center justify-center text-xs">/</span>
              <span>Type <strong className="text-foreground/80">/</strong> to see available blocks</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[rgba(247,246,243,0.04)] transition-colors cursor-pointer">
              <span className="w-5 h-5 rounded bg-[rgba(247,246,243,0.08)] flex items-center justify-center text-xs">⌘</span>
              <span>Press <strong className="text-foreground/80">Cmd+K</strong> for quick navigation</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[rgba(247,246,243,0.04)] transition-colors cursor-pointer">
              <span className="w-5 h-5 rounded bg-[rgba(247,246,243,0.08)] flex items-center justify-center text-xs">+</span>
              <span>Click <strong className="text-foreground/80">New Page</strong> in the sidebar</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
