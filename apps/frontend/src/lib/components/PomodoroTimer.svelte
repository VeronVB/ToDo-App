<script lang="ts">
  import { Play, Pause, Square, SkipForward, X, Timer } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { timerStore } from '$lib/stores/timer.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  let isVisible = $derived(timerStore.isRunning || timerStore.isPaused);

  const phaseLabels = {
    work: 'timer.focus',
    shortBreak: 'timer.short_break',
    longBreak: 'timer.long_break',
    idle: 'timer.ready'
  };

  onMount(() => {
    timerStore.init();
  });

  onDestroy(() => {
    timerStore.destroy();
  });

  function handleStop() {
    timerStore.stopTimer();
  }

  function handlePauseResume() {
    if (timerStore.isPaused) {
      timerStore.resumeTimer();
    } else {
      timerStore.pauseTimer();
    }
  }

  function handleSkip() {
    timerStore.skipToNext();
  }

  const phaseColors = {
    work: 'bg-red-500',
    shortBreak: 'bg-green-500',
    longBreak: 'bg-blue-500',
    idle: 'bg-muted'
  };
</script>

{#if isVisible}
  <div class="fixed bottom-6 right-6 z-50 flex items-end gap-2">
    <!-- Main Timer Widget -->
    <div class="bg-card border rounded-xl shadow-lg p-4 min-w-[200px] animate-in slide-in-from-bottom-4">
      <!-- Header -->
      <div class="flex items-center justify-center mb-3">
        <div class="flex items-center gap-2">
          <div class={`w-2 h-2 rounded-full ${phaseColors[timerStore.currentPhase]}`}></div>
          <span class="text-sm font-medium">{$t(phaseLabels[timerStore.currentPhase])}</span>
        </div>
      </div>

      <!-- Timer Display -->
      <div class="text-4xl font-bold text-center mb-4 tabular-nums tracking-tight">
        {timerStore.formattedTime}
      </div>

      <!-- Progress Bar -->
      <div class="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
        <div 
          class={`h-full transition-all duration-1000 ${phaseColors[timerStore.currentPhase]}`}
          style="width: {timerStore.progress}%"
        ></div>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          class="h-9 w-9"
          onclick={handlePauseResume}
          title={timerStore.isPaused ? $t('timer.resume') : $t('timer.pause')}
        >
          {#if timerStore.isPaused}
            <Play class="h-4 w-4" />
          {:else}
            <Pause class="h-4 w-4" />
          {/if}
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          class="h-9 w-9"
          onclick={handleSkip}
          title={$t('timer.skip')}
        >
          <SkipForward class="h-4 w-4" />
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          class="h-9 w-9 text-destructive hover:text-destructive"
          onclick={handleStop}
          title={$t('timer.stop')}
        >
          <Square class="h-4 w-4" />
        </Button>
      </div>

      <!-- Session Counter -->
      <div class="mt-3 text-center text-xs text-muted-foreground">
        {$t('timer.session')} {timerStore.sessionsCompleted + 1}
      </div>
    </div>

    <!-- Minimized indicator when main is hidden (future) -->
  </div>
{/if}
