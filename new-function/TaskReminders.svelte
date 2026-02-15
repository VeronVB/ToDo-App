<script lang="ts">
  import { Bell, Plus, X, Clock } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import type { ITaskReminder } from 'shared';
  import * as api from '$lib/api/client';

  interface Props {
    taskId: number;
    onUpdate?: () => void;
  }

  let { taskId, onUpdate }: Props = $props();

  let reminders = $state<ITaskReminder[]>([]);
  let isAdding = $state(false);
  let reminderDate = $state('');
  let reminderTime = $state('09:00');

  $effect(() => {
    loadReminders();
  });

  async function loadReminders() {
    try {
      reminders = await api.getReminders(taskId);
    } catch (e) {
      console.error('Failed to load reminders:', e);
    }
  }

  async function addReminder() {
    if (!reminderDate) return;
    const remindAt = `${reminderDate}T${reminderTime}:00`;
    try {
      await api.createReminder(taskId, remindAt);
      await loadReminders();
      isAdding = false;
      reminderDate = '';
      onUpdate?.();
    } catch (e) {
      console.error('Failed to create reminder:', e);
    }
  }

  async function deleteReminder(id: number) {
    try {
      await api.deleteReminder(id);
      await loadReminders();
      onUpdate?.();
    } catch (e) {
      console.error('Failed to delete reminder:', e);
    }
  }

  function formatReminderDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const isPast = d < now;
    const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeFormatted = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return { text: `${dateFormatted} at ${timeFormatted}`, isPast };
  }

  // Quick presets
  function setPreset(minutes: number) {
    const d = new Date(Date.now() + minutes * 60000);
    reminderDate = d.toISOString().split('T')[0];
    reminderTime = d.toTimeString().slice(0, 5);
    addReminder();
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
      <Bell class="h-3.5 w-3.5" />
      Reminders
    </h4>
    <Button variant="ghost" size="icon" class="h-6 w-6" onclick={() => isAdding = !isAdding}>
      <Plus class="h-3 w-3" />
    </Button>
  </div>

  {#each reminders as reminder}
    {@const formatted = formatReminderDate(reminder.remindAt)}
    <div class="flex items-center gap-2 px-2 py-1 rounded text-sm group
      {formatted.isPast ? 'bg-yellow-500/10' : 'bg-muted/50'}">
      <Clock class="h-3 w-3 {formatted.isPast ? 'text-yellow-500' : 'text-muted-foreground'} shrink-0" />
      <span class="flex-1 text-xs {formatted.isPast ? 'text-yellow-600' : ''}">{formatted.text}</span>
      {#if reminder.sent}
        <span class="text-[10px] text-muted-foreground">sent</span>
      {/if}
      <button class="opacity-0 group-hover:opacity-100 transition-opacity" onclick={() => deleteReminder(reminder.id)}>
        <X class="h-3 w-3 text-muted-foreground hover:text-red-500" />
      </button>
    </div>
  {/each}

  {#if isAdding}
    <div class="space-y-2 p-2 border rounded-lg">
      <!-- Quick presets -->
      <div class="flex gap-1.5 flex-wrap">
        <button class="px-2 py-0.5 text-[10px] bg-muted rounded hover:bg-accent" onclick={() => setPreset(30)}>
          In 30min
        </button>
        <button class="px-2 py-0.5 text-[10px] bg-muted rounded hover:bg-accent" onclick={() => setPreset(60)}>
          In 1h
        </button>
        <button class="px-2 py-0.5 text-[10px] bg-muted rounded hover:bg-accent" onclick={() => setPreset(180)}>
          In 3h
        </button>
        <button class="px-2 py-0.5 text-[10px] bg-muted rounded hover:bg-accent" onclick={() => setPreset(1440)}>
          Tomorrow
        </button>
      </div>

      <div class="flex gap-2">
        <Input type="date" bind:value={reminderDate} class="h-7 text-xs flex-1" />
        <Input type="time" bind:value={reminderTime} class="h-7 text-xs w-24" />
      </div>
      <div class="flex gap-1.5">
        <Button size="sm" class="h-6 text-xs flex-1" onclick={addReminder}>Set Reminder</Button>
        <Button size="sm" variant="ghost" class="h-6 text-xs" onclick={() => isAdding = false}>Cancel</Button>
      </div>
    </div>
  {/if}

  {#if reminders.length === 0 && !isAdding}
    <p class="text-xs text-muted-foreground">No reminders set</p>
  {/if}
</div>