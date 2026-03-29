# Hana — HRD Agent OS

AI HR Agent-as-a-Service for Indonesian SMEs (50-300 employees).
Built by Akhri Ramadhan (CEO EPIK Holding / Parallax).

## Stack

- **Framework:** Next.js 14 + TypeScript + pnpm
- **UI:** Tailwind 3 + shadcn/ui (base-nova style) + Lucide icons
- **DB:** Supabase PostgreSQL (Singapore region)
- **AI:** Anthropic Claude SDK v0.80
- **Auth:** Supabase SSR Auth (OAuth callback at `/auth/callback`)

## Design System — IMPORTANT

- **iOS 18 liquid glass** aesthetic, **LIGHT MODE ONLY**
- Fonts: DM Sans (body) + DM Mono (code/mono)
- Brand colors:
  - Indigo `#4F7BF7` — primary
  - Violet `#7C5CF6` — secondary
  - Teal `#26C6A6` — success
  - Coral `#F76B4F` — urgent/error
  - Amber `#F7C94F` — warning
- Glass cards use `glass` class (backdrop-blur + white/80 bg)
- Radius token: `var(--radius-xl)`

## Known Gotchas

- base-nova shadcn does NOT use `asChild` prop — uses base-ui primitives
- Zod **v3** required (v4 breaks @hookform/resolvers)
- Select `onValueChange` passes `string | null`, not `string`
- All DB queries MUST be tenant-scoped (use `tenant_id` filter)

## Architecture

### Multi-Tenant
- `useTenantContext()` hook provides selected tenant across app
- **operator** role = manage all tenants; **client_hrd** = own tenant only

### Routes (src/app)
```
(auth)/login, register
(dashboard)/
  dashboard        — KPI stats + agent status pills
  tenants          — operator-only tenant management
  employees        — employee directory CRUD + CSV import
  compliance       — compliance calendar (BPJS, PPh21, THR, PKWT expiry)
  assessment       — 360° assessment cycles
  documents        — document generation & management
  documents/[id]   — document detail + AI draft editor
  hr-agent         — HR Agent chat (for HRD users)
  hana-agent       — Staff Agent chat (for employees)
  settings         — org settings
  billing          — subscription & usage
```

### API Endpoints (src/app/api)
```
/agents/status           — agent heartbeat
/assessment/cycles       — CRUD cycles
/assessment/cycles/[id]  — single cycle + raters
/assessment/responses    — submit responses
/billing/usage           — token usage
/chat                    — GET messages / POST new (streaming)
/chat/sessions           — list/delete sessions
/chat/upload             — doc upload for chat context (DOCX/PDF → text)
/compliance              — compliance items
/dashboard/stats         — dashboard KPIs
/documents               — list/create document requests
/documents/[id]          — GET/PATCH/DELETE single document
/employees               — list/create employees
/employees/[id]          — single employee CRUD
/employees/import        — bulk CSV import
/tenants                 — list/create tenants
/tenants/[id]            — single tenant CRUD
```

### Agent Tools (src/lib/agent-tools.ts)
- search_employees, add_employee, add_employees_bulk, update_employee, delete_employee
- generate_document, list_documents, get_document
- check_compliance, mark_compliance_done
- start_assessment_cycle, get_assessment_responses
- escalate_to_background, get_tenant_context

### Chat Flow
Message → `/api/chat` (streaming SSE) → agent processes with tools → can create `pending_tasks` for background work → `TaskCard` component polls task status in chat UI

### Pending Tasks System
- `pending_tasks` table: status (pending → processing → completed/failed), payload JSONB, result JSONB
- Agent's `escalate_to_background` tool creates tasks
- `TaskCard` component polls `/api/tasks/:id` every 3s for live status

### Document Generation Flow
1. User creates doc request (POST /api/documents) → status: draft
2. Detail page (`/documents/[id]`) lets user generate with AI or write manually
3. AI generation streams via /api/chat, saves to `draft_content` column
4. User can edit draft, then mark as "ready"

## Database Migrations (supabase/migrations/)
1. `001_initial_schema.sql` — tenants, profiles, employees, compliance, documents
2. `002_phase2_tables.sql` — agent_heartbeats, pending_tasks, compliance_calendar, document_requests
3. `003_assessment_tables.sql` — assessment cycles, responses, raters, questions, reports
4. `004_document_draft_content.sql` — draft_content column on document_requests

## Types (src/lib/types/index.ts)
All types defined here — Employee, Tenant, DocumentRequest, PendingTask, ComplianceItem, AssessmentCycle, ChatMessage, etc. Always import from `@/lib/types`.

## Components (src/components/)
- `ui/` — 25 shadcn primitives
- `layout/` — sidebar, topbar, mobile nav, user menu
- `chat/` — session sidebar, message renderer (markdown + action buttons), task-card
- `employees/` — form, side panel, stats, contract/expiry badges, CSV import
- `dashboard/` — stat cards, agent status pills
- `documents/` — new document dialog
- `assessment/` — cycle badge, response progress
- `compliance/` — status chip, type icon
- `shared/` — tenant selector, filter select, coming soon, list skeleton

## Current Status (last updated: 2026-03-29)

### Phase 1 (Foundation) ✅ Complete
- Auth (login/register/OAuth)
- Tenant CRUD + settings
- Employee directory CRUD + CSV import

### Phase 2 (Core Value) — In Progress
- ✅ Compliance calendar page
- ✅ Document list + new document dialog
- ✅ Document detail page with AI draft generation
- ✅ 360° Assessment cycles + raters + responses
- ✅ HR Agent + Hana Agent chat interfaces
- ✅ Dashboard with KPI stats + agent pills
- ✅ Chat session sidebar + markdown renderer
- ✅ TaskCard inline component (polls task status)

### Remaining Work (Task Board Option A)
- ⬜ Task API endpoint (`/api/tasks/[id]`) — TaskCard polls this but it doesn't exist yet
- ⬜ Wire TaskCard into chat — render when agent returns `escalate_to_background`
- ⬜ Task status widget on dashboard — summary of pending/processing/completed
- ⬜ Run migration 004 on Supabase

### PRD Reference
Full PRD at: `HRD_Agent_OS_PRD_v1.0.md` (ask the user for location if needed)

## Running

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build
pnpm lint
```

Environment: copy `.env.example` → `.env.local`, fill Supabase URL/key + Anthropic API key.
