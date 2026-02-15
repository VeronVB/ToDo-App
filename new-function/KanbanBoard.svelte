<script lang="ts">
  import { Sun, AlertTriangle, CheckCircle, TrendingUp, Flame, ArrowRight, Calendar } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Separator } from '$lib/components/ui/separator';
  import { appStore } from '$lib/stores/app.svelte';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { t } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import * as api from '$lib/api/client';
  import type { IMorningBriefing } from 'shared';
  import DueDateChip from './DueDateChip.svelte';

  let briefing = $state<IMorningBriefing | null>(null);
  let loading = $state(true);
  let greeting = $state('');

  onMount(async () => {
    const hour = new Date().getHours();
    if (hour < 12) greeting = '☀️ Good morning';
    else if (hour < 18) greeting = '🌤️ Good afternoon';
    else greeting = '🌙 Good evening';

    try {
      briefing = await api.getMorningBriefing();
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });

  async function handleToggle(id: number) {
    const task = briefing?.todayTasks.find(t => t.id === id) ||
                 briefing?.overdueTasks.find(t => t.id === id);
    if (task) {
      await tasksStore.toggleComplete(task as any);
      briefing = await api.getMorningBriefing();
    }
  }

  const priorityDot: Record<string, string> = {
    high: 'bg-red-500', medium: 'bg-orange-500', low: 'bg-green-500'
  };
</script>

<div class="flex flex-col h-full">
  <ScrollArea class="flex-1 -mx-4 px-4">
    <div class="space-y-6 pb-20 max-w-2xl mx-auto">
      
      {#if loading}
        <div class="flex items-center justify-center py-20">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      {:else if briefing}
        
        <!-- Greeting -->
        <div class="pt-4">
          <h1 class="text-3xl font-bold mb-1">{greeting}</h1>
          <p class="text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="rounded-xl border bg-card p-4 text-center">
            <div class="text-2xl font-bold tabular-nums">{briefing.stats.completedYesterday}</div>
            <div class="text-[11px] text-muted-foreground mt-0.5">Done yesterday</div>
          </div>
          <div class="rounded-xl border bg-card p-4 text-center">
            <div class="text-2xl font-bold tabular-nums">{briefing.stats.completedThisWeek}</div>
            <div class="text-[11px] text-muted-foreground mt-0.5">This week</div>
          </div>
          <div class="rounded-xl border bg-card p-4 text-center">
            <div class="text-2xl font-bold tabular-nums">{briefing.stats.totalActive}</div>
            <div class="text-[11px] text-muted-foreground mt-0.5">Active tasks</div>
          </div>
          <div class="rounded-xl border bg-card p-4 text-center">
            <div class="flex items-center justify-center gap-1">
              <Flame class="h-4 w-4 text-orange-500" />
              <span class="text-2xl font-bold tabular-nums">{briefing.habits.pendingToday}</span>
            </div>
            <div class="text-[11px] text-muted-foreground mt-0.5">Habits pending</div>
          </div>
        </div>

        <!-- Overdue -->
        {#if briefing.overdueTasks.length > 0}
          <div class="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-4">
            <div class="flex items-center gap-2 mb-3">
              <AlertTriangle class="h-4 w-4 text-red-500" />
              <h3 class="text-sm font-semibold text-red-600 dark:text-red-400">Overdue ({briefing.overdueTasks.length})</h3>
            </div>
            <div class="space-y-2">
              {#each briefing.overdueTasks.slice(0, 5) as task (task.id)}
                <div class="flex items-center gap-2 group">
                  <div onclick={(e) => { e.stopPropagation(); handleToggle(task.id); }}>
                    <Checkbox checked={false} />
                  </div>
                  <span class="flex-1 text-sm truncate">{task.title}</span>
                  {#if task.dueDate}
                    <DueDateChip dueDate={task.dueDate} compact />
                  {/if}
                </div>
              {/each}
              {#if briefing.overdueTasks.length > 5}
                <Button variant="ghost" size="sm" class="w-full text-xs" onclick={() => appStore.setView('today')}>
                  +{briefing.overdueTasks.length - 5} more <ArrowRight class="h-3 w-3 ml-1" />
                </Button>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Today's Tasks -->
        <div class="rounded-xl border bg-card p-4">
          <div class="flex items-center gap-2 mb-3">
            <Calendar class="h-4 w-4 text-primary" />
            <h3 class="text-sm font-semibold">Today ({briefing.todayTasks.length})</h3>
          </div>
          {#if briefing.todayTasks.length === 0}
            <div class="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <CheckCircle class="h-5 w-5 text-green-500" />
              <span class="text-sm">Nothing scheduled for today!</span>
            </div>
          {:else}
            <div class="space-y-2">
              {#each briefing.todayTasks as task (task.id)}
                <div class="flex items-center gap-2 group">
                  <div onclick={(e) => { e.stopPropagation(); handleToggle(task.id); }}>
                    <Checkbox checked={false} />
                  </div>
                  <div class="{priorityDot[task.priority]} h-1.5 w-1.5 rounded-full shrink-0"></div>
                  <span class="flex-1 text-sm truncate">{task.title}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Quick Actions -->
        <div class="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onclick={() => appStore.setView('today')}>
            <Calendar class="h-3.5 w-3.5 mr-1.5" /> Go to Today
          </Button>
          <Button variant="outline" size="sm" onclick={() => appStore.setView('matrix')}>
            <TrendingUp class="h-3.5 w-3.5 mr-1.5" /> Eisenhower Matrix
          </Button>
          <Button variant="outline" size="sm" onclick={() => appStore.setView('habits')}>
            <Flame class="h-3.5 w-3.5 mr-1.5" /> Habits
          </Button>
        </div>
      {/if}
    </div>
  </ScrollArea>
</div>