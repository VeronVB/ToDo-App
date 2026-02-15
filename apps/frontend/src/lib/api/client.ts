import type { ITask, ISettings, ICategory, IApiToken, ITimeEntry } from 'shared';

const API_BASE = 'http://localhost:3000/api';

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
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(id: number, data: Partial<ITask>): Promise<ITask> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete task');
}

export async function moveTask(id: number, data: { parentId: number | null, newPosition: number }): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to move task');
}

export async function getSettings(): Promise<ISettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(data: Partial<ISettings>): Promise<ISettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

// Categories
export async function getCategories(): Promise<ICategory[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createCategory(data: Partial<ICategory>): Promise<ICategory> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete category');
}

// Tokens
export async function getTokens(): Promise<IApiToken[]> {
  const res = await fetch(`${API_BASE}/tokens`);
  if (!res.ok) throw new Error('Failed to fetch tokens');
  return res.json();
}

// Tags
export async function getTags(): Promise<import('shared').ITag[]> {
  const res = await fetch(`${API_BASE}/tags`);
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}

export async function createToken(name: string): Promise<{ token: string, id: number, name: string }> {
  const res = await fetch(`${API_BASE}/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create token');
  return res.json();
}

export async function deleteToken(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/tokens/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete token');
}

// Time Entries
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
  const res = await fetch(`${API_BASE}/time_entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, notes })
  });
  if (!res.ok) throw new Error('Failed to start timer');
  return res.json();
}

export async function stopTimeEntry(id: number, notes?: string): Promise<ITimeEntry> {
  const res = await fetch(`${API_BASE}/time_entries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'stop', notes })
  });
  if (!res.ok) throw new Error('Failed to stop timer');
  return res.json();
}

export async function updateTimeEntry(id: number, notes: string): Promise<ITimeEntry> {
  const res = await fetch(`${API_BASE}/time_entries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', notes })
  });
  if (!res.ok) throw new Error('Failed to update time entry');
  return res.json();
}

export async function deleteTimeEntry(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/time_entries/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete time entry');
}

export async function getTimeEntryStats(taskId: number): Promise<{ totalSessions: number; totalDuration: number; maxDuration: number }> {
  const res = await fetch(`${API_BASE}/time_entries/task/${taskId}/stats`);
  if (!res.ok) throw new Error('Failed to fetch time entry stats');
  return res.json();
}

// Habits
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
  const res = await fetch(`${API_BASE}/habits/${taskId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to create habit');
  return res.json();
}

export async function deleteHabit(habitId: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/habits/${habitId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete habit');
  return res.json();
}

export async function completeHabit(taskId: number): Promise<{ success: boolean; completedDate: string }> {
  const res = await fetch(`${API_BASE}/habits/${taskId}/complete`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to complete habit');
  return res.json();
}

export async function uncompleteHabit(taskId: number, date: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/habits/${taskId}/complete/${date}`, {
    method: 'DELETE'
  });
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
