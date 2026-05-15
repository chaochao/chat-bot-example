# Conversation Sidebar — Design Spec

**Date:** 2026-05-14  
**Status:** Approved

## Goal

Add a ChatGPT-style dark sidebar showing past conversations the user can select, and fix the "New Chat" button styling to match the existing design system.

## Layout

Replace the current centered-card layout with a full-viewport two-column flex row:

```
┌─────────────┬──────────────────────────────┐
│   Sidebar   │        Chat Panel            │
│   (260px)   │        (flex: 1)             │
│             │                              │
│ [New Chat]  │  header                      │
│ ─────────── │  ─────────────────────────── │
│ Thread 1    │  messages...                 │
│ Thread 2    │                              │
│ Thread 3    │  composer                    │
└─────────────┴──────────────────────────────┘
```

The `.chat-shell` padding and max-width centering are removed. The layout fills the full viewport.

## Visual Style

**Sidebar:**
- Background: `#2c2925` (warm charcoal, complements the cream palette)
- Text: `#e8e0d5` (light cream)
- Active thread background: `#3d3830`
- Hover thread background: `#353028`
- Border-right: `1px solid #1e1c19`

**"New Chat" button (in sidebar):**
- Full width, styled to match the existing Send button: background `#254c7d`, white text, `border-radius: 8px`, no border, `cursor: pointer`
- Disabled state: `opacity: 0.58`

**Status dot:** Stays in the chat header (right side), no change needed.

## Sidebar Content

Each thread item shows:
- **Title:** first user message in that thread, truncated to ~45 characters with ellipsis
- **Timestamp:** relative time (e.g. "2h ago", "yesterday") using `Intl.RelativeTimeFormat`
- **Active state:** highlighted background when it is the current `threadId`
- **Hover state:** subtle highlight on mouse over

## Backend — New Endpoint

### GET /api/threads

Returns all threads for `resourceId: "local-user"`, ordered by most-recent first.

**Response:**
```json
{
  "threads": [
    { "id": "uuid", "title": "What is the capital of France?", "createdAt": "2026-05-14T10:00:00Z" },
    ...
  ]
}
```

`title` is the first user message of the thread, truncated to 80 characters server-side.  
Returns `{ "threads": [] }` on any error.

**Implementation note:** Verify the exact Mastra Memory API for listing threads against the installed types (`node_modules/@mastra/memory/dist/`). Likely candidates: `memory.getThreadsByResourceId({ resourceId })` or `storage.getThreadsByResourceId(...)`.

## Frontend Changes

### `src/web/main.tsx`

**New state:**
- `threads: Thread[]` — list shown in sidebar (fetched on mount and after new chat)
- `threadId` state already exists

**New type:**
```typescript
type Thread = { id: string; title: string; createdAt: string };
```

**On mount:** fetch `/api/threads` to populate sidebar in parallel with fetching current thread messages.

**Thread selection:** clicking a sidebar item calls `setThreadId(id)`, which triggers the existing `useEffect` to load that thread's messages. Also persists the selected `threadId` to `localStorage`.

**New Chat:**
1. Remove `THREAD_ID_KEY` from `localStorage`
2. `setThreadId(getOrCreateThreadId())` — generates new UUID
3. `setMessages(initialMessages)` — resets chat
4. Re-fetch thread list after first message is sent (so the new thread appears in the sidebar)

**Sidebar thread list refresh:** after each successful `streamChatResponse` completes, re-fetch `/api/threads` to pick up newly created threads and updated titles.

### `src/web/styles.css`

New CSS classes: `.app-shell`, `.sidebar`, `.sidebar-header`, `.sidebar-threads`, `.thread-item`, `.thread-item.active`, `.thread-item:hover`, `.thread-title`, `.thread-time`, `.new-chat-btn`.

The existing `.chat-shell` and `.chat-panel` are updated for the new two-column layout.

## Data Flow

```
Mount
  ├── GET /api/threads           → populate sidebar
  └── GET /api/threads/:threadId → populate chat

Thread click
  └── setThreadId(id) → useEffect fires → GET /api/threads/:threadId → populate chat

New Chat
  └── clear localStorage → new UUID → reset messages → sidebar refreshes after first reply

After each reply
  └── GET /api/threads → refresh sidebar (new thread appears / title updates)
```

## Out of Scope

- Thread deletion or renaming
- Search/filter in sidebar
- Mobile responsive sidebar (collapsed/drawer)
- Pagination of thread list
