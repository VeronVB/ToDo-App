<script lang="ts">
  import { X, Send } from '@lucide/svelte';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { t } from 'svelte-i18n';

  let inputValue = $state('');

  async function handleSubmit() {
    if (!inputValue.trim()) return;
    
    try {
      await tasksStore.addTask({
        title: inputValue.trim(),
        priority: 'medium'
      });
      inputValue = '';
      uiStore.closeQuickCapture();
    } catch (e) {
      console.error('Failed to add task:', e);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      uiStore.closeQuickCapture();
    }
  }
</script>

{#if uiStore.isQuickCaptureOpen}
  <div class="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50" onclick={() => uiStore.closeQuickCapture()}>
    <div class="w-full max-w-xl bg-background rounded-lg shadow-2xl border p-4" onclick={(e) => e.stopPropagation()}>
      <div class="flex items-center gap-2">
        <Input 
          bind:value={inputValue}
          placeholder={$t('quick_capture.placeholder')}
          class="flex-1"
          onkeydown={handleKeydown}
          autofocus
        />
        <Button size="sm" onclick={handleSubmit}>
          <Send class="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onclick={() => uiStore.closeQuickCapture()}>
          <X class="h-4 w-4" />
        </Button>
      </div>
      <p class="text-xs text-muted-foreground mt-2">{$t('quick_capture.hint')}</p>
    </div>
  </div>
{/if}
