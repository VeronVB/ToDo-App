<script lang="ts">
  import TaskList from '$lib/components/TaskList.svelte';
  import TaskFormDialog from '$lib/components/TaskFormDialog.svelte';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { appStore, type ViewType } from '$lib/stores/app.svelte';
  import { t } from 'svelte-i18n';
  import type { ITask } from 'shared';

  import ProductivityDashboard from '$lib/components/views/ProductivityDashboard.svelte';
  import MorningBriefing from '$lib/components/views/MorningBriefing.svelte';
  import EisenhowerMatrix from '$lib/components/views/EisenhowerMatrix.svelte';
  import KanbanBoard from '$lib/components/views/KanbanBoard.svelte';
  import FocusMode from '$lib/components/views/FocusMode.svelte';
  import WeeklyReview from '$lib/components/views/WeeklyReview.svelte';
  import TaskTemplates from '$lib/components/views/TaskTemplates.svelte';
  import SavedFilters from '$lib/components/views/SavedFilters.svelte';
  import ActivityLog from '$lib/components/views/ActivityLog.svelte';
  
  $effect(() => {
    tasksStore.fetchTasks();
  });

  function findTaskById(tasks: ITask[], id: number): ITask | null {
      for (const t of tasks) {
          if (t.id === id) return t;
          if (t.children) {
              const found = findTaskById(t.children, id);
              if (found) return found;
          }
      }
      return null;
  }

  function handleAddTask() {
      uiStore.openAdd();
  }

  function handleSubmitTask(data: any) {
      if (uiStore.editingTask) {
          tasksStore.updateTask(uiStore.editingTask.id, data);
      } else {
          tasksStore.addTask(data);
      }
  }

  function handleToggleTask(id: number, completed: boolean) {
     const task = findTaskById(tasksStore.tasks, id);
     if (task) {
         tasksStore.toggleComplete(task);
     }
  }

  function handleDeleteTask(id: number) {
      if (settingsStore.settings.confirmDelete) {
          if (!confirm($t('tasks.confirm_delete_task'))) {
              return;
          }
      }
      tasksStore.deleteTask(id);
  }

  function handleEditTask(id: number) {
      const task = findTaskById(tasksStore.tasks, id);
      if (task) {
          uiStore.openEdit(task);
      }
  }

  function getViewTitle(view: ViewType): string {
    switch (view) {
      case 'inbox': return $t('sidebar.inbox');
      case 'today': return $t('sidebar.today');
      case 'upcoming': return $t('sidebar.upcoming');
      case 'logbook': return $t('sidebar.logbook');
      case 'habits': return $t('sidebar.habits');
      case 'project': return $t('sidebar.projects');
      case 'tag': return '#' + appStore.selectedTag;
      case 'dashboard': return $t('sidebar_advanced.dashboard');
      case 'briefing': return $t('sidebar_advanced.briefing');
      case 'matrix': return $t('sidebar_advanced.matrix');
      case 'kanban': return $t('sidebar_advanced.kanban');
      case 'focus': return $t('sidebar_advanced.focus');
      case 'review': return $t('sidebar_advanced.review');
      case 'templates': return $t('sidebar_advanced.templates');
      case 'filter': return $t('sidebar_advanced.filters');
      case 'activity': return $t('sidebar_advanced.activity');
      default: return $t('app.title');
    }
  }
</script>

<svelte:head>
  <title>{getViewTitle(appStore.currentView)} | {$t('app.title')}</title>
</svelte:head>

{#if appStore.currentView === 'dashboard'}
  <ProductivityDashboard />
{:else if appStore.currentView === 'briefing'}
  <MorningBriefing />
{:else if appStore.currentView === 'matrix'}
  <EisenhowerMatrix />
{:else if appStore.currentView === 'kanban'}
  <KanbanBoard />
{:else if appStore.currentView === 'focus'}
  <FocusMode />
{:else if appStore.currentView === 'review'}
  <WeeklyReview />
{:else if appStore.currentView === 'templates'}
  <TaskTemplates />
{:else if appStore.currentView === 'filter'}
  <SavedFilters />
{:else if appStore.currentView === 'activity'}
  <ActivityLog />
{:else}
  <div class="h-full max-w-4xl mx-auto p-6">
    <TaskList 
      onAddTask={handleAddTask}
      onToggleTask={handleToggleTask}
      onDeleteTask={handleDeleteTask}
      onEditTask={handleEditTask}
    />
  </div>
{/if}

<TaskFormDialog 
  open={uiStore.isTaskDialogOpen} 
  onOpenChange={(v) => uiStore.isTaskDialogOpen = v}
  onSubmit={handleSubmitTask}
/>
