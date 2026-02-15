export type ViewType = 'inbox' | 'today' | 'upcoming' | 'anytime' | 'someday' | 'logbook' | 'habits'
	| 'project' | 'tag'
	| 'matrix' | 'kanban' | 'briefing' | 'dashboard'
	| 'filter' | 'focus' | 'templates' | 'review' | 'activity';

class AppStore {
	currentView = $state<ViewType>('today');
	selectedProject = $state<string | number | null>(null);
	selectedTag = $state<string | null>(null);
	selectedFilterId = $state<number | null>(null);

	// Batch selection mode
	batchMode = $state(false);
	selectedTaskIds = $state<Set<number>>(new Set());

	// Sidebar mobile toggle
	sidebarOpen = $state(false);

	setView(view: ViewType) {
		this.currentView = view;
		this.selectedProject = null;
		this.selectedTag = null;
		this.selectedFilterId = null;
		this.exitBatchMode();
		this.sidebarOpen = false;
	}

	setProject(projectId: string | number) {
		this.currentView = 'project';
		this.selectedProject = projectId;
		this.selectedTag = null;
		this.selectedFilterId = null;
		this.exitBatchMode();
		this.sidebarOpen = false;
	}

	setTag(tagName: string) {
		this.currentView = 'tag';
		this.selectedTag = tagName;
		this.selectedProject = null;
		this.selectedFilterId = null;
		this.exitBatchMode();
		this.sidebarOpen = false;
	}

	setFilter(filterId: number) {
		this.currentView = 'filter';
		this.selectedFilterId = filterId;
		this.selectedProject = null;
		this.selectedTag = null;
		this.exitBatchMode();
		this.sidebarOpen = false;
	}

	// Batch mode
	toggleBatchMode() {
		this.batchMode = !this.batchMode;
		if (!this.batchMode) this.selectedTaskIds = new Set();
	}

	toggleTaskSelection(taskId: number) {
		const newSet = new Set(this.selectedTaskIds);
		if (newSet.has(taskId)) {
			newSet.delete(taskId);
		} else {
			newSet.add(taskId);
		}
		this.selectedTaskIds = newSet;
	}

	selectAllTasks(taskIds: number[]) {
		this.selectedTaskIds = new Set(taskIds);
	}

	clearSelection() {
		this.selectedTaskIds = new Set();
	}

	exitBatchMode() {
		this.batchMode = false;
		this.selectedTaskIds = new Set();
	}
}

export const appStore = new AppStore();