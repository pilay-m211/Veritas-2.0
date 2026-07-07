---
name: RBAC routing
description: Three-role system (educator/admin/auditor) with DashboardDispatcher and role-specific sidebar nav.
---

Roles: `educator` | `admin` | `auditor` (stored in Firestore `users/{uid}.role`).

**DashboardDispatcher** in `App.tsx`: `/dashboard` route renders `AdminDashboard`, `AuditorDashboard`, or the default `Dashboard` depending on `userProfile.role`.

**RequireRole** guard: wraps `/admin` and `/audit` direct URLs — redirects to `/dashboard` if role doesn't match.

**Sidebar nav** (`components/layout.tsx`): `EDUCATOR_NAV` / `ADMIN_NAV` / `AUDITOR_NAV` arrays selected by role. Each role sees only relevant links.

**Why:** Spec called for three distinct dashboard experiences; dispatch at the route level avoids per-component role checks everywhere.

**How to apply:** Adding a new role → add to `UserRole` union in auth-context, add nav array in layout, add case in DashboardDispatcher.
