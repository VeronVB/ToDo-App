import type { ITask, ISettings, ICategory, IApiToken } from 'shared';

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
