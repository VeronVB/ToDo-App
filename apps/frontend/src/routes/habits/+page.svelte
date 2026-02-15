<script lang="ts">
  import { Flame, Check, Trash2, Plus, Calendar, Trophy, Target, TrendingUp } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { habitsStore } from '$lib/stores/habits.svelte';
  import { getHabitHeatmap } from '$lib/api/client';
  import type { IHabitHeatmap } from '$lib/api/client';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  
  interface HeatmapData extends IHabitHeatmap {}
  
  let heatmapData = $state<Record<number, HeatmapData>>({});
  
  onMount(async () => {
    await habitsStore.fetchHabits();
    await habitsStore.fetchOverview();
    
    for (const habit of habitsStore.habits) {
      try {
        const data = await api.getHabitHeatmap(habit.id);
        heatmapData[habit.id] = data;
      } catch (e) {
        console.error('Failed to load heatmap for habit', habit.id, e);
      }
    }
  });
  
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (dateStr === todayStr) return {$t('habits.today')};
    if (dateStr === yesterdayStr) return {$t('habits.yesterday')};
    
    return date.toLocaleDateString();
  }
  
  async function handleComplete(habitId: number) {
    await habitsStore.completeHabit(habitId);
    const data = await api.getHabitHeatmap(habitId);
    heatmapData[habitId] = data;
  }
  
  async function handleDelete(habitId: number) {
    if (confirm('Are you sure you want to delete this habit? All completion data will be lost.')) {
      await habitsStore.deleteHabit(habitId);
    }
  }
  
  function getYearData(heatmap: HeatmapData | undefined): { date: string; level: number }[] {
    if (!heatmap || !heatmap.data) return [];
    
    const result: { date: string; level: number }[] = [];
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const hasData = heatmap.data[dateStr] ? 1 : 0;
      result.push({ date: dateStr, level: hasData });
    }
    
    return result;
  }
  
  let overview = $derived(habitsStore.overview);
</script>

<svelte:head>
  <title>{$t('habits.title')} - {$t('app.title')}</title>
</svelte:head>

<div class="h-full p-6">
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <Flame class="h-8 w-8 text-orange-500" />
        <h1 class="text-2xl font-bold">{$t('habits.title')}</h1>
      </div>
      <Button onclick={() => window.history.back()}>
        {$t('app.back')}
      </Button>
    </div>
    
    {#if overview && overview.totalHabits > 0}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="rounded-lg border bg-card p-4">
          <div class="flex items-center gap-2 text-muted-foreground mb-1">
            <Flame class="h-4 w-4 text-orange-500" />
            <span class="text-xs">{$t('habits.day_streak')}</span>
          </div>
          <div class="text-2xl font-bold">{overview.currentStreak}</div>
          <div class="text-xs text-muted-foreground">{$t('habits.days')}</div>
        </div>
        
        <div class="rounded-lg border bg-card p-4">
          <div class="flex items-center gap-2 text-muted-foreground mb-1">
            <Trophy class="h-4 w-4 text-yellow-500" />
            <span class="text-xs">{$t('habits.best_streak')}</span>
          </div>
          <div class="text-2xl font-bold">{overview.longestStreak}</div>
          <div class="text-xs text-muted-foreground">{$t('habits.days')}</div>
        </div>
        
        <div class="rounded-lg border bg-card p-4">
          <div class="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp class="h-4 w-4 text-green-500" />
            <span class="text-xs">{$t('habits.this_week')}</span>
          </div>
          <div class="text-2xl font-bold">{overview.weekCompletions}</div>
          <div class="text-xs text-muted-foreground">{$t('habits.total')}</div>
        </div>
        
        <div class="rounded-lg border bg-card p-4">
          <div class="flex items-center gap-2 text-muted-foreground mb-1">
            <Target class="h-4 w-4 text-blue-500" />
            <span class="text-xs">{$t('habits.active_habits')}</span>
          </div>
          <div class="text-2xl font-bold">{overview.activeHabits}</div>
          <div class="text-xs text-muted-foreground">{$t('habits.total')}</div>
        </div>
      </div>
    {/if}
    
    {#if habitsStore.loading}
      <div class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    {:else if habitsStore.habits.length === 0}
      <div class="text-center py-12">
        <Flame class="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">{$t('habits.no_habits')}</h2>
        <p class="text-muted-foreground mb-4">{$t('habits.create_first')}</p>
        <Button onclick={() => window.history.back()}>
          <Plus class="mr-2 h-4 w-4" />
          {$t('habits.go_to_tasks')}
        </Button>
      </div>
    {:else}
      <div class="space-y-4">
        {#each habitsStore.habits as habit (habit.id)}
          {@const heatmap = heatmapData[habit.id]}
          {@const today = new Date().toISOString().split('T')[0]}
          {@const isCompletedToday = habit.lastCompletedDate === {$t('habits.today')}}
          
          <div class="rounded-lg border bg-card p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <Flame class="h-5 w-5 text-orange-500" />
                  <span class="text-lg font-semibold">{habit.streak}</span>
                  <span class="text-sm text-muted-foreground">{$t('habits.day_streak')}</span>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                {#if !isCompletedToday}
                  <Button size="sm" onclick={() => handleComplete(habit.id)}>
                    <Check class="mr-1 h-4 w-4" />
                    {$t('habits.complete')}
                  </Button>
                {:else}
                  <Button size="sm" variant="secondary" disabled>
                    <Check class="mr-1 h-4 w-4" />
                    {$t('habits.done')}
                  </Button>
                {/if}
                <Button size="sm" variant="ghost" onclick={() => handleDelete(habit.id)}>
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            
            <div class="text-lg font-medium mb-2">{habit.title}</div>
            
            <div class="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div class="flex items-center gap-1">
                <Calendar class="h-3 w-3" />
                <span>{$t('habits.last_completed')}: {formatDate(habit.lastCompletedDate)}</span>
              </div>
              <div class="flex items-center gap-1">
                <Target class="h-3 w-3" />
                <span>{$t('habits.total')}: {habit.totalCompletions}</span>
              </div>
              <div class="flex items-center gap-1">
                <Trophy class="h-3 w-3" />
                <span>{$t('habits.best_streak')}: {habit.longestStreak} {$t('habits.days')}</span>
              </div>
            </div>
            
            {#if heatmap && Object.keys(heatmap.data).length > 0}
              <div class="mt-3 overflow-x-auto">
                <div class="flex gap-0.5 flex-wrap" style="max-width: 320px;">
                  {#each getYearData(heatmap) as day}
                    <div 
                      class="w-3 h-3 rounded-sm {day.level === 1 ? 'bg-green-500' : 'bg-muted'}"
                      title={day.date}
                    ></div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
