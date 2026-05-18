# Aura Docs 2.0 — Notion/ClickUp-Style Document System Roadmap

## Philosophy
Transform the existing `/docs` route from a simple document list into a full-featured knowledge base and wiki system. Think **Notion pages** meets **ClickUp Docs** — hierarchical, block-based, slash-command driven, with rich embeds and database-like collections.

The existing document editor (TipTap) becomes the foundation, but we add:
- **Block-based editing** with `/` slash commands
- **Hierarchical page trees** (docs inside docs, like Notion)
- **Database/Collection blocks** (tables with filters, sorts, views)
- **Embeds** (projects, tasks, calendar events, videos, Figma)
- **Templates** and **reusable components**

---

## Phase 1 — Block-Based Editor with Slash Commands
*Goal: The core editing experience feels like Notion.*

### Current State
- TipTap editor with standard rich-text toolbar
- Documents are flat (no hierarchy)
- Basic JSON content storage

### New Features

#### 1. Slash Command Menu (`/`)
Typing `/` anywhere in the editor opens a command palette:

```
/heading 1     /h1
/heading 2     /h2
/heading 3     /h3
/bullet list   /ul
/numbered list /ol
/to-do list    /task
/quote         /blockquote
/code          /codeblock
/divider       /hr
/table         /table
/image         /img
/embed         /embed
/link          /link
/callout       /callout
/page          /page (sub-page)
/database      /db (collection table)
```

**Implementation:**
- Use `@tiptap/suggestion` extension for slash commands
- Custom React renderer for the command menu (filtered list with icons)
- Keyboard navigation (arrow keys + Enter)

#### 2. Block Types
Extend TipTap with custom node extensions:

| Block | Description |
|---|---|
| **Paragraph** | Default text block |
| **Headings** | H1, H2, H3 with anchor links |
| **Bullet List** | Unordered list |
| **Numbered List** | Ordered list |
| **To-Do List** | Checkboxes (already have via TaskList) |
| **Quote** | Styled blockquote |
| **Code Block** | Syntax-highlighted code (use `lowlight`) |
| **Divider** | Horizontal rule |
| **Table** | Already supported |
| **Image** | Upload or URL (already supported) |
| **Callout** | Color-coded info boxes (💡 Tip, ⚠️ Warning, etc.) |
| **Embed** | YouTube, Figma, Loom, Google Sheets, etc. |
| **Sub-Page** | Link to another document (inline or card) |
| **Collection** | Live table of projects, tasks, etc. |

#### 3. Block Actions (Hover Menu)
Hovering any block shows a handle (⋮⋮) with actions:
- Drag to reorder
- Delete
- Duplicate
- Turn into... (convert block type)
- Color / background
- Move to another page

**Implementation:**
- TipTap `NodeView` for each custom block
- Framer Motion for drag animations
- `@dnd-kit/sortable` for block reordering

#### 4. Database Schema Updates

```sql
-- Add parent_id for hierarchical docs
ALTER TABLE public.documents ADD COLUMN parent_id UUID REFERENCES public.documents(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD COLUMN icon TEXT DEFAULT 'page';
ALTER TABLE public.documents ADD COLUMN cover_image TEXT;
ALTER TABLE public.documents ADD COLUMN is_template BOOLEAN DEFAULT false;
ALTER TABLE public.documents ADD COLUMN template_category TEXT;

-- Document blocks (for complex block storage if needed)
CREATE TABLE IF NOT EXISTS public.document_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for tree traversal
CREATE INDEX idx_documents_parent ON public.documents(parent_id);
CREATE INDEX idx_document_blocks_doc ON public.document_blocks(document_id, sort_order);
```

---

## Phase 2 — Hierarchical Page Tree & Navigation
*Goal: Documents can be nested infinitely, like Notion.*

### Sidebar Navigation (Left Panel)
Replace the simple docs list with a tree:

```
📁 Workspace
├── 📄 Getting Started
│   ├── 📄 Quick Start Guide
│   └── 📄 FAQ
├── 📄 Projects
│   ├── 📄 Active Projects (Collection)
│   ├── 📄 Client A Brief
│   └── 📄 Client B Brief
├── 📄 Processes
│   ├── 📄 Onboarding
│   └── 📄 Design System
└── 📄 Archive
```

**Features:**
- Drag-and-drop to reorder or nest pages
- Expand/collapse folders
- Breadcrumb trail in header
- "Add sub-page" on any page
- Quick search within sidebar (filter tree)

