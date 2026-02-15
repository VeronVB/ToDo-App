<script lang="ts">
  import {
    Inbox, Sun, Calendar, Infinity, Moon, BookOpen, Repeat,
    Grid3x3, Columns3, Sunrise, BarChart3, Timer, FileText,
    History, ClipboardList, ChevronDown, ChevronRight, Plus,
    FolderOpen, Tag, Filter, Menu, X, Settings
  } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { appStore, type ViewType } from '$lib/stores/app.svelte';
  import SavedFilters from './SavedFilters.svelte';

  interface Props {
    projects?: Array<{ id: number; name: string; color?: string; taskCount?: number; completedCount?: number }>;
    tags?: Array<{ name: string; count: number }>;
    isOpen?: boolean;
    onToggle?: () => void;
  }

  let { projects = [], tags = [], isOpen = true, onToggle }: Props = $props();

  let showProjects = $state(true);
  let showTags = $state(false);

  type NavItem = {
    view: ViewType;
    label: string;
    icon: any;
    badge?: number;
    separator?: boolean;
  };

  const mainNav: NavItem[] = [
    { view: 'inbox', label: 'Inbox', icon: Inbox },
    { view: 'today', label: 'Today', icon: Sun },
    { view: 'upcoming', label: 'Upcoming', icon: Calendar },
    { view: 'anytime', label: 'Anytime', icon: Infinity },
    { view: 'someday', label: 'Someday', icon: Moon },
    { view: 'logbook', label: 'Logbook', icon: BookOpen },
    { view: 'habits', label: 'Habits', icon: Repeat },
  ];

  const advancedNav: NavItem[] = [
    { view: 'briefing', label: 'Morning Briefing', icon: Sunrise },
    { view: 'matrix', label: 'Eisenhower Matrix', icon: Grid3x3 },
    { view: 'kanban', label: 'Kanban Board', icon: Columns3 },
    { view: 'dashboard', label: 'Productivity', icon: BarChart3 },
  ];

  // Additional views accessible via nav
  const toolsNav = [
    { view: 'focus' as ViewType, label: 'Focus Mode', icon: Timer },
    { view: 'templates' as ViewType, label: 'Templates', icon: FileText },
    { view: 'review' as ViewType, label: 'Weekly Review', icon: ClipboardList },
    { view: 'activity' as ViewType, label: 'Activity Log', icon: History },
  ];

  function getProjectProgress(project: { taskCount?: number; completedCount?: number }) {
    if (!project.taskCount) return 0;
    return Math.round(((project.completedCount || 0) / project.taskCount) * 100);
  }
</script>

