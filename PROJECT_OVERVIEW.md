# Aura Agency OS — Project Overview

> **Last Updated**: 2026-05-18
> **Version**: 0.1.0 (Beta)
> **Purpose**: This document serves as a comprehensive guide to the Aura Agency OS platform. Share this with any AI assistant, developer, or stakeholder to bring them up to speed on the entire project.

---

## 1. Executive Summary

**Aura Agency OS** is a comprehensive, all-in-one operating system designed specifically for creative agencies, marketing firms, and project-based businesses. It functions as an "OS within an OS" — a self-contained web application that replaces the fragmented tool stack agencies typically use (Notion, Asana, QuickBooks, Google Drive, Slack, etc.) with a single, unified platform.

The platform is built on a **Notion-inspired UI/UX philosophy** — hierarchical documents, slash commands, block-based editing, warm color palettes, and progressive disclosure — combined with agency-specific workflows like project management, client portals, deliverable review systems, financial tracking, and capacity planning.

---

## 2. Core Philosophy & Goals

### Primary Goal
Create a single platform where an agency can:
- Manage client relationships (CRM)
- Plan and execute projects with phases and deliverables
- Track team capacity and workload
- Handle finances (invoices, expenses, timesheets)
- Store and share documents (Notion-style wiki)
- Communicate with clients via dedicated portals
- Automate repetitive workflows
- Track leads and sales pipeline

### Design Philosophy
- **Notion-inspired UI**: Hierarchical docs, block editor, slash commands, drag-and-drop
- **Warm, premium feel**: Warm grays (`#F7F6F3` family) instead of cold blacks
- **Progressive disclosure**: Features hide behind `/`, hover states, and contextual menus
- **Keyboard-first**: `Cmd+K` command palette, `?` shortcuts, `/` block commands
- **Role-based access**: Different views for admins, managers, contractors, and clients

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | React framework with server components |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **UI Components** | Radix UI + shadcn/ui | Accessible, composable components |
| **Database** | Supabase (PostgreSQL) | Primary data store with RLS |
| **Auth** | Firebase Admin + Supabase | Firebase session cookies, Supabase user profiles |
| **Storage** | Supabase Storage | File uploads, receipts, deliverables |
| **Real-time** | Supabase Realtime | Live notifications, calendar events |
| **Editor** | TipTap (ProseMirror) | Block-based rich text editor |
| **Drag & Drop** | @dnd-kit | Block and tree reordering |
| **Animations** | Framer Motion | Page transitions, micro-interactions |
| **Command Palette** | cmdk | Global search & command interface |
| **Date Handling** | date-fns | Calendar and date formatting |
| **Icons** | Lucide React | Consistent icon system |

---

## 4. Architecture Overview

### 4.1 Authentication Flow
```
User Login → Firebase Authentication
    ↓
Firebase Session Cookie stored in browser
    ↓
Server-side verification (middleware + layout)
    ↓
Supabase profile lookup (role, is_active)
    ↓
Role-based routing and sidebar rendering
```

**Roles**: `admin`, `manager`, `contractor`, `client`
**VIP System**: Specific email addresses auto-grant admin access
**Access Control**: Row Level Security (RLS) on every table

### 4.2 Route Structure
```
/
├── (dashboard)/              # Authenticated routes (layout with sidebar)
│   ├── page.tsx              # Dashboard overview (Command Center)
│   ├── docs/                 # Notion-style document system
│   │   ├── page.tsx          # Docs list / redirect to first doc
│   │   └── [id]/             # Individual document editor
│   ├── projects/             # Project management
│   │   └── [id]/             # Project detail + deliverables
│   ├── businesses/           # Client CRM
│   ├── calendar/             # Agency calendar
│   ├── finances/             # Invoices, expenses, profit tracking
│   ├── tasks/                # Personal task management
│   ├── lists/                # Custom lists
│   ├── notes/                # Quick notes
│   ├── upnotes/              # Standalone notes workspace
│   ├── inbox/                # Notifications center
│   ├── automations/          # Workflow automation builder
│   ├── team/                 # Team management
│   ├── settings/             # User preferences
│   └── workspace/            # Custom workspace pages
├── portal/                   # Public client portal
│   └── [businessId]/         # Client-facing project views
├── shared-docs/              # Public document sharing
│   └── [id]/                 # Shared document viewer
├── calendars/                # Standalone calendar view
├── review/                   # Deliverable review rooms
├── login/                    # Authentication page
├── landing/                  # Marketing landing page
└── auth/callback/            # OAuth callback
```

