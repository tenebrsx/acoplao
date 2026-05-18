# Aura | Agency System - Spec Sheet & Roadmap

## 1. Product Specification

**Product Name:** Aura | Agency System (Agency OS)
**Purpose:** A high-performance, aesthetically premium ERP and project management portal for modern digital agencies.
**Architecture:**
- **Framework:** Next.js 15+ (App Router)
- **Backend/Database:** Supabase (PostgreSQL, Row Level Security, Auth)
- **Styling:** Tailwind CSS with a strong focus on glassmorphism, dark-mode-first premium aesthetics, and fluid micro-animations.
- **Iconography:** Lucide React

### Core Modules
1. **Command Center (Dashboard):** Provides a high-level operational pulse. Recently updated to focus strictly on production metrics (Active Projects, Clients, Active Deliverables, Pending Tasks) rather than financials.
2. **Projects & Production Pulse:** Tracks multi-phase projects with health indicators (On Track, Wait Client, Wait Team, Blocked).
3. **Tasks:** Granular task management integrated directly into the command center.
4. **Calendar/Agenda:** Time-bound events and phase deadlines.
5. **Finances (Dedicated Module):** Separated from the main dashboard to keep operations focused.

---

## 2. Technical Implementation Details

- **Data Fetching:** Parallel data fetching using `Promise.all` in Server Components for instantaneous dashboard loading.
- **Authentication:** Dual-layer approach with Firebase-Admin for session verification and Supabase for structured data access.
- **UI Components:** Minimalist, no-border data strips combined with heavily styled, backdrop-blurred cards for critical data (Project Health).

---

## 3. Strategic Roadmap

### Phase 1: Operational Refinement (Current)
- [x] Pivot dashboard key metrics from Financial (Revenue/Outstanding) to Operational (Clients/Active Deliverables).
- [ ] Implement drill-down modals for the "Clients" metric to show a quick CRM list.
- [ ] Connect the "Active Deliverables" stat to a kanban-style quick view of uncompleted project phases.

### Phase 2: Bottleneck Resolution & Client Portals
- [ ] **Automated Nudges:** Introduce automated email/SMS reminders for projects stuck in "Wait Client".
- [ ] **Login-Free Client Portals:** Finalize secure, token-based links for clients to view their specific project phase progress without needing an account.

### Phase 3: Resource & Capacity Management
- [ ] **Capacity Module:** Implement team bandwidth tracking to forecast how many new clients/deliverables the agency can handle.
- [ ] **Time Tracking:** Link time spent on tasks to specific active deliverables.

### Phase 4: Advanced Financials (Restricted Access)
- [ ] Build a highly secure, role-restricted "Finances" tab.
- [ ] Re-introduce MRR (Monthly Recurring Revenue) and Outstanding Receivables exclusively for the Admin/Owner roles within the finance module, keeping the main Command Center purely production-focused.