### Breadcrumbs
Every document shows its path:
`Workspace > Projects > Active Projects > Q3 Campaign`

Click any ancestor to jump up the tree.

### Empty States
- Empty workspace: "Create your first page" with template picker
- Empty folder: "This folder is empty. Add a page."

---

## Phase 3 — Collection / Database Blocks
*Goal: Embed live, filterable tables of Aura data inside documents.*

### Collection Block Types

#### 1. Project Collection
```
/database projects
```
Shows a live table of projects with columns:
- Name | Client | Status | Due Date | Budget
- Filterable by status, client, date range
- Sortable by any column
- Click row → navigate to project

#### 2. Task Collection
```
/database tasks
```
Shows tasks table:
- Task | Project | Assignee | Due | Priority
- Inline check-off
- Filter by assignee, project, priority

#### 3. Custom Collections
Users define their own table schema:
```
/database custom
Columns: Name, Status, URL, Notes
```
Stored in `document_collections` table.

### Implementation
```sql
CREATE TABLE public.document_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'projects', 'tasks', 'custom', 'events'
  config JSONB DEFAULT '{}', -- columns, filters, sorts
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI:**
- Collection block renders as a shadcn `<Table>` with sorting/filtering
- "Add filter" dropdown (field, operator, value)
- "Add sort" dropdown
- "View" switcher: Table | Board | List | Calendar

---

## Phase 4 — Embeds & Rich Media
*Goal: Documents become dashboards, not just text.*

### Embed Types

| Type | Slash Command | Preview |
|---|---|---|
| **YouTube** | `/embed youtube` | Inline video player |
| **Figma** | `/embed figma` | Live Figma iframe |
| **Loom** | `/embed loom` | Video player |
| **Google Sheets** | `/embed sheets` | Embedded spreadsheet |
| **Miro** | `/embed miro` | Whiteboard iframe |
| **Aura Project** | `/embed project` | Project status card |
| **Aura Task** | `/embed task` | Task checkbox inline |
| **Aura Calendar** | `/embed calendar` | Mini month view |
| **CodePen** | `/embed codepen` | Live code demo |
| **PDF** | `/embed pdf` | PDF viewer |

### Implementation
- Generic `EmbedBlock` TipTap node
- `embedType` and `embedUrl` attributes
- React component switcher based on type
- iframe sandboxing for security

---

## Phase 5 — Templates & Reusables
*Goal: Never start from scratch.*

### Document Templates
Pre-built page structures:
- **Project Brief** — Overview, Goals, Timeline, Budget sections
- **Meeting Notes** — Attendees, Agenda, Notes, Action Items
- **SOP** — Purpose, Steps, Resources, Owner
- **Campaign Plan** — Concept, Assets, Channels, Metrics
- **Empty Database** — Collection block with custom columns

### Template System
```sql
-- Templates are just documents with is_template = true
-- Creating from template = deep copy of document + blocks
```

**UI:**
- "New page" → "Blank" or "From Template"
- Template gallery with preview
- User-created templates (star any page as template)

### Reusable Blocks / Snippets
Save frequently used content blocks:
- Brand guidelines paragraph
- Legal disclaimer
- Signature block
- Pricing table

Stored in `document_snippets` table.
Insert anywhere via `/snippet` command.

---

## Phase 6 — Collaboration & Comments
*Goal: Work together on documents.*

### Real-Time Presence
- Show other users' cursors (different colors)
- Avatar stack in top-right
- "Last edited by" attribution per block

### Comments
- Select text → "Add comment"
- Comment threads in right sidebar
- Resolve / re-open comments
- @mentions in comments

### Version History
- Snapshots every 5 minutes + manual save
- Diff view (highlight changes)
- Restore previous version
- Named versions ("Before client review")

---

## Phase 7 — Search, Discovery & AI
*Goal: Find anything, instantly.*

### Global Search
- `⌘K` from any doc page searches across ALL docs
- Full-text in titles, content, tags
- Filter by author, date, folder
- Recent searches

### Linked References
- When a doc is mentioned elsewhere, show "Linked References" at bottom
- Similar to Notion backlinks

### AI Features (Future)
- `/ai summarize` — Summarize page
- `/ai expand` — Expand bullet points into paragraphs
- `/ai rewrite` — Tone adjustment (professional, casual, persuasive)
- `/ai generate` — Generate content from prompt

---

## UI/UX Design

### Layout (Standalone, like `/calendars` and `/upnotes`)
```
┌─────────────────────────────────────────────────────┐
│  ← Docs    Breadcrumb: Workspace > Projects         │
├──────────┬──────────────────────────┬───────────────┤
│          │                          │               │
│ Sidebar  │    Editor / Content      │  Comments /   │
│ (Tree)   │                          │  Page Info    │
│          │                          │               │
│ 280px    │      flex-1              │    300px      │
│          │                          │  (toggle)     │
│          │                          │               │
└──────────┴──────────────────────────┴───────────────┘
```

### Visual Design
- **Dark theme** (consistent with Aura)
- **Page title**: 40px bold, centered or left-aligned
- **Cover images**: Optional banner at top (gradient or upload)
- **Page icon**: Emoji or Lucide icon next to title
- **Block spacing**: 4px between blocks, generous padding
- **Callouts**: Colored left border (blue, green, yellow, red)
- **Collections**: Card-style tables with hover states

### Animations
- Block appearance: subtle fade-in
- Drag-and-drop: smooth ghost + drop indicator
- Slash menu: scale-in from cursor position
- Page transitions: slide direction based on hierarchy

---

## Technical Architecture

### Data Flow
```
User types / → SlashCommand extension triggers
User selects "callout" → Insert CalloutBlock node
User edits callout content → TipTap onUpdate debounce 500ms
Debounced save → Update documents.content JSONB
Real-time sync → Supabase realtime broadcasts to other clients
```

### Block Rendering Strategy
TipTip stores everything as JSON. Custom blocks use:
1. **NodeView React components** for complex blocks (embeds, collections)
2. **Standard marks/nodes** for simple blocks (paragraphs, headings)
3. **Attributes** for block metadata (color, alignment, embed URL)

### Performance
- **Virtual scrolling** for long documents (100+ blocks)
- **Lazy loading** for embeds (intersection observer)
- **Optimistic updates** for drag-and-drop
- **Image compression** on upload

---

## Implementation Order

### Sprint 1: Slash Commands + Callouts
1. Install `@tiptap/suggestion`
2. Build `SlashCommand` extension
3. Add Callout block (💡 ⚠️ 📝 etc.)
4. Add Divider block
5. Update `/docs/[id]` editor

### Sprint 2: Hierarchy + Sidebar
1. Add `parent_id` to documents
2. Build tree sidebar component
3. Breadcrumb navigation
4. Drag-and-drop page reordering
5. "Add sub-page" functionality

### Sprint 3: Collections
1. `document_collections` table
2. Project collection block
3. Task collection block
4. Filter/sort UI
5. View switchers (Table/Board/List)

### Sprint 4: Embeds
1. Generic EmbedBlock
2. YouTube, Figma, Loom embeds
3. Aura internal embeds (project, task cards)
4. PDF viewer

### Sprint 5: Templates
1. Template gallery
2. Create from template
3. User-defined templates
4. Snippet system

### Sprint 6: Polish
1. Comments
2. Version history
3. Global search
4. AI features

---

## Open Questions

1. **Should `/docs` remain dashboard-embedded or go standalone?**
   - Standalone = more space, feels like a real product
   - Embedded = easier context switching
   - **Recommendation**: Standalone, like `/calendars` and `/upnotes`

2. **Block storage: TipTap JSON only, or split into `document_blocks` table?**
   - JSON only = simpler, one save operation
   - Blocks table = easier querying, better for collections
   - **Recommendation**: Start with JSON, migrate to blocks table if performance demands

3. **Collections: read-only embeds or editable inline?**
   - Read-only = safer, simpler
   - Editable = powerful but complex (need to handle permissions)
   - **Recommendation**: Read-only first, editable in Phase 3.5

4. **Cover images and icons: scope for Phase 1 or defer?**
   - Easy wins for polish
   - **Recommendation**: Add in Phase 2 with hierarchy

5. **Comments: inline (Google Docs style) or sidebar (Notion style)?**
   - Sidebar = cleaner, more space
   - **Recommendation**: Sidebar threads

---

## Success Metrics
- [ ] Create a new page from template in < 3 clicks
- [ ] Slash menu appears in < 100ms
- [ ] Block drag-and-drop at 60fps
- [ ] Document loads in < 500ms (up to 100 blocks)
- [ ] Collection block renders live data in < 300ms
