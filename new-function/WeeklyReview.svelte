<script lang="ts">
  import { CheckCircle, Clock, TrendingUp, AlertTriangle, ArrowRight, Trophy } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import type { IProductivityStats } from 'shared';
  import * as api from '$lib/api/client';

  let stats = $state<IProductivityStats | null>(null);
  let loading = $state(true);
  let currentStep = $state(0);

  const steps = [
    { title: 'Review Completed', icon: CheckCircle },
    { title: 'Process Overdue', icon: AlertTriangle },
    { title: 'Plan Next Week', icon: ArrowRight },
    { title: 'Celebrate', icon: Trophy }
  ];

  $effect(() => {
    loadStats();
  });

  async function loadStats() {
    loading = true;
    try {
      stats = await api.getProductivityStats();
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
    loading = false;
  }

  function getWeekRange() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
</script>

<div class="max-w-2xl mx-auto p-6 space-y-8">
  <div class="text-center">
    <h2 class="text-2xl font-bold">Weekly Review</h2>
    <p class="text-muted-foreground mt-1">{getWeekRange()}</p>
  </div>

  <!-- Step indicator -->
  <div class="flex items-center justify-center gap-2">
    {#each steps as step, i}
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
          {i === currentStep ? 'bg-primary text-primary-foreground' : i < currentStep ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}"
        onclick={() => currentStep = i}
      >
        <step.icon class="h-3.5 w-3.5" />
        {step.title}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="text-center py-12">
      <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
    </div>
  {:else if stats}
    <!-- Step content -->
    {#if currentStep === 0}
      <div class="space-y-6">
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-4 bg-green-500/10 rounded-xl">
            <p class="text-3xl font-bold text-green-500">{stats.completedThisWeek}</p>
            <p class="text-xs text-muted-foreground mt-1">Completed this week</p>
          </div>
          <div class="text-center p-4 bg-blue-500/10 rounded-xl">
            <p class="text-3xl font-bold text-blue-500">{stats.activeTasks}</p>
            <p class="text-xs text-muted-foreground mt-1">Active tasks</p>
          </div>
          <div class="text-center p-4 bg-purple-500/10 rounded-xl">
            <p class="text-3xl font-bold text-purple-500">{stats.currentStreak}</p>
            <p class="text-xs text-muted-foreground mt-1">Day streak</p>
          </div>
        </div>

        {#if stats.completionRate !== undefined}
          <div>
            <div class="flex justify-between text-sm mb-2">
              <span class="text-muted-foreground">Completion rate</span>
              <span class="font-medium">{Math.round(stats.completionRate)}%</span>
            </div>
            <div class="h-3 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-green-500 rounded-full transition-all"
                style="width: {stats.completionRate}%"></div>
            </div>
          </div>
        {/if}

        <div class="text-center pt-4">
          <Button onclick={() => currentStep = 1}>
            Next: Process Overdue <ArrowRight class="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

    {:else if currentStep === 1}
      <div class="space-y-4">
        <div class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div class="flex items-center gap-2 mb-3">
            <AlertTriangle class="h-5 w-5 text-yellow-500" />
            <h3 class="font-semibold">Overdue Tasks</h3>
          </div>
          <p class="text-sm text-muted-foreground">
            Review your overdue tasks. Reschedule, delegate, or delete items that are no longer relevant.
          </p>
        </div>

        <div class="space-y-2">
          <p class="text-sm text-muted-foreground italic">
            Navigate to your task views to manage overdue items. Use the "Today" view to see what's due.
          </p>
        </div>

        <div class="text-center pt-4">
          <Button onclick={() => currentStep = 2}>
            Next: Plan Ahead <ArrowRight class="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

    {:else if currentStep === 2}
      <div class="space-y-4">
        <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div class="flex items-center gap-2 mb-3">
            <Clock class="h-5 w-5 text-blue-500" />
            <h3 class="font-semibold">Plan Next Week</h3>
          </div>
          <p class="text-sm text-muted-foreground">
            Review your upcoming tasks. Assign due dates, priorities, and ensure your week is balanced.
          </p>
        </div>

        <ul class="space-y-2 text-sm">
          <li class="flex items-start gap-2">
            <CheckCircle class="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>Check your Upcoming view for next week's tasks</span>
          </li>
          <li class="flex items-start gap-2">
            <CheckCircle class="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>Use the Eisenhower Matrix to prioritize</span>
          </li>
          <li class="flex items-start gap-2">
            <CheckCircle class="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>Set realistic goals — aim for 3-5 key tasks per day</span>
          </li>
          <li class="flex items-start gap-2">
            <CheckCircle class="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>Schedule time for deep work using Focus Mode</span>
          </li>
        </ul>

        <div class="text-center pt-4">
          <Button onclick={() => currentStep = 3}>
            Finish Review <ArrowRight class="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

    {:else if currentStep === 3}
      <div class="text-center space-y-6 py-8">
        <div class="text-6xl">🎉</div>
        <div>
          <h3 class="text-xl font-bold">Weekly Review Complete!</h3>
          <p class="text-muted-foreground mt-2">
            You completed {stats.completedThisWeek} tasks this week. Keep up the great work!
          </p>
        </div>

        {#if stats.completedThisWeek > 10}
          <div class="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-600 px-4 py-2 rounded-full">
            <Trophy class="h-5 w-5" />
            <span class="font-semibold text-sm">Productivity Champion! 🏆</span>
          </div>
        {/if}

        <div>
          <Button variant="outline" onclick={() => currentStep = 0}>
            Review Again
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>