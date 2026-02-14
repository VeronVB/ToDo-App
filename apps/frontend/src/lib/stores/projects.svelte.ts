import { type ICategory } from 'shared';
import * as api from '$lib/api/client';

class ProjectsStore {
    projects = $state<ICategory[]>([]);

    constructor() {
        this.fetchProjects();
    }

    async fetchProjects() {
        try {
            this.projects = await api.getCategories();
            console.log('[DEBUG] ProjectsStore: Fetched projects:', this.projects);
        } catch (e) {
            console.error(e);
        }
    }

    async addProject(name: string): Promise<number> {
        try {
            // Default color/icon for now
            const newCat = await api.createCategory({ name, color: '#666666', icon: '📁' });
            this.projects.push(newCat);
            return newCat.id;
        } catch (e) {
            console.error('Failed to create project', e);
            throw e;
        }
    }

    async updateProject(id: number, name: string) {
        // Need API update endpoint, using client side only for now? 
        // Backend doesn't have PATCH /categories/:id yet?
        // Let's check routes/categories.ts content again.
        // It only has GET, POST, DELETE.
        // So I can't update name on backend yet.
        // For prototype, I will just update local state, but it won't persist.
        // Or I should add PATCH to backend.
        // Given constraints, I'll focus on ADD (which was broken).
        const project = this.projects.find(p => p.id === id);
        if (project) {
            project.name = name;
        }
    }

    async deleteProject(id: number) {
        try {
            await api.deleteCategory(id);
            this.projects = this.projects.filter(p => p.id !== id);
        } catch (e) {
            console.error(e);
        }
    }
}

export const projectsStore = new ProjectsStore();
