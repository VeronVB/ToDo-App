<script lang="ts">
  import { CheckCircle, Plus, Trash2 } from '@lucide/svelte';
  import TaskItem from './TaskItem.svelte';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Separator } from '$lib/components/ui/separator';
  import { appStore } from '$lib/stores/app.svelte';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { projectsStore } from '$lib/stores/projects.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { t } from 'svelte-i18n';
  import * as api from '$lib/api/client';
  import type { ITask } from 'shared';

  interface Props {
      onAddTask: () => void;
      onToggleTask: (id: number, completed: boolean) => void;
      onDeleteTask: (id: number) => void;
      onEditTask: (id: number) => void;
  }

  let { onAddTask, onToggleTask, onDeleteTask, onEditTask }: Props = $props();

  // --- Helpers ---
  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    const taskDate = dateStr.split('T')[0];
    return taskDate <= today;
  };

  const isUpcoming = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    const taskDate = dateStr.split('T')[0];
    return taskDate > today;
  };

  // --- Tree Helpers ---
  function findTaskRecursive(tasks: ITask[], id: number): ITask | null {
      for (const task of tasks) {
          if (task.id === id) return task;
          if (task.children) {
              const found = findTaskRecursive(task.children, id);
              if (found) return found;
          }
      }
      return null;
  }

  function flattenTasks(tasks: ITask[]): ITask[] {
      let result: ITask[] = [];
      for (const t of tasks) {
          result.push(t);
          if (t.children) {
              result = result.concat(flattenTasks(t.children));
          }
      }
      return result;
  }

  // --- Filtering ---
  let filteredFlatTasks = $derived.by(() => {
      const allTasks = tasksStore.tasks; // This is a TREE now
      const view = appStore.currentView;
      const project = appStore.selectedProject;

      if (view === 'project' && project) {
          return allTasks.filter(t => !t.completed && (
              (t.categoryId?.toString() === project.toString()) || 
              (t.project?.toString() === project.toString())
          ));
      }

      if (view === 'tag') {
          const allFlat = flattenTasks(allTasks);
          return allFlat.filter(t => t.tags?.some(tag => tag.name === appStore.selectedTag));
      }

      switch (view) {
          case 'inbox':
              return allTasks.filter(t => !t.dueDate && !t.categoryId && !t.completed);
          case 'today':
              return allTasks.filter(t => !t.completed && isToday(t.dueDate));
          case 'upcoming':
              return allTasks.filter(t => !t.completed && isUpcoming(t.dueDate));
          case 'logbook':
              const logbookTasks = allTasks.filter(t => t.completed)
                  .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
              console.log('[DEBUG] Logbook Tasks:', logbookTasks.map(t => ({ id: t.id, title: t.title, completed: t.completed, recurrence: t.recurrence })));
              return logbookTasks;
          default:
              return allTasks.filter(t => !t.completed);
      }
  });

  let processedTasks = $derived.by(() => {
      if (appStore.currentView === 'tag') {
          return {
              active: filteredFlatTasks.filter(t => !t.completed),
              completed: filteredFlatTasks.filter(t => t.completed)
          };
      }
      return {
          active: filteredFlatTasks,
          completed: []
      };
  });

  // --- Tree Building ---
  // Since backend returns a tree, and filteredFlatTasks filters the roots of that tree,
  // we can use it directly. The children are already nested in the objects.
  let taskTree = $derived(processedTasks.active);

  // --- View Titles & Empty States ---
  const viewTitles = $derived({
      inbox: $t('sidebar.inbox'),
      today: $t('sidebar.today'),
      upcoming: $t('sidebar.upcoming'),
      logbook: $t('sidebar.logbook')
  });

  let title = $derived.by(() => {
      if (appStore.currentView === 'tag') {
          return `# ${appStore.selectedTag || ''}`;
      }
      if (appStore.selectedProject) {
          const project = projectsStore.projects.find(p => p.id.toString() === appStore.selectedProject?.toString());
          return project ? project.name : appStore.selectedProject;
      }
      return viewTitles[appStore.currentView as keyof typeof viewTitles] || 'Tasks';
  });

  const emptyMessages = $derived({
      inbox: $t('tasks.empty.inbox'),
      today: $t('tasks.empty.today'),
      upcoming: $t('tasks.empty.upcoming'),
      logbook: $t('tasks.empty.logbook'),
      tag: $t('tasks.empty.tag')
  });

  let emptyMessage = $derived(emptyMessages[appStore.currentView as keyof typeof emptyMessages] || $t('tasks.empty.default'));

  // --- Drag & Drop State ---
  let draggedTaskId = $state<number | null>(null);
  let dragOverTaskId = $state<number | null>(null);
  let dropPosition = $state<'before' | 'after' | 'child' | null>(null);
  let dragDisabled = $state(false);

  function handleDragStart(id: number) {
      draggedTaskId = id;
  }

  function handleDragOver(e: DragEvent, id: number) {
      e.preventDefault();
      if (!draggedTaskId || draggedTaskId === id) return;
      
      dragOverTaskId = id;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const threshold = rect.height / 3;
      
      if (relativeY < threshold) {
          dropPosition = 'before';
      } else if (relativeY > rect.height - threshold) {
          dropPosition = 'after';
      } else {
          dropPosition = 'child';
      }
  }

  async function handleDrop(targetId: number) {
      if (!draggedTaskId || draggedTaskId === targetId) {
          resetDragState();
          return;
      }
      
      let newParentId: number | null = null;
      let newPosition = 0;
      
      if (dropPosition === 'child') {
          newParentId = targetId;
      } else {
          const targetTask = findTaskRecursive(tasksStore.tasks, targetId);
          if (targetTask) {
              newParentId = targetTask.parentId || null;
              // Need to calculate position - simplified for now
              newPosition = targetTask.position || 0 + (dropPosition === 'after' ? 1 : 0);
          }
      }

      try {
          await api.moveTask(draggedTaskId, { parentId: newParentId, newPosition });
          await tasksStore.fetchTasks();
      } catch (err) {
          console.error('Failed to move task:', err);
      }
      
      resetDragState();
  }

  function resetDragState() {
      draggedTaskId = null;
      dragOverTaskId = null;
      dropPosition = null;
  }

  $effect(() => {
      if (appStore.currentView !== 'logbook') {
          dragDisabled = false;
      } else {
          dragDisabled = true;
      }
  });
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">{title}</h1>
      <Button onclick={onAddTask} size="sm" class="gap-2">
          <Plus class="h-4 w-4" />
          {$t('sidebar.add_task')}
      </Button>
  </div>

  <!-- Content -->
  {#if appStore.currentView !== 'logbook' && !appStore.selectedProject && processedTasks.active.length === 0}
      <div class="flex-1 flex items-center justify-center text-muted-foreground">
          <p>{emptyMessage}</p>
      </div>
  {:else}
      <ScrollArea class="flex-1 -mx-4 px-4">
          <div class="space-y-2 pb-20">
              {#each taskTree as task (task.id)}
                  <TaskItem 
                      {task} 
                      onToggle={onToggleTask}
                      onDelete={onDeleteTask}
                      onEdit={onEditTask}
                      
                      draggable={!dragDisabled}
                      dndHandlers={{
                          onDragStart: handleDragStart,
                          onDragOver: handleDragOver,
                          onDrop: handleDrop
                      }}
                      dropIndicator={dropPosition && dragOverTaskId === task.id ? { taskId: task.id, position: dropPosition } : null}
                  />
              {/each}

              {#if processedTasks.completed.length > 0}
                  <div class="pt-6">
                      <div class="flex items-center gap-4 mb-4">
                          <Separator class="flex-1" />
                          <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {$t('sidebar.logbook')}
                          </span>
                          <Separator class="flex-1" />
                      </div>
                      <div class="space-y-2 opacity-60">
                          {#each processedTasks.completed as task (task.id)}
                              <TaskItem 
                                  {task} 
                                  onToggle={onToggleTask}
                                  onDelete={onDeleteTask}
                                  onEdit={onEditTask}
                                  draggable={false}
                              />
                          {/each}
                      </div>
                  </div>
              {/if}
          </div>
      </ScrollArea>
      
      {#if appStore.currentView !== 'logbook'}
        <div class="fixed bottom-8 right-8 md:hidden">
            <Button size="icon" class="h-14 w-14 rounded-full shadow-lg" onclick={onAddTask}>
                <Plus class="h-6 w-6" />
            </Button>
        </div>
      {/if}
  {/if}
</div>
