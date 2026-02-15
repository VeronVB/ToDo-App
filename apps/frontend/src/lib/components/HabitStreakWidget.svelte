<script lang="ts">
  import { Flame, Check, ChevronRight } from '@lucide/svelte';
  import { habitsStore } from '$lib/stores/habits.svelte';
  import { appStore } from '$lib/stores/app.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  
  onMount(() => {
    habitsStore.fetchOverview();
    habitsStore.fetchHabits();
  });

  let overview = $derived(habitsStore.overview);
  let habits = $derived(habitsStore.habits);
  let today = $derived(new Date().toISOString().split('T')[0]);
  
  // Widget size from settings: 'full' | 'mini' | 'micro' | 'off'
  let widgetSize = $derived(settingsStore.settings.sidebarHabitWidget || 'full');

  // ─── Ring Progress ───
  let completionRatio = $derived.by(() => {
    if (!overview || overview.totalHabits === 0) return 0;
    return overview.todayCompleted / overview.totalHabits;
  });

  let circumference = 2 * Math.PI * 18;
  let strokeDashoffset = $derived(circumference - completionRatio * circumference);

  // Smaller ring for mini
  let circumferenceMini = 2 * Math.PI * 14;
  let strokeDashoffsetMini = $derived(circumferenceMini - completionRatio * circumferenceMini);
  
  // ─── Mini Heatmap (full mode only) ───
  function getMiniHeatmapDays(): string[] {
    const days: string[] = [];
    for (let i = 34; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }
  
  let miniHeatmapDays = $derived(getMiniHeatmapDays());

  let heatmapLevels = $derived.by(() => {
    const levels: Record<string, number> = {};
    if (!habits.length) return levels;
    for (const habit of habits) {
      if (habit.lastCompletedDate) {
        levels[habit.lastCompletedDate] = (levels[habit.lastCompletedDate] || 0) + 1;
      }
    }
    return levels;
  });

  function getHeatmapLevel(dateStr: string): number {
    const count = heatmapLevels[dateStr] || 0;
    if (!overview || overview.totalHabits === 0) return 0;
    if (count === 0) return 0;
    const ratio = count / overview.totalHabits;

    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }
  
  // ─── Pending habits for quick-complete (full mode only) ───
  let pendingToday = $derived(
    habits.filter(h => h.lastCompletedDate !== today)
  );

  let allDoneToday = $derived(
    overview ? overview.todayCompleted >= overview.totalHabits && overview.totalHabits > 0 : false
  );

  async function quickComplete(habitId: number, e: MouseEvent | KeyboardEvent) {
    e.stopPropagation();
    await habitsStore.completeHabit(habitId);
  }
  
  function navigateToHabits() {
    appStore.setView('habits');
  }

  // Funkcja ułatwiająca obsługę kliknięcia z klawiatury (Enter/Spacja)
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateToHabits();
    }
  }
</script>

