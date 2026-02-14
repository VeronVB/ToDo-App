<script lang="ts">
  import * as Command from "$lib/components/ui/command";
  import { uiStore } from "$lib/stores/ui.svelte";
  import { appStore } from "$lib/stores/app.svelte";
  import { searchTasks } from "$lib/api/client";
  import type { ITask } from "shared";
  import { t } from "svelte-i18n";
  import { Check, Circle } from "@lucide/svelte";
  
  let { open, onOpenChange } = $props<{ open: boolean; onOpenChange: (open: boolean) => void }>();

  let query = $state("");
  let results = $state<ITask[]>([]);
  let loading = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput(value: string) {
    query = value;
    clearTimeout(debounceTimer);
    
    if (value.trim().length === 0) {
        results = [];
        return;
    }

    loading = true;
    debounceTimer = setTimeout(async () => {
        try {
            results = await searchTasks(value);
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }, 300);
  }

  function handleNavigate(task: ITask) {
      onOpenChange(false);
      
      // Navigate to context
      if (task.categoryId) {
          appStore.setProject(task.categoryId);
      } else {
          appStore.setView('inbox');
      }

      // Trigger highlight
      uiStore.highlightedTaskId = task.id;
      
      // Clear highlight after a delay
      setTimeout(() => {
          uiStore.highlightedTaskId = null;
      }, 3000);
  }

  function handlePointerDown(e: PointerEvent, task: ITask) {
      if (e.ctrlKey || e.metaKey || e.altKey) {
          e.preventDefault();
          uiStore.openEdit(task);
          onOpenChange(false);
      }
  }
</script>

<Command.Dialog bind:open={open} onOpenChange={onOpenChange} shouldFilter={false}>
  <Command.Input placeholder={$t('search.placeholder')} oninput={(e) => handleInput(e.currentTarget.value)} />
  <Command.List>
    <Command.Empty>
        {#if loading}
            {$t('search.searching')}
        {:else if query}
            {$t('search.no_results')}
        {:else}
            {$t('search.type_to_search')}
        {/if}
    </Command.Empty>
    
    {#if results.length > 0}
        <Command.Group heading={$t('search.tasks')}>
            {#each results as task (task.id)}
                <Command.Item 
                    onSelect={() => handleNavigate(task)} 
                    value={task.title + task.id}
                    onpointerdown={(e) => handlePointerDown(e, task)}
                >
                    <div class="mr-2 flex h-4 w-4 items-center justify-center rounded-full border border-primary/50">
                        {#if task.completed}
                            <Check class="h-3 w-3" />
                        {:else}
                            <Circle class="h-3 w-3 opacity-0" />
                        {/if}
                    </div>
                    <span>{task.title}</span>
                    {#if task.description}
                        <span class="ml-2 text-xs text-muted-foreground truncate max-w-[200px]">{task.description}</span>
                    {/if}
                </Command.Item>
            {/each}
        </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