### 4.3 Key Layout Components
Every dashboard route shares:
- **SidebarClient**: Collapsible navigation with sections, favorites, workspaces
- **CommandPaletteClient**: Global `Cmd+K` search and navigation
- **AuraCopilotClient**: AI assistant panel (`Cmd+J`)
- **ProductivityPanel**: Slide-out panel with notes, tasks, and lists

---

## 5. Feature Modules

### 5.1 Dashboard (Command Center)
The central hub showing:
- **Greeting**: Time-aware personalized greeting
- **Project Health**: Distribution of projects by status (on track, waiting, blocked)
- **Active Projects**: List with status badges and client info
- **Upcoming Phases**: Calendar view of deliverable deadlines
- **My Tasks**: Personal todo list with quick-add
- **Stats**: Client count, active deliverables, active projects

### 5.2 Documents (The Notion Clone)
A full Notion-inspired document system:

**Editor Features**:
- Block-based TipTap editor with slash commands (`/`)
- **Slash Commands**: Headings, lists, to-do, quotes, code blocks, tables, images, embeds
- **Block Drag Handles**: Six-dot handles (`⋮⋮`) on every block for reordering
- **Insert Buttons**: `+` circle appears between blocks on hover
- **Block Menu**: Right-click / click handle → Delete, Duplicate, Turn into...
- **Bubble Menu**: Formatting toolbar on text selection
- **Callout Blocks**: Color-coded info boxes (info, warning, danger, success, note)
- **Embed Blocks**: YouTube, Figma, Loom, Google Sheets, Miro, generic iframe
- **Collection Blocks**: Live tables of projects, tasks, invoices, events

**Document Features**:
- **Hierarchy**: Parent-child document tree (infinite nesting)
- **Sidebar Tree**: Draggable, collapsible page tree
- **Breadcrumbs**: Truncated navigation path with `...` for deep nesting
- **Cover Images**: Optional banner images at top of page
- **Page Icons**: Emoji or custom icons
- **Favorites**: Quick-access starred documents in sidebar
- **Sharing**: Public share links with token-based access
- **Collaborators**: View/edit permissions per document

**Navigation Views** (via sidebar):
- Home view (recent docs, favorites grid)
- Inbox (mentions, notifications)
- My Tasks (personal task list)
- Trash (deleted pages with 30-day retention)

### 5.3 Project Management
**Projects**:
- Scoped to businesses (clients)
- Status tracking: active, paused, completed
- Bottleneck status: on_track, waiting_client, waiting_team, blocked
- Campaign blueprint system (predefined deliverable templates)
- Phase-based timeline (Gantt-style)

**Deliverables**:
- Multi-phase workflow with scheduled dates
- Status tracking: in_progress, delivered, approved, rejected, published
- File uploads and version tracking
- **Review Links**: Public, token-based review rooms for clients
- **Review Responses**: Clients approve/reject with feedback
- Publishing tracking with URLs and dates

**Project Members**:
- Scoped access (members see only their projects)
- Role-based permissions via junction table

### 5.4 Client Management (CRM)
**Businesses**:
- Client profiles with contact info and notes
- Financial tracking per client
- Project association

**Leads**:
- Lead capture and tracking
- Source attribution
- Follow-up dates
- Priority levels (low, medium, high)
- Activity timeline (notes, calls, emails, status changes)
- Estimated close dates

### 5.5 Calendar
- Standalone calendar view (`/calendars`)
- Dashboard-embedded calendar widget
- Events with title, description, start/end times
- All-day and timed events
- Color coding
- Recurring events (iCal RRULE format)
- Project/business association
- Assignment to team members
- Real-time updates via Supabase Realtime

### 5.6 Financial Management
**Invoices**:
- Status tracking: draft, sent, paid, overdue
- Due dates and descriptions
- Stripe integration (invoice IDs)
- Business-scoped

**Expenses**:
- Categories: software, contractor, ad_spend, other
- Receipt upload (Supabase Storage)
- Business and project association
- Date tracking

**Timesheets**:
- Contractor hour logging
- Hourly rate tracking
- Work date and description
- Invoiced status
- Cost calculation: hours × rate

**Profit Engine**:
- PostgreSQL function `get_business_profit()`
- Calculates: Paid Invoices - Expenses - Contractor Costs
- Per-business profit tracking

### 5.7 Digital Asset Management (DAM)
- File uploads with metadata
- Auto-generated thumbnails for videos/images
- Tagging system
- Approval workflow
- Project and business association
- Supabase Storage for file hosting
- Real-time updates

