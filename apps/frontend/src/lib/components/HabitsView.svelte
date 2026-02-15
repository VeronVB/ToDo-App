<script lang="ts">
  import { Flame, Check, Trophy, Target, TrendingUp, Calendar, Trash2, ChevronLeft, ChevronRight, Zap } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Separator } from '$lib/components/ui/separator';
  import { habitsStore } from '$lib/stores/habits.svelte';
  import { appStore } from '$lib/stores/app.svelte';
  import { t } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import * as api from '$lib/api/client';
  import type { IHabitHeatmap } from '$lib/api/client';
  
  // ─── State ───
  let heatmapData = $state<Record<number, IHabitHeatmap>>({});
  let selectedHabitId = $state<number | null>(null);
  let heatmapYear = $state(new Date().getFullYear());
  
  // ─── Derived ───
  let overview = $derived(habitsStore.overview);
  let habits = $derived(habitsStore.habits);
  let today = $derived(new Date().toISOString().split('T')[0]);
  
  // ─── Lifecycle ───
  onMount(async () => {
    await habitsStore.fetchHabits();
    await habitsStore.fetchOverview();
    await loadAllHeatmaps();
  });
  
  async function loadAllHeatmaps() {
    for (const habit of habitsStore.habits) {
      try {
        const data = await api.getHabitHeatmap(habit.id);
        heatmapData[habit.id] = data;
      } catch (e) {
        console.error('Failed to load heatmap for habit', habit.id, e);
      }
    }
  }
  
  // ─── Heatmap Helpers ───
  
  // Generate full year calendar data for GitHub-style grid
  function getYearCalendar(year: number): { date: string; dayOfWeek: number; month: number; weekIndex: number }[] {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    
    // If current year, end at today
    const actualEnd = year === new Date().getFullYear() ? new Date() : end;
    
    const days: { date: string; dayOfWeek: number; month: number; weekIndex: number }[] = [];
    let weekIndex = 0;
    let lastDayOfWeek = -1;
    
    for (let d = new Date(start); d <= actualEnd; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0=Sun
      if (dayOfWeek === 0 && days.length > 0) weekIndex++;
      
      days.push({
        date: d.toISOString().split('T')[0],
        dayOfWeek,
        month: d.getMonth(),
        weekIndex
      });
    }
    return days;
  }
  
  let yearCalendar = $derived(getYearCalendar(heatmapYear));
  let totalWeeks = $derived(yearCalendar.length > 0 ? yearCalendar[yearCalendar.length - 1].weekIndex + 1 : 0);
  
  // Aggregate heatmap: merge all habits' completions
  let aggregateHeatmap = $derived.by(() => {
    const agg: Record<string, number> = {};
    const totalHabits = habits.length || 1;
    
    for (const [habitId, data] of Object.entries(heatmapData)) {
      if (!data?.data) continue;
      for (const [dateStr, count] of Object.entries(data.data)) {
        agg[dateStr] = (agg[dateStr] || 0) + count;
      }
    }
    return agg;
  });
  
  // For a single selected habit
  let selectedHeatmap = $derived.by(() => {
    if (!selectedHabitId) return aggregateHeatmap;
    return heatmapData[selectedHabitId]?.data || {};
  });
  
  function getLevel(dateStr: string, data: Record<string, number>): number {
    const count = data[dateStr] || 0;
    if (count === 0) return 0;
    const maxHabits = habits.length || 1;
    if (selectedHabitId) {
      // Single habit: binary
      return count > 0 ? 4 : 0;
    }
    // Aggregate: scale by total habits
    const ratio = count / maxHabits;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }
  
  // Level to CSS class - using primary color with opacity for theme awareness
  function levelClass(level: number): string {
    switch (level) {
      case 0: return 'bg-muted/40 dark:bg-muted/20';
      case 1: return 'bg-primary/20';
      case 2: return 'bg-primary/40';
      case 3: return 'bg-primary/65';
      case 4: return 'bg-primary';
      default: return 'bg-muted/40';
    }
  }
  
  // Month labels for heatmap header
  let monthLabels = $derived.by(() => {
    const labels: { name: string; weekStart: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let lastMonth = -1;
    
    for (const day of yearCalendar) {
      if (day.month !== lastMonth) {
        labels.push({ name: months[day.month], weekStart: day.weekIndex });
        lastMonth = day.month;
      }
    }
    return labels;
  });
  
  // ─── Weekly Matrix ───
  
  function getLast7Days(): { date: string; label: string; dayOfWeek: number }[] {
    const days: { date: string; label: string; dayOfWeek: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Yst' : dayNames[d.getDay()],
        dayOfWeek: d.getDay()
      });
    }
    return days;
  }
  
  let last7Days = $derived(getLast7Days());
  
  function isCompletedOnDate(habitId: number, dateStr: string): boolean {
    const data = heatmapData[habitId]?.data;
    if (!data) return false;
    return !!data[dateStr];
  }
  
  // ─── Completion Rate ───
  let completionRate = $derived.by(() => {
    if (!overview || overview.totalHabits === 0) return 0;
    // Week completions / (total habits * 7) * 100
    const maxPossible = overview.totalHabits * 7;
    return Math.round((overview.weekCompletions / maxPossible) * 100);
  });
  
  // ─── Actions ───
  async function handleCompleteHabit(habitId: number) {
    await habitsStore.completeHabit(habitId);
    // Reload heatmap for this habit
    try {
      const data = await api.getHabitHeatmap(habitId);
      heatmapData[habitId] = data;
    } catch (e) {
      console.error(e);
    }
  }
  
  async function handleDeleteHabit(habitId: number) {
    if (confirm('Are you sure? All completion data will be lost.')) {
      await habitsStore.deleteHabit(habitId);
      delete heatmapData[habitId];
      if (selectedHabitId === habitId) selectedHabitId = null;
    }
  }
  
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    if (dateStr === today) return $t('habits.today');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return $t('habits.yesterday');
    
    return new Date(dateStr).toLocaleDateString();
  }
  
  // Streak flame intensity based on streak length
  function getFlameSize(streak: number): string {
    if (streak >= 30) return 'h-8 w-8';
    if (streak >= 14) return 'h-7 w-7';
    if (streak >= 7) return 'h-6 w-6';
    return 'h-5 w-5';
  }
  
  function getFlameOpacity(streak: number): string {
    if (streak >= 30) return 'opacity-100';
    if (streak >= 14) return 'opacity-90';
    if (streak >= 7) return 'opacity-75';
    if (streak >= 1) return 'opacity-60';
    return 'opacity-30';
  }
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <Flame class="h-7 w-7 text-orange-500" />
      <h1 class="text-2xl font-bold">{$t('habits.title')}</h1>
    </div>
  </div>

  {#if habitsStore.loading}
    <div class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  {:else if habits.length === 0}
    <!-- Empty State -->
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center max-w-sm">
        <div class="relative mx-auto mb-6 w-20 h-20">
          <div class="absolute inset-0 rounded-full bg-primary/5"></div>
          <div class="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
            <Flame class="h-8 w-8 text-muted-foreground/30" />
          </div>
        </div>
        <h2 class="text-lg font-semibold mb-2">{$t('habits.no_habits')}</h2>
        <p class="text-sm text-muted-foreground mb-4">{$t('habits.create_first')}</p>
        <Button onclick={() => appStore.setView('inbox')} variant="outline" size="sm">
          {$t('habits.go_to_tasks')}
        </Button>
      </div>
    </div>
  {:else}
    <ScrollArea class="flex-1 -mx-4 px-4">
      <div class="space-y-6 pb-20">
        
        <!-- ═══ Overview Stats Cards ═══ -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="rounded-xl border bg-card p-4 space-y-1">
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <Flame class="h-3.5 w-3.5 text-orange-500" />
              <span class="text-[11px] font-medium uppercase tracking-wider">{$t('habits.day_streak')}</span>
            </div>
            <div class="text-3xl font-bold tabular-nums">{overview?.currentStreak || 0}</div>
          </div>
          
          <div class="rounded-xl border bg-card p-4 space-y-1">
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <Trophy class="h-3.5 w-3.5 text-yellow-500" />
              <span class="text-[11px] font-medium uppercase tracking-wider">{$t('habits.best_streak')}</span>
            </div>
            <div class="text-3xl font-bold tabular-nums">{overview?.longestStreak || 0}</div>
          </div>
          
          <div class="rounded-xl border bg-card p-4 space-y-1">
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <Check class="h-3.5 w-3.5 text-green-500" />
              <span class="text-[11px] font-medium uppercase tracking-wider">{$t('habits.this_week')}</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold tabular-nums">{overview?.weekCompletions || 0}</span>
              <span class="text-sm text-muted-foreground">{completionRate}%</span>
            </div>
          </div>
          
          <div class="rounded-xl border bg-card p-4 space-y-1">
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <Target class="h-3.5 w-3.5 text-primary" />
              <span class="text-[11px] font-medium uppercase tracking-wider">{$t('habits.active_habits')}</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold tabular-nums">{overview?.activeHabits || 0}</span>
              <span class="text-sm text-muted-foreground">
                {overview?.todayCompleted || 0}/{overview?.totalHabits || 0} {$t('habits.today').toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        
        <!-- ═══ GitHub-style Heatmap ═══ -->
        <div class="rounded-xl border bg-card p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold">{$t('habits.contribution_graph')}</h3>
              {#if selectedHabitId}
                <Button variant="ghost" size="sm" class="h-6 text-xs px-2" onclick={() => selectedHabitId = null}>
                  {$t('habits.show_all')}
                </Button>
              {/if}
            </div>
            <div class="flex items-center gap-1">
              <Button variant="ghost" size="icon" class="h-7 w-7" onclick={() => heatmapYear--}>
                <ChevronLeft class="h-4 w-4" />
              </Button>
              <span class="text-sm font-medium tabular-nums w-12 text-center">{heatmapYear}</span>
              <Button variant="ghost" size="icon" class="h-7 w-7" onclick={() => heatmapYear++} disabled={heatmapYear >= new Date().getFullYear()}>
                <ChevronRight class="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <!-- Heatmap Grid -->
          <div class="overflow-x-auto">
            <div class="min-w-[700px]">
              <!-- Month labels -->
              <div class="flex mb-1 ml-8">
                {#each monthLabels as ml}
                  <div 
                    class="text-[10px] text-muted-foreground" 
                    style="position: relative; left: {ml.weekStart * 13}px; width: 0; white-space: nowrap;"
                  >
                    {ml.name}
                  </div>
                {/each}
              </div>
              
              <!-- Grid: 7 rows (days of week) × N columns (weeks) -->
              <div class="flex gap-0">
                <!-- Day labels -->
                <div class="flex flex-col gap-[2px] mr-1 justify-start">
                  {#each ['', 'Mon', '', 'Wed', '', 'Fri', ''] as label}
                    <div class="h-[11px] w-7 text-[10px] text-muted-foreground flex items-center justify-end pr-1">
                      {label}
                    </div>
                  {/each}
                </div>
                
                <!-- Weeks columns -->
                <div class="flex gap-[2px]">
                  {#each { length: totalWeeks } as _, weekIdx}
                    <div class="flex flex-col gap-[2px]">
                      {#each { length: 7 } as _, dayIdx}
                        {@const day = yearCalendar.find(d => d.weekIndex === weekIdx && d.dayOfWeek === dayIdx)}
                        {#if day}
                          <div 
                            class="h-[11px] w-[11px] rounded-[2px] transition-colors duration-150 {levelClass(getLevel(day.date, selectedHeatmap))} {day.date === today ? 'ring-1 ring-foreground/20' : ''}"
                            title="{day.date}: {selectedHeatmap[day.date] || 0} completions"
                          ></div>
                        {:else}
                          <div class="h-[11px] w-[11px]"></div>
                        {/if}
                      {/each}
                    </div>
                  {/each}
                </div>
              </div>
              
              <!-- Legend -->
              <div class="flex items-center justify-end gap-1.5 mt-3">
                <span class="text-[10px] text-muted-foreground">{$t('habits.less')}</span>
                <div class="h-[11px] w-[11px] rounded-[2px] bg-muted/40"></div>
                <div class="h-[11px] w-[11px] rounded-[2px] bg-primary/20"></div>
                <div class="h-[11px] w-[11px] rounded-[2px] bg-primary/40"></div>
                <div class="h-[11px] w-[11px] rounded-[2px] bg-primary/65"></div>
                <div class="h-[11px] w-[11px] rounded-[2px] bg-primary"></div>
                <span class="text-[10px] text-muted-foreground">{$t('habits.more')}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- ═══ Weekly Matrix (Habit × Day) ═══ -->
        <div class="rounded-xl border bg-card p-5">
          <h3 class="text-sm font-semibold mb-4">{$t('habits.weekly_overview')}</h3>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr>
                  <th class="text-left text-[11px] text-muted-foreground font-medium pb-2 pr-4 w-[140px]">
                    {$t('habits.habit_name')}
                  </th>
                  {#each last7Days as day}
                    <th class="text-center text-[11px] text-muted-foreground font-medium pb-2 w-10">
                      <div>{day.label}</div>
                      <div class="text-[9px] opacity-60">{day.date.slice(8)}</div>
                    </th>
                  {/each}
                  <th class="text-center text-[11px] text-muted-foreground font-medium pb-2 pl-3 w-12">
                    {$t('habits.streak_short')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each habits as habit (habit.id)}
                  {@const isCompletedToday = habit.lastCompletedDate === today}
                  <tr class="group hover:bg-muted/30 transition-colors">
                    <td class="py-1.5 pr-4">
                      <button 
                        class="text-sm font-medium truncate max-w-[140px] block text-left hover:text-primary transition-colors {selectedHabitId === habit.id ? 'text-primary' : ''}"
                        onclick={() => selectedHabitId = selectedHabitId === habit.id ? null : habit.id}
                      >
                        {habit.title}
                      </button>
                    </td>
                    {#each last7Days as day}
                      {@const completed = isCompletedOnDate(habit.id, day.date)}
                      <td class="text-center py-1.5">
                        <div class="flex items-center justify-center">
                          {#if completed}
                            <div class="h-6 w-6 rounded-md bg-primary/15 flex items-center justify-center">
                              <Check class="h-3.5 w-3.5 text-primary" />
                            </div>
                          {:else if day.date === today && !isCompletedToday}
                            <button 
                              class="h-6 w-6 rounded-md border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center"
                              onclick={() => handleCompleteHabit(habit.id)}
                              title={$t('habits.complete')}
                            >
                              <Check class="h-3 w-3 text-muted-foreground/30" />
                            </button>
                          {:else}
                            <div class="h-6 w-6 rounded-md bg-muted/20 flex items-center justify-center">
                              <div class="h-1.5 w-1.5 rounded-full bg-muted-foreground/15"></div>
                            </div>
                          {/if}
                        </div>
                      </td>
                    {/each}
                    <td class="text-center py-1.5 pl-3">
                      <div class="flex items-center justify-center gap-1">
                        <Flame class="h-3 w-3 text-orange-500 {getFlameOpacity(habit.streak)}" />
                        <span class="text-sm font-bold tabular-nums">{habit.streak}</span>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- ═══ Individual Habit Cards ═══ -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold">{$t('habits.details')}</h3>
          
          {#each habits as habit (habit.id)}
            {@const isCompletedToday = habit.lastCompletedDate === today}
            {@const heatmap = heatmapData[habit.id]}
            
            <div 
              class="rounded-xl border bg-card p-4 transition-all {selectedHabitId === habit.id ? 'ring-2 ring-primary/30' : ''}"
            >
              <div class="flex items-start justify-between mb-3">
                <!-- Left: Title + Streak -->
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <Flame class="{getFlameSize(habit.streak)} text-orange-500 {getFlameOpacity(habit.streak)} transition-all" />
                    {#if habit.streak >= 7}
                      <div class="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                        {#if habit.streak >= 30}
                          <Zap class="h-2 w-2" />
                        {:else}
                          ★
                        {/if}
                      </div>
                    {/if}
                  </div>
                  <div>
                    <button 
                      class="text-base font-semibold hover:text-primary transition-colors text-left"
                      onclick={() => selectedHabitId = selectedHabitId === habit.id ? null : habit.id}
                    >
                      {habit.title}
                    </button>
                    <div class="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span class="font-medium">{habit.streak} {$t('habits.day_streak')}</span>
                      <span>·</span>
                      <span>{$t('habits.best_streak')}: {habit.longestStreak}</span>
                      <span>·</span>
                      <span>{$t('habits.total')}: {habit.totalCompletions}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Right: Actions -->
                <div class="flex items-center gap-2">
                  {#if !isCompletedToday}
                    <Button size="sm" class="gap-1.5" onclick={() => handleCompleteHabit(habit.id)}>
                      <Check class="h-3.5 w-3.5" />
                      {$t('habits.complete')}
                    </Button>
                  {:else}
                    <Button size="sm" variant="secondary" disabled class="gap-1.5">
                      <Check class="h-3.5 w-3.5" />
                      {$t('habits.done')}
                    </Button>
                  {/if}
                  <Button size="sm" variant="ghost" class="h-8 w-8 p-0 text-destructive hover:text-destructive" onclick={() => handleDeleteHabit(habit.id)}>
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              
              <!-- Mini heatmap for individual habit (last 16 weeks) -->
              {#if heatmap && Object.keys(heatmap.data).length > 0}
                <div class="mt-2 pt-3 border-t">
                  <div class="flex gap-[2px] flex-wrap" style="max-height: 88px;">
                    {#each getRecentDays(112) as dateStr}
                      <div 
                        class="h-[10px] w-[10px] rounded-[1.5px] {heatmap.data[dateStr] ? 'bg-primary' : 'bg-muted/30'}"
                        title={dateStr}
                      ></div>
                    {/each}
                  </div>
                  <div class="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                    <span>{$t('habits.last_completed')}: {formatDate(habit.lastCompletedDate)}</span>
                    <span>{Object.keys(heatmap.data).length} {$t('habits.days').toLowerCase()}</span>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
        
      </div>
    </ScrollArea>
  {/if}
</div>

<script module lang="ts">
  function getRecentDays(count: number): string[] {
    const days: string[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }
</script>