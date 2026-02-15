<script lang="ts">
  import { Focus, Play, Pause, Square, SkipForward } from '@lucide/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { t } from 'svelte-i18n';

  type TimerMode = 'focus' | 'short_break' | 'long_break';
  
  let mode = $state<TimerMode>('focus');
  let isRunning = $state(false);
  let timeLeft = $state(25 * 60);
  let sessions = $state(0);

  const DURATIONS = {
    focus: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60
  };

  let timer: ReturnType<typeof setInterval> | null = null;

  function startTimer() {
    if (timer) return;
    isRunning = true;
    timer = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
      } else {
        completeSession();
      }
    }, 1000);
  }

  function pauseTimer() {
    isRunning = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function stopTimer() {
    pauseTimer();
    timeLeft = DURATIONS[mode];
  }

  function completeSession() {
    pauseTimer();
    if (mode === 'focus') {
      sessions++;
      if (sessions % 4 === 0) {
        mode = 'long_break';
        timeLeft = DURATIONS.long_break;
      } else {
        mode = 'short_break';
        timeLeft = DURATIONS.short_break;
      }
    } else {
      mode = 'focus';
      timeLeft = DURATIONS.focus;
    }
  }

  function skipToNext() {
    stopTimer();
    if (mode === 'focus') {
      mode = 'short_break';
    } else {
      mode = 'focus';
    }
    timeLeft = DURATIONS[mode];
  }

  function setMode(newMode: TimerMode) {
    stopTimer();
    mode = newMode;
    timeLeft = DURATIONS[newMode];
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<div class="h-full max-w-2xl mx-auto p-6 flex flex-col items-center justify-center">
  <div class="flex items-center gap-3 mb-8">
    <Focus class="h-8 w-8" />
    <h1 class="text-2xl font-bold">{$t('focus.title')}</h1>
  </div>

  <div class="flex gap-2 mb-8">
    <Button 
      variant={mode === 'focus' ? 'default' : 'outline'} 
      size="sm"
      onclick={() => setMode('focus')}
    >
      {$t('focus.pomodoro')}
    </Button>
    <Button 
      variant={mode === 'short_break' ? 'default' : 'outline'} 
      size="sm"
      onclick={() => setMode('short_break')}
    >
      {$t('focus.short_break')}
    </Button>
    <Button 
      variant={mode === 'long_break' ? 'default' : 'outline'} 
      size="sm"
      onclick={() => setMode('long_break')}
    >
      {$t('focus.long_break')}
    </Button>
  </div>

  <Card class="w-80 h-80 flex items-center justify-center mb-8">
    <CardContent class="flex flex-col items-center">
      <div class="text-7xl font-bold font-mono tabular-nums">
        {formatTime(timeLeft)}
      </div>
      <div class="text-muted-foreground mt-2">
        {#if mode === 'focus'}
          {$t('focus.pomodoro')}
        {:else if mode === 'short_break'}
          {$t('focus.short_break')}
        {:else}
          {$t('focus.long_break')}
        {/if}
      </div>
    </CardContent>
  </Card>

  <div class="flex gap-4">
    {#if isRunning}
      <Button size="lg" onclick={pauseTimer}>
        <Pause class="mr-2 h-5 w-5" />
        {$t('focus.pause')}
      </Button>
    {:else}
      <Button size="lg" onclick={startTimer}>
        <Play class="mr-2 h-5 w-5" />
        {$t('focus.start')}
      </Button>
    {/if}
    <Button variant="outline" size="lg" onclick={stopTimer}>
      <Square class="mr-2 h-5 w-5" />
      {$t('focus.stop')}
    </Button>
    <Button variant="outline" size="lg" onclick={skipToNext}>
      <SkipForward class="mr-2 h-5 w-5" />
      {$t('focus.skip')}
    </Button>
  </div>

  <div class="mt-8 text-center">
    <div class="text-muted-foreground">{$t('focus.sessions')}: {sessions}</div>
  </div>
</div>
