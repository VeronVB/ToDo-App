<script lang="ts">
  import TaskList from '$lib/components/TaskList.svelte';
  import TaskFormDialog from '$lib/components/TaskFormDialog.svelte';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { t } from 'svelte-i18n';
  import type { ITask } from 'shared';
  
  $effect(() => {
    tasksStore.fetchTasks();
  });

  // Helper: rekurencyjne szukanie taska w drzewie
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

</script>

<svelte:head>
	<title>{$t('app.title')}</title>
</svelte:head>

<TaskList 
  onAddTask={handleAddTask}
  onToggleTask={handleToggleTask}
  onDeleteTask={handleDeleteTask}
  onEditTask={handleEditTask}
/>

<TaskFormDialog 
  open={uiStore.isTaskDialogOpen} 
  onOpenChange={(v) => uiStore.isTaskDialogOpen = v}
  onSubmit={handleSubmitTask}
/>
