<script lang="ts">
  import { RotateCcw, X } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { undoStore } from '$lib/stores/undo.svelte';
  import { t } from 'svelte-i18n';
</script>

{#if undoStore.actions.length > 0}
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    {#each undoStore.actions as action (action.id)}
      <div class="flex items-center gap-2 bg-background border rounded-lg shadow-lg p-3">
        <span class="text-sm">{action.label}</span>
        <Button size="sm" variant="outline" onclick={() => undoStore.undo(action.id)}>
          <RotateCcw class="mr-1 h-3 w-3" />
          {$t('undo.undo')}
        </Button>
        <Button size="sm" variant="ghost" onclick={() => undoStore.dismiss(action.id)}>
          <X class="h-3 w-3" />
        </Button>
      </div>
    {/each}
  </div>
{/if}
