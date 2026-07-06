# Veritas

A teacher grading platform with OCR answer scanning, student/class/exam management, Excel export, grade syncing, and a reports dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/veritas run dev` — run the frontend (port 20981, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind (dark navy/cyan theme)
- API: Express 5 at `/api`
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- OCR: Tesseract.js v5 (CDN, browser-side)
- Excel: xlsx v0.18.1 (CDN, browser-side)

## Where things live

- `lib/db/src/schema/` — Drizzle schema files (classes, students, exams, grades, drafts)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for types/hooks)
- `lib/api-client-react/src/` — Generated React Query hooks (run codegen to update)
- `lib/api-zod/src/` — Generated Zod validators
- `artifacts/api-server/src/routes/` — Express route handlers (one file per resource)
- `artifacts/veritas/src/pages/` — Frontend pages (dashboard, classes, exams, students, scanner, reports, settings)
- `artifacts/veritas/src/components/layout.tsx` — Sidebar layout
- `artifacts/veritas/src/index.css` — Theme vars and dark mode config

## Architecture decisions

- Contract-first: OpenAPI spec drives codegen; never write fetch calls by hand
- Scanner page loads Tesseract.js and xlsx from CDN to avoid bundling large OCR/spreadsheet libs
- Grade upsert: `POST /api/grades/bulk` accepts `studentSchoolId` strings, resolves to DB student IDs server-side
- All timestamps serialized as ISO strings over the wire
- App forces dark mode via `document.documentElement.classList.add('dark')` in App.tsx

## Product

- **Dashboard** — stats cards (students, exams, classes, avg score) + recent exams/grades
- **Classes** — CRUD for class sections with subject and student count
- **Students** — CRUD roster with search, optional class assignment
- **Exams** — CRUD with per-exam average score and graded count
- **Scanner** — Upload image → Tesseract OCR → parse `YYYY-NNNNN score` lines → sync to DB, export new/updated Excel, or save drafts
- **Reports** — Per-exam analytics: avg/highest/lowest/pass rate, score distribution bar chart, top/bottom performers
- **Settings** — Placeholder settings cards

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing DB schema, run `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs`
- After changing OpenAPI spec, run `pnpm --filter @workspace/api-spec run codegen` then `pnpm run typecheck:libs`
- Tesseract and xlsx are loaded as CDN scripts — check `window.Tesseract` / `window.XLSX` availability before calling

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
