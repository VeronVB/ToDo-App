<script lang="ts">
  import { onMount } from 'svelte';
  import { CalendarRange, CheckCircle2, AlertCircle, PartyPopper } from '@lucide/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import * as api from '$lib/api/client';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { t } from 'svelte-i18n';
  import type { ITask } from 'shared';

  let currentStep = $state(1);
  let completedTasks = $state<ITask[]>([]);
  let overdueTasks = $state<ITask[]>([]);

  onMount(() => {
    const today = new Date().toISOString().split('T')[0];
    completedTasks = tasksStore.tasks.filter(t => {
      const updated = t.updatedAt?.split('T')[0];
      return t.completed && updated === today;
    });
    overdueTasks = tasksStore.tasks.filter(t => {
      const due = t.dueDate?.split('T')[0];
      return !t.completed && due && due < today;
    });
  });

  function nextStep() {
    if (currentStep < 4) currentStep++;
  }

  function prevStep() {
    if (currentStep > 1) currentStep--;
  }
</script>

<div class="h-full max-w-4xl mx-auto p-6">
  <div class="flex items-center gap-3 mb-6">
    <CalendarRange class="h-8 w-8" />
    <h1 class="text-2xl font-bold">{$t('review.title')}</h1>
  </div>

  <div class="flex gap-2 mb-8">
    {#each [1, 2, 3, 4] as step}
      <Button 
        variant={currentStep === step ? 'default' : 'outline'}
        size="sm"
        onclick={() => currentStep = step}
      >
        {step}
      </Button>
    {/each}
  </div>

  {#if currentStep === 1}
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <CheckCircle2 class="h-5 w-5" />
          {$t('review.step1')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {#if completedTasks.length === 0}
          <p class="text-muted-foreground">{$t('review.no_completed')}</p>
        {:else}
          <div class="space-y-2">
            {#each completedTasks as task}
              <div class="p-2 border rounded flex items-center gap-2">
                <CheckCircle2 class="h-4 w-4 text-green-500" />
                <span>{task.title}</span>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  {:else if currentStep === 2}
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <AlertCircle class="h-5 w-5" />
          {$t('review.step2')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {#if overdueTasks.length === 0}
          <p class="text-muted-foreground">{$t('review.no_overdue')}</p>
        {:else}
          <div class="space-y-2">
            {#each overdueTasks as task}
              <div class="p-2 border rounded flex items-center gap-2">
                <AlertCircle class="h-4 w-4 text-red-500" />
                <span>{task.title}</span>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  {:else if currentStep === 3}
    <Card>
      <CardHeader>
        <CardTitle>{$t('review.step3')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">Plan your tasks for next week</p>
        <Button onclick={() => {}}>Add Task</Button>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <PartyPopper class="h-5 w-5" />
          {$t('review.step4')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-lg text-center py-8">
          Great job! You've completed {completedTasks.length} tasks this week! 🎉
        </p>
      </CardContent>
    </Card>
  {/if}

  <div class="flex justify-between mt-6">
    <Button variant="outline" onclick={prevStep} disabled={currentStep === 1}>
      {$t('app.back')}
    </Button>
    <Button onclick={nextStep} disabled={currentStep === 4}>
      Next
    </Button>
  </div>
</div>
