import { register, init, getLocaleFromNavigator } from 'svelte-i18n';
import { browser } from '$app/environment';
import { settingsStore } from '$lib/stores/settings.svelte';

register('en', () => import('./locales/en.json'));
register('pl', () => import('./locales/pl.json'));

export function setupI18n() {
    let initialLocale = 'en';
    
    if (browser) {
        // Try to get from settings store first (which loads from localStorage)
        // Since settingsStore is a class with a state field, we access it directly if initialized
        // However, svelte state might not be ready or we want to trust localStorage directly for init speed
        const stored = localStorage.getItem('settings');
        if (stored) {
            try {
                const settings = JSON.parse(stored);
                if (settings.language) {
                    initialLocale = settings.language;
                }
            } catch (e) {
                console.error(e);
            }
        } else {
             initialLocale = getLocaleFromNavigator()?.startsWith('pl') ? 'pl' : 'en';
        }
    }

    init({
        fallbackLocale: 'en',
        initialLocale: initialLocale,
    });
}
