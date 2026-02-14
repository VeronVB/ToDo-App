# 📋 TODO App - Project Context

## 🎯 What is this?
A modern, **Things 3-inspired** task management application built as a monorepo. It features natural language processing for task entry, hierarchical subtasks, drag-and-drop organization, and a highly customizable UI with themes and layout density options. It uses a local SQLite database for speed and simplicity.

## ✨ Current Status
**Version:** 2.0.0
**Stage:** Active Development / Functional MVP
**Last Updated:** 2026-02-10

**What Works:**
- ✅ **Tasks CRUD:** Create (with NLP), Read, Update, Delete.
- ✅ **Subtasks:** Infinite nesting (UI limited to useful depth), recursive rendering.
- ✅ **Drag & Drop:** Native HTML5 implementation supporting reordering and nesting.
- ✅ **Natural Language Input:** Parsing dates ("tomorrow"), priorities ("!high"), and projects ("@Work").
- ✅ **Settings & Customization:**
    - **Themes:** Light/Dark/System + Accent Colors (Zinc, Red, Orange, etc.).
    - **Layout:** Compact/Comfortable/Spacious density.
    - **Shortcuts Scheme:** Windows/Mac/Linux/Default keybindings.
    - **Default Due Date:** Logic to auto-set "Today" on project selection.
- ✅ **API Security:** Bearer Token authentication for external access (API Tokens management in UI).
- ✅ **Internationalization (i18n):** Full English and Polish support.

**What's Missing/Broken:**
- ❌ **Search:** `Ctrl+K` UI exists but logic is not implemented.
- ⏳ **Tags:** Database support likely needed, UI missing.
- ⏳ **Recurring Tasks Logic:** Database column exists (`recurrence`), UI exists, but backend background job for generating instances is missing.
- ⏳ **Smart Filters Logic:** "Upcoming" and "Logbook" logic is basic; "Anytime"/"Someday" views are placeholders.

**Known Issues:**
- Dragging a task into a deeply nested child (depth > 2) is visually blocked (intended behavior) but user feedback could be clearer.
- Textarea expansion in `TaskFormDialog` can sometimes be jumpy on initial render.

---

## 🛠️ Technology Stack

### Frontend (`apps/frontend`)
- **Framework:** SvelteKit 2.x (Svelte 5 Runes `$state`, `$derived`, `$effect`)
- **Language:** TypeScript
- **UI Library:** shadcn-svelte (bits-ui under the hood)
- **Styling:** Tailwind CSS 4.0
- **Icons:** @lucide/svelte
- **i18n:** svelte-i18n
- **Date Handling:** @internationalized/date, chrono-node (NLP)

### Backend (`apps/backend`)
- **Framework:** Fastify 5.x
- **Runtime:** Node.js (tsx for dev)
- **Database:** SQLite (better-sqlite3 11.x)
- **Validation:** Zod
- **Auth:** @fastify/jwt
- **CORS:** @fastify/cors

### Shared (`packages/shared`)
- **Purpose:** Shared TypeScript interfaces (`ITask`, `ISettings`, `IApiToken`) used by both frontend and backend to ensure type safety.

---

## 📁 Project Structure