### 5.8 Productivity Suite
**Tasks**:
- Personal task management (not project-specific)
- Status: todo, in_progress, done, cancelled
- Priority: low, medium, high, urgent
- Due dates and tags
- Project association optional
- Real-time sync

**Lists**:
- Custom lists (shopping, ideas, resources)
- Color coding and icons
- Pinning
- Checkable items with timestamps

**Notes**:
- Quick notes / sticky notes
- Color options (yellow, blue, green, pink, purple, orange)
- Pinning and archiving
- Tags

**UpNotes**:
- Standalone notes workspace (`/upnotes`)
- Full-screen, dedicated note-taking environment

### 5.9 Content Publishing
- Deliverable publishing tracking
- Published URL and date
- Published status in deliverable workflow

### 5.10 Automations
**Rule Engine**:
- Trigger-based: status_changed, created, etc.
- Condition matching (JSONB)
- Actions: send_email, webhook, update_record
- Execution logs with success/failure tracking

### 5.11 Notifications (Inbox)
- Unified notification center
- Types: comment, review, lead, mention
- Action URLs for direct navigation
- Read/unread status
- Real-time delivery via Supabase Realtime

### 5.12 Team & Capacity
- Team member profiles
- Capacity planning
- Workload visualization
- Role-based access

### 5.13 Client Portal (`/portal`)
**Public-facing client views**:
- Project status dashboard
- Deliverable review rooms
- Invoice viewing
- Brand identity vault
- Content calendar view
- Analytics connection modal
- Request submission forms

### 5.14 Command Palette (`Cmd+K`)
- Global search across all entities
- Navigation shortcuts
- Fuzzy matching
- Grouped results: Navigation, Clients, Projects, Workspaces, Documents
- Recent items

### 5.15 Aura Copilot (`Cmd+J`)
- AI assistant panel
- Context-aware responses (reads CRM, Gantt, deliverables)
- Simulated intelligence with hardcoded smart responses
- Agency-specific knowledge

### 5.16 Workspace System
- Custom workspace sections (e.g., "Marketing", "Ops")
- Nested pages within sections
- Page types: doc, kanban, table
- Generic content storage (JSONB)
- Sidebar integration

---

## 6. Database Schema

### 6.1 Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **profiles** | User accounts and roles | Roles: admin, manager, contractor, client. RLS enforced. |
| **businesses** | Client companies | CRM entries with contact info |
| **projects** | Agency projects | Scoped to businesses, bottleneck tracking |
| **project_members** | Access control | Junction table for scoped project access |
| **project_phases** | Project timeline | Scheduled dates, completion status |
| **deliverables** | Project outputs | Multi-phase workflow, file URLs, publishing |
| **deliverable_phases** | Phase tracking | Individual phase scheduling |
| **review_links** | Client review rooms | Token-based public links |
| **review_responses** | Client feedback | Approve/reject with notes |
| **documents** | Wiki/docs | Hierarchical (parent_id), sharing, collaborators |
| **document_collaborators** | Doc permissions | View/edit/admin per document |
| **todos** | Global tasks | Assigned to users, completion tracking |
| **calendar_events** | Agency calendar | Recurring events, color coding, assignments |
| **invoices** | Billing | Status tracking, Stripe integration |
| **expenses** | Cost tracking | Categories, receipts, business/project scoped |
| **contractor_timesheets** | Hour logging | Hours × rate = cost |
| **digital_assets** | File storage | Thumbnails, tags, approval |
| **leads** | Sales pipeline | Source, priority, follow-up, close dates |
| **lead_activities** | Lead timeline | Notes, calls, emails, status changes |
| **tasks** | Personal productivity | Status, priority, due dates, tags |
| **lists** | Custom lists | Color, icon, pinning |
| **list_items** | List entries | Checkable items |
| **notes** | Quick notes | Color, pinning, archiving |
| **notifications** | Inbox | Real-time, typed, actionable |
| **automations** | Workflow rules | Trigger → condition → action |
| **automation_logs** | Rule execution | Success/failure tracking |
| **campaign_blueprints** | Project templates | Predefined deliverable structures |
| **blueprint_deliverables** | Template items | Phases per deliverable |
| **workspace_sections** | Custom sections | Sidebar organization |
| **workspace_pages** | Custom pages | Doc/kanban/table types |
| **workspace_page_content** | Page data | Generic JSONB storage |
| **user_favorites** | Starred items | Cross-entity favorites |
| **settings** | User preferences | Theme, defaults |

### 6.2 Database Features
- **49 migrations** — incremental schema evolution
- **RLS on every table** — row-level security policies
- **Realtime** — Supabase realtime for live updates
- **Triggers** — Auto-updated timestamps, status cascades
- **Functions** — Profit calculation, business logic
- **Indexes** — Optimized queries on foreign keys and dates
- **ENUMs** — Type-safe status and category fields

