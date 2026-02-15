<script lang="ts">
  import { Inbox, Calendar, Archive, CheckSquare, Folder, Plus, Pencil, Hash, Flame } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Separator } from '$lib/components/ui/separator';
  import { Badge } from '$lib/components/ui/badge';
  import { appStore, type ViewType } from '$lib/stores/app.svelte';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { projectsStore } from '$lib/stores/projects.svelte';
  import { tagsStore } from '$lib/stores/tags.svelte';
  import { habitsStore } from '$lib/stores/habits.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { t } from 'svelte-i18n';
  import HabitStreakWidget from './HabitStreakWidget.svelte';

  // Helper to check dates
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

  // Derived counts
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
    </nav>

    <div class="px-2 shrink-0">
        <Separator class="my-4" />
    </div>

    <div class="px-4 py-2 flex-1 flex flex-col min-h-0">
      <h3 class="mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase shrink-0">
        {$t('sidebar.projects')}
      </h3>
       <ScrollArea class="flex-1 -mx-2 px-2">
        <nav class="grid gap-1">
             {#each projectsStore.projects as project (project.id)}
                <div class="group relative flex items-center">
                    <Button
                      variant={appStore.selectedProject === project.id ? "secondary" : "ghost"}
                      class="justify-start px-2 font-normal w-full {appStore.selectedProject === project.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}"
                      onclick={() => appStore.setProject(project.id)}
                    >
                      <Folder class="mr-2 h-4 w-4 text-muted-foreground" />
                      {project.name}
                    </Button>
                    
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        class="absolute right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onclick={(e) => {
                            e.stopPropagation();
                            uiStore.openEditProject(project);
                        }}
                    >
                        <Pencil class="h-3 w-3 text-muted-foreground" />
                    </Button>
                </div>
             {/each}
        </nav>

        {#if tagsStore.tags.length > 0}
            <div class="mt-6 mb-2">
                <h3 class="mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase shrink-0">
                    # Tags
                </h3>
                <nav class="grid gap-1">
                    {#each tagsStore.tags as tag (tag.id)}
                        <Button
                            variant={appStore.selectedTag === tag.name ? "secondary" : "ghost"}
                            class="justify-start px-2 font-normal w-full {appStore.selectedTag === tag.name ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}"
                            onclick={() => appStore.setTag(tag.name)}
                        >
                            <Hash class="mr-2 h-4 w-4 text-muted-foreground" />
                            {tag.name}
                        </Button>
                    {/each}
                </nav>
            </div>
        {/if}
      </ScrollArea>
    </div>
  </div>
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
