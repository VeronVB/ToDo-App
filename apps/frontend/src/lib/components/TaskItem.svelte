<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Badge } from '$lib/components/ui/badge';
  import { Calendar, MoreHorizontal, Edit, Trash2, Plus, GripVertical, ChevronRight, ChevronDown } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { t } from 'svelte-i18n';
  import { projectsStore } from '$lib/stores/projects.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import * as api from '$lib/api/client';
  import TaskItem from './TaskItem.svelte';
  import { cn } from '$lib/utils';
  
  interface Task {
    id: number;
    title: string;
    description?: string;
    completed: boolean;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
    project?: string; 
    categoryId?: number;
    children?: Task[];
    position?: number; // Needed for sorting if passed
    tags?: { id: number; name: string; color?: string; }[];
    pendingParentCompletion?: boolean;
  }

  interface Props {
    task: Task;
    onToggle: (id: number, completed: boolean) => void;
    onDelete: (id: number) => void;
    onEdit: (id: number) => void;
    
    // DnD Props
    draggable?: boolean;
    dndHandlers?: {
        onDragStart: (id: number) => void;
        onDragOver: (e: DragEvent, id: number) => void;
        onDrop: (id: number) => void;
    };
    dropIndicator?: { taskId: number; position: 'before' | 'after' | 'child' } | null;
  }

  let { task, onToggle, onDelete, onEdit, draggable = false, dndHandlers, dropIndicator }: Props = $props();

  let isExpanded = $state(false); // Description expansion
  let areChildrenExpanded = $state(true); // Subtasks expansion
  let elementRef = $state<HTMLElement | null>(null);

  // Derive local drop indicator state
  let myDropPosition = $derived(dropIndicator?.taskId === task.id ? dropIndicator.position : null);
  let isHighlighted = $derived(uiStore.highlightedTaskId === task.id);

  // Auto-expand children if dragging over as 'child'
  $effect(() => {
      if (myDropPosition === 'child' && !areChildrenExpanded) {
          areChildrenExpanded = true;
      }
  });

  $effect(() => {
      if (isHighlighted && elementRef) {
          elementRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Open parent if nested? 
          // Assuming parent TaskItem handles expansion if child isHighlighted? 
          // Not implemented yet, but scrollIntoView helps.
      }
  });

  function handleCheckedChange(checked: boolean | 'indeterminate') {
      if (typeof checked === 'boolean') {
          onToggle(task.id, checked);
      }
  }

  function formatDate(date: Date | string) {
      return new Date(date).toLocaleDateString();
  }

  let projectName = $derived.by(() => {
      const id = task.project || (task.categoryId ? task.categoryId.toString() : undefined);
      if (!id) return null;

      const p = projectsStore.projects.find(p => p.id.toString() === id.toString() || p.name === id);
      return p ? p.name : null; 
  });

  const priorityColors = {
      high: "bg-red-500",
      medium: "bg-orange-500",
      low: "bg-green-500"
  };

  function handleAddSubtask() {
    uiStore.openAdd(task.id);
  }

  // --- Drag Events ---
  function onDragStart(e: DragEvent) {
      if (!draggable || !dndHandlers) return;
      e.stopPropagation();
      // Set data transfer just in case
      if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          // e.dataTransfer.setDragImage(ghost, 0, 0); // Browser default is fine usually
      }
      dndHandlers.onDragStart(task.id);
  }

  function onDragOver(e: DragEvent) {
      if (!draggable || !dndHandlers) return;
      dndHandlers.onDragOver(e, task.id);
  }

  function onDrop(e: DragEvent) {
      if (!draggable || !dndHandlers) return;
      e.stopPropagation();
      e.preventDefault();
      dndHandlers.onDrop(task.id);
  }

</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    class="relative flex flex-col gap-2"
    ondragover={onDragOver}
    ondrop={onDrop}