---

## 7. UI/UX Design System

### 7.1 Color Palette (Dark Mode)
- **Background**: `#1a1a18` (warm near-black)
- **Surface**: `#232320` (warm dark gray)
- **Hover**: `rgba(247, 246, 243, 0.04)` (warm white at low opacity)
- **Active**: `rgba(247, 246, 243, 0.08)`
- **Text Primary**: `#fafafa`
- **Text Secondary**: `#a1a1aa`
- **Text Tertiary**: `#71717a`
- **Border**: `rgba(55, 53, 47, 0.09)` (warm gray)
- **Accent**: `#22c55e` (green for success/primary actions)

### 7.2 Typography
- **Font**: System stack (`-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica`)
- **Page Title**: 40px, bold, tracking-tight
- **Headings**: H1 2rem, H2 1.5rem, H3 1.25rem
- **Body**: 16px, line-height 1.75
- **Small**: 14px option available

### 7.3 Spacing & Layout
- **Content max-width**: 720-900px (comfortable reading)
- **Horizontal padding**: 96px on content (centered column)
- **Base unit**: 4px (8px primary increment)
- **Block gap**: Near-zero between stacked blocks
- **Sidebar width**: 240px (expanded), 64px (collapsed)

### 7.4 Micro-interactions
- **Transition duration**: 150ms (snappy, natural)
- **Hover effects**: Pure color shifts (NO translate/scale)
- **Drag handles**: Opacity 0→1 on hover
- **Skeleton loaders**: Pulse animation for loading states
- **Toast notifications**: Auto-dismiss, promise states

### 7.5 Responsive Breakpoints
- **Mobile** (<480px): Single column, bottom nav
- **Tablet** (768-1023px): 2-column grids
- **Desktop** (1024px+): Full sidebar, multi-column

---

## 8. Key Components

### 8.1 Layout Components
- **SidebarClient**: Main navigation with sections, favorites, workspaces, collapsible
- **DocumentTree**: Hierarchical page tree with drag-and-drop, expand/collapse
- **CommandPaletteClient**: Global search (`Cmd+K`)
- **AuraCopilotClient**: AI assistant panel (`Cmd+J`)
- **ProductivityPanel**: Slide-out with notes, tasks, lists
- **MobileBottomNav**: Fixed bottom bar for mobile navigation

### 8.2 Editor Components
- **TiptapEditor**: Block-based rich text editor
- **SlashCommand**: `/` command palette for block insertion
- **BlockMenu**: ProseMirror plugin for drag handles and context menus
- **BlockAddButton**: `+` insert buttons between blocks
- **BlockContextMenu**: Right-click menu (Delete, Duplicate, Turn into)
- **KeyboardShortcutsModal**: `?` help overlay

### 8.3 Block Types
- **Callout**: Color-coded info boxes
- **EmbedBlock**: YouTube, Figma, Loom, Google Sheets, Miro, generic iframe
- **CollectionBlock**: Live tables of projects, tasks, invoices, events

### 8.4 UI Components
Built on Radix UI + shadcn/ui:
- Button, Input, Dialog, Tabs, Badge, Card
- Dropdown Menu, Tooltip, Toast, Skeleton
- Table, Select, Calendar, Command

---

## 9. Authentication & Authorization

### 9.1 Auth Flow
1. **Firebase Authentication** — Handles login/signup
2. **Session Cookie** — Firebase ID token stored server-side
3. **Supabase Profile** — Role and active status lookup
4. **VIP Override** — Specific emails always get admin
5. **RLS Enforcement** — Every database query filtered by role

### 9.2 Role Permissions

| Feature | Admin | Manager | Contractor | Client |
|---------|-------|---------|------------|--------|
| **Dashboard** | Full | Full | Limited | N/A |
| **Projects** | All | All | Assigned | Own |
| **Finances** | All | View | Own timesheet | Invoices |
| **Documents** | All | All | All | Shared |
| **Calendar** | All | All | All | Own events |
| **Portal** | N/A | N/A | N/A | Public view |
| **Settings** | All | Own | Own | N/A |
| **Team Mgmt** | All | View | N/A | N/A |
| **Automations** | All | N/A | N/A | N/A |

### 9.3 Client Portal
- Public routes (`/portal/[businessId]`)
- Token-based deliverable review (`/review/[token]`)
- No authentication required for public review links
- Scoped to specific business projects only

---

## 10. Data Flow Patterns

