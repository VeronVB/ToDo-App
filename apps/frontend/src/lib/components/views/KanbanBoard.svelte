<script lang="ts">
  import { Columns, MoreVertical } from '@lucide/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { t } from 'svelte-i18n';
  import type { ITask } from 'shared';

  type GroupBy = 'priority' | 'status' | 'project';
  let groupBy = $state<GroupBy>('priority');

  interface Column {
    id: string;
    title: string;
    tasks: ITask[];
  }

  let columns = $derived.by((): Column[] => {
    const tasks = tasksStore.tasks;
    
    if (groupBy === 'priority') {
      return [
        { id: 'high', title: 'High', tasks: tasks.filter(t => !t.completed && t.priority === 'high') },
        { id: 'medium', title: 'Medium', tasks: tasks.filter(t => !t.completed && t.priority === 'medium') },
        { id: 'low', title: 'Low', tasks: tasks.filter(t => !t.completed && t.priority === 'low') },
        { id: 'done', title: 'Done', tasks: tasks.filter(t => t.completed) }
      ];
    } else if (groupBy === 'status') {
      return [
        { id: 'todo', title: 'To Do', tasks: tasks.filter(t => !t.completed) },
        { id: 'done', title: 'Done', tasks: tasks.filter(t => t.completed) }
      ];
    } else {
      const projects = new Map<number | string, ITask[]>();
      tasks.filter(t => !t.completed).forEach(t => {
        const key = t.categoryId || 'unassigned';
        if (!projects.has(key)) projects.set(key, []);
        projects.get(key)!.push(t);
      });
      return [
        ...Array.from(projects.entries()).map(([id, tasks]) => ({ id: String(id), title: id === 'unassigned' ? 'Inbox' : String(id), tasks })),
        { id: 'done', title: 'Done', tasks: tasks.filter(t => t.completed) }
      ];
    }
  });
</script>

<div class="h-full max-w-full mx-auto p-6">
  <div class="flex items-center gap-3 mb-6">
    <Columns class="h-8 w-8" />
    <h1 class="text-2xl font-bold">{$t('kanban.title')}</h1>
    <div class="ml-auto flex gap-2">
      <Button 
        variant={groupBy === 'priority' ? 'default' : 'outline'} 
        size="sm"
        onclick={() => groupBy = 'priority'}
      >
        Priority
      </Button>
      <Button 
        variant={groupBy === 'status' ? 'default' : 'outline'} 
        size="sm"
        onclick={() => groupBy = 'status'}
      >
        Status
      </Button>
    </div>
  </div>

  <div class="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
    {#each columns as column}
      <div class="flex-shrink-0 w-72">
        <Card>
          <CardHeader class="bg-muted/50">
            <CardTitle class="flex items-center justify-between text-sm">
              {column.title}
              <span class="text-xs bg-muted px-2 py-0.5 rounded-full">{column.tasks.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-4 space-y-2 overflow-auto max-h-[calc(100vh-300px)]">
            {#each column.tasks as task}
              <div class="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                <div class="font-medium">{task.title}</div>
                {#if task.dueDate}
                  <div class="text-xs text-muted-foreground mt-1">{task.dueDate}</div>
                {/if}
                <div class="flex items-center gap-1 mt-2">
                  <span class="text-xs px-1.5 py-0.5 rounded {task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}">
                    {task.priority}
                  </span>
                </div>
              </div>
            {/each}
            {#if column.tasks.length === 0}
              <p class="text-muted-foreground text-sm text-center py-4">{$t('tasks.empty.default')}</p>
            {/if}
          </CardContent>
        </Card>
      </div>
    {/each}
  </div>
</div>
