<script lang="ts">
  import { Grid2x2, AlertTriangle, Calendar, Trash2, Clock } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { t } from 'svelte-i18n';
  import type { ITask, EisenhowerQuadrant } from 'shared';
  import DueDateChip from './DueDateChip.svelte';

  interface Props {
    onToggleTask: (id: number, completed: boolean) => void;
    onEditTask: (id: number) => void;
  }
  let { onToggleTask, onEditTask }: Props = $props();

  function flattenTasks(tasks: ITask[]): ITask[] {
    let result: ITask[] = [];
    for (const t of tasks) {
      result.push(t);
      if (t.children) result = result.concat(flattenTasks(t.children));
    }
    return result;
  }

  function classifyTask(task: ITask): EisenhowerQuadrant {
    const isUrgent = (() => {
      if (!task.dueDate) return false;
      const now = new Date();
      const due = new Date(task.dueDate);
      const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 2; // Due within 2 days = urgent
    })();
    const isImportant = task.priority === 'high' || task.priority === 'medium';
    
    if (isUrgent && isImportant) return 'do_first';
    if (!isUrgent && isImportant) return 'schedule';
    if (isUrgent && !isImportant) return 'delegate';
    return 'eliminate';
  }

  let allTasks = $derived(flattenTasks(tasksStore.tasks).filter(t => !t.completed));
  
  let quadrants = $derived.by(() => {
    const q: Record<EisenhowerQuadrant, ITask[]> = {
      do_first: [], schedule: [], delegate: [], eliminate: []
    };
    for (const task of allTasks) {
      q[classifyTask(task)].push(task);
    }
    return q;
  });

  const quadrantConfig: { key: EisenhowerQuadrant; label: string; labelPl: string; color: string; bgColor: string; borderColor: string; icon: any }[] = [
    { key: 'do_first', label: 'Do First', labelPl: 'Zrób najpierw', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/30', borderColor: 'border-red-200 dark:border-red-900', icon: AlertTriangle },
    { key: 'schedule', label: 'Schedule', labelPl: 'Zaplanuj', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/30', borderColor: 'border-blue-200 dark:border-blue-900', icon: Calendar },
    { key: 'delegate', label: 'Delegate', labelPl: 'Deleguj', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-950/30', borderColor: 'border-yellow-200 dark:border-yellow-900', icon: Clock },
    { key: 'eliminate', label: 'Eliminate', labelPl: 'Wyeliminuj', color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-950/30', borderColor: 'border-gray-200 dark:border-gray-800', icon: Trash2 },
  ];

  const priorityDot: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-green-500'
  };
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center gap-3 mb-6">
    <Grid2x2 class="h-7 w-7 text-primary" />
    <h1 class="text-2xl font-bold">{$t('matrix.title') || 'Eisenhower Matrix'}</h1>
  </div>

  <div class="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
    {#each quadrantConfig as q (q.key)}
      {@const Icon = q.icon}
      {@const tasks = quadrants[q.key]}
      <div class="flex flex-col rounded-xl border {q.borderColor} {q.bgColor} overflow-hidden">
        <!-- Quadrant Header -->
        <div class="flex items-center gap-2 px-4 py-3 border-b {q.borderColor}">
          <Icon class="h-4 w-4 {q.color}" />
          <h3 class="text-sm font-semibold {q.color}">{q.label}</h3>
          <Badge variant="secondary" class="ml-auto text-[10px] h-5">{tasks.length}</Badge>
        </div>
        
        <!-- Task List -->
        <ScrollArea class="flex-1 px-3 py-2">
          <div class="space-y-1.5">
            {#each tasks as task (task.id)}
              <button 
                class="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-white/5 transition-colors group"
                onclick={() => onEditTask(task.id)}
              >
                <div onclick={(e) => { e.stopPropagation(); onToggleTask(task.id, true); }}>
                  <Checkbox checked={task.completed} />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <div class="{priorityDot[task.priority]} h-1.5 w-1.5 rounded-full shrink-0"></div>
                    <span class="text-sm truncate">{task.title}</span>
                  </div>
                </div>
                {#if task.dueDate}
                  <DueDateChip dueDate={task.dueDate} compact />
                {/if}
              </button>
            {/each}
            {#if tasks.length === 0}
              <div class="text-center py-6 text-xs text-muted-foreground/50">—</div>
            {/if}
          </div>
        </ScrollArea>
      </div>
    {/each}
  </div>

  <!-- Legend -->
  <div class="mt-3 flex items-center justify-center gap-6 text-[11px] text-muted-foreground">
    <span>← {$t('matrix.urgent') || 'Urgent'} →</span>
    <span>↑ {$t('matrix.important') || 'Important'} ↓</span>
  </div>
</div>