# Chat History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent chat history to the Mastra SSE chat bot using Mastra Memory backed by a local LibSQL (SQLite) `storage.db` file.

**Architecture:** Attach `Memory` (with `LibSQLStore`) to `chatAgent` so Mastra reads/writes conversation history automatically. The API accepts a `threadId` instead of the full message array. The browser persists `threadId` in `localStorage` and fetches stored history on page load.

**Tech Stack:** `@mastra/memory`, `@mastra/libsql`, React `localStorage`, Express

---

## File Map

| File | Change |
|------|--------|
| `package.json` | Add `@mastra/memory`, `@mastra/libsql` via npm install |
| `.gitignore` | Add `storage.db` |
| `src/mastra/agents/chat-agent.ts` | Add `Memory` with `LibSQLStore` |
| `src/api/server.ts` | Update `POST /api/chat` schema + handler; add `GET /api/threads/:threadId` |
| `src/web/main.tsx` | Persist `threadId` in `localStorage`, fetch history on mount, update submit, add New Chat button |

---

### Task 1: Install packages and ignore the database file

**Files:**
- Modify: `package.json` (via npm)
- Modify: `.gitignore`

- [ ] **Step 1: Install Mastra memory and LibSQL packages**

```bash
npm install @mastra/memory@latest @mastra/libsql@latest
```

Expected: both packages appear in `package.json` dependencies, no errors.

- [ ] **Step 2: Add storage.db to .gitignore**

Check if `.gitignore` exists:

```bash
ls .gitignore 2>/dev/null || echo "missing"
```

If it exists, append to it. If missing, create it. Either way the file should contain:

```
storage.db
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "feat: install @mastra/memory and @mastra/libsql"
```

---

### Task 2: Add Memory to chatAgent

**Files:**
- Modify: `src/mastra/agents/chat-agent.ts`

- [ ] **Step 1: Verify the Memory import path after install**

```bash
grep -r "class Memory" node_modules/@mastra/memory/dist --include="*.d.ts" -l | head -3
```

Expected: shows a `.d.ts` file. The import `from "@mastra/memory"` should work.

- [ ] **Step 2: Replace the entire chat-agent.ts**

```typescript
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

export const chatAgent = new Agent({
  id: "chat-agent",
  name: "Chat Agent",
  instructions:
    "You are a helpful general-purpose assistant. Answer clearly and concisely, and ask a brief follow-up question only when the user's request is ambiguous.",
  model: "openai/gpt-5.4",
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:./storage.db",
    }),
  }),
});
```

- [ ] **Step 3: Start the API server to confirm no errors**

```bash
npm run dev:api
```

Expected: server starts cleanly, no TypeScript or import errors.

- [ ] **Step 4: Commit**

```bash
git add src/mastra/agents/chat-agent.ts
git commit -m "feat: add LibSQL memory to chatAgent"
```

---

### Task 3: Update POST /api/chat to accept threadId

**Files:**
- Modify: `src/api/server.ts`

The request body changes from `{ messages: [...] }` to `{ message: string, threadId: string }`. Mastra fetches conversation history from the DB automatically.

- [ ] **Step 1: Replace the schema and type near the top of server.ts**

Find this block (lines 11–22):

```typescript
const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      })
    )
    .min(1)
});

type ChatMessage = z.infer<typeof chatRequestSchema>["messages"][number];
```

Replace with:

```typescript
const chatRequestSchema = z.object({
  message: z.string().min(1),
  threadId: z.string().uuid()
});
```

- [ ] **Step 2: Replace parseChatRequest**

Find:

```typescript
function parseChatRequest(body: unknown): ChatMessage[] {
  const parsed = chatRequestSchema.parse(body);
  const latestMessage = parsed.messages.at(-1);

  if (latestMessage?.role !== "user" || latestMessage.content.trim() === "") {
    throw new Error("The latest message must be a non-empty user message.");
  }

  return parsed.messages.map((message) => ({
    ...message,
    content: message.content.trim()
  }));
}
```

