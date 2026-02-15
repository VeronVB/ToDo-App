<script lang="ts">
  import { X } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';

  interface Props {
    isOpen?: boolean;
    onClose?: () => void;
  }

  let { isOpen = false, onClose }: Props = $props();

  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['1'], desc: 'Go to Inbox' },
      { keys: ['2'], desc: 'Go to Today' },
      { keys: ['3'], desc: 'Go to Upcoming' },
    ]},
    { category: 'Actions', items: [
      { keys: ['⌘', 'K'], desc: 'Quick Capture' },
      { keys: ['B'], desc: 'Toggle batch mode' },
      { keys: ['Esc'], desc: 'Exit batch mode / Close' },
    ]},
    { category: 'Task Actions', items: [
      { keys: ['Enter'], desc: 'Open task details' },
      { keys: ['⌘', 'Enter'], desc: 'Complete task' },
      { keys: ['Delete'], desc: 'Delete task' },
    ]},
  ];
</script>

{#if isOpen}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onclick={onClose}>
    <div class="bg-card border rounded-xl shadow-2xl max-w-md w-full mx-4 p-6" onclick|stopPropagation>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold">Keyboard Shortcuts</h2>
        <Button variant="ghost" size="icon" class="h-7 w-7" onclick={onClose}>
          <X class="h-4 w-4" />
        </Button>
      </div>

      <div class="space-y-6">
        {#each shortcuts as group}
          <div>
            <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.category}</h3>
            <div class="space-y-2">
              {#each group.items as item}
                <div class="flex items-center justify-between">
                  <span class="text-sm">{item.desc}</span>
                  <div class="flex gap-1">
                    {#each item.keys as key}
                      <kbd class="px-2 py-0.5 bg-muted border rounded text-xs font-mono min-w-[24px] text-center">{key}</kbd>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}