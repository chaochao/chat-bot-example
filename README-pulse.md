# Pulse — Hospital Scheduling OS (Demo)

A shift scheduling and workforce management dashboard for hospital operations. Built as a demo to explore how AI can assist charge nurses and scheduling coordinators in managing complex staffing needs.

> **Demo scope:** Single-user, local SQLite, no auth. Real-world considerations are noted below.

---

## Tech Stack

### Frontend

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript | Component model, strong typing |
| Build | Vite + TailwindCSS v4 | Fast HMR, utility-first CSS |
| Routing | React Router v7 | Nested routes for `/pulse` sub-pages |
| Server state | TanStack Query v5 | Cache, background refetch, mutation invalidation |
| UI primitives | shadcn/ui + Base UI | Accessible, unstyled components |
| Icons | Lucide React | Consistent icon set |
| Date math | date-fns | Week/month grids, range queries |

### Backend

| Layer | Choice | Why |
|---|---|---|
| Server | Express.js | Lightweight REST API |
| ORM | Prisma v7 | Type-safe queries, migrations |
| Database | SQLite (via better-sqlite3) | Zero-config local dev |
| AI agent | Mastra | SSE-based agent with scheduling context |

### Testing

- **Vitest** — unit tests for pure calendar utilities (`calendarUtils.test.ts`)

---

## Data Model

```
Department  ──< Staff  ──< Shift
           ──< PatientCensus
           
Staff  ──< TimeOffRequest
       ──< ShiftSwap
       ──< SickCall

SchedulingRule  (global rules table)
```

Key fields:
- **Department** — min/max staff per shift type (day/evening/night), nurse-patient ratio, required certifications
- **Staff** — employment type (full/part-time), contract hours, preferred shift, max consecutive shifts
- **Shift** — date, type (day/evening/night), hours (default 12), status
- **PatientCensus** — predicted vs actual patient count per department per shift
- **SchedulingRule** — global constraints (min rest hours, max nights/month, max hours/week)

---

## Running Locally

```bash
npm install

# First-time database setup (required — Prisma v7 does not auto-generate on install)
npx prisma migrate deploy
npx prisma generate
npx prisma db seed

npm run dev
```

App runs at `http://localhost:3000`. Pulse is at `/pulse`.

### Prisma command reference

| Command | When to use |
|---|---|
| `prisma migrate dev` | Local dev — create a new migration and apply it |
| `prisma migrate deploy` | After clone/pull — apply existing migrations without creating new ones |
| `prisma generate` | After any schema change, or after `npm install` |
| `prisma db seed` | Populate initial/demo data |
| `prisma studio` | Open GUI to browse and edit the database |

> **Note:** `npm install` does **not** regenerate the Prisma client in v7. Always run `prisma generate` after installing on a fresh clone.

---

## Real-World Considerations

This demo omits significant production concerns. Here is what would need to change for a real hospital deployment.

### Auth and access control
No authentication exists. Production requires role-based access: charge nurses manage shifts for their unit, staff can only view their own schedule, administrators see everything. Integrates with hospital identity providers (SAML/LDAP).

### Database
SQLite is file-based and single-writer. Production uses PostgreSQL with connection pooling (PgBouncer). Patient census and shift history grow fast — partitioning by date and department becomes necessary over 1–2 years.

### HIPAA compliance
Patient census data is PHI. Production requires encryption at rest and in transit, audit logs for every data access, BAAs with all vendors, and data retention policies. The demo logs nothing and encrypts nothing.

### Scheduling rule enforcement
The `SchedulingRule` model captures constraints (min rest hours, max consecutive nights) but the demo UI does not enforce them. Production would validate every shift creation/edit server-side and surface conflicts to the user before saving.

### Real-time collaboration
Multiple charge nurses may schedule the same unit simultaneously. Production needs optimistic locking or last-write-wins with conflict UI, and likely WebSocket push for live calendar updates without manual refresh.

### Timezone handling
Hospital shifts cross midnight and span DST transitions. The demo stores dates as UTC strings and uses `slice(0, 10)` to avoid offset bugs — production needs explicit timezone-aware storage (store the local date + hospital timezone, not a UTC timestamp).

### Notifications
Staff expect push/SMS notifications when shifts are assigned, swapped, or cancelled. Time-off approvals need email confirmation. The demo has no notification layer.

### Mobile
Nurses check schedules on their phones. The current layout is desktop-only. Production needs a responsive or PWA design optimized for one-handed use on small screens.

### EHR and HR integrations
Staff rosters come from HR systems (Workday, UKG). Patient census feeds from the EHR (Epic, Cerner). Manual data entry at this scale is not viable — production syncs via HL7 FHIR or vendor APIs.

### AI agent guardrails
The Ask Pulse agent (Step 2, pending) provides scheduling suggestions. Production agents need audit trails for every AI recommendation, human-in-the-loop approval before any write, and clear disclosure to staff that AI assisted the schedule.