Replace with:

```typescript
function parseChatRequest(body: unknown): { message: string; threadId: string } {
  const parsed = chatRequestSchema.parse(body);
  return { message: parsed.message.trim(), threadId: parsed.threadId };
}
```

- [ ] **Step 3: Replace streamAgentResponse**

Find:

```typescript
async function streamAgentResponse(
  messages: ChatMessage[],
  res: express.Response,
  abortSignal: AbortSignal
) {
  const stream = await chatAgent.stream(messages, { abortSignal });
  let chunkCount = 0;

  for await (const text of stream.textStream) {
    chunkCount += 1;
    writeSseEvent(res, "delta", { text });
  }

  logServer("Finished streaming agent response.", { chunkCount });
  writeSseEvent(res, "done", {});
}
```

Replace with:

```typescript
async function streamAgentResponse(
  message: string,
  threadId: string,
  res: express.Response,
  abortSignal: AbortSignal
) {
  const stream = await chatAgent.stream(
    [{ role: "user", content: message }],
    {
      resourceId: "local-user",
      threadId,
      memoryOptions: { lastMessages: 20 },
      abortSignal
    }
  );
  let chunkCount = 0;

  for await (const text of stream.textStream) {
    chunkCount += 1;
    writeSseEvent(res, "delta", { text });
  }

  logServer("Finished streaming agent response.", { chunkCount });
  writeSseEvent(res, "done", {});
}
```

- [ ] **Step 4: Update the POST /api/chat route handler body**

Inside `app.post("/api/chat", ...)`, find:

```typescript
    logServer("Received chat request.");
    const messages = parseChatRequest(req.body);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing. Add it to .env and restart the dev server.");
    }

    prepareSseResponse(res);
    streamStarted = true;
    logServer("Started SSE stream.", { messageCount: messages.length });

    await streamAgentResponse(messages, res, abortController.signal);
```

Replace with:

```typescript
    logServer("Received chat request.");
    const { message, threadId } = parseChatRequest(req.body);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing. Add it to .env and restart the dev server.");
    }

    prepareSseResponse(res);
    streamStarted = true;
    logServer("Started SSE stream.", { threadId });

    await streamAgentResponse(message, threadId, res, abortController.signal);
```

- [ ] **Step 5: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/api/server.ts
git commit -m "feat: update /api/chat to accept threadId and use Mastra memory"
```

---

### Task 4: Add GET /api/threads/:threadId endpoint

**Files:**
- Modify: `src/api/server.ts`

- [ ] **Step 1: Check the Memory query API from embedded docs**

```bash
ls node_modules/@mastra/memory/dist/docs/references/ 2>/dev/null || echo "no embedded docs"
grep -r "getMessages\|query\b" node_modules/@mastra/memory/dist/docs/references/ 2>/dev/null | head -20
```

Note the exact method name and parameters for retrieving stored messages. Common signatures:
- `memory.query({ resourceId, threadId })`
- `memory.getMessages({ threadId, resourceId })`

- [ ] **Step 2: Add the route to server.ts before app.listen**

Add this block immediately before `app.listen(port, ...)`:

```typescript
app.get("/api/threads/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const memory = chatAgent.getMemory();
    if (!memory) {
      return res.json({ messages: [] });
    }

    const result = await memory.query({
      resourceId: "local-user",
      threadId,
      selectBy: { last: 100 }
    });

    const messages = (result.messages ?? []).map((m: { role: string; content: unknown }) => ({
      role: m.role as "user" | "assistant",
      content: typeof m.content === "string" ? m.content : ""
    }));

    res.json({ messages });
  } catch {
    logServer("Failed to fetch thread history.", { threadId });
    res.json({ messages: [] });
  }
});
```

> **If the memory API differs from what embedded docs show in Step 1**, update the `memory.query(...)` call to match. The endpoint must return `{ messages: Array<{ role: "user"|"assistant", content: string }> }`.

- [ ] **Step 3: Test the endpoint manually**

Start the server:

```bash
npm run dev:api
```

Hit the endpoint with a non-existent thread:

```bash
curl http://localhost:3001/api/threads/00000000-0000-0000-0000-000000000000
```

Expected: `{"messages":[]}`

- [ ] **Step 4: Commit**

```bash
git add src/api/server.ts
git commit -m "feat: add GET /api/threads/:threadId history endpoint"
```

---

### Task 5: Update the frontend

**Files:**
- Modify: `src/web/main.tsx`

- [ ] **Step 1: Replace the React import line to add useEffect**

Find:

```typescript
import React, { FormEvent, useMemo, useRef, useState } from "react";
```

Replace with:

```typescript
import React, { FormEvent, useEffect, useRef, useState } from "react";
```

(`useMemo` is removed since `apiMessages` is no longer needed; `useEffect` is added for history fetch.)

- [ ] **Step 2: Add threadId helpers after the imports**

After the import block and before the `type ChatRole` line, add:

```typescript
const THREAD_ID_KEY = "chat_thread_id";

