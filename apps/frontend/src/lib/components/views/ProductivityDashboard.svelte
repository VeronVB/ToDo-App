<script lang="ts">
  import { onMount } from 'svelte';
  import { BarChart3, TrendingUp, CheckCircle2, Circle, Flame, Calendar } from '@lucide/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as api from '$lib/api/client';
  import { t } from 'svelte-i18n';
  import type { IProductivityStats } from 'shared';

  let stats = $state<IProductivityStats | null>(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      stats = await api.getProductivityStats();
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      loading = false;
    }
  });

  function getCompletionRate(): number {
    if (!stats || stats.totalCreated === 0) return 0;
    return Math.round((stats.totalCompleted / stats.totalCreated) * 100);
  }
</script>

<div class="h-full max-w-6xl mx-auto p-6">
  <div class="flex items-center gap-3 mb-6">
    <BarChart3 class="h-8 w-8" />
    <h1 class="text-2xl font-bold">{$t('dashboard.title')}</h1>
  </div>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  {:else if stats}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{$t('dashboard.total_completed')}</CardTitle>
          <CheckCircle2 class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{stats.totalCompleted}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{$t('dashboard.total_active')}</CardTitle>
          <Circle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{stats.totalActive}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{$t('dashboard.current_streak')}</CardTitle>
          <Flame class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{stats.currentStreak} <span class="text-sm font-normal">{$t('habits.days')}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{$t('dashboard.busiest_day')}</CardTitle>
          <Calendar class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{stats.busiestDay}</div>
        </CardContent>
      </Card>
    </div>

    <div class="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>{$t('dashboard.completion_rate')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-4">
            <div class="text-4xl font-bold">{getCompletionRate()}%</div>
            <div class="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all" style="width: {getCompletionRate()}%"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {#if stats.completedByDay.length > 0}
      <div class="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{$t('dashboard.last_30_days')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex items-end gap-1 h-32">
              {#each stats.completedByDay as day}
                {@const maxCount = Math.max(...stats.completedByDay.map(d => d.count), 1)}
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div 
                    class="w-full bg-primary rounded-t" 
                    style="height: {(day.count / maxCount) * 100}%"
                    title="{day.date}: {day.count}"
                  ></div>
                </div>
              {/each}
            </div>
          </CardContent>
        </Card>
      </div>
    {/if}
  {/if}
</div>
