<script lang="ts">
  import { LayoutGrid, AlertCircle, Calendar, Users, Trash2 } from '@lucide/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { t } from 'svelte-i18n';
  import type { ITask } from 'shared';

  interface QuadrantTasks {
    do_first: ITask[];
    schedule: ITask[];
    delegate: ITask[];
    eliminate: ITask[];
  }

  let quadrantTasks = $derived<QuadrantTasks>({
    do_first: [],
    schedule: [],
    delegate: [],
    eliminate: []
  });

  $effect(() => {
    const tasks = tasksStore.tasks.filter(t => !t.completed);
    
    quadrantTasks = {
      do_first: tasks.filter(t => t.priority === 'high' && isUrgent(t.dueDate)),
      schedule: tasks.filter(t => t.priority === 'high' && !isUrgent(t.dueDate)),
      delegate: tasks.filter(t => t.priority === 'low' && isUrgent(t.dueDate)),
      eliminate: tasks.filter(t => t.priority === 'low' && !isUrgent(t.dueDate))
    };
  });

  function isUrgent(dueDate?: string): boolean {
    if (!dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate.split('T')[0] <= today;
  }
</script>

<div class="h-full max-w-6xl mx-auto p-6">
  <div class="flex items-center gap-3 mb-6">
    <LayoutGrid class="h-8 w-8" />
    <h1 class="text-2xl font-bold">{$t('matrix.title')}</h1>
  </div>

  <div class="grid grid-cols-2 gap-4 h-[calc(100vh-200px)]">
    <!-- Do First - Urgent & Important -->
    <Card class="border-red-300 dark:border-red-700">
      <CardHeader class="bg-red-50 dark:bg-red-950">
        <CardTitle class="flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle class="h-5 w-5" />
          {$t('matrix.do_first')}
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-4 overflow-auto h-[calc(100%-80px)]">
        {#if quadrantTasks.do_first.length === 0}
          <p class="text-muted-foreground text-sm">{$t('tasks.empty.default')}</p>
        {:else}
          <div class="space-y-2">
            {#each quadrantTasks.do_first as task}
              <div class="p-2 border rounded bg-red-50 dark:bg-red-950/30">
                <span class="font-medium">{task.title}</span>
                {#if task.dueDate}
                  <span class="text-xs text-muted-foreground ml-2">{task.dueDate}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Schedule - Not Urgent & Important -->
    <Card class="border-blue-300 dark:border-blue-700">
      <CardHeader class="bg-blue-50 dark:bg-blue-950">
        <CardTitle class="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Calendar class="h-5 w-5" />
          {$t('matrix.schedule')}
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-4 overflow-auto h-[calc(100%-80px)]">
        {#if quadrantTasks.schedule.length === 0}
          <p class="text-muted-foreground text-sm">{$t('tasks.empty.default')}</p>
        {:else}
          <div class="space-y-2">
            {#each quadrantTasks.schedule as task}
              <div class="p-2 border rounded bg-blue-50 dark:bg-blue-950/30">
                <span class="font-medium">{task.title}</span>
                {#if task.dueDate}
                  <span class="text-xs text-muted-foreground ml-2">{task.dueDate}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Delegate - Urgent & Not Important -->
    <Card class="border-yellow-300 dark:border-yellow-700">
      <CardHeader class="bg-yellow-50 dark:bg-yellow-950">
        <CardTitle class="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
          <Users class="h-5 w-5" />
          {$t('matrix.delegate')}
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-4 overflow-auto h-[calc(100%-80px)]">
        {#if quadrantTasks.delegate.length === 0}
          <p class="text-muted-foreground text-sm">{$t('tasks.empty.default')}</p>
        {:else}
          <div class="space-y-2">
            {#each quadrantTasks.delegate as task}
              <div class="p-2 border rounded bg-yellow-50 dark:bg-yellow-950/30">
                <span class="font-medium">{task.title}</span>
                {#if task.dueDate}
                  <span class="text-xs text-muted-foreground ml-2">{task.dueDate}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Eliminate - Not Urgent & Not Important -->
    <Card class="border-gray-300 dark:border-gray-700">
      <CardHeader class="bg-gray-50 dark:bg-gray-950">
        <CardTitle class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Trash2 class="h-5 w-5" />
          {$t('matrix.eliminate')}
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-4 overflow-auto h-[calc(100%-80px)]">
        {#if quadrantTasks.eliminate.length === 0}
          <p class="text-muted-foreground text-sm">{$t('tasks.empty.default')}</p>
        {:else}
          <div class="space-y-2">
            {#each quadrantTasks.eliminate as task}
              <div class="p-2 border rounded bg-gray-50 dark:bg-gray-950/30">
                <span class="font-medium">{task.title}</span>
                {#if task.dueDate}
                  <span class="text-xs text-muted-foreground ml-2">{task.dueDate}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  </div>
</div>
