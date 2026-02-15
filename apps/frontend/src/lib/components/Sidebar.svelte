<script lang="ts">
  import { Inbox, Calendar, Archive, CheckSquare, Folder, Plus, Pencil, Hash, Flame, ChevronDown, ChevronRight, MoreHorizontal, Tag, LayoutGrid, Columns, Sunrise, BarChart3, Focus, CalendarRange, FileText, Filter, Activity, Import, Wrench } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Separator } from '$lib/components/ui/separator';
  import { Badge } from '$lib/components/ui/badge';
  import * as Popover from '$lib/components/ui/popover';
  import { appStore, type ViewType } from '$lib/stores/app.svelte';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { projectsStore } from '$lib/stores/projects.svelte';
  import { tagsStore } from '$lib/stores/tags.svelte';
  import { habitsStore } from '$lib/stores/habits.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { t } from 'svelte-i18n';
  import { browser } from '$app/environment';
  import HabitStreakWidget from './HabitStreakWidget.svelte';

  // ─── Collapse State (persisted in localStorage) ───
  let projectsCollapsed = $state(false);
  let tagsCollapsed = $state(false);

  // Load from localStorage on init
  if (browser) {
    projectsCollapsed = localStorage.getItem('sidebar_projects_collapsed') === 'true';
    tagsCollapsed = localStorage.getItem('sidebar_tags_collapsed') === 'true';
  }

  function toggleProjects() {
    if (!settingsStore.settings.sidebarProjectsCollapsible) return;
    projectsCollapsed = !projectsCollapsed;
    if (browser) localStorage.setItem('sidebar_projects_collapsed', String(projectsCollapsed));
  }

  function toggleTags() {
    if (!settingsStore.settings.sidebarTagsCollapsible) return;
    tagsCollapsed = !tagsCollapsed;
    if (browser) localStorage.setItem('sidebar_tags_collapsed', String(tagsCollapsed));
  }

  // ─── Tags Style ───
  let tagsStyle = $derived(settingsStore.settings.sidebarTagsStyle || 'chips-collapsible');
  let canCollapseTags = $derived(settingsStore.settings.sidebarTagsCollapsible !== false);
  let canCollapseProjects = $derived(settingsStore.settings.sidebarProjectsCollapsible !== false);

  // For chips-limited: show max N tags
  const TAGS_LIMIT = 5;
  let showAllTags = $state(false);
  let visibleTags = $derived.by(() => {
    if (tagsStyle !== 'chips-limited' || showAllTags) return tagsStore.tags;
    return tagsStore.tags.slice(0, TAGS_LIMIT);
  });
  let hasMoreTags = $derived(tagsStyle === 'chips-limited' && tagsStore.tags.length > TAGS_LIMIT);

  // Popover state
  let tagsPopoverOpen = $state(false);

  // ─── Counts ───
  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    const taskDate = dateStr.split('T')[0];
    return taskDate <= today;
  };

  const isUpcoming = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    const taskDate = dateStr.split('T')[0];
    return taskDate > today;
  };

  let inboxCount = $derived(tasksStore.tasks.filter(t => !t.dueDate && !t.categoryId && !t.completed).length);
  let todayCount = $derived(tasksStore.tasks.filter(t => !t.completed && isToday(t.dueDate)).length);
  let upcomingCount = $derived(tasksStore.tasks.filter(t => !t.completed && isUpcoming(t.dueDate)).length);

  let smartLists = $derived([
    { id: 'inbox', name: $t('sidebar.inbox'), icon: Inbox, count: inboxCount },
    { id: 'today', name: $t('sidebar.today'), icon: CheckSquare, count: todayCount },
    { id: 'upcoming', name: $t('sidebar.upcoming'), icon: Calendar, count: upcomingCount },
  ]);

  $effect(() => {
    habitsStore.fetchHabits();
  });
</script>

