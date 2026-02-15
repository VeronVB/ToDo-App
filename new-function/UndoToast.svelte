<script lang="ts">
  import { X, Undo2 } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { undoStore } from '$lib/stores/undo.svelte';

  let actions = $derived(undoStore.actions);
</script>

{#if actions.length > 0}
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
    {#each actions as action (action.id)}
      <div class="flex items-center gap-3 bg-card border shadow-xl rounded-xl px-4 py-3 min-w-[280px] animate-in slide-in-from-bottom-4 fade-in duration-200">
        <span class="text-sm flex-1">{action.label}</span>
        <Button variant="link" size="sm" class="h-auto p-0 text-primary font-semibold" onclick={() => undoStore.undo(action.id)}>
          <Undo2 class="h-3.5 w-3.5 mr-1" />
          Undo
        </Button>
        <Button variant="ghost" size="icon" class="h-6 w-6 shrink-0" onclick={() => undoStore.dismiss(action.id)}>
          <X class="h-3 w-3" />
        </Button>
      </div>
    {/each}
  </div>
{/if}