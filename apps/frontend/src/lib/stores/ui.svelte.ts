import type { ITask } from 'shared';

class UIStore {
	isTaskDialogOpen = $state(false);
	isCheatsheetOpen = $state(false);
	isSettingsOpen = $state(false);
    isProjectDialogOpen = $state(false);
    isSearchOpen = $state(false);
	editingTask = $state<ITask | null>(null);
    editingProject = $state<{ id: string | number, name: string } | null>(null);
	parentForNewTask = $state<number | null>(null);
    highlightedTaskId = $state<number | null>(null);

	isQuickCaptureOpen = $state(false);
	isUndoToastVisible = $state(false);
	isKeyboardShortcutsOpen = $state(false);
	isFocusModeOpen = $state(false);
	isTemplatesOpen = $state(false);
	isFiltersOpen = $state(false);
	isActivityLogOpen = $state(false);
	isImportExportOpen = $state(false);

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

    openEditProject(project: { id: string | number, name: string }) {
        this.editingProject = project;
        this.isProjectDialogOpen = true;
    }

	openQuickCapture() {
		this.isQuickCaptureOpen = true;
	}

	closeQuickCapture() {
		this.isQuickCaptureOpen = false;
	}

	showUndoToast() {
		this.isUndoToastVisible = true;
	}

	hideUndoToast() {
		this.isUndoToastVisible = false;
	}

	openKeyboardShortcuts() {
		this.isKeyboardShortcutsOpen = true;
	}

	closeKeyboardShortcuts() {
		this.isKeyboardShortcutsOpen = false;
	}

	openFocusMode() {
		this.isFocusModeOpen = true;
	}

	closeFocusMode() {
		this.isFocusModeOpen = false;
	}

	openTemplates() {
		this.isTemplatesOpen = true;
	}

	closeTemplates() {
		this.isTemplatesOpen = false;
	}

	openFilters() {
		this.isFiltersOpen = true;
	}

	closeFilters() {
		this.isFiltersOpen = false;
	}

	openActivityLog() {
		this.isActivityLogOpen = true;
	}

	closeActivityLog() {
		this.isActivityLogOpen = false;
	}

	openImportExport() {
		this.isImportExportOpen = true;
	}

	closeImportExport() {
		this.isImportExportOpen = false;
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