<!-- Mobile overlay -->
{#if isOpen}
  <button
    class="fixed inset-0 bg-black/50 z-40 md:hidden"
    onclick={onToggle}
    aria-label="Close sidebar"
  ></button>
{/if}

<aside class="
  fixed top-0 left-0 h-full w-[240px] bg-card border-r z-50
  flex flex-col
  transition-transform duration-200
  {isOpen ? 'translate-x-0' : '-translate-x-full'}
  md:translate-x-0 md:static md:z-auto
">
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-3 border-b">
    <h1 class="text-base font-bold tracking-tight">Todo App</h1>
    <Button variant="ghost" size="icon" class="h-7 w-7 md:hidden" onclick={onToggle}>
      <X class="h-4 w-4" />
    </Button>
  </div>

  <!-- Scrollable nav -->
  <nav class="flex-1 overflow-y-auto py-2 space-y-4">
    <!-- Main navigation -->
    <div class="px-2 space-y-0.5">
      {#each mainNav as item}
        <button
          class="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors
            {appStore.currentView === item.view && !appStore.selectedProject && !appStore.selectedTag
              ? 'bg-accent font-medium' : 'hover:bg-accent/50'}"
          onclick={() => appStore.setView(item.view)}
        >
          <item.icon class="h-4 w-4 text-muted-foreground shrink-0" />
          <span class="flex-1 text-left">{item.label}</span>
          {#if item.badge}
            <span class="text-xs text-muted-foreground tabular-nums">{item.badge}</span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Separator -->
    <div class="border-t mx-4"></div>

    <!-- Advanced Views -->
    <div class="px-2 space-y-0.5">
      <p class="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Views</p>
      {#each advancedNav as item}
        <button
          class="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors
            {appStore.currentView === item.view ? 'bg-accent font-medium' : 'hover:bg-accent/50'}"
          onclick={() => appStore.setView(item.view)}
        >
          <item.icon class="h-4 w-4 text-muted-foreground shrink-0" />
          <span class="flex-1 text-left">{item.label}</span>
        </button>
      {/each}
    </div>

    <!-- Separator -->
    <div class="border-t mx-4"></div>

    <!-- Tools -->
    <div class="px-2 space-y-0.5">
      <p class="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Tools</p>
      {#each toolsNav as item}
        <button
          class="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors
            {appStore.currentView === item.view ? 'bg-accent font-medium' : 'hover:bg-accent/50'}"
          onclick={() => appStore.setView(item.view)}
        >
          <item.icon class="h-4 w-4 text-muted-foreground shrink-0" />
          <span class="flex-1 text-left">{item.label}</span>
        </button>
      {/each}
    </div>

    <!-- Separator -->
    <div class="border-t mx-4"></div>

    <!-- Projects -->
    <div class="px-2">
      <button
        class="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
        onclick={() => showProjects = !showProjects}
      >
        {#if showProjects}
          <ChevronDown class="h-3 w-3" />
        {:else}
          <ChevronRight class="h-3 w-3" />
        {/if}
        Projects
        <span class="flex-1"></span>
        <Plus class="h-3 w-3 opacity-0 group-hover:opacity-100" />
      </button>

      {#if showProjects}
        <div class="space-y-0.5 mt-0.5">
          {#each projects as project (project.id)}
            {@const progress = getProjectProgress(project)}
            <button
              class="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors group
                {appStore.currentView === 'project' && appStore.selectedProject === project.id
                  ? 'bg-accent font-medium' : 'hover:bg-accent/50'}"
              onclick={() => appStore.setProject(project.id)}
            >
              <div class="h-3 w-3 rounded-sm shrink-0"
                style="background-color: {project.color || 'hsl(var(--primary))'}"></div>
              <span class="flex-1 text-left truncate">{project.name}</span>
              {#if project.taskCount}
                <div class="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all"
                    style="width: {progress}%; background-color: {project.color || 'hsl(var(--primary))'}"></div>
                </div>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Separator -->
    <div class="border-t mx-4"></div>

    <!-- Tags -->
    <div class="px-2">
      <button
        class="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
        onclick={() => showTags = !showTags}
      >
        {#if showTags}
          <ChevronDown class="h-3 w-3" />
        {:else}
          <ChevronRight class="h-3 w-3" />
        {/if}
        Tags
      </button>

      {#if showTags}
        <div class="space-y-0.5 mt-0.5">
          {#each tags as tag}
            <button
              class="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors
                {appStore.currentView === 'tag' && appStore.selectedTag === tag.name
                  ? 'bg-accent font-medium' : 'hover:bg-accent/50'}"
              onclick={() => appStore.setTag(tag.name)}
            >
              <Tag class="h-3 w-3 text-muted-foreground shrink-0" />
              <span class="flex-1 text-left truncate">{tag.name}</span>
              <span class="text-xs text-muted-foreground tabular-nums">{tag.count}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Separator -->
    <div class="border-t mx-4"></div>

    <!-- Saved Filters / Smart Lists -->
    <div class="px-2">
      <SavedFilters />
    </div>
  </nav>

  <!-- Footer -->
  <div class="border-t px-4 py-2">
    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <kbd class="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd>
      <span>Quick Capture</span>
    </div>
  </div>
</aside>