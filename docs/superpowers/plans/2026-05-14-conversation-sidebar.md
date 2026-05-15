# Conversation Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a ChatGPT-style dark sidebar showing past conversations the user can select, and fix the "New Chat" button styling.

**Architecture:** Three tasks in sequence — backend endpoint for thread listing, CSS for the two-column layout and sidebar styles, then frontend wiring. The existing `GET /api/threads/:threadId` and thread/message state remain unchanged; this plan adds a thread list on top.

**Tech Stack:** Express, `@mastra/memory` (already installed), React, CSS

---

## File Map

| File | Change |
|------|--------|
| `src/api/server.ts` | Add `GET /api/threads` endpoint |
| `src/web/styles.css` | Replace centered-card layout with two-column flex; add sidebar classes |
| `src/web/main.tsx` | Add `Thread` type, `threads` state, `fetchThreads`, sidebar JSX, thread selection, post-reply refresh |

---

### Task 1: Add GET /api/threads endpoint

**Files:**
- Modify: `src/api/server.ts`

- [ ] **Step 1: Check the Mastra Memory thread-listing API**

```bash
grep -r "getThreadsByResourceId\|getThreads\|listThreads" /Users/chaoliu/Documents/repo/chat-bot-example/node_modules/@mastra/memory/dist --include="*.d.ts" | head -10
```

Note the exact method name and return type. The return value is likely an array of thread objects with at minimum `id` and `createdAt` fields.

- [ ] **Step 2: Add the GET /api/threads route to server.ts**

Add this block immediately before the existing `app.get("/api/threads/:threadId", ...)` route:

```typescript
app.get("/api/threads", async (_req, res) => {
  try {
    const memory = await chatAgent.getMemory();
    if (!memory) return res.json({ threads: [] });

    const rawThreads = await memory.getThreadsByResourceId({ resourceId: "local-user" });

    const threads = await Promise.all(
      rawThreads.map(async (thread: { id: string; createdAt: string | Date }) => {
        const { messages } = await memory.recall({
          threadId: thread.id,
          resourceId: "local-user"
        });
        const firstUser = messages.find((m: { role: string }) => m.role === "user");
        const part = firstUser?.content?.parts?.find(
          (p: { type: string }) => p.type === "text"
        ) as { type: string; text: string } | undefined;
        const title = part?.text?.slice(0, 80) ?? "New conversation";
        return {
          id: thread.id,
          title,
          createdAt: typeof thread.createdAt === "string"
            ? thread.createdAt
            : new Date(thread.createdAt).toISOString()
        };
      })
    );

    threads.sort(
      (a: { createdAt: string }, b: { createdAt: string }) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ threads });
  } catch {
    logServer("Failed to fetch thread list.");
    res.json({ threads: [] });
  }
});
```

> **If Step 1 shows a different method name** (e.g. `listThreads`, `getThreads`), update the call accordingly. The return shape and the rest of the logic stay the same.

- [ ] **Step 3: Check TypeScript**

```bash
cd /Users/chaoliu/Documents/repo/chat-bot-example && npx tsc --noEmit 2>&1 | head -20
```

Fix any type errors by adjusting the type assertions to match the actual return types shown by the compiler.

- [ ] **Step 4: Start the server and test the endpoint**

```bash
npm run dev:api
```

```bash
curl http://localhost:3001/api/threads
```

Expected before any conversations: `{"threads":[]}`. If conversations exist in `storage.db`, they should appear with titles.

- [ ] **Step 5: Commit**

```bash
git add src/api/server.ts
git commit -m "feat: add GET /api/threads endpoint"
```

---

### Task 2: Update CSS for two-column layout and sidebar

**Files:**
- Modify: `src/web/styles.css`

The current `.chat-shell` centers a card; the new layout fills the full viewport with a sidebar on the left and the chat on the right.

- [ ] **Step 1: Replace the .chat-shell rule**

Find:
```css
.chat-shell {
  min-height: 100vh;
  padding: 32px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), transparent 240px),
    #f4f1ea;
}
```

Replace with:
```css
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #fffdfa;
}
```

- [ ] **Step 2: Replace the .chat-panel rule**

Find:
```css
.chat-panel {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  width: min(920px, 100%);
  min-height: calc(100vh - 64px);
  margin: 0 auto;
  border: 1px solid #d8d1c5;
  border-radius: 8px;
  background: #fffdfa;
  box-shadow: 0 18px 50px rgba(34, 28, 20, 0.08);
  overflow: hidden;
}
```

Replace with:
```css
.chat-panel {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  flex: 1;
  min-width: 0;
  height: 100vh;
  background: #fffdfa;
  overflow: hidden;
}
```

- [ ] **Step 3: Add sidebar CSS**

After the `.chat-panel` rule, add:

```css
.sidebar {
  width: 260px;
  flex: 0 0 260px;
  height: 100vh;
  background: #2c2925;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #1e1c19;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px 12px 12px;
  flex: 0 0 auto;
}

.new-chat-btn {
  width: 100%;
  height: 40px;
  border: 0;
  border-radius: 8px;
  background: #254c7d;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.new-chat-btn:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.new-chat-btn:not(:disabled):hover {
  background: #1e3f6a;
}

.sidebar-threads {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 16px;
}

.thread-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #e8e0d5;
  text-align: left;
  cursor: pointer;
}

.thread-item:hover {
  background: #353028;
}

.thread-item.active {
  background: #3d3830;
}

.thread-title {
  display: block;
  font-size: 14px;
  line-height: 1.3;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.thread-time {
  display: block;
  font-size: 12px;
  color: #9b8f82;
}
```

