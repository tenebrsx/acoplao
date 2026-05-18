# UpNotes for Aura — Requirements Roadmap

## Philosophy
Build a dedicated `/upnotes` route as a full-featured knowledge management app — similar to UpNotes, Obsidian, or Notion — while keeping the existing `/notes` route as a lightweight, dashboard-embedded scratchpad. The full app should feel like a standalone product: fast, keyboard-driven, and purpose-built for long-form thinking.

---

## Phase 1 — Core Note-Taking (MVP)
*Goal: A usable, fast note app that replaces Apple Notes / Google Keep for serious work.*

### Data Model

```sql
-- notebooks: hierarchical folders
upnote_notebooks (
  id uuid primary key,
  user_id uuid references profiles(id),
  parent_id uuid references upnote_notebooks(id), -- null = root
  name text not null,
  color text, -- hex color for sidebar icon
  icon text, -- lucide icon name
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

-- notes: the actual content
upnote_notes (
  id uuid primary key,
  user_id uuid references profiles(id),
  notebook_id uuid references upnote_notebooks(id),
  title text not null default 'Untitled Note',
  content jsonb, -- TipTap JSON document
  plain_text text, -- denormalized for search
  word_count int default 0,
  is_pinned boolean default false,
  is_archived boolean default false,
  is_daily_note boolean default false,
  daily_note_date date, -- only for daily notes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

-- tags: global tag system
upnote_tags (
  id uuid primary key,
  user_id uuid references profiles(id),
  name text not null,
  color text default '#22c55e',
  parent_id uuid references upnote_tags(id), -- nested tags: work/project/client-a
  created_at timestamptz default now()
)

-- note_tags: many-to-many
upnote_note_tags (
  note_id uuid references upnote_notes(id) on delete cascade,
  tag_id uuid references upnote_tags(id) on delete cascade,
  primary key (note_id, tag_id)
)

-- backlinks: bi-directional links (populated in Phase 2)
upnote_backlinks (
  source_note_id uuid references upnote_notes(id) on delete cascade,
  target_note_id uuid references upnote_notes(id) on delete cascade,
  context_text text, -- surrounding text for preview
  created_at timestamptz default now(),
  primary key (source_note_id, target_note_id)
)
```

### UI Structure — `/upnotes`

**Layout** (no dashboard sidebar — same standalone pattern as `/calendars`)
- Left sidebar (280px, collapsible, resizable)
  - Search bar (full-text, instant, with ⌘K shortcut)
  - "New Note" button (⌘N)
  - "Daily Note" button (⌘D)
  - Notebook tree (expandable/collapsible, drag-to-reorder, drag notes between notebooks)
  - Tags section (nested tree, color-coded dots)
  - Favorites / Pinned section
  - Recent notes (last 5)
  - Trash / Archive
- Main editor area (flex-1)
  - Breadcrumb: Notebook > Note title
  - Note title input (large, H1-like, auto-focus on new note)
  - TipTap editor (full-width, minimal chrome)
  - Note metadata bar (bottom, subtle): word count, created, last edited, tags inline
  - Floating action button for mobile: new note
- Right panel (optional, 300px, toggle with ⌘/)
  - Backlinks (Phase 2)
  - Outline / Table of contents (from headings)
  - Tags editor
  - Note info

### Features
1. **Notebook CRUD** — Create, rename, delete (with confirmation), drag to reorder, nest up to 5 levels deep.
2. **Note CRUD** — Auto-save on debounce (500ms). Soft delete → Trash (30-day retention). Restore from trash.
3. **Rich Text Editor** — Use existing `TiptapEditor`. Full toolbar. Slash commands (`/heading`, `/list`, `/table`, etc.).
4. **Tags** — Create tags inline by typing `#tag-name` or `#parent/child`. Tag autocomplete. Color-coded in sidebar.
5. **Full-Text Search** — Debounced search across titles + `plain_text`. Results ranked by recency. Fuzzy match.
6. **Pinning / Favorites** — Pin up to 10 notes to top of sidebar.
7. **Keyboard Shortcuts**
   - `⌘K` — Search / command palette
   - `⌘N` — New note
   - `⌘D` — Open today's daily note
   - `⌘P` — Toggle pinned/favorite
   - `⌘/` — Toggle right panel
   - `⌘Shift+F` — Focus mode
   - `Esc` — Exit focus mode / close panels
