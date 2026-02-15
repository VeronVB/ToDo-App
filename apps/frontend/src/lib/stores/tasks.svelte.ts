import type { ITask } from 'shared';
import * as api from '$lib/api/client';
import { habitsStore } from './habits.svelte';

function findPendingTasks(nodes: ITask[], result: ITask[] = []): ITask[] {
	for (const node of nodes) {
		if (node.pendingParentCompletion === true) {
			result.push({ id: node.id, title: node.title, parentId: node.parentId, pendingParentCompletion: node.pendingParentCompletion });
		}
		if (node.children) {
			findPendingTasks(node.children, result);
		}
	}
	return result;
}

class TaskStore {
	tasks = $state<ITask[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	async fetchTasks(view?: string) {
		this.loading = true;
		this.error = null;
		try {
			const data = await api.getTasks(view);
			// Handle both wrapped { tasks: [...] } or direct array [...]
			if (Array.isArray(data)) {
				this.tasks = data;
			} else {
				this.tasks = data.tasks || [];
			}
			// DEBUG: log all tasks with pendingParentCompletion=true
			const pendingTasks = findPendingTasks(this.tasks);
			if (pendingTasks.length > 0) {
				console.log('[DEBUG Store] Tasks with pendingParentCompletion=true:', JSON.stringify(pendingTasks));
			}
		} catch (err: any) {
			this.error = err.message;
		} finally {
			this.loading = false;
		}
	}

	async addTask(task: Partial<ITask>) {
		try {
			const newTask = await api.createTask(task);
			
			// Optimistically update
			if (newTask.parentId) {
				this.addChildToParent(this.tasks, newTask.parentId, newTask);
			} else {
				this.tasks.push(newTask);
			}
			
			// Refresh habits if this was a habit
			if ((task as any).isHabit) {
				await habitsStore.fetchHabits();
				await habitsStore.fetchOverview();
			}
		} catch (err: any) {
			this.error = err.message;
		}
	}

	async updateTask(id: number, updates: Partial<ITask>) {
		// Optimistic update
		this.updateTaskInTree(this.tasks, id, updates);

		try {
			await api.updateTask(id, updates);
			
			// Refresh habits if isHabit was set
			if ((updates as any).isHabit) {
				await habitsStore.fetchHabits();
				await habitsStore.fetchOverview();
			}
		} catch (err: any) {
			this.error = err.message;
			// Revert on error? For prototype, just show error
			this.fetchTasks(); // Re-sync
		}
	}

	async toggleComplete(task: ITask) {
        const isCompleting = !task.completed;
        
        await this.updateTask(task.id, { completed: isCompleting });

        // Always fetch to ensure sync (recurrence, cascade completion, etc.)
        await this.fetchTasks();
	}

	async deleteTask(id: number) {
		// Optimistic delete
		this.removeTaskFromTree(this.tasks, id);

		try {
			await api.deleteTask(id);
		} catch (err: any) {
			this.error = err.message;
			this.fetchTasks();
		}
	}

    async clearCompletedTasks() {
        const completedTasks = this.tasks.filter(t => t.completed);
        // Optimistic delete
        this.tasks = this.tasks.filter(t => !t.completed);

        // Delete individually in parallel since we don't have bulk delete API yet
        // In production, should implement /tasks/completed endpoint
        await Promise.all(completedTasks.map(t => this.deleteTask(t.id)));
    }

	// Helpers
	private addChildToParent(nodes: ITask[], parentId: number, task: ITask): boolean {
		for (const node of nodes) {
			if (node.id === parentId) {
				if (!node.children) node.children = [];
				node.children.push(task);
				return true;
			}
			if (node.children && this.addChildToParent(node.children, parentId, task)) {
				return true;
			}
		}
		return false;
	}

	private updateTaskInTree(nodes: ITask[], id: number, updates: Partial<ITask>) {
		for (const node of nodes) {
			if (node.id === id) {
				Object.assign(node, updates);
				return;
			}
			if (node.children) this.updateTaskInTree(node.children, id, updates);
		}
	}

	private removeTaskFromTree(nodes: ITask[], id: number) {
		const idx = nodes.findIndex(n => n.id === id);
		if (idx !== -1) {
			nodes.splice(idx, 1);
			return;
		}
		for (const node of nodes) {
			if (node.children) {
				this.removeTaskFromTree(node.children, id);
			}
		}
	}
}

export const tasksStore = new TaskStore();
