# Todo App — Advanced Features Extension

## Overview
30+ advanced features added across database, backend API, shared types, API client, and 21 Svelte 5 frontend components.

---

## Architecture

### Database (Migration 012)
- `task_dependencies` — Task blocking/dependency graph with circular dependency prevention
- `task_templates` — Reusable task templates with subtasks and tags
- `saved_filters` — Smart lists with JSON filter configuration
- `activity_log` — Audit trail for all task actions
- `task_reminders` — Scheduled reminders with notification support
- `notes_markdown` column on tasks for rich text

### Backend Routes
| Route File | Endpoints |
|---|---|
| `dependencies.ts` | GET/POST/DELETE task dependencies, circular check |
| `templates.ts` | CRUD templates, POST `/templates/:id/use` creates task |
| `advanced.ts` | Saved filters, activity log, reminders, batch actions, morning briefing, productivity stats, import/export, category progress |

### Shared Types (`packages/shared/src/index.ts`)
`ITaskDependency`, `ITaskTemplate`, `ISavedFilter`, `IFilterConfig`, `IActivityLog`, `ITaskReminder`, `IMorningBriefing`, `IProductivityStats`, `EisenhowerQuadrant`, `KanbanGroupBy`

### API Client (`apps/frontend/src/lib/api/client.ts`)
Complete typed client with all endpoints for dependencies, templates, filters, activity log, reminders, batch actions, briefing, stats, import/export.

---

## Frontend Components (21 total)

### Core Views
| Component | Description |
|---|---|
| **AppLayout.svelte** | Main layout: sidebar + content + floating elements, global ⌘K shortcut, keyboard nav |
| **Sidebar.svelte** | Full navigation: main views, advanced views, tools, projects with progress bars, tags, saved filters |

### Advanced Views
| Component | Description |
|---|---|
| **EisenhowerMatrix.svelte** | 2×2 urgency/importance grid, auto-classifies by due date & priority |
| **KanbanBoard.svelte** | Drag & drop columns, group by priority/status/project |
| **MorningBriefing.svelte** | Daily overview: greeting, stats cards, overdue alerts, today's tasks |
| **ProductivityDashboard.svelte** | 30-day completion chart, streaks, completion rate, overview cards |
| **FocusMode.svelte** | Pomodoro timer (25/5/15), circular progress, session tracking, browser notifications |
| **WeeklyReview.svelte** | Guided 4-step review: completed → overdue → plan → celebrate |

### Task Enhancements
| Component | Description |
|---|---|
| **DueDateChip.svelte** | Color-coded date badges (overdue/today/tomorrow/soon/future) |
| **TaskDependencies.svelte** | Manage blockers/dependents with search, circular dep protection |
| **TaskReminders.svelte** | Set reminders with quick presets (30min/1h/3h/tomorrow) + custom datetime |
| **MarkdownEditor.svelte** | Split edit/preview, toolbar (bold/italic/code/headers/links), built-in renderer |

### Management
| Component | Description |
|---|---|
| **TaskTemplates.svelte** | Create/use/delete task templates with subtasks and tags |
| **SavedFilters.svelte** | Smart lists: filter by priority, status, tags, due dates, project |
| **ActivityLog.svelte** | Grouped-by-date activity timeline with icons and relative timestamps |
| **ImportExport.svelte** | Download/restore data as JSON |

### UI Infrastructure
| Component | Description |
|---|---|
| **QuickCapture.svelte** | Floating input with NLP: `@project #tag !priority` + Polish/English dates |
| **BatchActionsToolbar.svelte** | Multi-select: complete, delete, move, change priority |
| **UndoToast.svelte** | Toast notifications with undo action (8s auto-dismiss) |
| **EmptyState.svelte** | View-specific illustrations and messages |
| **KeyboardShortcuts.svelte** | Help overlay showing all available shortcuts |

### Stores
| Store | Purpose |
|---|---|
| **app.svelte.ts** | View state, 18 view types, batch selection, sidebar toggle |
| **undo.svelte.ts** | Undo action queue with auto-expire and task restoration |

---

## Keyboard Shortcuts
| Key | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Quick Capture |
| `1` / `2` / `3` | Inbox / Today / Upcoming |
| `B` | Toggle batch mode |
| `Esc` | Exit batch mode |

---

## Integration Guide

1. **Run migration 012** on backend startup
2. **Register routes** in `server.ts` (already done)
3. **Use `<AppLayout>`** as root wrapper — it includes Sidebar, QuickCapture, UndoToast, BatchActionsToolbar
4. **Pass tasks/projects/tags** as props to AppLayout
5. **Add TaskDependencies + TaskReminders + MarkdownEditor** to your task detail dialog
6. **Install chrono-node** for NLP date parsing: `npm install chrono-node`