### 10.1 Server Components (Next.js App Router)
```
page.tsx (Server Component)
    ↓
Fetches data from Supabase (server-side)
    ↓
Passes data as props to Client Component
    ↓
*Client.tsx handles interactivity
```

### 10.2 Real-time Updates
```
User action → Supabase update
    ↓
Realtime broadcast
    ↓
Other clients receive update
    ↓
UI re-renders with new data
```

### 10.3 Document Editing
```
User types → TipTap onUpdate
    ↓
Debounce 500ms
    ↓
Save JSON content to Supabase
    ↓
Update word count, last_edited_by
    ↓
Show "Saved" indicator
```

---

## 11. External Integrations

| Service | Purpose |
|---------|---------|
| **Firebase** | Authentication, session management |
| **Supabase** | Database, storage, realtime, auth |
| **Stripe** | Invoice payment tracking (IDs stored) |
| **Unsplash** | Cover image URLs (prompted) |

---

## 12. File Structure

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Authenticated routes
│   │   ├── portal/             # Public client portal
│   │   ├── shared-docs/        # Public document sharing
│   │   ├── calendars/          # Standalone calendar
│   │   ├── upnotes/            # Standalone notes
│   │   ├── review/             # Review rooms
│   │   ├── login/              # Auth page
│   │   ├── landing/            # Marketing page
│   │   └── layout.tsx          # Root layout
│   ├── components/             # Reusable components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── tiptap/             # Editor extensions
│   │   └── *.tsx               # Layout/feature components
│   ├── lib/                    # Utilities
│   │   ├── types/              # TypeScript types
│   │   └── firebase-admin.ts   # Firebase server config
│   └── utils/                  # Helper functions
│       └── supabase/           # Supabase clients
├── supabase/
│   └── migrations/               # 49 SQL migration files
├── public/                     # Static assets
└── package.json                # Dependencies
```

---

## 13. Development Roadmap

### Completed
- Core dashboard with project overview
- Project management with phases and deliverables
- Client CRM with leads and activities
- Financial tracking (invoices, expenses, timesheets)
- Calendar with events
- Document/wiki system with TipTap editor
- Notion-style UI/UX (slash commands, block handles, warm colors)
- Command palette (`Cmd+K`)
- AI Copilot panel (`Cmd+J`)
- Productivity panel (notes, tasks, lists)
- Client portal with review rooms
- Mobile bottom navigation
- Skeleton loading states
- Keyboard shortcuts help
- Block context menus
- Favorites system

### In Progress
- Block drag-and-drop reordering
- Full mobile responsiveness
- Collection block filters/sorts
- Template system
- Version history
- Comments on documents

### Planned
- Real-time collaboration (cursors, presence)
- AI content generation (`/ai` commands)
- Advanced automations (webhooks, email)
- Analytics dashboard
- Integrations (Slack, Google Calendar, etc.)
- White-label client portals
- API for third-party integrations

---

## 14. Key Design Decisions

1. **TipTap over Notion API**: Full control over editing experience
2. **Firebase + Supabase hybrid**: Firebase for auth, Supabase for data
3. **Server Components default**: Fetch data server-side, hydrate interactivity client-side
4. **Warm color palette**: Differentiates from cold corporate tools
5. **Standalone docs route**: `/docs` escapes dashboard layout for immersive editing
6. **Token-based sharing**: Simple, secure public document/project access
7. **Role-based RLS**: Database-level security, not just UI hiding
8. **ProseMirror decorations**: Block handles and add-buttons as editor plugins

---

## 15. Getting Started

### Prerequisites
- Node.js 18+
- Firebase project (for auth)
- Supabase project (for database)

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Running Locally
```bash
npm install
npm run dev
```

### Database Setup
```bash
# Apply all migrations
supabase db push
```

---

## 16. Glossary

| Term | Definition |
|------|------------|
| **Aura** | The AI assistant / brand name of the platform |
| **Block** | A unit of content in the editor (paragraph, heading, image, etc.) |
| **Blueprint** | Predefined project template with deliverables and phases |
| **Deliverable** | A project output (video, image, document) with review workflow |
| **Phase** | A stage in a deliverable timeline |
| **Review Room** | Public page where clients approve/reject deliverables |
| **Workspace** | Custom sections in sidebar for organizing pages |
| **Collection** | Live, filterable table of database records inside a document |
| **RLS** | Row Level Security — database access control |
| **Copilot** | AI assistant panel for agency intelligence |

---

*This document was generated to provide comprehensive context for AI assistants, developers, and stakeholders. For the latest updates, refer to the codebase and DOCS_2.0_ROADMAP.md.*
