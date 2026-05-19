# Pulse — Hospital AI Operating System: UI Design Spec

**Date:** 2026-05-19  
**Scope:** Step 1 — UI shell, Calendar view, Analytics placeholder, Ask Pulse drawer, data model  
**Stack:** React + TanStack Query + shadcn/ui + React Router + Express + Prisma + SQLite

---

## 1. Product Overview

Pulse is an AI-powered operating system for hospitals that helps schedulers make fair, optimized staffing decisions. Step 1 builds the UI shell and calendar view with real shift data. Step 2 wires the Ask Pulse AI agent.

---

## 2. App Structure

### Shell Layout
- **Left sidebar** (fixed, ~240px): Pulse logo/wordmark, nav items — Calendar, Analytics, Ask Pulse toggle button
- **Main area** (fluid right): renders the active page
- **Ask Pulse drawer**: slides in from the left over the main content when toggled; has a close (X) button

### Routing (React Router)
| Path | Page |
|---|---|
| `/pulse` | Calendar (default) |
| `/pulse/analytics` | Analytics dashboard |

Ask Pulse is not a route — it is a `boolean` state at the layout level toggled by the sidebar button.

### Entry Point
`src/web/main.tsx` gets React Router added. The existing chat app remains at `/`. Pulse routes live under `/pulse`.

---

## 3. Calendar Page

### Views
- **Month view** (default): 7-column grid, one cell per calendar day
- **Week view**: 7-column grid showing day/evening/night shift rows per day
- Toggle between views via a button group in the page header (matches Marklo reference style)
- Navigation: prev/next arrows + "Today" button; current month/week label in header

### Month View Cell
Each day cell contains:
- Day number (top-right)
- One card per department that has shifts on that day
- Card shows: department name + role count summary, e.g. **"ICU — 4 RNs, 2 MDs"**
- Card background color: department color (soft tint, dark text)
- On hover: shadcn `Popover` shows individual staff names grouped by role

### Week View Cell
Each day column has three rows: **Day**, **Evening**, **Night**.  
Each row shows department cards (same format as month view) for that shift type.

### Department Color Coding
Each department has a hex color stored in the DB. Cards use a soft tint of that color as background with the full color as a left border accent.

### Implementation
- Custom CSS Grid (no calendar library)
- `date-fns` for date math (start of month, day-of-week offsets, week ranges)
- shadcn `Card`, `Badge`, `Popover` for shift cards and hover details
- TanStack Query fetches shifts keyed by `['shifts', startDate, endDate]`; re-fetches when the visible date range changes

---

## 4. Analytics Page

Placeholder for Step 1 — renders a page shell with the heading "Analytics" and a "Coming soon" state. Wired up in routing so the nav link works.

---

## 5. Ask Pulse Drawer

A slide-in panel triggered by the "Ask Pulse" nav item. Overlays the main content (does not push it).

### Contents (Step 1 — static shell)
- Close (X) button top-right
- Pulse logo mark + greeting: "Good morning, [name]!"
- Subtitle: "Ask me anything about your staffing schedule."
- Chat input (shadcn `Textarea` + send button)
- Quick-action chips: **Plan**, **Analyze**, **Optimize**

The drawer is a static UI shell in Step 1. AI wiring happens in Step 2 using the existing Mastra + SSE infrastructure.

---

## 6. Data Model (Prisma + SQLite)

```prisma
model Department {
  id                   String   @id @default(cuid())
  name                 String
  color                String   // hex e.g. "#4f86c6"
  minStaffDay          Int      @default(0)
  minStaffEvening      Int      @default(0)
  minStaffNight        Int      @default(0)
  maxStaffDay          Int      @default(0)
  maxStaffEvening      Int      @default(0)
  maxStaffNight        Int      @default(0)
  requiredCertifications String  @default("") // comma-separated
  staff                Staff[]
  createdAt            DateTime @default(now())
}

model Staff {
  id                   String   @id @default(cuid())
  name                 String
  role                 String   // RN | LPN | MD | Tech | Pharmacy
  departmentId         String
  department           Department @relation(fields: [departmentId], references: [id])
  employmentType       String   @default("fullTime") // fullTime | partTime | prn
  contractHoursPerWeek Int      @default(36)
  preferredShift       String   @default("none")     // day | evening | night | none
  certifications       String   @default("")         // comma-separated
  maxConsecutiveShifts Int      @default(3)
  shifts               Shift[]
  timeOffRequests      TimeOffRequest[]
  createdAt            DateTime @default(now())
}

model Shift {
  id        String   @id @default(cuid())
  staffId   String
  staff     Staff    @relation(fields: [staffId], references: [id])
  date      DateTime
  type      String   // day | evening | night
  hours     Int      @default(12) // 8 or 12
  status    String   @default("scheduled") // scheduled | completed | absent | swapped
  createdAt DateTime @default(now())
}

model TimeOffRequest {
  id        String   @id @default(cuid())
  staffId   String
  staff     Staff    @relation(fields: [staffId], references: [id])
  startDate DateTime
  endDate   DateTime
  reason    String   @default("")
  status    String   @default("pending") // pending | approved | denied
  createdAt DateTime @default(now())
}

model SchedulingRule {
  id                      String @id @default(cuid())
  minRestHoursBetweenShifts Int  @default(11)
  maxNightShiftsPerMonth  Int    @default(8)
  maxShiftsPerWeek        Int    @default(5)
}
```

---

## 7. API Endpoints (Express)

| Method | Path | Description |
|---|---|---|
| GET | `/api/pulse/shifts` | `?start=&end=` — shifts in date range, joined to staff + department |
| GET | `/api/pulse/departments` | All departments with colors |
| POST | `/api/pulse/shifts` | Create a shift |
| DELETE | `/api/pulse/shifts/:id` | Remove a shift |
| GET | `/api/pulse/staff` | All staff |
| GET | `/api/pulse/rules` | Global scheduling rules |

---

## 8. TanStack Query

- `QueryClient` added at Pulse app root
- `useShifts(startDate, endDate)` — fetches and caches shifts for visible range
- `useDepartments()` — fetches departments once, long cache time
- Keys: `['shifts', start, end]`, `['departments']`

---

## 9. File Structure (new files under `src/`)

```
src/
  pulse/
    components/
      CalendarGrid.tsx        — month/week grid (CSS Grid + date-fns)
      ShiftCard.tsx           — department card with hover popover
      WeekRow.tsx             — day/evening/night rows for week view
      AskPulseDrawer.tsx      — slide-in chat panel shell
      Sidebar.tsx             — Pulse nav sidebar
    pages/
      CalendarPage.tsx
      AnalyticsPage.tsx
    hooks/
      useShifts.ts
      useDepartments.ts
    lib/
      calendarUtils.ts        — date-fns helpers (weeks, month grid)
  api/
    pulse.ts                  — Express router for /api/pulse/*
```

Prisma schema lives at `prisma/schema.prisma`. The existing `storage.db` (Mastra memory) is separate from `pulse.db` (Prisma).

---

## 10. Seed Data

On first run, seed:
- 4–5 departments (ICU, ED, Surgery, Cardiology, General) with distinct colors
- 10–15 staff members across departments with varied roles
- 2–3 weeks of sample shifts covering all shift types
- One `SchedulingRule` row with sensible defaults

---

## Out of Scope for Step 1
- Creating/editing shifts from the UI (read-only; seed data only)
- Ask Pulse AI wiring (Step 2)
- Analytics charts (placeholder page only)
- Authentication
- Mobile responsiveness
