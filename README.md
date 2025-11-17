# Tablón de Anuncios (tablon-anuncios)

Lightweight notice board (frontend) built with React + TypeScript + Vite and using Supabase for auth/data. This repository contains a client application for publishing and browsing short notices (announcements). The project is configured for deployment on Vercel and includes guidance to set up a Supabase backend.

Resumen en español: Aplicación frontend ligera para publicar y buscar anuncios, con autenticación y almacenamiento en Supabase.

---

## Repositorio

- Owner / Repo: erpallaga/tablon-anuncios
- Main docs in this repo:
  - DEPLOYMENT.md - https://github.com/erpallaga/tablon-anuncios/blob/master/DEPLOYMENT.md
  - VERCEL_DEPLOYMENT.md - https://github.com/erpallaga/tablon-anuncios/blob/master/VERCEL_DEPLOYMENT.md
  - VERCEL_QUICK_START.md - https://github.com/erpallaga/tablon-anuncios/blob/master/VERCEL_QUICK_START.md
  - SUPABASE_SETUP.md - https://github.com/erpallaga/tablon-anuncios/blob/master/SUPABASE_SETUP.md
  - supabase-setup.sql - https://github.com/erpallaga/tablon-anuncios/blob/master/supabase-setup.sql
  - DEPLOYMENT_QUICK_START.md - https://github.com/erpallaga/tablon-anuncios/blob/master/DEPLOYMENT_QUICK_START.md
  - DEVELOPMENT_WORKFLOW.md - https://github.com/erpallaga/tablon-anuncios/blob/master/DEVELOPMENT_WORKFLOW.md
  - .env.example - https://github.com/erpallaga/tablon-anuncios/blob/master/.env.example
  - vercel.json - https://github.com/erpallaga/tablon-anuncios/blob/master/vercel.json
  - index.html - https://github.com/erpallaga/tablon-anuncios/blob/master/index.html
  - package.json - https://github.com/erpallaga/tablon-anuncios/blob/master/package.json
  - vite.config.ts - https://github.com/erpallaga/tablon-anuncios/blob/master/vite.config.ts
  - tailwind.config.js - https://github.com/erpallaga/tablon-anuncios/blob/master/tailwind.config.js

---

## Tech stack

(derived from package.json)
- Vite (dev tooling & build)
- React 19 + TypeScript
- TailwindCSS + PostCSS
- Supabase (auth + database) — @supabase/supabase-js and @supabase/auth-ui-react present
- React Router
- Optional libraries seen in dependencies: @dnd-kit (drag & drop), react-pdf, lucide-react, react-spring, uuid

See package.json for exact versions:
https://github.com/erpallaga/tablon-anuncios/blob/master/package.json

---

## Features (what the repo supports)
- Frontend UI for notices (posting/listing/filtering).
- Authentication via Supabase Auth.
- Uses Supabase for persistence; SQL schema provided in `supabase-setup.sql`.
- Tailwind-based responsive UI.
- Configured and documented for Vercel deployment.

(For full feature detail, inspect the source under `src/` and the Supabase docs file `SUPABASE_SETUP.md`.)

---

## Quick start (local development)

Prerequisites
- Node.js (LTS recommended — Node 16+ will work; use current LTS for best results)
- npm (or yarn/pnpm)
- A Supabase project (see Supabase setup instructions below)

Install dependencies
```bash
npm install
```

Start dev server
```bash
npm run dev
# opens Vite dev server (check console for local URL, typically http://localhost:5173)
```

Build for production
```bash
npm run build
```

Preview production build locally
```bash
npm run preview
```

The available npm scripts are defined in package.json:
- dev -> vite
- build -> tsc && vite build
- preview -> vite preview

---

## Environment

There is an `.env.example` in the repo: https://github.com/erpallaga/tablon-anuncios/blob/master/.env.example

Copy it to `.env` and fill the values required for Supabase and any other provider keys. Typical vars you will need (examples — check `.env.example`):

- SUPABASE_URL
- SUPABASE_ANON_KEY
- VITE_* prefixed variables (Vite exposes env vars that begin with VITE_)

The project expects a Supabase client configuration; consult SUPABASE_SETUP.md for exact instructions:
https://github.com/erpallaga/tablon-anuncios/blob/master/SUPABASE_SETUP.md

Also see `supabase-setup.sql` for the database schema and helper initialization:
https://github.com/erpallaga/tablon-anuncios/blob/master/supabase-setup.sql

---

## Supabase setup

This repository contains explicit Supabase setup instructions and a SQL file to create the tables used by the app:
- SUPABASE_SETUP.md — https://github.com/erpallaga/tablon-anuncios/blob/master/SUPABASE_SETUP.md
- supabase-setup.sql — https://github.com/erpallaga/tablon-anuncios/blob/master/supabase-setup.sql

Follow those docs to:
1. Create a Supabase project.
2. Run the provided SQL to create tables and policies.
3. Configure auth providers if necessary.
4. Add the project's keys to your `.env`.

---

## Deployment

Options in the repo focus on Vercel; there are deployment guides included:

- Vercel deployment and quick start docs in repo:
  - VERCEL_DEPLOYMENT.md - https://github.com/erpallaga/tablon-anuncios/blob/master/VERCEL_DEPLOYMENT.md
  - VERCEL_QUICK_START.md - https://github.com/erpallaga/tablon-anuncios/blob/master/VERCEL_QUICK_START.md
- Generic deployment: the build produces a static site (Vite + client-side React) which can be hosted on Vercel, Netlify, or any static hosting. Ensure environment variables for Supabase are configured in your host.

See DEPLOYMENT.md and DEPLOYMENT_QUICK_START.md for fuller instructions:
https://github.com/erpallaga/tablon-anuncios/blob/master/DEPLOYMENT.md

If you plan to host on Vercel, `vercel.json` is included to control routing/build behavior:
https://github.com/erpallaga/tablon-anuncios/blob/master/vercel.json

---

## Development workflow & conventions

There is a DEVELOPMENT_WORKFLOW.md in the repo which describes contribution workflow and branch strategy:
https://github.com/erpallaga/tablon-anuncios/blob/master/DEVELOPMENT_WORKFLOW.md

Please read it before contributing or opening pull requests.

---

## Project structure (high level)

- index.html
- src/              # React + TypeScript source (UI, routes, Supabase client)
- public/           # static assets
- package.json      # scripts & deps
- vit e.config.ts
- tailwind.config.js
- supabase-setup.sql
- several docs for deployment and setup (see list above)

---

## Tests & linting

No test scripts are present in package.json. Add tests/linting as needed (Jest / Testing Library, ESLint, Prettier, etc.) and document them in DEVELOPMENT_WORKFLOW.md when present.

---

## Contributing

1. Fork the repository.
2. Create a branch: git checkout -b feat/your-feature
3. Commit your changes and push.
4. Open a Pull Request describing the changes.
5. Follow guidance in DEVELOPMENT_WORKFLOW.md.

If you'd like me to open draft issues, prepare PR templates, or add CI workflows, I can generate those files.

---

## License

No LICENSE file is present in the repository root. If you intend to make this project public for reuse, add a license (for example MIT) to clarify reuse terms.

---

## Maintainer / Contact

- Maintainer: erpallaga
- Repository: https://github.com/erpallaga/tablon-anuncios
