<script lang="ts">
  import { Plus, Copy, Trash2, FileText, ChevronDown, ChevronRight } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import type { ITaskTemplate } from 'shared';
  import * as api from '$lib/api/client';
  import { tasksStore } from '$lib/stores/tasks.svelte';

  let templates = $state<ITaskTemplate[]>([]);
  let isCreating = $state(false);
  let expandedId = $state<number | null>(null);

  // Form
  let formName = $state('');
  let formTitle = $state('');
  let formDescription = $state('');
  let formPriority = $state('none');
  let formTags = $state('');
  let formSubtasks = $state('');

  $effect(() => {
    loadTemplates();
  });

  async function loadTemplates() {
    try {
      templates = await api.getTemplates();
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  }

  function resetForm() {
    formName = '';
    formTitle = '';
    formDescription = '';
    formPriority = 'none';
    formTags = '';
    formSubtasks = '';
    isCreating = false;
  }

  async function handleCreate() {
    if (!formName.trim() || !formTitle.trim()) return;
    try {
      const subtasks = formSubtasks.split('\n').map(s => s.trim()).filter(Boolean).map(title => ({ title }));
      const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);

      await api.createTemplate({
        name: formName,
        taskData: {
          title: formTitle,
          description: formDescription || undefined,
          priority: formPriority,
          tags: tags.length > 0 ? tags : undefined
        },
        subtasks: subtasks.length > 0 ? subtasks : undefined
      });
      await loadTemplates();
      resetForm();
    } catch (e) {
      console.error('Failed to create template:', e);
    }
  }

  async function handleUseTemplate(id: number) {
    try {
      await api.useTemplate(id);
      await tasksStore.fetchTasks();
    } catch (e) {
      console.error('Failed to use template:', e);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteTemplate(id);
      await loadTemplates();
    } catch (e) {
      console.error('Failed to delete template:', e);
    }
  }
</script>

<div class="space-y-4 p-4">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold">Task Templates</h2>
    <Button size="sm" class="gap-1.5" onclick={() => (isCreating = !isCreating)}>
      <Plus class="h-3.5 w-3.5" />
      New Template
    </Button>
  </div>

  {#if isCreating}
    <div class="space-y-3 p-4 bg-muted/50 rounded-lg border">
      <Input placeholder="Template name (e.g. Weekly Review)" bind:value={formName} />
      <Input placeholder="Task title" bind:value={formTitle} />
      <textarea
        class="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
        placeholder="Description (optional)"
        bind:value={formDescription}
      ></textarea>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">Priority</label>
          <select bind:value={formPriority} class="h-9 w-full rounded-md border bg-background px-2 text-sm">
            <option value="none">None</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">Tags</label>
          <Input placeholder="tag1, tag2" bind:value={formTags} />
        </div>
      </div>

      <div>
        <label class="text-xs text-muted-foreground mb-1 block">Subtasks (one per line)</label>
        <textarea
          class="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] resize-y font-mono"
          placeholder="Subtask 1&#10;Subtask 2&#10;Subtask 3"
          bind:value={formSubtasks}
        ></textarea>
      </div>

      <div class="flex gap-2">
        <Button size="sm" onclick={handleCreate}>Create Template</Button>
        <Button size="sm" variant="ghost" onclick={resetForm}>Cancel</Button>
      </div>
    </div>
  {/if}

  {#if templates.length === 0 && !isCreating}
    <div class="text-center py-12 text-muted-foreground">
      <FileText class="h-10 w-10 mx-auto mb-3 opacity-40" />
      <p class="text-sm">No templates yet</p>
      <p class="text-xs mt-1">Create reusable task templates for common workflows</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each templates as template (template.id)}
        <div class="border rounded-lg overflow-hidden">
          <button
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
            onclick={() => expandedId = expandedId === template.id ? null : template.id}
          >
            {#if expandedId === template.id}
              <ChevronDown class="h-4 w-4 text-muted-foreground shrink-0" />
            {:else}
              <ChevronRight class="h-4 w-4 text-muted-foreground shrink-0" />
            {/if}
            <FileText class="h-4 w-4 text-muted-foreground shrink-0" />
            <span class="flex-1 text-left font-medium text-sm">{template.name}</span>
            <span class="text-xs text-muted-foreground">{template.taskData.title}</span>
          </button>

          {#if expandedId === template.id}
            <div class="px-4 pb-3 pt-1 border-t bg-muted/30 space-y-2">
              <div class="text-sm">
                <span class="text-muted-foreground">Title:</span> {template.taskData.title}
              </div>
              {#if template.taskData.description}
                <div class="text-sm">
                  <span class="text-muted-foreground">Description:</span> {template.taskData.description}
                </div>
              {/if}
              {#if template.taskData.priority && template.taskData.priority !== 'none'}
                <div class="text-sm">
                  <span class="text-muted-foreground">Priority:</span> {template.taskData.priority}
                </div>
              {/if}
              {#if template.subtasks && template.subtasks.length > 0}
                <div class="text-sm">
                  <span class="text-muted-foreground">Subtasks:</span>
                  <ul class="ml-4 mt-1 space-y-0.5">
                    {#each template.subtasks as sub}
                      <li class="text-xs text-muted-foreground">• {sub.title}</li>
                    {/each}
                  </ul>
                </div>
              {/if}

              <div class="flex gap-2 pt-2">
                <Button size="sm" class="gap-1.5" onclick={() => handleUseTemplate(template.id)}>
                  <Copy class="h-3 w-3" /> Use Template
                </Button>
                <Button size="sm" variant="ghost" class="gap-1.5 text-destructive hover:text-destructive" onclick={() => handleDelete(template.id)}>
                  <Trash2 class="h-3 w-3" /> Delete
                </Button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>