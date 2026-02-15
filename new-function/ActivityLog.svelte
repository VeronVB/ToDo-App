<script lang="ts">
  import { Clock, CheckCircle, Trash2, Plus, Pencil, ArrowRight, RotateCcw } from '@lucide/svelte';
  import type { IActivityLog } from 'shared';
  import * as api from '$lib/api/client';

  let logs = $state<IActivityLog[]>([]);
  let loading = $state(true);
  let limit = $state(50);

  $effect(() => {
    loadLogs();
  });

  async function loadLogs() {
    loading = true;
    try {
      logs = await api.getActivityLog(limit);
    } catch (e) {
      console.error('Failed to load activity log:', e);
    }
    loading = false;
  }

  function getIcon(action: string) {
    switch (action) {
      case 'created': return Plus;
      case 'completed': return CheckCircle;
      case 'deleted': return Trash2;
      case 'updated': return Pencil;
      case 'moved': return ArrowRight;
      case 'restored': return RotateCcw;
      default: return Clock;
    }
  }

  function getColor(action: string) {
    switch (action) {
      case 'created': return 'text-green-500';
      case 'completed': return 'text-blue-500';
      case 'deleted': return 'text-red-500';
      case 'updated': return 'text-yellow-500';
      case 'moved': return 'text-purple-500';
      default: return 'text-muted-foreground';
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  // Group logs by date
  let groupedLogs = $derived(() => {
    const groups = new Map<string, IActivityLog[]>();
    for (const log of logs) {
      const date = new Date(log.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(log);
    }
    return groups;
  });
</script>

<div class="space-y-6 p-4 max-w-2xl mx-auto">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold">Activity Log</h2>
    <select bind:value={limit} onchange={loadLogs}
      class="h-8 text-xs rounded-md border bg-background px-2">
      <option value={25}>Last 25</option>
      <option value={50}>Last 50</option>
      <option value={100}>Last 100</option>
    </select>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
    </div>
  {:else if logs.length === 0}
    <div class="text-center py-12 text-muted-foreground">
      <Clock class="h-10 w-10 mx-auto mb-3 opacity-40" />
      <p class="text-sm">No activity yet</p>
    </div>
  {:else}
    {#each groupedLogs() as [date, dayLogs]}
      <div>
        <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{date}</h3>
        <div class="space-y-1">
          {#each dayLogs as log}
            {@const Icon = getIcon(log.action)}
            <div class="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div class="mt-0.5 {getColor(log.action)}">
                <Icon class="h-4 w-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm">
                  <span class="capitalize font-medium">{log.action}</span>
                  {#if log.entityType === 'task'}
                    task
                  {:else}
                    {log.entityType}
                  {/if}
                  {#if log.details}
                    <span class="text-muted-foreground">— {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</span>
                  {/if}
                </p>
              </div>
              <span class="text-xs text-muted-foreground whitespace-nowrap">{formatTime(log.createdAt)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}

    {#if logs.length >= limit}
      <div class="text-center">
        <Button variant="ghost" size="sm" onclick={() => { limit += 50; loadLogs(); }}>
          Load more
        </Button>
      </div>
    {/if}
  {/if}
</div>