8. **Mobile Responsive** — Sidebar becomes a slide-out drawer. Editor fills screen.

---

## Phase 2 — Connected Thinking
*Goal: Notes that talk to each other. The magic of networked note-taking.*

### Bi-Directional Linking
- Type `[[` to trigger note-link autocomplete. Shows note titles filtered by typed text.
- Rendered as styled inline links. Click navigates to that note.
- Backlinks panel (right sidebar): shows all notes that link to current note, with context preview.
- Broken links (target deleted) rendered in red/dashed.
- On note save: parse content for `[[Note Title]]` patterns, update `upnote_backlinks` table.

### Daily Notes
- Auto-generated note for each calendar day: `YYYY-MM-DD` title, `is_daily_note = true`.
- `⌘D` jumps to today's note. If doesn't exist, create it.
- Daily notes appear in a special "Daily Notes" notebook (auto-created, hidden from regular tree).
- Quick-add timestamp block: type `/now` inserts current time.

### Focus Mode
- `⌘Shift+F` hides everything except the editor and title. Pure writing surface.
- Soft fade-in of UI on mouse move near edges.
- Typewriter mode option (keeps cursor vertically centered).

### Improved Search
- Search within a specific notebook or tag.
- Search operators: `tag:client-a`, `notebook:projects`, `before:2026-01-01`.
- Recent searches.

---

## Phase 3 — Power Features
*Goal: Make it a serious knowledge base, not just a notepad.*

### Task Aggregation
- Scan all notes for unchecked `TaskItem` nodes.
- Present in a "Tasks" view (tab next to Notebooks/Tags): all open checkboxes grouped by note, with quick-complete.
- Filter by tag, notebook, or due date (if task text contains `@due 2026-05-20`).

### Note Templates
- `upnote_templates` table: name, content (TipTap JSON), default notebook.
- New note dropdown: "New from template...".
- Default templates: Meeting Notes, Project Brief, Daily Standup, Research Log.

### Attachments
- Use existing Supabase Storage. New bucket: `upnote-attachments`.
- Drag-and-drop images/files into editor. Auto-upload, insert as image node or download link.
- Attachment gallery per note (bottom panel).

### Note Graph View
- D3.js or ForceGraph visual of all notes as nodes, backlinks as edges.
- Filter by notebook/tag. Zoom/pan. Click node to navigate.
- Toggle between 2D graph and tree view.

### Import / Export
- **Import**: Markdown files (.md) → convert to TipTap JSON. Folder structure → notebooks. Frontmatter → tags.
- **Export**: Single note or entire notebook → Markdown ZIP. PDF export (via print stylesheet).

---

## Phase 4 — Collaboration & Polish
*Goal: Share knowledge and never lose work.*

### Sharing
- Public share link per note (read-only). Generates JWT token with expiration.
- Shared note rendered with clean, minimal layout (no sidebar, no edit).
- Revoke sharing anytime.

### Version History
- `upnote_note_versions` table: note_id, content, plain_text, created_at.
- Save snapshot on explicit save (⌘S) or every 5 minutes.
- "History" modal: timeline of versions, diff view (side-by-side or inline), restore to version.

### Real-Time Collaboration (Future)
- Yjs + TipTap collaboration extension.
- Show other users' cursors.
- Comments/annotations on text ranges.

---

## UI/UX Specifications