function getOrCreateThreadId(): string {
  const existing = localStorage.getItem(THREAD_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(THREAD_ID_KEY, id);
  return id;
}
```

- [ ] **Step 3: Add threadId state and history fetch inside App**

Inside the `App` function, after the existing `useState` declarations, add:

```typescript
const [threadId, setThreadId] = useState<string>(getOrCreateThreadId);

useEffect(() => {
  fetch(`/api/threads/${threadId}`)
    .then((r) => r.json())
    .then(({ messages: history }: { messages: Array<{ role: ChatRole; content: string }> }) => {
      if (history.length === 0) return;
      setMessages([
        ...initialMessages,
        ...history.map((m) => ({ id: crypto.randomUUID(), role: m.role, content: m.content }))
      ]);
    })
    .catch(() => {});
}, [threadId]);
```

- [ ] **Step 4: Remove the apiMessages useMemo block**

Find and delete this entire block:

```typescript
  const apiMessages = useMemo(
    () =>
      messages
        .filter((message) => message.content.trim() !== "")
        .map(({ role, content }) => ({ role, content })),
    [messages]
  );
```

- [ ] **Step 5: Update the streamChatResponse call in handleSubmit**

Find:

```typescript
      await streamChatResponse(
        [...apiMessages, { role: "user", content: prompt }],
        assistantMessage.id
      );
```

Replace with:

```typescript
      await streamChatResponse(prompt, threadId, assistantMessage.id);
```

- [ ] **Step 6: Update the streamChatResponse function signature and fetch body**

Find:

```typescript
  async function streamChatResponse(
    requestMessages: Array<{ role: ChatRole; content: string }>,
    assistantMessageId: string
  ) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: requestMessages })
    });
```

Replace with:

```typescript
  async function streamChatResponse(
    message: string,
    threadId: string,
    assistantMessageId: string
  ) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, threadId })
    });
```

(The rest of the function — reader loop, frame parsing — stays unchanged.)

- [ ] **Step 7: Add New Chat button to the header**

Find:

```tsx
        <header className="chat-header">
          <div>
            <h1>Mastra SSE Chat</h1>
            <p>POST a message, stream the agent response back as SSE.</p>
          </div>
          <span className={isStreaming ? "status live" : "status"} />
        </header>
```

Replace with:

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

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: End-to-end smoke test**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:

1. Send a message — it streams back and appears in the chat.
2. Refresh the page — the conversation history is restored.
3. Send another message — it continues the conversation (agent remembers context).
4. Click "New Chat" — the UI resets to the initial greeting and a fresh conversation starts.
5. Confirm `storage.db` exists in the project root.

- [ ] **Step 10: Commit**

```bash
git add src/web/main.tsx
git commit -m "feat: persist chat thread in localStorage and restore history on load"
```
