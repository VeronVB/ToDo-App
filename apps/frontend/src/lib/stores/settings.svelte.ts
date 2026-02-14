import { type ISettings, DEFAULT_SETTINGS } from 'shared';
import * as api from '$lib/api/client';
import { browser } from '$app/environment';
import { locale } from 'svelte-i18n';

class SettingsStore {
	settings = $state<ISettings>({ 
		...DEFAULT_SETTINGS, 
		id: 0, 
		userId: 0, 
		createdAt: '', 
		updatedAt: '' 
	});
	loading = $state(false);
	error = $state<string | null>(null);

	constructor() {
		// Initialize from localStorage if available (instant theme load)
		if (browser) {
			const stored = localStorage.getItem('settings');
			if (stored) {
				try {
					Object.assign(this.settings, JSON.parse(stored));
					this.applySideEffects();
				} catch (e) {
					console.error('Failed to parse settings from local storage', e);
				}
			}
		}

		// Watch for changes and apply side effects using $effect.root or manual subscription logic 
        // Since we are in a class, we handle it in updateSettings
	}

	private applySideEffects() {
		if (!browser) return;
		
		// Apply theme
		const root = document.documentElement;
		if (this.settings.colorScheme === 'dracula') {
			root.classList.add('dark');
		} else if (this.settings.colorScheme === 'nord') {
			root.classList.remove('dark');
		} else if (this.settings.colorScheme === 'github-dark') {
            // Logic for system/auto could be added here
             if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
             } else {
                root.classList.remove('dark');
             }
        }
		
		// Apply layout density
		root.setAttribute('data-layout', this.settings.layout);

        // Apply Language
        if (this.settings.language) {
            locale.set(this.settings.language);
        }

        // Save to localStorage
        localStorage.setItem('settings', JSON.stringify(this.settings));
	}

	async fetchSettings() {
		this.loading = true;
		try {
			const data = await api.getSettings();
            // Merge with default settings to ensure all fields exist
            this.settings = { ...this.settings, ...data };
            this.applySideEffects();
		} catch (err: any) {
			this.error = err.message;
		} finally {
			this.loading = false;
		}
	}

	async updateSettings(updates: Partial<ISettings>) {
		// Optimistic update
		Object.assign(this.settings, updates);
		this.applySideEffects();

		try {
			const data = await api.updateSettings(updates);
            this.settings = { ...this.settings, ...data };
		} catch (err: any) {
			this.error = err.message;
			// Revert is hard without previous state copy, but we can re-fetch
			this.fetchSettings(); 
		}
	}
}

export const settingsStore = new SettingsStore();