<div class="flex h-full w-full flex-col bg-sidebar border-r">
  <div class="flex-1 py-4 flex flex-col min-h-0">
    <!-- ═══ Smart Lists ═══ -->
    <nav class="grid gap-1 px-2 shrink-0">
      {#each smartLists as list}
        <Button
          variant={appStore.currentView === list.id && !appStore.selectedProject ? "secondary" : "ghost"}
          class="justify-start px-2 font-normal {appStore.currentView === list.id && !appStore.selectedProject ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}"
          onclick={() => appStore.setView(list.id as ViewType)}
        >
          <list.icon class="mr-2 h-4 w-4" />
          {list.name}
          {#if list.count > 0}
            <Badge variant="secondary" class="ml-auto text-xs font-normal">
              {list.count}
            </Badge>
          {/if}
        </Button>
      {/each}
      
      <Separator class="my-2" />
      
      <Button
          variant={appStore.currentView === 'logbook' ? "secondary" : "ghost"}
          class="justify-start px-2 font-normal {appStore.currentView === 'logbook' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground'}"
           onclick={() => appStore.setView('logbook')}
        >
        <Archive class="mr-2 h-4 w-4" />
        {$t('sidebar.logbook')}
      </Button>

      <Separator class="my-2" />

      <!-- ═══ Tools Section ═══ -->
      <div class="mb-2">
        <h3 class="px-2 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          {$t('sidebar_advanced.tools')}
        </h3>
        <nav class="grid gap-0.5">
          <Button
            variant={appStore.currentView === 'dashboard' ? "secondary" : "ghost"}
            class="justify-start px-2 font-normal text-sm"
            onclick={() => appStore.setView('dashboard')}
          >
            <BarChart3 class="mr-2 h-4 w-4" />
            {$t('sidebar_advanced.dashboard')}
          </Button>
          <Button
            variant={appStore.currentView === 'briefing' ? "secondary" : "ghost"}
            class="justify-start px-2 font-normal text-sm"
            onclick={() => appStore.setView('briefing')}
          >
            <Sunrise class="mr-2 h-4 w-4" />
            {$t('sidebar_advanced.briefing')}
          </Button>
          <Button
            variant={appStore.currentView === 'matrix' ? "secondary" : "ghost"}
            class="justify-start px-2 font-normal text-sm"
            onclick={() => appStore.setView('matrix')}
          >
            <LayoutGrid class="mr-2 h-4 w-4" />
            {$t('sidebar_advanced.matrix')}
          </Button>
          <Button
            variant={appStore.currentView === 'kanban' ? "secondary" : "ghost"}
            class="justify-start px-2 font-normal text-sm"
            onclick={() => appStore.setView('kanban')}
          >
            <Columns class="mr-2 h-4 w-4" />
            {$t('sidebar_advanced.kanban')}
          </Button>
          <Button
            variant={appStore.currentView === 'focus' ? "secondary" : "ghost"}
            class="justify-start px-2 font-normal text-sm"
            onclick={() => appStore.setView('focus')}
          >
            <Focus class="mr-2 h-4 w-4" />
            {$t('sidebar_advanced.focus')}
          </Button>
          <Button
            variant={appStore.currentView === 'review' ? "secondary" : "ghost"}
            class="justify-start px-2 font-normal text-sm"
            onclick={() => appStore.setView('review')}
          >
            <CalendarRange class="mr-2 h-4 w-4" />
            {$t('sidebar_advanced.review')}
          </Button>
          <Separator class="my-1" />
          <Button
            variant={appStore.currentView === 'templates' ? "secondary" : "ghost"}
            class="justify-start px-2 font-normal text-sm"
            onclick={() => appStore.setView('templates')}
          >
            <FileText class="mr-2 h-4 w-4" />
            {$t('sidebar_advanced.templates')}
          </Button>
          <Button
            variant={appStore.currentView === 'filter' ? "secondary" : "ghost"}
            class="justify-start px-2 font-normal text-sm"
            onclick={() => appStore.setView('filter')}
          >
            <Filter class="mr-2 h-4 w-4" />
            {$t('sidebar_advanced.filters')}
          </Button>
          <Button
            variant={appStore.currentView === 'activity' ? "secondary" : "ghost"}
            class="justify-start px-2 font-normal text-sm"
            onclick={() => appStore.setView('activity')}
          >
            <Activity class="mr-2 h-4 w-4" />
            {$t('sidebar_advanced.activity')}
          </Button>
        </nav>
      </div>
    </nav>

    <div class="px-2 shrink-0">
        <Separator class="my-4" />
    </div>

    <!-- ═══ Scrollable Area: Projects + Tags ═══ -->
    <div class="flex-1 flex flex-col min-h-0 px-2">
      <ScrollArea class="flex-1 -mx-2 px-2">
        
        <!-- ─── PROJECTS Section ─── -->
        <div class="mb-4">
          <button
            class="flex items-center justify-between w-full px-2 py-1.5 group {canCollapseProjects ? 'cursor-pointer hover:bg-muted/50 rounded-md' : 'cursor-default'}"
            onclick={toggleProjects}
          >
            <h3 class="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {$t('sidebar.projects')}
            </h3>
            {#if canCollapseProjects}
              <div class="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                {#if projectsCollapsed}
                  <ChevronRight class="h-3.5 w-3.5" />
                {:else}
                  <ChevronDown class="h-3.5 w-3.5" />
                {/if}
              </div>
            {/if}
          </button>
          
          {#if !projectsCollapsed}
            <nav class="grid gap-0.5 mt-1">
              {#each projectsStore.projects as project (project.id)}
                <div class="group relative flex items-center">
                  <Button
                    variant={appStore.selectedProject === project.id ? "secondary" : "ghost"}
                    class="justify-start px-2 font-normal w-full h-8 text-sm {appStore.selectedProject === project.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}"
                    onclick={() => appStore.setProject(project.id)}
                  >
                    <Folder class="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    {project.name}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="absolute right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onclick={(e) => {
                      e.stopPropagation();
                      uiStore.openEditProject({ id: project.id, name: project.name });
                    }}
                  >
                    <Pencil class="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              {/each}
            </nav>
          {:else if projectsStore.projects.length > 0}
            <div class="px-2 mt-1">
              <span class="text-[10px] text-muted-foreground/50">{projectsStore.projects.length} {$t('sidebar.projects').toLowerCase()}</span>
            </div>
          {/if}
        </div>

        <!-- ─── TAGS Section ─── -->
        {#if tagsStore.tags.length > 0}
          <div class="mb-4">
            
            <!-- ══ Style: LIST (original full buttons) ══ -->
            {#if tagsStyle === 'list'}
              <button
                class="flex items-center justify-between w-full px-2 py-1.5 group {canCollapseTags ? 'cursor-pointer hover:bg-muted/50 rounded-md' : 'cursor-default'}"
                onclick={toggleTags}
              >
                <h3 class="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  # Tags
                </h3>
                {#if canCollapseTags}
                  <div class="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                    {#if tagsCollapsed}
                      <ChevronRight class="h-3.5 w-3.5" />
                    {:else}
                      <ChevronDown class="h-3.5 w-3.5" />
                    {/if}
                  </div>
                {/if}
              </button>
              
              {#if !tagsCollapsed}
                <nav class="grid gap-0.5 mt-1">
                  {#each tagsStore.tags as tag (tag.id)}
                    <Button
                      variant={appStore.selectedTag === tag.name ? "secondary" : "ghost"}
                      class="justify-start px-2 font-normal w-full h-8 text-sm {appStore.selectedTag === tag.name ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}"
                      onclick={() => appStore.setTag(tag.name)}
                    >
                      <Hash class="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      {tag.name}
                    </Button>
                  {/each}
                </nav>
              {:else}
                <div class="px-2 mt-1">
                  <span class="text-[10px] text-muted-foreground/50">{tagsStore.tags.length} tags</span>
                </div>
              {/if}
            
            <!-- ══ Style: CHIPS (always visible, compact) ══ -->
            {:else if tagsStyle === 'chips'}
              <div class="px-2 py-1.5">
                <h3 class="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
                  # Tags
                </h3>
              </div>
              <div class="flex flex-wrap gap-1 px-2">
                {#each tagsStore.tags as tag (tag.id)}
                  <button
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors {
                      appStore.selectedTag === tag.name 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }"
                    onclick={() => appStore.setTag(tag.name)}
                  >
                    <span class="opacity-60">#</span>{tag.name}
                  </button>
                {/each}
              </div>
            
            <!-- ══ Style: CHIPS-COLLAPSIBLE (chips + toggle) ══ -->
            {:else if tagsStyle === 'chips-collapsible'}
              <button
                class="flex items-center justify-between w-full px-2 py-1.5 group cursor-pointer hover:bg-muted/50 rounded-md"
                onclick={toggleTags}
              >
                <h3 class="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  # Tags
                  <span class="font-normal ml-1 opacity-50">{tagsStore.tags.length}</span>
                </h3>
                <div class="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                  {#if tagsCollapsed}
                    <ChevronRight class="h-3.5 w-3.5" />
                  {:else}
                    <ChevronDown class="h-3.5 w-3.5" />
                  {/if}
                </div>
              </button>
              
              {#if !tagsCollapsed}
                <div class="flex flex-wrap gap-1 px-2 mt-1">
                  {#each tagsStore.tags as tag (tag.id)}
                    <button
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors {
                        appStore.selectedTag === tag.name 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }"
                      onclick={() => appStore.setTag(tag.name)}
                    >
                      <span class="opacity-60">#</span>{tag.name}
                    </button>
                  {/each}
                </div>
              {/if}
            
            <!-- ══ Style: POPOVER (hidden behind button) ══ -->
            {:else if tagsStyle === 'popover'}
              <Popover.Root bind:open={tagsPopoverOpen}>
                <Popover.Trigger>
                  {#snippet child({ props })}
                    <Button
                      variant="ghost"
                      class="justify-start px-2 font-normal w-full h-8 text-sm"
                      {...props}
                    >
                      <Tag class="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      <span class="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Tags</span>
                      <Badge variant="secondary" class="ml-auto text-xs font-normal">
                        {tagsStore.tags.length}
                      </Badge>
                    </Button>
                  {/snippet}
                </Popover.Trigger>
                <Popover.Content side="right" align="start" class="w-52 p-2">
                  <div class="space-y-1 max-h-[300px] overflow-y-auto">
                    <div class="px-2 py-1.5">
                      <p class="text-xs font-semibold text-muted-foreground">{$t('sidebar.select_tag')}</p>
                    </div>
                    {#each tagsStore.tags as tag (tag.id)}
                      <button
                        class="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors {
                          appStore.selectedTag === tag.name 
                            ? 'bg-primary/10 text-primary font-medium' 
                            : 'hover:bg-muted text-foreground'
                        }"
                        onclick={() => { 
                          appStore.setTag(tag.name); 
                          tagsPopoverOpen = false; 
                        }}
                      >
                        <Hash class="h-3.5 w-3.5 text-muted-foreground" />
                        {tag.name}
                      </button>
                    {/each}
                  </div>
                </Popover.Content>
              </Popover.Root>
            
            <!-- ══ Style: CHIPS-LIMITED (max N + "more") ══ -->
            {:else if tagsStyle === 'chips-limited'}
              <div class="px-2 py-1.5">
                <h3 class="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
                  # Tags
                </h3>
              </div>
              <div class="flex flex-wrap gap-1 px-2">
                {#each visibleTags as tag (tag.id)}
                  <button
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors {
                      appStore.selectedTag === tag.name 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }"
                    onclick={() => appStore.setTag(tag.name)}
                  >
                    <span class="opacity-60">#</span>{tag.name}
                  </button>
                {/each}
                {#if hasMoreTags && !showAllTags}
                  <button
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    onclick={() => showAllTags = true}
                  >
                    +{tagsStore.tags.length - TAGS_LIMIT} {$t('habits.more')}
                  </button>
                {:else if showAllTags && hasMoreTags}
                  <button
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    onclick={() => showAllTags = false}
                  >
                    {$t('sidebar.show_less')}
                  </button>
                {/if}
              </div>
            {/if}

          </div>
        {/if}

      </ScrollArea>
    </div>
  </div>
  
  <!-- ═══ Bottom: New List + Habit Widget ═══ -->
  <div class="border-t p-2 shrink-0">
    <Button variant="outline" class="w-full justify-start" onclick={() => uiStore.openAddProject()}>
       <Plus class="mr-2 h-4 w-4" />
       {$t('app.new_list')}
    </Button>
  </div>
  <div class="border-t p-2 shrink-0">
    <HabitStreakWidget />
  </div>
</div>