```
todo-app/
├── apps/
│   ├── backend/              # Fastify API Server
│   │   ├── src/
│   │   │   ├── server.ts     # Entry point, JWT/CORS config, Hooks
│   │   │   ├── db/
│   │   │   │   ├── client.ts      # DB connection
│   │   │   │   ├── migrate.ts     # Migration runner
│   │   │   │   └── migrations/    # SQL files (001-006)
│   │   │   ├── routes/
│   │   │   │   ├── tasks.ts       # CRUD + Move logic
│   │   │   │   ├── settings.ts    # User preferences
│   │   │   │   ├── auth.ts        # API Tokens management
│   │   │   │   └── categories.ts  # Projects/Lists
│   │   └── data/                  # todo.db location
│   │
│   └── frontend/             # SvelteKit App
│       ├── src/
│       │   ├── routes/
│       │   │   ├── +layout.svelte    # Global state init, Shortcuts, Theming
│       │   │   └── +page.svelte      # Main Dashboard View
│       │   ├── lib/
│       │   │   ├── components/
│       │   │   │   ├── ui/           # shadcn primitives
│       │   │   │   ├── TaskList.svelte # Recursive list + DnD logic
│       │   │   │   ├── TaskItem.svelte # Individual task + Subtasks
│       │   │   │   ├── TaskFormDialog.svelte # Add/Edit + NLP
│       │   │   │   ├── SettingsDialog.svelte # Preferences + API Tokens
│       │   │   │   └── RichTaskInput.svelte # Textarea with highlighting
│       │   │   ├── stores/
│       │   │   │   ├── tasks.svelte.ts    # Tasks state
│       │   │   │   ├── settings.svelte.ts # Settings state
│       │   │   │   └── ui.svelte.ts       # Modal states
│       │   │   ├── api/
│       │   │   │   └── client.ts     # Fetch wrappers
│       │   │   ├── assets/
│       │   │   │   ├── app.css       # Tailwind base
│       │   │   │   └── themes.css    # Color definitions (accent/primary)
│       │   │   └── i18n/             # Locales (en.json, pl.json)
│
├── packages/
│   └── shared/              # Shared Types
│       └── src/
│           └── index.ts     # Interfaces
│
├── package.json             # Workspace root
└── README-ME.md             # 👈 YOU ARE HERE
```

---

## 🗄️ Database Schema (SQLite)

### Key Tables

#### `tasks`
Core table. Supports hierarchy via `parent_id`.
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT 0,
  priority TEXT DEFAULT 'medium',          -- 'low'|'medium'|'high'
  category_id INTEGER,                     -- Link to Project/Category
  parent_id INTEGER,                       -- Recursive Subtasks
  position INTEGER DEFAULT 0,              -- Sorting order
  depth INTEGER DEFAULT 0,                 -- Nesting level (0=root)
  due_date DATETIME,
  recurrence TEXT DEFAULT 'none',          -- 'daily'|'weekly'|'monthly'
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

#### `settings`
Single row configuration (user_id=1).
```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  site_name TEXT,
  language TEXT,             -- 'en'|'pl'
  color_scheme TEXT,         -- 'nord'|'dracula'|... (legacy/base)
  layout TEXT,               -- 'compact'|'comfortable'|'spacious'
  confirm_delete BOOLEAN,
  shortcut_scheme TEXT,      -- 'default'|'windows'|'mac'|'linux'
  theme_color TEXT,          -- 'zinc'|'orange'|'violet'...
  default_due_date TEXT      -- 'none'|'today'
);
```

#### `api_tokens`
For external API access.
```sql
CREATE TABLE api_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Migrations History
- `001`: Initial schema.
- `002`: Added `recurrence` to tasks.
- `003`: Added `shortcut_scheme` to settings.
- `004`: Added `theme_color` to settings.
- `005`: Added `default_due_date` to settings.
- `006`: Created `api_tokens` table.

---

## 🔌 API Endpoints

**Base:** `http://localhost:3000/api`
**Auth:** Headers: `Authorization: Bearer <token>` (Bypassed for localhost)

### Tasks
- `GET /tasks` - Returns task tree (nested children). Query: `?view=inbox|today...`
- `POST /tasks` - Create task. Body: `{ title, parentId?, ... }`
- `PATCH /tasks/:id` - Update task fields.
- `DELETE /tasks/:id` - Delete task (cascades to children).
- `POST /tasks/:id/move` - **Critical:** Handles DnD reordering/nesting.
  - Body: `{ parentId: number|null, newPosition: number }`

### Settings
- `GET /settings` - Get current config.
- `PUT /settings` - Update config.

### Auth (API Tokens)
- `GET /tokens` - List active tokens.
- `POST /tokens` - Generate new token (returns token once).
- `DELETE /tokens/:id` - Revoke token.

---

## 🎨 Frontend Components & Styling

