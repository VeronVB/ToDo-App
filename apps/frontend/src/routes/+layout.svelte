<script lang="ts">
  import '../lib/assets/app.css';
  import '../lib/assets/animations.css';
  import '../lib/assets/themes.css';
  import Header from '$lib/components/Header.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import * as Sheet from '$lib/components/ui/sheet';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import CheatsheetDialog from '$lib/components/CheatsheetDialog.svelte';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import ProjectDialog from '$lib/components/ProjectDialog.svelte';
  import SearchDialog from '$lib/components/SearchDialog.svelte';
  import PomodoroTimer from '$lib/components/PomodoroTimer.svelte';
  import { setupI18n } from '$lib/i18n';
  import { isLoading } from 'svelte-i18n';
  import { browser } from '$app/environment';

  // Initialize i18n
  setupI18n();

  let { children } = $props();

  let isMobileMenuOpen = $state(false);

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  // Apply Theme & Layout
  $effect(() => {
      if (browser) {
          // Theme Color
          if (settingsStore.settings.themeColor) {
              const theme = settingsStore.settings.themeColor;
              const body = document.body;
              
              body.classList.forEach(cls => {
                  if (cls.startsWith('theme-') && cls !== `theme-${theme}`) {
                      body.classList.remove(cls);
                  }
              });
              
              body.classList.add(`theme-${theme}`);
          }

          // Layout Density
          if (settingsStore.settings.layout) {
              document.documentElement.setAttribute('data-layout', settingsStore.settings.layout);
          }
      }
  });

  function handleKeydown(e: KeyboardEvent) {
      const scheme = settingsStore.settings.shortcutScheme;
      let modifier = false;

      switch (scheme) {
          case 'mac':
              modifier = e.metaKey;
              break;
          case 'linux':
              // Linux users often prefer Alt to avoid browser/system conflicts (Ctrl+N, Ctrl+T)
              modifier = e.altKey;
              break;
          case 'windows':
              modifier = e.ctrlKey;
              break;
          default:
              modifier = e.ctrlKey || e.metaKey; // Default / Hybrid
              break;
      }

      // Allow escaping without modifier
      if (e.key === 'Escape') {
          // Close modals if open
          if (uiStore.isTaskDialogOpen || uiStore.isSettingsOpen || uiStore.isCheatsheetOpen || uiStore.isProjectDialogOpen) {
              uiStore.close();
          }
      }

      if (!modifier) return;

      switch (e.key.toLowerCase()) {
          case 'n':
              e.preventDefault();
              uiStore.openAdd();
              break;
          case ',':
              e.preventDefault();
              uiStore.openSettings();
              break;
          case '/':
          case '?':
              e.preventDefault();
              uiStore.openCheatsheet();
              break;
          case 'k':
              e.preventDefault();
              uiStore.openSearch();
              break;
      }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $isLoading}
  <div class="flex h-screen w-full items-center justify-center">
    <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
{:else}
  <div class="flex min-h-screen flex-col bg-background font-sans antialiased">
    <Header onMenuClick={toggleMobileMenu} />

    <div class="flex flex-1 pt-14">
      <!-- Desktop Sidebar -->
      <aside class="hidden w-[240px] flex-col md:flex fixed left-0 top-14 bottom-0 z-30">
         <Sidebar />
      </aside>

      <!-- Mobile Sidebar (Sheet) -->
      <Sheet.Root bind:open={isMobileMenuOpen}>
        <Sheet.Content side="left" class="p-0 w-[240px]">
           <Sidebar />
        </Sheet.Content>
      </Sheet.Root>

      <!-- Main Content -->
      <main class="flex-1 md:pl-[240px]">
        {@render children()}
      </main>
    </div>
  </div>

  <CheatsheetDialog 
    open={uiStore.isCheatsheetOpen} 
    onOpenChange={(v) => uiStore.isCheatsheetOpen = v} 
  />

  <SettingsDialog 
    open={uiStore.isSettingsOpen} 
    onOpenChange={(v) => uiStore.isSettingsOpen = v} 
  />

  <ProjectDialog 
    open={uiStore.isProjectDialogOpen} 
    onOpenChange={(v) => uiStore.isProjectDialogOpen = v}
    project={uiStore.editingProject}
  />
  
  <SearchDialog 
    open={uiStore.isSearchOpen}
    onOpenChange={(v) => uiStore.isSearchOpen = v}
  />

  <PomodoroTimer />
{/if}
