<script lang="ts">
  import { Plus, Pencil, Trash2, Filter, Star } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import type { ISavedFilter, IFilterConfig } from 'shared';
  import * as api from '$lib/api/client';
  import { appStore } from '$lib/stores/app.svelte';

  let filters = $state<ISavedFilter[]>([]);
  let isCreating = $state(false);
  let editingId = $state<number | null>(null);

  // New filter form
  let newName = $state('');
  let newPriority = $state('');
  let newStatus = $state('');
  let newDueBefore = $state('');
  let newDueAfter = $state('');
  let newCategoryId = $state('');
  let newTags = $state('');

  $effect(() => {
    loadFilters();
  });

  async function loadFilters() {
    try {
      filters = await api.getSavedFilters();
    } catch (e) {
      console.error('Failed to load filters:', e);
    }
  }

  function buildConfig(): IFilterConfig {
    const config: IFilterConfig = {};
    if (newPriority) config.priority = [newPriority];
    if (newStatus) config.status = newStatus as any;
    if (newDueBefore) config.dueBefore = newDueBefore;
    if (newDueAfter) config.dueAfter = newDueAfter;
    if (newCategoryId) config.categoryId = parseInt(newCategoryId);
    if (newTags) config.tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
    return config;
  }

  function resetForm() {
    newName = '';
    newPriority = '';
    newStatus = '';
    newDueBefore = '';
    newDueAfter = '';
    newCategoryId = '';
    newTags = '';
    isCreating = false;
    editingId = null;
  }

  async function handleSave() {
    if (!newName.trim()) return;
    const config = buildConfig();

    try {
      if (editingId) {
        await api.updateSavedFilter(editingId, { name: newName, config, icon: 'filter' });
      } else {
        await api.createSavedFilter({ name: newName, config, icon: 'filter' });
      }
      await loadFilters();
      resetForm();
    } catch (e) {
      console.error('Failed to save filter:', e);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteSavedFilter(id);
      await loadFilters();
    } catch (e) {
      console.error('Failed to delete filter:', e);
    }
  }

  function startEdit(f: ISavedFilter) {
    editingId = f.id;
    newName = f.name;
    newPriority = f.config.priority?.[0] || '';
    newStatus = f.config.status || '';
    newDueBefore = f.config.dueBefore || '';
    newDueAfter = f.config.dueAfter || '';
    newCategoryId = f.config.categoryId?.toString() || '';
    newTags = f.config.tags?.join(', ') || '';
    isCreating = true;
  }

  function selectFilter(f: ISavedFilter) {
    appStore.setFilter(f.id);
  }
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Smart Lists</h3>
    <Button variant="ghost" size="icon" class="h-6 w-6" onclick={() => { isCreating = true; editingId = null; }}>
      <Plus class="h-3.5 w-3.5" />
    </Button>
  </div>

  {#if isCreating}
    <div class="space-y-2 p-3 bg-muted/50 rounded-lg border">
      <Input placeholder="Filter name..." bind:value={newName} class="h-8 text-sm" />

      <div class="grid grid-cols-2 gap-2">
        <select bind:value={newPriority} class="h-8 text-xs rounded-md border bg-background px-2">
          <option value="">Any priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="none">None</option>
        </select>

        <select bind:value={newStatus} class="h-8 text-xs rounded-md border bg-background px-2">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <Input placeholder="Tags (comma-separated)" bind:value={newTags} class="h-8 text-sm" />

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="text-[10px] text-muted-foreground">Due after</label>
          <Input type="date" bind:value={newDueAfter} class="h-8 text-sm" />
        </div>
        <div>
          <label class="text-[10px] text-muted-foreground">Due before</label>
          <Input type="date" bind:value={newDueBefore} class="h-8 text-sm" />
        </div>
      </div>

      <div class="flex gap-2 pt-1">
        <Button size="sm" class="flex-1 h-7 text-xs" onclick={handleSave}>
          {editingId ? 'Update' : 'Create'}
        </Button>
        <Button size="sm" variant="ghost" class="h-7 text-xs" onclick={resetForm}>
          Cancel
        </Button>
      </div>
    </div>
  {/if}

  <div class="space-y-0.5">
    {#each filters as f (f.id)}
      <button
        class="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors group {appStore.selectedFilterId === f.id ? 'bg-accent font-medium' : ''}"
        onclick={() => selectFilter(f)}
      >
        <Filter class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span class="flex-1 text-left truncate">{f.name}</span>
        <div class="hidden group-hover:flex items-center gap-0.5">
          <button class="p-0.5 hover:text-primary" onclick|stopPropagation={() => startEdit(f)}>
            <Pencil class="h-3 w-3" />
          </button>
          <button class="p-0.5 hover:text-destructive" onclick|stopPropagation={() => handleDelete(f.id)}>
            <Trash2 class="h-3 w-3" />
          </button>
        </div>
      </button>
    {/each}
  </div>
</div>