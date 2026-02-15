<script lang="ts">
  import { onMount } from 'svelte';
  import { Sunrise, AlertCircle, CheckCircle2, Calendar, Flame } from '@lucide/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import * as api from '$lib/api/client';
  import { t } from 'svelte-i18n';
  import type { IMorningBriefing } from 'shared';
  import { appStore } from '$lib/stores/app.svelte';

  let briefing = $state<IMorningBriefing | null>(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      briefing = await api.getMorningBriefing();
    } catch (e) {
      console.error('Failed to load briefing:', e);
    } finally {
      loading = false;
    }
  });

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return $t('briefing.greeting_morning');
    if (hour < 18) return $t('briefing.greeting_afternoon');
    return $t('briefing.greeting_evening');
  }
</script>

<div class="h-full max-w-4xl mx-auto p-6">
  <div class="flex items-center gap-3 mb-6">
    <Sunrise class="h-8 w-8" />
    <h1 class="text-2xl font-bold">{$t('briefing.title')}</h1>
  </div>

  <div class="mb-6">
    <h2 class="text-xl font-semibold">{getGreeting()}</h2>
  </div>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  {:else if briefing}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{$t('briefing.completed_yesterday')}</CardTitle>
          <CheckCircle2 class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{briefing.stats.completedYesterday}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{$t('briefing.completed_this_week')}</CardTitle>
          <Calendar class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{briefing.stats.completedThisWeek}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{$t('briefing.total_active')}</CardTitle>
          <Flame class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{briefing.stats.totalActive}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{$t('briefing.habits_pending')}</CardTitle>
          <Flame class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{briefing.habits.pendingToday}/{briefing.habits.totalHabits}</div>
        </CardContent>
      </Card>
    </div>

    {#if briefing.overdueTasks.length > 0}
      <Card class="mb-4 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-red-600">
            <AlertCircle class="h-5 w-5" />
            {$t('briefing.overdue')} ({briefing.overdueTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            {#each briefing.overdueTasks as task}
              <div class="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded">
                <span>{task.title}</span>
                <Button variant="ghost" size="sm" onclick={() => appStore.setView('today')}>
                  {$t('tasks.add_task')}
                </Button>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

    {#if briefing.todayTasks.length > 0}
      <Card class="mb-4">
        <CardHeader>
          <CardTitle>{$t('briefing.due_today')} ({briefing.todayTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            {#each briefing.todayTasks as task}
              <div class="flex items-center justify-between p-2">
                <span>{task.title}</span>
                <span class="text-xs text-muted-foreground">{task.priority}</span>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

    {#if briefing.upcomingTasks.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>{$t('briefing.upcoming')} ({briefing.upcomingTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            {#each briefing.upcomingTasks as task}
              <div class="flex items-center justify-between p-2">
                <span>{task.title}</span>
                <span class="text-xs text-muted-foreground">{task.dueDate}</span>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}
  {/if}
</div>
