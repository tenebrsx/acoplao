# Plan: Notion-Like Docs UI Redesign

## Objective
Redesign the `/docs/[id]` document editor page to match Notion's clean, minimal, canvas-like aesthetic while preserving all existing functionality.

---

## Current State Analysis

### File: `src/app/(dashboard)/docs/[id]/DocEditorClient.tsx`
- Heavy borders around editor (`border rounded-2xl`)
- Title is large but page feels cramped
- Cover image has border radius, doesn't span full width
- Top bar is cluttered with many buttons
- Sidebar toggle uses text arrows (`←`/`→`)
- Emoji icon is small (text-3xl = 30px)
- Breadcrumbs take up space above content
- Content max-width is `max-w-4xl` (896px) with `px-8` padding

### File: `src/components/editor.css`
- Editor has `border: 1px solid var(--surface-border)`
- Toolbar is sticky with background
- Content padding is `32px 48px`
- Headings are large but spacing could be more generous
- No Notion-style block hover handles

---

## Target Design (Notion-Inspired)

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Full-width cover image — no border radius]            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │  [Breadcrumb — small, subtle, top-left]          │    │
│  │                                                  │    │
│  │  😀  [Large emoji — 72px, overlaps cover]       │    │
│  │                                                  │    │
│  │  Page Title                                      │    │
│  │  [40px bold, no border, placeholder "Untitled"] │    │
│  │                                                  │    │
│  │  [Editor content — no borders, flows naturally]  │    │
│  │  • Paragraphs with generous line height          │    │
│  │  • Headings with more whitespace above           │    │
│  │  • Slash commands inline                         │    │
│  │  • Block hover handle on left (⋮⋮)               │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│         ↑ max-w-[900px] mx-auto                         │
└─────────────────────────────────────────────────────────┘
```

### Key Changes

1. **Cover Image**
   - Full viewport width, no border radius
   - Height: `30vh` (min 200px, max 400px)
   - "Change cover" button appears on hover at bottom-right
   - No margin-bottom — content sits right below

2. **Page Icon**
   - Size: `72px` (`text-[4.5rem]`)
   - Positioned directly below cover (no overlap yet, or slight negative margin if cover exists)
   - Hover: subtle scale animation
   - Click: opens emoji picker

3. **Title**
   - Font: `40px` bold, tracking-tight
   - No border, no background
   - Placeholder: "Untitled" (lighter color)
   - Focus: no outline ring, just caret

4. **Editor**
   - Remove ALL borders from editor wrapper
   - Remove `glass-panel` / `bg-card` styling
   - Editor should feel like writing on a blank canvas
   - Content max-width: `900px` centered
   - Generous horizontal padding: `80px` on desktop (`px-20`)

5. **Top Bar**
   - Sticky, minimal height
   - Background: `bg-background/80 backdrop-blur-sm`
   - Left: sidebar toggle icon + breadcrumbs (small, subtle)
   - Right: single "..." menu button (MoreHorizontal)
   - Dropdown menu contains: Share, Sub-page, Delete
   - Save indicator: tiny spinner text, no "Saved" label

6. **Typography (editor.css updates)**
   - H1: `40px`, weight 700, margin `32px 0 8px`
   - H2: `28px`, weight 600, margin `24px 0 8px`
   - H3: `22px`, weight 600, margin `16px 0 8px`
   - Paragraph: `16px`, line-height `1.75`, margin `4px 0`
   - Blockquote: left border `3px solid primary`, padding `8px 16px`, italic
   - Lists: padding-left `24px`, item margin `6px 0`
   - Code: `13px`, bg `rgba(0,0,0,0.04)` (light) / `rgba(255,255,255,0.06)` (dark)
   - Code block: bg `rgba(0,0,0,0.03)` (light) / `rgba(255,255,255,0.04)` (dark), no border
   - Horizontal rule: `1px solid border`, margin `24px 0`

7. **Breadcrumbs**
   - Move to sticky top bar
   - Font size: `11px`
   - Color: muted-foreground
   - Show only last 2 ancestors + current page
   - Truncate long titles

8. **Floating Toolbar**
   - Instead of persistent toolbar, show on text selection (future enhancement)
   - For now: keep existing toolbar but make it more minimal
   - Option: collapse toolbar into a single "+" button that opens slash menu

---

## Implementation Tasks

### Task 1: Rewrite DocEditorClient.tsx
- Reorder JSX: cover first, then sticky header, then content
- Remove heavy border wrappers
- Increase icon size to 72px
- Move breadcrumbs into sticky header
- Replace top button row with "..." dropdown menu
- Add `showTopMenu` state for dropdown
- Adjust content padding: `px-20 py-8 pb-32`
- Make cover full-width with no border radius
- Add hover state for "Change cover" button

### Task 2: Update editor.css
- Remove `.tiptap-wrapper` border and background
- Increase heading sizes and margins
- Increase paragraph line-height to `1.75`
- Remove code block border, use subtle background instead
- Add `.notion-editor` class overrides
- Make placeholder text lighter
- Add block hover handle styles (optional Phase 2)

### Task 3: Remove Unused Imports
- Clean up imports in DocEditorClient (remove unused icons if any)

### Task 4: Responsive
- On mobile: reduce content padding to `px-4`
- Cover height reduces to `25vh`
- Icon size reduces to `56px`
- Title size reduces to `32px`

---

## Acceptance Criteria
- [ ] Cover image spans full width with no border radius
- [ ] Page icon is 72px and prominent
- [ ] Title is 40px, no border, clean placeholder
- [ ] Editor has no wrapper border — flows like a canvas
- [ ] Top bar is minimal sticky header with "..." menu
- [ ] Breadcrumbs are in top bar, small and subtle
- [ ] Typography matches Notion spacing (generous margins)
- [ ] Build passes with zero errors

---

## Files to Modify
1. `src/app/(dashboard)/docs/[id]/DocEditorClient.tsx`
2. `src/components/editor.css`

## Files to Create
- None

## Estimated Effort
1-2 hours for implementation + testing
