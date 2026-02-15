<script lang="ts">
  import { Flame, TrendingUp, Target } from '@lucide/svelte';
  import { habitsStore } from '$lib/stores/habits.svelte';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  
  onMount(() => {
    habitsStore.fetchOverview();
  });
  
  let overview = $derived(habitsStore.overview);
  
  function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }
  
  let last7Days = $derived(getLast7Days());
</script>

{#if overview && overview.totalHabits > 0}
  <div class="rounded-lg border bg-card p-3 shadow-sm">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-1.5">
        <Flame onclick={() => (appStore as any).setView('habits')} class="h-4 w-4 text-orange-500" />
        <span class="text-sm font-semibold">{overview.currentStreak}</span>
        <span class="text-xs text-muted-foreground">{$t('habits.day_streak')}</span>
      </div>
      <span class="text-xs text-muted-foreground">
        {overview.todayCompleted}/{overview.totalHabits} {$t('habits.today')}
      </span>
    </div>
    
    <div class="flex gap-1 mb-2">
      {#each last7Days as dateStr, i}
        <div 
          class="h-6 w-3 rounded-sm {i < overview.todayCompleted ? 'bg-green-500' : 'bg-muted'}"
          style="opacity: {i < overview.todayCompleted ? 1 : 0.3}"
          title={dateStr}
        ></div>
      {/each}
    </div>
    
    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <div class="flex items-center gap-1">
        <TrendingUp class="h-3 w-3" />
        <span>{overview.weekCompletions} {$t('habits.this_week')}</span>
      </div>
      <div class="flex items-center gap-1">
        <Target class="h-3 w-3" />
        <span>{overview.yearCompletions} {$t('habits.this_year')}</span>
      </div>
    </div>
  </div>
{:else}
  <div class="rounded-lg border bg-card p-3 shadow-sm opacity-60">
    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <Flame class="h-4 w-4" />
      <span>{$t('habits.no_habits')}</span>
    </div>
  </div>
{/if}
