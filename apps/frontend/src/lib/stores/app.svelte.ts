export type ViewType = 'inbox' | 'today' | 'upcoming' | 'anytime' | 'someday' | 'logbook' | 'project' | 'tag';

class AppStore {
	currentView = $state<ViewType>('today');
	selectedProject = $state<string | number | null>(null);
    selectedTag = $state<string | null>(null);

	setView(view: ViewType) {
		this.currentView = view;
		this.selectedProject = null;
        this.selectedTag = null;
	}

	setProject(projectId: string | number) {
		this.currentView = 'project';
		this.selectedProject = projectId;
        this.selectedTag = null;
	}

    setTag(tagName: string) {
        this.currentView = 'tag';
        this.selectedTag = tagName;
        this.selectedProject = null;
    }
}

export const appStore = new AppStore();
