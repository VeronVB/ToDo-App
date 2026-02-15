<script lang="ts">
  import { CheckSquare, Trash2, ArrowRight, X, Flag } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { appStore } from '$lib/stores/app.svelte';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { undoStore } from '$lib/stores/undo.svelte';
  import * as api from '$lib/api/client';

  interface Props {
    projects?: Array<{ id: number; name: string }>;
  }

  let { projects = [] }: Props = $props();

  let selectedCount = $derived(appStore.selectedTaskIds.size);
  let isVisible = $derived(appStore.batchMode && selectedCount > 0);
  let showMoveMenu = $state(false);
  let showPriorityMenu = $state(false);

  async function handleBatchComplete() {
    const ids = [...appStore.selectedTaskIds];
    await api.batchAction(ids, 'complete');

    undoStore.push({
      id: crypto.randomUUID(),
      label: `${ids.length} task${ids.length > 1 ? 's' : ''} completed`,
      type: 'batch_complete',
      data: { taskIds: ids },
      timestamp: Date.now()
    });

    appStore.exitBatchMode();
    await tasksStore.fetchTasks();
  }

  async function handleBatchDelete() {
    const ids = [...appStore.selectedTaskIds];
    await api.batchAction(ids, 'delete');

    undoStore.push({
      id: crypto.randomUUID(),
      label: `${ids.length} task${ids.length > 1 ? 's' : ''} deleted`,
      type: 'batch_delete',
      data: { taskIds: ids },
      timestamp: Date.now()
    });

    appStore.exitBatchMode();
    await tasksStore.fetchTasks();
  }

  async function handleBatchMove(categoryId: number | null) {
    const ids = [...appStore.selectedTaskIds];
    await api.batchAction(ids, 'move', { categoryId });
    showMoveMenu = false;
    appStore.exitBatchMode();
    await tasksStore.fetchTasks();
  }

  async function handleBatchPriority(priority: string) {
    const ids = [...appStore.selectedTaskIds];
    await api.batchAction(ids, 'priority', { priority });
    showPriorityMenu = false;
    appStore.exitBatchMode();
    await tasksStore.fetchTasks();
  }

  const priorities = [
    { value: 'high', label: 'High', color: 'text-red-500' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
    { value: 'low', label: 'Low', color: 'text-blue-500' },
    { value: 'none', label: 'None', color: 'text-muted-foreground' }
  ];
</script>

{#if isVisible}
  <div class="fixed bottom-0 left-0 right-0 md:left-[240px] z-40 bg-card border-t shadow-lg animate-in slide-in-from-bottom-4 duration-200">
    <div class="flex items-center gap-3 max-w-4xl mx-auto px-4 py-3">
      <span class="text-sm font-medium tabular-nums">{selectedCount} selected</span>

      <div class="flex-1 flex items-center gap-2">
        <Button size="sm" variant="outline" class="gap-1.5" onclick={handleBatchComplete}>
          <CheckSquare class="h-3.5 w-3.5" /> Complete
        </Button>

        <Button size="sm" variant="outline" class="gap-1.5 text-destructive hover:text-destructive" onclick={handleBatchDelete}>
          <Trash2 class="h-3.5 w-3.5" /> Delete
        </Button>

        <!-- Move to project dropdown -->
        <div class="relative">
          <Button size="sm" variant="outline" class="gap-1.5" onclick={() => { showMoveMenu = !showMoveMenu; showPriorityMenu = false; }}>
            <ArrowRight class="h-3.5 w-3.5" /> Move
          </Button>
          {#if showMoveMenu}
            <div class="absolute bottom-full mb-1 left-0 bg-popover border rounded-lg shadow-lg py-1 min-w-[180px] max-h-60 overflow-y-auto">
              <button class="w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onclick={() => handleBatchMove(null)}>
                Inbox (no project)
              </button>
              {#each projects as project}
                <button class="w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onclick={() => handleBatchMove(project.id)}>
                  {project.name}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Priority dropdown -->
        <div class="relative">
          <Button size="sm" variant="outline" class="gap-1.5" onclick={() => { showPriorityMenu = !showPriorityMenu; showMoveMenu = false; }}>
            <Flag class="h-3.5 w-3.5" /> Priority
          </Button>
          {#if showPriorityMenu}
            <div class="absolute bottom-full mb-1 left-0 bg-popover border rounded-lg shadow-lg py-1 min-w-[140px]">
              {#each priorities as p}
                <button class="w-full text-left px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2" onclick={() => handleBatchPriority(p.value)}>
                  <span class="h-2 w-2 rounded-full {p.color} bg-current"></span>
                  {p.label}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <Button size="sm" variant="ghost" class="gap-1.5" onclick={() => appStore.exitBatchMode()}>
        <X class="h-3.5 w-3.5" /> Cancel
      </Button>
    </div>
  </div>
{/if}