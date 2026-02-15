import type { ITask, ISettings, ICategory, IApiToken, ITimeEntry, ITag, ITaskTemplate, ISavedFilter, IActivityLog, ITaskDependency, IMorningBriefing, IProductivityStats } from 'shared';

const API_BASE = 'http://localhost:3000/api';

// ═══ TASKS ═══
export async function getTasks(view?: string): Promise<ITask[] | { tasks: ITask[] }> {
  const query = view ? `?view=${view}` : '';
  const res = await fetch(`${API_BASE}/tasks${query}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function searchTasks(query: string): Promise<ITask[]> {
  if (!query) return [];
  const res = await fetch(`${API_BASE}/tasks?search=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search tasks');
  return res.json();
}

export async function createTask(data: Partial<ITask>): Promise<ITask> {
  const res = await fetch(`${API_BASE}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(id: number, data: Partial<ITask>): Promise<ITask> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
}

export async function moveTask(id: number, data: { parentId: number | null, newPosition: number }): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}/move`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to move task');
}

// ═══ BATCH ACTIONS ═══
export async function batchAction(taskIds: number[], action: string, data?: any): Promise<{ success: boolean; affected: number }> {
  const res = await fetch(`${API_BASE}/tasks/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskIds, action, data }) });
  if (!res.ok) throw new Error('Failed to perform batch action');
  return res.json();
}

// ═══ SETTINGS ═══
export async function getSettings(): Promise<ISettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(data: Partial<ISettings>): Promise<ISettings> {
  const res = await fetch(`${API_BASE}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

// ═══ CATEGORIES ═══
export async function getCategories(): Promise<ICategory[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getCategoriesWithProgress(): Promise<ICategory[]> {
  const res = await fetch(`${API_BASE}/categories/progress`);
  if (!res.ok) throw new Error('Failed to fetch categories with progress');
  return res.json();
}

export async function createCategory(data: Partial<ICategory>): Promise<ICategory> {
  const res = await fetch(`${API_BASE}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
}

// ═══ TOKENS ═══
export async function getTokens(): Promise<IApiToken[]> {
  const res = await fetch(`${API_BASE}/tokens`);
  if (!res.ok) throw new Error('Failed to fetch tokens');
  return res.json();
}

export async function createToken(name: string): Promise<{ token: string, id: number, name: string }> {
  const res = await fetch(`${API_BASE}/tokens`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
  if (!res.ok) throw new Error('Failed to create token');
  return res.json();
}

export async function deleteToken(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/tokens/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete token');
}

// ═══ TAGS ═══
export async function getTags(): Promise<ITag[]> {
  const res = await fetch(`${API_BASE}/tags`);
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}

// ═══ DEPENDENCIES ═══
export async function getTaskDependencies(taskId: number): Promise<ITaskDependency[]> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/dependencies`);
  if (!res.ok) throw new Error('Failed to fetch dependencies');
  return res.json();
}

export async function addTaskDependency(taskId: number, dependsOnId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/dependencies`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dependsOnId }) });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add dependency');
  }
}

export async function removeTaskDependency(taskId: number, depId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/dependencies/${depId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove dependency');
}

// ═══ TEMPLATES ═══
export async function getTemplates(): Promise<ITaskTemplate[]> {
  const res = await fetch(`${API_BASE}/templates`);
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function createTemplate(data: Partial<ITaskTemplate>): Promise<ITaskTemplate> {
  const res = await fetch(`${API_BASE}/templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create template');
  return res.json();
}

export async function useTemplate(templateId: number): Promise<{ taskId: number }> {
  const res = await fetch(`${API_BASE}/templates/${templateId}/use`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to use template');
  return res.json();
}

export async function deleteTemplate(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete template');
}

// ═══ SAVED FILTERS ═══
export async function getSavedFilters(): Promise<ISavedFilter[]> {
  const res = await fetch(`${API_BASE}/filters`);
  if (!res.ok) throw new Error('Failed to fetch filters');
  return res.json();
}

export async function createSavedFilter(data: Partial<ISavedFilter>): Promise<ISavedFilter> {
  const res = await fetch(`${API_BASE}/filters`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create filter');
  return res.json();
}

export async function deleteSavedFilter(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/filters/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete filter');
}

// ═══ ACTIVITY LOG ═══
export async function getActivityLog(taskId?: number, limit?: number): Promise<IActivityLog[]> {
  const params = new URLSearchParams();
  if (taskId) params.set('taskId', taskId.toString());
  if (limit) params.set('limit', limit.toString());
  const res = await fetch(`${API_BASE}/activity?${params}`);
  if (!res.ok) throw new Error('Failed to fetch activity log');
  return res.json();
}

// ═══ REMINDERS ═══
export async function getPendingReminders(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/reminders/pending`);
  if (!res.ok) throw new Error('Failed to fetch reminders');
  return res.json();
}

export async function addReminder(taskId: number, remindAt: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/reminders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ remindAt }) });
  if (!res.ok) throw new Error('Failed to add reminder');
}

export async function dismissReminder(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/reminders/${id}/dismiss`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to dismiss reminder');
}

// ═══ MORNING BRIEFING ═══
export async function getMorningBriefing(): Promise<IMorningBriefing> {
  const res = await fetch(`${API_BASE}/briefing`);
  if (!res.ok) throw new Error('Failed to fetch briefing');
  return res.json();
}

// ═══ STATS ═══
export async function getProductivityStats(): Promise<IProductivityStats> {
  const res = await fetch(`${API_BASE}/stats/productivity`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

// ═══ IMPORT/EXPORT ═══
export async function exportData(): Promise<any> {
  const res = await fetch(`${API_BASE}/export`);
  if (!res.ok) throw new Error('Failed to export');
  return res.json();
}

export async function importData(data: any): Promise<{ imported: number }> {
  const res = await fetch(`${API_BASE}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to import');
  return res.json();
}

// ═══ TIME ENTRIES ═══
export async function getTimeEntries(taskId?: number): Promise<ITimeEntry[]> {
  const query = taskId ? `?taskId=${taskId}` : '';
  const res = await fetch(`${API_BASE}/time_entries${query}`);
  if (!res.ok) throw new Error('Failed to fetch time entries');
  return res.json();
}

export async function getActiveTimer(): Promise<ITimeEntry | null> {
  const res = await fetch(`${API_BASE}/time_entries/active`);
  if (!res.ok) throw new Error('Failed to fetch active timer');
  return res.json();
}

export async function startTimeEntry(taskId: number, notes?: string): Promise<ITimeEntry> {
  const res = await fetch(`${API_BASE}/time_entries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId, notes }) });
  if (!res.ok) throw new Error('Failed to start timer');
  return res.json();
}

export async function stopTimeEntry(id: number, notes?: string): Promise<ITimeEntry> {
  const res = await fetch(`${API_BASE}/time_entries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop', notes }) });
  if (!res.ok) throw new Error('Failed to stop timer');
  return res.json();
}

export async function updateTimeEntry(id: number, notes: string): Promise<ITimeEntry> {
  const res = await fetch(`${API_BASE}/time_entries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', notes }) });
  if (!res.ok) throw new Error('Failed to update time entry');
  return res.json();
}

export async function deleteTimeEntry(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/time_entries/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete time entry');
}

export async function getTimeEntryStats(taskId: number): Promise<{ totalSessions: number; totalDuration: number; maxDuration: number }> {
  const res = await fetch(`${API_BASE}/time_entries/task/${taskId}/stats`);
  if (!res.ok) throw new Error('Failed to fetch time entry stats');
  return res.json();
}

// ═══ HABITS ═══
export interface IHabit {
  id: number;
  title: string;
  description?: string;
  streak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
  isHabit: boolean;
}

export interface IHabitHeatmap {
  data: Record<string, number>;
  streak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
}

export interface IHabitOverview {
  currentStreak: number;
  longestStreak: number;
  weekCompletions: number;
  yearCompletions: number;
  activeHabits: number;
  todayCompleted: number;
  totalHabits: number;
}

export async function getHabits(): Promise<IHabit[]> {
  const res = await fetch(`${API_BASE}/habits`);
  if (!res.ok) throw new Error('Failed to fetch habits');
  return res.json();
}

export async function createHabit(taskId: number): Promise<{ success: boolean; taskId: number }> {
  const res = await fetch(`${API_BASE}/habits/${taskId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create habit');
  return res.json();
}

export async function deleteHabit(habitId: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/habits/${habitId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete habit');
  return res.json();
}

export async function completeHabit(taskId: number): Promise<{ success: boolean; completedDate: string }> {
  const res = await fetch(`${API_BASE}/habits/${taskId}/complete`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to complete habit');
  return res.json();
}

export async function uncompleteHabit(taskId: number, date: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/habits/${taskId}/complete/${date}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to uncomplete habit');
  return res.json();
}

export async function getHabitHeatmap(taskId: number): Promise<IHabitHeatmap> {
  const res = await fetch(`${API_BASE}/habits/${taskId}/heatmap`);
  if (!res.ok) throw new Error('Failed to fetch habit heatmap');
  return res.json();
}

export async function getHabitOverview(): Promise<IHabitOverview> {
  const res = await fetch(`${API_BASE}/habits/overview`);
  if (!res.ok) throw new Error('Failed to fetch habit overview');
  return res.json();
}

export async function getHabitsHeatmap(year?: string): Promise<Record<number, { title: string; data: Record<string, number> }>> {
  const query = year ? `?year=${year}` : '';
  const res = await fetch(`${API_BASE}/habits/heatmap${query}`);
  if (!res.ok) throw new Error('Failed to fetch habits heatmap');
  return res.json();
}