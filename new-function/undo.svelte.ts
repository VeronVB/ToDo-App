import * as api from '$lib/api/client';
import { tasksStore } from './tasks.svelte';
import type { ITask } from 'shared';

export interface UndoAction {
  id: string;
  label: string;
  type: 'delete' | 'complete' | 'move' | 'batch_complete' | 'batch_delete';
  data: any;
  timestamp: number;
}

class UndoStore {
  actions = $state<UndoAction[]>([]);
  timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  push(action: UndoAction) {
    this.actions = [...this.actions, action];
    
    // Auto-expire after 8 seconds
    const timeout = setTimeout(() => {
      this.dismiss(action.id);
    }, 8000);
    this.timeouts.set(action.id, timeout);
  }

  async undo(actionId: string) {
    const action = this.actions.find(a => a.id === actionId);
    if (!action) return;

    try {
      switch (action.type) {
        case 'delete': {
          // Re-create the task
          const task = action.data as Partial<ITask>;
          await api.createTask(task);
          break;
        }
        case 'complete': {
          await api.updateTask(action.data.id, { completed: false });
          break;
        }
        case 'batch_complete': {
          await api.batchAction(action.data.taskIds, 'uncomplete');
          break;
        }
        case 'batch_delete': {
          // Can't fully undo batch delete without stored task data
          // For now just refetch
          break;
        }
      }
      await tasksStore.fetchTasks();
    } catch (e) {
      console.error('Undo failed:', e);
    }

    this.dismiss(actionId);
  }

  dismiss(actionId: string) {
    const timeout = this.timeouts.get(actionId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(actionId);
    }
    this.actions = this.actions.filter(a => a.id !== actionId);
  }

  clear() {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    this.actions = [];
  }
}

export const undoStore = new UndoStore();