### Visual Design
- **Standalone layout** (same pattern as `/calendars`): no dashboard sidebar.
- **Theme**: Respect existing Aura dark theme (`bg-background`, `text-foreground`).
- **Accent**: Forest green (`#22c55e`) for primary actions, active states, links.
- **Typography**: Same Inter font. Note title: 28px/600. Editor body: 16px/1.6 line-height.
- **Spacing**: Generous whitespace. Editor max-width: 720px centered (focus mode: 100%).

### Animations
- Sidebar slide: `duration: 250ms`, `ease: [0.2, 0.8, 0.2, 1]`.
- Note list fade: stagger 30ms per item.
- Panel transitions: `AnimatePresence` with `width` or `x` animation.
- Auto-save indicator: subtle dot pulse → "Saved" text fade.

### Empty States
- No notebooks: "Create your first notebook" with CTA.
- Empty notebook: "No notes yet. Press ⌘N to start writing."
- Empty search: "No notes match 'query'. Try a different term."
- Trash empty: "Trash is empty. Deleted notes appear here for 30 days."

---

## Technical Architecture

### State Management
- **Server**: Supabase for persistence. Real-time subscriptions for multi-tab sync.
- **Client**: React `useState` + `useCallback` for local UI state. No global state library needed.
- **Optimistic updates**: Update UI immediately, rollback on error.

### Performance
- **Virtualized note list**: `react-window` or native CSS container queries for 1000+ notes.
- **Lazy loading**: Editor content loaded on demand. Note list only fetches title + metadata.
- **Debounced search**: 150ms debounce on search input.
- **Plain text index**: Maintain `plain_text` column for fast search without parsing JSON.

### Security
- **RLS**: All tables have `user_id` checks. Users can only CRUD their own data.
- **Sharing**: Shared notes bypass RLS via a `shared_token` function.

---

## Migration Strategy

### Database
- Migration `0047_upnote_schema.sql`: Creates all tables, indexes, RLS policies, triggers (update `updated_at`).
- Index on `upnote_notes(plain_text)` using `pg_trgm` for fuzzy search.
- Index on `upnote_notes(user_id, is_archived, updated_at)` for fast list loading.

### Routing
- `/upnotes` — Main app (standalone layout).
- `/upnotes/note/[id]` — Deep link to specific note.
- `/upnotes/note/[id]/share/[token]` — Public read-only view (Phase 4).
- `/notes` — Keep existing simplified version (or redirect to `/upnotes` with `?compact=1`).

---

## Success Criteria
- [ ] Create a note in < 500ms (⌘N → typing).
- [ ] Search returns results in < 200ms for 1000 notes.
- [ ] Auto-save feels invisible (no UI blocking).
- [ ] Works offline for current note (localStorage draft backup).
- [ ] 60fps on note list scroll with 500+ items.

---

## Implementation Order (Recommended)

1. **Schema + API** — Write migration, build Supabase queries.
2. **Layout Shell** — Standalone layout, sidebar structure, routing.
3. **Notebook Tree** — CRUD, drag-and-drop, nesting.
4. **Note List + Editor** — Create, edit, auto-save, delete.
5. **Search** — Full-text search with filters.
6. **Tags** — Inline tagging, sidebar tag tree.
7. **Daily Notes** — Auto-create, ⌘D shortcut.
8. **Backlinks** — `[[` autocomplete, backlinks panel.
9. **Focus Mode** — Distraction-free writing.
10. **Tasks** — Aggregate checkboxes.
11. **Templates** — Template system.
12. **Graph View** — D3 visualization.
13. **Sharing + Versions** — Collaboration features.

---

## Open Questions for You

1. **Should `/notes` stay as a simplified view, or redirect to `/upnotes`?**
2. **Do you want daily notes auto-created, or only on demand?**
3. **Should we support markdown file import now, or defer to Phase 3?**
4. **Graph view: cool but complex. Priority?**
5. **Real-time collaboration: needed now, or purely single-user?**
