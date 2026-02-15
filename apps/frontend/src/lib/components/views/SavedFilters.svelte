<script lang="ts">
  import { onMount } from 'svelte';
  import { Filter, Plus, Trash2 } from '@lucide/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as api from '$lib/api/client';
  import { t } from 'svelte-i18n';
  import type { ISavedFilter } from 'shared';
  import { appStore } from '$lib/stores/app.svelte';

  let filters = $state<ISavedFilter[]>([]);
  let loading = $state(true);
  let showForm = $state(false);
  let newFilter = $state({ name: '', icon: '🔍', color: '#666666', filterConfig: { priorities: [] as string[], categories: [] as number[], tags: [] as string[] } });

  onMount(async () => {
    await loadFilters();
  });

  async function loadFilters() {
    try {
      loading = true;
      filters = await api.getSavedFilters();
    } catch (e) {
      console.error('Failed to load filters:', e);
    } finally {
      loading = false;
    }
  }

  async function createFilter() {
    if (!newFilter.name) return;
    try {
      await api.createSavedFilter(newFilter);
      await loadFilters();
      showForm = false;
      newFilter = { name: '', icon: '🔍', color: '#666666', filterConfig: { priorities: [], categories: [], tags: [] } };
    } catch (e) {
      console.error('Failed to create filter:', e);
    }
  }

  async function deleteFilter(id: number) {
    if (!confirm('Delete this filter?')) return;
    try {
      await api.deleteSavedFilter(id);
      await loadFilters();
    } catch (e) {
      console.error('Failed to delete filter:', e);
    }
  }

  function applyFilter(id: number) {
    appStore.setFilter(id);
  }
</script>

<div class="h-full max-w-4xl mx-auto p-6">
  <div class="flex items-center gap-3 mb-6">
    <Filter class="h-8 w-8" />
    <h1 class="text-2xl font-bold">{$t('filters.title')}</h1>
    <Button class="ml-auto" onclick={() => showForm = !showForm}>
      <Plus class="mr-2 h-4 w-4" />
      {$t('filters.create')}
    </Button>
  </div>

  {#if showForm}
    <Card class="mb-6">
      <CardHeader>
        <CardTitle>{$t('filters.create')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div>
            <Label>Filter Name</Label>
            <Input bind:value={newFilter.name} placeholder="e.g., High Priority" />
          </div>
          <div class="flex gap-2">
            <Button onclick={createFilter}>{$t('app.save')}</Button>
            <Button variant="outline" onclick={() => showForm = false}>{$t('app.cancel')}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  {:else if filters.length === 0}
    <Card>
      <CardContent class="py-8 text-center">
        <p class="text-muted-foreground mb-4">{$t('filters.no_filters')}</p>
        <p class="text-sm text-muted-foreground">{$t('filters.create_first')}</p>
      </CardContent>
    </Card>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each filters as filter}
        <Card class="cursor-pointer hover:bg-muted/50" onclick={() => applyFilter(filter.id)}>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span>{filter.icon}</span>
              {filter.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex justify-between items-center">
              <span class="text-xs text-muted-foreground">{filter.position}</span>
              <Button size="sm" variant="destructive" onclick={(e) => { e.stopPropagation(); deleteFilter(filter.id); }}>
                <Trash2 class="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>
