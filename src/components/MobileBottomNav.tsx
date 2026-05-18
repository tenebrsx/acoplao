'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Search, Plus, Inbox } from 'lucide-react'

export function MobileBottomNav() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const checkMobile = () => setVisible(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!visible) return null

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a18]/95 backdrop-blur-xl border-t border-[rgba(55,53,47,0.15)] md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        <Link
          href="/docs"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            isActive('/docs') ? 'text-foreground' : 'text-muted-foreground/60'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          href="/docs"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            pathname === '/docs' ? 'text-foreground' : 'text-muted-foreground/60'
          }`}
        >
          <FileText size={20} />
          <span className="text-[10px] font-medium">Docs</span>
        </Link>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors text-muted-foreground/60 active:text-foreground"
        >
          <Search size={20} />
          <span className="text-[10px] font-medium">Search</span>
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('mobile-new-page'))}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={20} />
        </button>

        <Link
          href="/docs?view=inbox"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            pathname.includes('inbox') ? 'text-foreground' : 'text-muted-foreground/60'
          }`}
        >
          <Inbox size={20} />
          <span className="text-[10px] font-medium">Inbox</span>
        </Link>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
