export default function DocsLoading() {
  return (
    <div className="flex h-full w-full bg-[#1a1a18] absolute inset-0 z-50">
      <aside className="w-[240px] shrink-0 border-r border-[rgba(55,53,47,0.09)] bg-[#232320] overflow-hidden flex flex-col relative z-20">
        <div className="px-3 py-3 mt-1 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[rgba(247,246,243,0.08)] animate-pulse" />
            <div className="w-24 h-4 rounded bg-[rgba(247,246,243,0.06)] animate-pulse" />
          </div>
        </div>

        <div className="px-3 mb-4 space-y-0.5">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-4 h-4 rounded bg-[rgba(247,246,243,0.06)] animate-pulse" />
            <div className="w-16 h-3.5 rounded bg-[rgba(247,246,243,0.06)] animate-pulse" />
          </div>
        </div>

        <div className="px-3 mb-2">
          <div className="w-14 h-3 rounded bg-[rgba(247,246,243,0.05)] animate-pulse mb-2" />
          <div className="space-y-1.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2 px-2 py-1">
                <div className="w-4 h-4 rounded bg-[rgba(247,246,243,0.06)] animate-pulse" />
                <div className="w-20 h-3 rounded bg-[rgba(247,246,243,0.06)] animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="px-3">
          <div className="w-12 h-3 rounded bg-[rgba(247,246,243,0.05)] animate-pulse mb-2" />
          <div className="space-y-1.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-2 px-2 py-1">
                <div className="w-4 h-4 rounded bg-[rgba(247,246,243,0.06)] animate-pulse" />
                <div className="w-full h-3 rounded bg-[rgba(247,246,243,0.06)] animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative flex flex-col custom-scrollbar">
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-[#1a1a18]/80 backdrop-blur-md">
          <div className="flex items-center gap-1">
            <div className="w-20 h-3 rounded bg-[rgba(247,246,243,0.06)] animate-pulse" />
            <div className="w-2 h-3 rounded bg-[rgba(247,246,243,0.04)] animate-pulse" />
            <div className="w-24 h-3 rounded bg-[rgba(247,246,243,0.06)] animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-5 rounded bg-[rgba(247,246,243,0.06)] animate-pulse" />
            <div className="w-8 h-5 rounded bg-[rgba(247,246,243,0.06)] animate-pulse" />
          </div>
        </div>

        <div className="w-full max-w-[900px] mx-auto px-16 pb-32 pt-12">
          <div className="w-[78px] h-[78px] rounded-lg bg-[rgba(247,246,243,0.05)] animate-pulse mb-4" />

          <div className="w-3/4 h-[40px] rounded bg-[rgba(247,246,243,0.06)] animate-pulse mb-8" />

          <div className="space-y-3">
            <div className="w-full h-4 rounded bg-[rgba(247,246,243,0.05)] animate-pulse" />
            <div className="w-[90%] h-4 rounded bg-[rgba(247,246,243,0.05)] animate-pulse" />
            <div className="w-[95%] h-4 rounded bg-[rgba(247,246,243,0.05)] animate-pulse" />
            <div className="w-full h-4 rounded bg-[rgba(247,246,243,0.05)] animate-pulse" />
            <div className="w-2/3 h-4 rounded bg-[rgba(247,246,243,0.05)] animate-pulse" />
          </div>

          <div className="mt-6 space-y-3">
            <div className="w-full h-4 rounded bg-[rgba(247,246,243,0.05)] animate-pulse" />
            <div className="w-[85%] h-4 rounded bg-[rgba(247,246,243,0.05)] animate-pulse" />
            <div className="w-[92%] h-4 rounded bg-[rgba(247,246,243,0.05)] animate-pulse" />
          </div>

          <div className="mt-8 mb-4">
            <div className="w-1/2 h-7 rounded bg-[rgba(247,246,243,0.07)] animate-pulse" />
          </div>

          <div className="space-y-3">
            <div className="w-full h-4 rounded bg-[rgba(247,246,243,0.05)] animate-pulse" />
            <div className="w-[88%] h-4 rounded bg-[rgba(247,246,243,0.05)] animate-pulse" />
            <div className="w-full h-4 rounded bg-[rgba(247,246,243,0.05)] animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  )
}