>
    <!-- Drop Indicators -->
    {#if myDropPosition === 'before'}
        <div class="absolute -top-1 left-0 right-0 h-1 rounded bg-primary z-20 pointer-events-none"></div>
    {/if}
    {#if myDropPosition === 'after'}
        <div class="absolute -bottom-1 left-0 right-0 h-1 rounded bg-primary z-20 pointer-events-none"></div>
    {/if}
    {#if myDropPosition === 'child'}
        <div class="absolute inset-0 rounded-lg border-2 border-primary bg-primary/5 z-20 pointer-events-none"></div>
    {/if}

    <div 
      bind:this={elementRef}
      class="group relative flex flex-col gap-[var(--spacing-list)] rounded-[var(--radius)] border p-[var(--spacing-card)] cursor-pointer transition-colors duration-200 {isExpanded ? 'border-primary bg-primary/5' : 'bg-card border-border hover:bg-accent/50'} {(task.completed || task.pendingParentCompletion) ? 'opacity-50' : ''} {isHighlighted ? 'animate-flash-highlight' : ''}"
      onclick={(e) => {
        isExpanded = !isExpanded;
        e.stopPropagation();
      }}
      draggable={draggable}
      ondragstart={onDragStart}
    >
      <div class="flex items-center gap-3">
        <!-- Expand Children Button -->
        {#if task.children && task.children.length > 0}
            <div onclick={(e) => e.stopPropagation()}>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-4 w-4 shrink-0 hover:bg-transparent" 
                    onclick={() => areChildrenExpanded = !areChildrenExpanded}
                >
                    {#if areChildrenExpanded}
                        <ChevronDown class="h-3 w-3" />
                    {:else}
                        <ChevronRight class="h-3 w-3" />
                    {/if}
                </Button>
            </div>
        {/if}

        <!-- Drag Handle -->
        {#if draggable}
            <div class="cursor-grab active:cursor-grabbing text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical class="h-4 w-4" />
            </div>
        {/if}

        <!-- Checkbox -->
        <div onclick={(e) => e.stopPropagation()}>
          <Checkbox checked={task.completed} onCheckedChange={handleCheckedChange} />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 py-0.5">
          <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium transition-all duration-200 {task.completed ? 'line-through text-muted-foreground opacity-70' : ''} {task.pendingParentCompletion ? 'line-through text-red-500 font-bold' : ''}">
                  {task.title}
               </span>
             
             {#if task.priority}
                <div class={`h-2.5 w-2.5 rounded-full ${priorityColors[task.priority].split(' ')[0].replace('bg-', 'bg-')}`} title={$t(`task_form.priorities.${task.priority}`)}></div>
             {/if}
             
              {#if projectName}
                 <Badge variant="outline" class="h-5 px-1.5 text-[10px] text-muted-foreground">
                   {projectName}
                 </Badge>
              {/if}

              {#if task.tags && task.tags.length > 0}
                  {#each task.tags as tag}
                      <span class="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">#{tag.name}</span>
                  {/each}
              {/if}
          </div>

          {#if isExpanded && task.description}
            <p class="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {task.description}
            </p>
          {/if}
          
          {#if isExpanded && task.dueDate}
             <div class="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <div class="flex items-center gap-1">
                    <Calendar class="h-3 w-3" />
                    <span>{formatDate(task.dueDate)}</span>
                </div>
             </div>
          {/if}
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onclick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => onEdit(task.id)}>
                <Edit class="h-4 w-4 text-muted-foreground" />
            </Button>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  {#snippet child({ props })}
                     <Button variant="ghost" size="icon" class="h-8 w-8" {...props}>
                        <MoreHorizontal class="h-4 w-4 text-muted-foreground" />
                     </Button>
                  {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                    <DropdownMenu.Item onclick={handleAddSubtask}>
                        <Plus class="mr-2 h-4 w-4" />
                        {$t('tasks.add_subtask') || 'Add Subtask'}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onclick={() => onEdit(task.id)}>{$t('app.edit')}</DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => onDelete(task.id)} class="text-destructive">{$t('app.delete')}</DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>
      </div>
    </div>

    <!-- Subtasks -->
    {#if task.children && task.children.length > 0 && areChildrenExpanded}
        <div class="ml-8 mt-2 space-y-2 border-l pl-2 outline-none">
            {#each task.children as child (child.id)}
                <TaskItem 
                    task={child} 
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    
                    draggable={draggable}
                    dndHandlers={dndHandlers}
                    dropIndicator={dropIndicator}
                />
            {/each}
        </div>
    {/if}
</div>