- [ ] **Step 4: Update the mobile media query**

Find the existing `@media (max-width: 640px)` block and replace it with:

```css
@media (max-width: 640px) {
  .app-shell {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    flex: 0 0 auto;
    border-right: 0;
    border-bottom: 1px solid #1e1c19;
  }

  .sidebar-threads {
    display: none;
  }

  .chat-panel {
    height: auto;
    min-height: 0;
    flex: 1;
  }

  .message {
    max-width: 92%;
  }

  .composer {
    grid-template-columns: 1fr;
  }

  .composer button {
    width: 100%;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/web/styles.css
git commit -m "feat: add sidebar CSS and two-column layout"
```

---

### Task 3: Wire sidebar in main.tsx

**Files:**
- Modify: `src/web/main.tsx`

- [ ] **Step 1: Add Thread type after the existing ChatMessage type**

Find:
```typescript
type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};
```

Add after it:
```typescript
type Thread = {
  id: string;
  title: string;
  createdAt: string;
};
```

- [ ] **Step 2: Add formatRelativeTime helper after the extractSseFrames function**

Find the end of `extractSseFrames`:
```typescript
function extractSseFrames(buffer: string) {
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";
  return { frames: parts, remainder };
}
```

Add after it:
```typescript
function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}
```

- [ ] **Step 3: Add threads state and fetchThreads inside App**

After the existing `const [threadId, setThreadId] = useState<string>(getOrCreateThreadId);` line, add:

```typescript
const [threads, setThreads] = useState<Thread[]>([]);

function fetchThreads() {
  fetch("/api/threads")
    .then((r) => r.json())
    .then(({ threads: list }: { threads: Thread[] }) => setThreads(list))
    .catch(() => {});
}
```

- [ ] **Step 4: Add useEffect to fetch threads on mount**

After the existing `useEffect` that fetches thread messages, add:

```typescript
useEffect(() => {
  fetchThreads();
}, []);
```

- [ ] **Step 5: Add handleSelectThread helper inside App**

After `fetchThreads`, add:

```typescript
function handleSelectThread(id: string) {
  localStorage.setItem(THREAD_ID_KEY, id);
  setThreadId(id);
  setMessages(initialMessages);
}
```

- [ ] **Step 6: Refresh threads after each reply**

Inside `handleSubmit`, find the `finally` block:
```typescript
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
```

Replace with:
```typescript
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
      fetchThreads();
    }
```

- [ ] **Step 7: Replace the outer JSX structure**

Find:
```tsx
  return (
    <main className="chat-shell">
      <section className="chat-panel" aria-label="Chat conversation">
```

Replace with:
```tsx
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <button
            className="new-chat-btn"
            type="button"
            disabled={isStreaming}
            onClick={() => {
              localStorage.removeItem(THREAD_ID_KEY);
              setThreadId(getOrCreateThreadId());
              setMessages(initialMessages);
            }}
          >
            New Chat
          </button>
        </div>
        <div className="sidebar-threads">
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className={`thread-item${thread.id === threadId ? " active" : ""}`}
              onClick={() => handleSelectThread(thread.id)}
            >
              <span className="thread-title">{thread.title}</span>
              <span className="thread-time">{formatRelativeTime(thread.createdAt)}</span>
            </button>
          ))}
        </div>
      </aside>
      <main className="chat-panel" aria-label="Chat conversation">
```

- [ ] **Step 8: Remove the old New Chat button from the header and fix closing tags**

Find the old header with the New Chat button:
```tsx
        <header className="chat-header">
          <div>
            <h1>Mastra SSE Chat</h1>
            <p>POST a message, stream the agent response back as SSE.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              disabled={isStreaming}
              onClick={() => {
                localStorage.removeItem(THREAD_ID_KEY);
                setThreadId(getOrCreateThreadId());
                setMessages(initialMessages);
              }}
            >
              New Chat
            </button>
            <span className={isStreaming ? "status live" : "status"} />
          </div>
        </header>
```

Replace with:
```tsx
        <header className="chat-header">
          <div>
            <h1>Mastra SSE Chat</h1>
            <p>POST a message, stream the agent response back as SSE.</p>
          </div>
          <span className={isStreaming ? "status live" : "status"} />
        </header>
```

Then find the closing tags at the bottom of the return:
```tsx
      </section>
    </main>
```

Replace with:
```tsx
      </main>
    </div>
```

- [ ] **Step 9: TypeScript check**

```bash
cd /Users/chaoliu/Documents/repo/chat-bot-example && npx tsc --noEmit 2>&1 | head -20
```

Fix any errors before committing.

- [ ] **Step 10: Commit**

```bash
git add src/web/main.tsx
git commit -m "feat: add conversation sidebar with thread list and selection"
```

- [ ] **Step 11: Smoke test**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:

1. Dark sidebar appears on the left, chat panel fills the right
2. "New Chat" button is styled (dark blue, matches Send button)
3. Past conversations appear in the sidebar (if `storage.db` has threads)
4. Clicking a thread loads its messages
5. Sending a message refreshes the sidebar and the thread appears/updates
6. Clicking "New Chat" resets the chat and the new thread appears after first reply
