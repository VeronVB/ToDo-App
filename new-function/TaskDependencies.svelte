<script lang="ts">
  import { Link2, Plus, X, AlertTriangle, Lock } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import type { ITask, ITaskDependency } from 'shared';
  import * as api from '$lib/api/client';

  interface Props {
    taskId: number;
    allTasks?: ITask[];
    onUpdate?: () => void;
  }

  let { taskId, allTasks = [], onUpdate }: Props = $props();

  let dependencies = $state<ITaskDependency[]>([]);
  let dependents = $state<ITaskDependency[]>([]);
  let isAdding = $state(false);
  let searchQuery = $state('');
  let error = $state('');

  $effect(() => {
    loadDependencies();
  });

  async function loadDependencies() {
    try {
      const all = await api.getDependencies(taskId);
      dependencies = all.filter(d => d.taskId === taskId);
      dependents = all.filter(d => d.dependsOnTaskId === taskId);
    } catch (e) {
      console.error('Failed to load dependencies:', e);
    }
  }

  let filteredTasks = $derived(
    allTasks
      .filter(t => t.id !== taskId)
      .filter(t => !dependencies.some(d => d.dependsOnTaskId === t.id))
      .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8)
  );

  async function addDependency(dependsOnId: number) {
    error = '';
    try {
      await api.addDependency(taskId, dependsOnId);
      await loadDependencies();
      onUpdate?.();
      isAdding = false;
      searchQuery = '';
    } catch (e: any) {
      error = e.message || 'Failed to add dependency (circular?)';
    }
  }

  async function removeDependency(dependsOnId: number) {
    try {
      await api.removeDependency(taskId, dependsOnId);
      await loadDependencies();
      onUpdate?.();
    } catch (e) {
      console.error('Failed to remove dependency:', e);
    }
  }

  function getTaskTitle(id: number): string {
    return allTasks.find(t => t.id === id)?.title || `Task #${id}`;
  }
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
      <Link2 class="h-3.5 w-3.5" />
      Dependencies
    </h4>
    <Button variant="ghost" size="icon" class="h-6 w-6" onclick={() => isAdding = !isAdding}>
      <Plus class="h-3 w-3" />
    </Button>
  </div>

  {#if error}
    <div class="flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 px-2 py-1.5 rounded">
      <AlertTriangle class="h-3 w-3 shrink-0" />
      {error}
    </div>
  {/if}

  <!-- Depends on (blockers) -->
  {#if dependencies.length > 0}
    <div class="space-y-1">
      <p class="text-[10px] text-muted-foreground">Blocked by:</p>
      {#each dependencies as dep}
        <div class="flex items-center gap-2 px-2 py-1 bg-red-500/5 rounded text-sm group">
          <Lock class="h-3 w-3 text-red-400 shrink-0" />
          <span class="flex-1 truncate">{getTaskTitle(dep.dependsOnTaskId)}</span>
          <button class="opacity-0 group-hover:opacity-100 transition-opacity" onclick={() => removeDependency(dep.dependsOnTaskId)}>
            <X class="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Dependents (blocks other tasks) -->
  {#if dependents.length > 0}
    <div class="space-y-1">
      <p class="text-[10px] text-muted-foreground">Blocks:</p>
      {#each dependents as dep}
        <div class="flex items-center gap-2 px-2 py-1 bg-yellow-500/5 rounded text-sm">
          <Link2 class="h-3 w-3 text-yellow-500 shrink-0" />
          <span class="flex-1 truncate">{getTaskTitle(dep.taskId)}</span>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Add dependency search -->
  {#if isAdding}
    <div class="border rounded-lg overflow-hidden">
      <input
        type="text"
        placeholder="Search tasks to add as dependency..."
        bind:value={searchQuery}
        class="w-full px-3 py-2 text-sm bg-background border-b focus:outline-none"
      />
      <div class="max-h-40 overflow-y-auto">
        {#each filteredTasks as task}
          <button
            class="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors flex items-center gap-2"
            onclick={() => addDependency(task.id)}
          >
            <span class="flex-1 truncate">{task.title}</span>
            <Plus class="h-3 w-3 text-muted-foreground" />
          </button>
        {/each}
        {#if filteredTasks.length === 0}
          <p class="px-3 py-2 text-xs text-muted-foreground">No matching tasks found</p>
        {/if}
      </div>
    </div>
  {/if}

  {#if dependencies.length === 0 && dependents.length === 0 && !isAdding}
    <p class="text-xs text-muted-foreground">No dependencies</p>
  {/if}
</div>