import type { ITask } from 'shared';

class UIStore {
	isTaskDialogOpen = $state(false);
	isCheatsheetOpen = $state(false);
	isSettingsOpen = $state(false);
    isProjectDialogOpen = $state(false);
    isSearchOpen = $state(false);
	editingTask = $state<ITask | null>(null);
    editingProject = $state<{ id: string, name: string } | null>(null);
	parentForNewTask = $state<number | null>(null);
    highlightedTaskId = $state<number | null>(null);

	openAdd(parentId: number | null = null) {
		this.editingTask = null;
		this.parentForNewTask = parentId;
		this.isTaskDialogOpen = true;
	}

	openEdit(task: ITask) {
		this.editingTask = task;
		this.parentForNewTask = task.parentId || null;
		this.isTaskDialogOpen = true;
	}

	openCheatsheet() {
		this.isCheatsheetOpen = true;
	}

	openSettings() {
		this.isSettingsOpen = true;
	}
    
    openSearch() {
        this.isSearchOpen = true;
    }

    openAddProject() {
        this.editingProject = null;
        this.isProjectDialogOpen = true;
    }

    openEditProject(project: { id: string, name: string }) {
        this.editingProject = project;
        this.isProjectDialogOpen = true;
    }

	close() {
		this.isTaskDialogOpen = false;
		this.isCheatsheetOpen = false;
		this.isSettingsOpen = false;
        this.isProjectDialogOpen = false;
        this.isSearchOpen = false;
		this.editingTask = null;
        this.editingProject = null;
		this.parentForNewTask = null;
	}
}

export const uiStore = new UIStore();