### Design System
- **Source:** shadcn-svelte (Tailwind).
- **Theming:** Dynamic CSS variables in `themes.css`.
- **Logic:** `+layout.svelte` watches `settingsStore` and applies `theme-{color}` class to `<body>` and `data-layout` attribute to `<html>`.

### Key Components
- **`TaskList.svelte`:** The heart of the app. Handles:
  - Recursive rendering of `TaskItem`.
  - Drag and Drop logic (Native HTML5 API).
  - Calculating drop zones (above/below/child).
- **`TaskItem.svelte`:** Displays task. Handles:
  - "Expand" state for details.
  - "Expand Children" state for subtasks.
  - Visual drop indicators.
  - Editing trigger.
- **`TaskFormDialog.svelte`:**
  - Uses `chrono-node` for NLP.
  - Smart logic: Sets due date to "Today" if a category is picked (and setting is enabled).
- **`RichTaskInput.svelte`:**
  - Custom textarea with syntax highlighting for tags/dates.
  - Fixed cursor alignment issues by removing padding padding.

---

## 🔄 State Management

Using **Svelte 5 Runes** inside `.svelte.ts` files (not Svelte 4 `writable` stores).

### `stores/tasks.svelte.ts`
- `tasks`: `$state(ITask[])` - Holds the full tree.
- `fetchTasks()`: Reloads from API.
- `optimistic updates`: UI updates immediately before API response (mostly).

### `stores/settings.svelte.ts`
- `settings`: `$state(ISettings)`
- Updates trigger side-effects in layout (theme change, layout density).

---

## 🚀 Development Workflow

### Prerequisites
- Node.js 20+ (using v22/v24 ideally)
- pnpm

### Commands

**Root:**
```bash
pnpm dev          # Start Frontend (5173) + Backend (3000)
pnpm db:migrate   # Run pending migrations (backend)
pnpm build        # Build all
```

**Database:**
The DB is at `apps/backend/data/todo.db`.
To reset:
```bash
rm apps/backend/data/todo.db
pnpm db:migrate
pnpm db:seed
```

### Common Pitfalls
1. **LSP Errors:** If you change shared types, VS Code/Cursor might not pick it up immediately. Restart TS server or ignore if build passes.
2. **DnD Logic:** It's complex. `TaskList` handles the logic, `TaskItem` handles the events and visuals.
3. **Themes:** `themes.css` overrides shadcn variables (`--primary`, `--ring`, `--accent`). Ensure you edit this file if adding new colors.

---

## 📋 TODO & Roadmap

### Immediate
- [ ] **Search:** Implement logic in `handleKeydown` (cmd+k) and search API.
- [ ] **Sidebar Active State:** Ensure "Inbox" vs "Project" highlight logic is robust.

### Short-term
- [ ] **Tags:** Add database table, API, and `#tag` parsing in `RichTaskInput`.
- [ ] **Optimistic UI:** Improve DnD smoothness (reduce flicker on drop).

### Long-term
- [ ] **Calendar View:** Visual representation of due dates.
- [ ] **Notes/Markdown:** Rich text description.

---

## 🚀 Quick Start for New AI

1.  **Verify Environment:**
    ```bash
    pnpm dev
    ```
2.  **Verify DB:**
    ```bash
    curl http://localhost:3000/api/settings
    ```
3.  **UI Check:**
    - Open `http://localhost:5173`.
    - Try adding a task: "Buy milk tomorrow !high".
    - Check if "tomorrow" turns green and "!high" turns red.
    - Go to Settings -> Appearance -> Change Accent Color.

**Where to find code:**
- **Logic for moving tasks:** `apps/frontend/src/lib/components/TaskList.svelte` (`handleDrop`) + `apps/backend/src/routes/tasks.ts`.
- **Logic for NLP:** `apps/frontend/src/lib/components/TaskFormDialog.svelte` (`parseNaturalLanguage`).
- **Styling:** `apps/frontend/src/lib/assets/themes.css`.

**Note:** Always read the file before editing. Use `grep` to find usage. Use `tree` to verify structure.
