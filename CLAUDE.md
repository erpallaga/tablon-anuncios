# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Type-check (tsc) then build for production
npm run preview   # Preview the production build locally
```

There is no test suite and no linter configured.

## Environment setup

Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Architecture

**Tablón de Anuncios** is a React 19 + TypeScript + Vite SPA deployed on Vercel. It serves as a notice board for a congregation — authenticated users can view PDF documents and announcements; editors/admins can manage content via an admin panel.

### Auth flow

Authentication uses Supabase magic links (no passwords). The app blocks rendering until a valid session exists — unauthenticated users see `LoginPage`. Roles (`admin`, `editor`, `publicador`) come from the `profiles` table and are loaded by `AuthContext` after sign-in. Only `admin` can manage users; `editor` and above can manage content.

**Critical detail in `AuthContext.tsx`**: the profile fetch inside `onAuthStateChange` is deferred with `setTimeout(0)` to avoid a deadlock — Supabase's auth state change callbacks run inside an internal lock that blocks REST queries.

### Two Supabase clients

`src/lib/supabase/client.ts` exports two clients:
- `supabase` — persists session, used for all writes and auth operations
- `supabaseAnon` — session-less, used for public reads (`getAll` in `database.ts`) to avoid blocking on token refresh

### State management

Two React contexts (`src/context/`):
- `AuthContext` — session, profile, role, sign-in/sign-out
- `AppContext` — grid items and announcements (CRUD + optimistic state updates against Supabase)

`AppContext` exposes `announcements` (active only, for display) and `allAnnouncements` (all, for the admin panel).

### Database schema

Three tables in Supabase (`supabase-setup.sql` + `profiles` migration):
- `grid_items` — id, title, icon (emoji), pdf_url, order
- `announcements` — id, title, content, is_active, order, created_at, updated_at
- `profiles` — id (FK to auth.users), email, display_name, role, is_active

DB column names use `snake_case`; TypeScript types use `camelCase`. Mapping is done in `src/lib/supabase/database.ts` and `profiles.ts`.

### PDF storage

PDFs are stored in a Supabase Storage bucket named `pdfs`. `storageService` in `src/lib/supabase/storage.ts` handles upload/delete. `pdfUrl` in `grid_items` is the full public URL returned by Supabase Storage.

### Admin panel

`src/components/admin/AdminPanel.tsx` is a full-screen overlay with three tabs:
- **Grid items** — CRUD + drag-and-drop reordering via `@dnd-kit`
- **Announcements** — CRUD + reordering; toggling `isActive` shows/hides on the main board
- **Users** (admin only) — managed via `UsersPanel`, which calls the `invite-user` Supabase Edge Function

### Edge Functions

- `supabase/functions/invite-user/` — invites a new user via Supabase Admin API and inserts a row in `profiles`. Deploy with `supabase functions deploy invite-user`.
- `supabase/functions/extract-assignments/` — triggered by a Database Webhook on `grid_items` INSERT. When `extract_assignments` is true, extracts RSC schedule assignments from the PDF/JPG via the Anthropic API (vision + structured outputs, double-pass verification), validates deterministically, stores results in `extracted_assignments` (see `supabase-assignments-setup.sql`), and emails assigned users via Brevo (or Resend) with an `.ics` attachment. Deploy with `supabase functions deploy extract-assignments --no-verify-jwt`. Architecture and setup: `docs/automatizacion-asignaciones.md`.

### Deployment

Push to `master` → auto-deploys to Vercel. Required Vercel env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
