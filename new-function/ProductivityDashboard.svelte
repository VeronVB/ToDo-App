<script lang="ts">
  import { BarChart3, TrendingUp, Calendar, Target, Flame, Clock } from '@lucide/svelte';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { t } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import * as api from '$lib/api/client';
  import type { IProductivityStats } from 'shared';

  let stats = $state<IProductivityStats | null>(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      stats = await api.getProductivityStats();
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });

  // Chart: completed tasks per day (bar chart via pure CSS)
  let maxCompleted = $derived.by(() => {
    if (!stats?.completedByDay.length) return 1;
    return Math.max(...stats.completedByDay.map(d => d.count), 1);
  });

  // Fill missing days in last 30 days
  let chartData = $derived.by(() => {
    if (!stats) return [];
    const map = new Map(stats.completedByDay.map(d => [d.date, d.count]));
    const days: { date: string; count: number; dayLabel: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        count: map.get(dateStr) || 0,
        dayLabel: d.toLocaleDateString(undefined, { day: 'numeric' })
      });
    }
    return days;
  });

  // Weekly grouped for heatmap-style view
  let weekData = $derived.by(() => {
    const weeks: { date: string; count: number }[][] = [];
    let currentWeek: { date: string; count: number }[] = [];
    for (const day of chartData) {
      currentWeek.push(day);
      if (new Date(day.date).getDay() === 6 || day === chartData[chartData.length - 1]) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    return weeks;
  });
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center gap-3 mb-6">
    <BarChart3 class="h-7 w-7 text-primary" />
    <h1 class="text-2xl font-bold">{$t('stats.title') || 'Productivity'}</h1>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  {:else if stats}
    <ScrollArea class="flex-1 -mx-4 px-4">
      <div class="space-y-6 pb-20">
        
        <!-- Overview Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="rounded-xl border bg-card p-4">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Target class="h-3.5 w-3.5 text-green-500" />
              <span class="text-[11px] font-medium uppercase tracking-wider">Completed</span>
            </div>
            <div class="text-3xl font-bold tabular-nums">{stats.totalCompleted}</div>
          </div>
          <div class="rounded-xl border bg-card p-4">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Calendar class="h-3.5 w-3.5 text-blue-500" />
              <span class="text-[11px] font-medium uppercase tracking-wider">Active</span>
            </div>
            <div class="text-3xl font-bold tabular-nums">{stats.totalActive}</div>
          </div>
          <div class="rounded-xl border bg-card p-4">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Flame class="h-3.5 w-3.5 text-orange-500" />
              <span class="text-[11px] font-medium uppercase tracking-wider">Streak</span>
            </div>
            <div class="text-3xl font-bold tabular-nums">{stats.currentStreak}<span class="text-sm font-normal text-muted-foreground ml-1">days</span></div>
          </div>
          <div class="rounded-xl border bg-card p-4">
            <div class="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Clock class="h-3.5 w-3.5 text-purple-500" />
              <span class="text-[11px] font-medium uppercase tracking-wider">Best Day</span>
            </div>
            <div class="text-lg font-bold">{stats.busiestDay}</div>
          </div>
        </div>

        <!-- Bar Chart: Last 30 Days -->
        <div class="rounded-xl border bg-card p-5">
          <h3 class="text-sm font-semibold mb-4">Last 30 Days</h3>
          <div class="flex items-end gap-[2px] h-[120px]">
            {#each chartData as day}
              <div class="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div 
                  class="w-full rounded-t-sm bg-primary/70 hover:bg-primary transition-colors min-h-[2px]"
                  style="height: {day.count > 0 ? Math.max((day.count / maxCompleted) * 100, 5) : 2}%"
                ></div>
                <!-- Tooltip -->
                <div class="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border rounded px-2 py-1 text-[10px] shadow-lg whitespace-nowrap z-10">
                  {day.date}: {day.count} tasks
                </div>
              </div>
            {/each}
          </div>
          <!-- X-axis labels -->
          <div class="flex mt-1">
            {#each chartData as day, i}
              {#if i % 7 === 0}
                <div class="flex-1 text-[9px] text-muted-foreground text-center" style="flex: 7;">{day.dayLabel}</div>
              {/if}
            {/each}
          </div>
        </div>

        <!-- Completion Rate -->
        <div class="rounded-xl border bg-card p-5">
          <h3 class="text-sm font-semibold mb-4">Completion Rate</h3>
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <div class="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  class="h-full bg-primary rounded-full transition-all duration-700"
                  style="width: {stats.totalCreated > 0 ? Math.round((stats.totalCompleted / stats.totalCreated) * 100) : 0}%"
                ></div>
              </div>
            </div>
            <span class="text-2xl font-bold tabular-nums">
              {stats.totalCreated > 0 ? Math.round((stats.totalCompleted / stats.totalCreated) * 100) : 0}%
            </span>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            {stats.totalCompleted} of {stats.totalCreated} tasks completed
          </p>
        </div>
      </div>
    </ScrollArea>
  {/if}
</div>