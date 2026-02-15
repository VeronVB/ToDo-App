<script lang="ts">
  import { Plus, X, Zap } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { projectsStore } from '$lib/stores/projects.svelte';
  import { t } from 'svelte-i18n';
  import * as chrono from 'chrono-node';

  let isOpen = $state(false);
  let value = $state('');
  let inputRef = $state<HTMLInputElement | null>(null);
  let recentlyAdded = $state<string | null>(null);

  export function toggle() {
    isOpen = !isOpen;
    if (isOpen) {
      value = '';
      setTimeout(() => inputRef?.focus(), 50);
    }
  }

  export function open() {
    isOpen = true;
    value = '';
    setTimeout(() => inputRef?.focus(), 50);
  }

  function close() {
    isOpen = false;
    value = '';
  }

  async function handleSubmit() {
    if (!value.trim()) return;

    let text = value.trim();
    let priority: 'low' | 'medium' | 'high' = 'medium';
    let categoryId: number | undefined;
    let dueDate: string | undefined;
    let tags: string[] = [];

    // Parse priority
    const priorityMatch = text.match(/!(high|medium|low|wysoki|sredni|średni|niski)/i);
    if (priorityMatch) {
      const p = priorityMatch[1].toLowerCase();
      if (['high', 'wysoki'].includes(p)) priority = 'high';
      else if (['low', 'niski'].includes(p)) priority = 'low';
      text = text.replace(priorityMatch[0], '').trim();
    }

    // Parse project
    const projectMatch = text.match(/@([\w\p{L}]+)/u);
    if (projectMatch) {
      const proj = projectsStore.projects.find(p => p.name.toLowerCase() === projectMatch[1].toLowerCase());
      if (proj) categoryId = proj.id;
      text = text.replace(projectMatch[0], '').trim();
    }

    // Parse tags
    const tagMatches = [...text.matchAll(/#([\w\p{L}]+)/gu)];
    for (const m of tagMatches) {
      tags.push(m[1]);
      text = text.replace(m[0], '').trim();
    }

    // Parse date (NLP)
    const plMap: Record<string, string> = {
      'jutro': 'tomorrow', 'dzisiaj': 'today', 'dziś': 'today',
      'pojutrze': 'day after tomorrow'
    };
    let dateText = text;
    Object.keys(plMap).forEach(key => {
      dateText = dateText.replace(new RegExp(`\\b${key}\\b`, 'gi'), plMap[key]);
    });
    const parsed = chrono.parse(dateText);
    if (parsed.length > 0) {
      dueDate = parsed[0].start.date().toISOString();
      // Remove date text from title
      const dateStr = parsed[0].text;
      text = text.replace(new RegExp(dateStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
    }

    // Clean up
    text = text.replace(/\s+/g, ' ').trim();

    try {
      await tasksStore.addTask({
        title: text || value,
        priority,
        categoryId,
        dueDate,
        tags
      } as any);
      
      recentlyAdded = text || value;
      value = '';
      setTimeout(() => { recentlyAdded = null; }, 2000);
      inputRef?.focus();
    } catch (e) {
      console.error(e);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div class="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm" onclick={close}></div>
  
  <!-- Quick Capture Bar -->
  <div class="fixed top-[20vh] left-1/2 -translate-x-1/2 z-[61] w-full max-w-xl px-4">
    <div class="bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center gap-3 px-4 py-3">
        <Zap class="h-5 w-5 text-primary shrink-0" />
        <input
          bind:this={inputRef}
          bind:value={value}
          onkeydown={handleKeydown}
          placeholder="Quick add: Buy milk tomorrow @Personal !high #grocery"
          class="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
        />
        <Button size="sm" onclick={handleSubmit} disabled={!value.trim()}>
          <Plus class="h-4 w-4 mr-1" /> Add
        </Button>
        <Button variant="ghost" size="icon" class="h-8 w-8" onclick={close}>
          <X class="h-4 w-4" />
        </Button>
      </div>
      
      {#if recentlyAdded}
        <div class="px-4 py-2 border-t bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
          <span>✓</span> Added: <strong>{recentlyAdded}</strong>
        </div>
      {/if}
      
      <div class="px-4 py-2 border-t text-[10px] text-muted-foreground flex gap-4">
        <span><kbd class="font-mono bg-muted px-1 rounded">@</kbd> project</span>
        <span><kbd class="font-mono bg-muted px-1 rounded">#</kbd> tag</span>
        <span><kbd class="font-mono bg-muted px-1 rounded">!</kbd> priority</span>
        <span class="ml-auto">press <kbd class="font-mono bg-muted px-1 rounded">Esc</kbd> to close</span>
      </div>
    </div>
  </div>
{/if}