{#if widgetSize !== 'off'}
  
  {#if !overview || overview.totalHabits === 0}
    <button
      class="w-full rounded-lg border bg-card p-2.5 opacity-60 hover:opacity-80 transition-opacity cursor-pointer text-left"
      onclick={navigateToHabits}
      type="button"
    >
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <Flame class="h-3.5 w-3.5" />
        <span>{$t('habits.no_habits')}</span>
      </div>
    </button>

  {:else if widgetSize === 'micro'}
    <button
      class="w-full flex items-center gap-2 rounded-lg border bg-card px-3 py-2 hover:shadow-sm transition-all cursor-pointer group"
      onclick={navigateToHabits}
      type="button"
    >
      {#if allDoneToday}
        <Check class="h-3.5 w-3.5 text-primary flex-shrink-0" />
      {:else}
        <Flame class="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
      {/if}
      
      <span class="text-sm font-bold tabular-nums">{overview.currentStreak}</span>
      <span class="text-[10px] text-muted-foreground">{$t('habits.day_streak')}</span>
      
      <div class="flex-1"></div>
      
      <span class="text-[11px] tabular-nums {allDoneToday ? 'text-primary font-medium' : 'text-muted-foreground'}">
        {overview.todayCompleted}/{overview.totalHabits}
      </span>
      
      <ChevronRight class="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>

  {:else if widgetSize === 'mini'}
    <button
      class="w-full rounded-lg border bg-card p-2.5 hover:shadow-sm transition-all cursor-pointer text-left group"
      onclick={navigateToHabits}
      type="button"
    >
      <div class="flex items-center gap-2.5">
        <div class="relative flex-shrink-0">
          <svg width="36" height="36" viewBox="0 0 36 36" class="transform -rotate-90">
            <circle 
              cx="18" cy="18" r="14" 
              fill="none" 
              stroke="currentColor"
              class="text-muted/50"
              stroke-width="3"
            />
            <circle 
              cx="18" cy="18" r="14" 
              fill="none" 
              stroke="currentColor"
              class="text-primary transition-all duration-700 ease-out"
              stroke-width="3"
              stroke-linecap="round"
              stroke-dasharray={circumferenceMini}
              stroke-dashoffset={strokeDashoffsetMini}
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            {#if allDoneToday}
              <Check class="h-3.5 w-3.5 text-primary" />
            {:else}
              <Flame class="h-3.5 w-3.5 text-orange-500" />
            {/if}
          </div>
        </div>
        
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-1">
            <span class="text-base font-bold tabular-nums">{overview.currentStreak}</span>
            <span class="text-[10px] text-muted-foreground truncate">{$t('habits.day_streak')}</span>
          </div>
          <div class="text-[10px] text-muted-foreground">
            {overview.todayCompleted}/{overview.totalHabits} {$t('habits.today')}
          </div>
        </div>
        
        <ChevronRight class="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </button>

  {:else}
    <div 
      class="w-full rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-all cursor-pointer text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      onclick={navigateToHabits}
      onkeydown={handleKeydown}
      role="button"
      tabindex="0"
    >
      <div class="flex items-center gap-3 mb-2.5">
        <div class="relative flex-shrink-0">
          <svg width="44" height="44" viewBox="0 0 44 44" class="transform -rotate-90">
            <circle 
              cx="22" cy="22" r="18" 
              fill="none" 
              stroke="currentColor"
              class="text-muted/50"
              stroke-width="3.5"
            />
            <circle 
              cx="22" cy="22" r="18" 
              fill="none" 
              stroke="currentColor"
              class="text-primary transition-all duration-700 ease-out"
              stroke-width="3.5"
              stroke-linecap="round"
              stroke-dasharray={circumference}
              stroke-dashoffset={strokeDashoffset}
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            {#if allDoneToday}
              <Check class="h-4 w-4 text-primary" />
            {:else}
              <Flame class="h-4 w-4 text-orange-500" />
            {/if}
          </div>
        </div>
        
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-1.5">
            <span class="text-lg font-bold tabular-nums">{overview.currentStreak}</span>
            <span class="text-[11px] text-muted-foreground truncate">{$t('habits.day_streak')}</span>
          </div>
          <div class="text-[11px] text-muted-foreground">
            {overview.todayCompleted}/{overview.totalHabits} {$t('habits.today')}
          </div>
        </div>
        
        <ChevronRight class="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
      
      <div class="grid grid-cols-7 gap-[2px] mb-2.5" title={$t('habits.this_year')}>
        {#each miniHeatmapDays as dateStr}
          <div 
            class="aspect-square rounded-[2px] transition-colors {
              getHeatmapLevel(dateStr) === 0 ? 'bg-muted/40' :
              getHeatmapLevel(dateStr) === 1 ? 'bg-primary/25' :
              getHeatmapLevel(dateStr) === 2 ? 'bg-primary/50' :
              getHeatmapLevel(dateStr) === 3 ? 'bg-primary/75' :
              'bg-primary'
            } {dateStr === today ? 'ring-1 ring-primary/50' : ''}"
            title="{dateStr}: {heatmapLevels[dateStr] || 0}"
          ></div>
        {/each}
      </div>
      
      {#if pendingToday.length > 0}
        <div class="space-y-1">
          {#each pendingToday.slice(0, 2) as habit (habit.id)}
            <button
              class="flex items-center justify-between w-full px-2 py-1 rounded-md text-[11px] bg-muted/50 hover:bg-primary/10 transition-colors group/item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onclick={(e) => quickComplete(habit.id, e)}
              type="button"
            >
              <span class="truncate text-muted-foreground">{habit.title}</span>
              <div class="flex items-center gap-1 text-primary opacity-0 group-hover/item:opacity-100 transition-opacity">
                <Check class="h-3 w-3" />
              </div>
            </button>
          {/each}
          {#if pendingToday.length > 2}
            <div class="text-[10px] text-muted-foreground text-center">
              +{pendingToday.length - 2} {$t('habits.more')}
            </div>
          {/if}
        </div>
      {:else if allDoneToday}
        <div class="flex items-center justify-center gap-1.5 py-1 text-[11px] text-primary font-medium">
          <Check class="h-3 w-3" />
          {$t('habits.all_done_today')}
        </div>
      {/if}
    </div>
  {/if}
{/if}