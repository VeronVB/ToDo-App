<script lang="ts">
  import { CheckCircle2, Trash2, Folder, Tag } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { appStore } from '$lib/stores/app.svelte';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import * as api from '$lib/api/client';
  import { t } from 'svelte-i18n';

  let selectedCount = $derived(appStore.selectedTaskIds.size);

  async function completeSelected() {
    const ids = Array.from(appStore.selectedTaskIds);
    try {
      await api.batchAction(ids, 'complete');
      await tasksStore.fetchTasks();
      appStore.exitBatchMode();
    } catch (e) {
      console.error('Failed to complete tasks:', e);
    }
  }

  async function deleteSelected() {
    if (!confirm(`Delete ${selectedCount} tasks?`)) return;
    const ids = Array.from(appStore.selectedTaskIds);
    try {
      await api.batchAction(ids, 'delete');
      await tasksStore.fetchTasks();
      appStore.exitBatchMode();
    } catch (e) {
      console.error('Failed to delete tasks:', e);
    }
  }

  function selectAll() {
    const allIds = tasksStore.tasks.map(t => t.id);
    appStore.selectAllTasks(allIds);
  }
</script>

{#if appStore.batchMode}
  <div class="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-40 p-4">
    <div class="flex items-center justify-between max-w-4xl mx-auto">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium">{selectedCount} selected</span>
        <Button variant="outline" size="sm" onclick={selectAll}>
          {$t('batch_actions.select_all')}
        </Button>
        <Button variant="outline" size="sm" onclick={() => appStore.exitBatchMode()}>
          {$t('batch_actions.clear_selection')}
        </Button>
      </div>
      
      <div class="flex items-center gap-2">
        <Button size="sm" onclick={completeSelected}>
          <CheckCircle2 class="mr-2 h-4 w-4" />
          {$t('batch_actions.complete')}
        </Button>
        <Button size="sm" variant="destructive" onclick={deleteSelected}>
          <Trash2 class="mr-2 h-4 w-4" />
          {$t('batch_actions.delete')}
        </Button>
      </div>
    </div>
  </div>
{/if}
