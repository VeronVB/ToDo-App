<script lang="ts">
  import { onMount } from 'svelte';
  import { Activity, Plus, Edit, Trash2, CheckCircle2, XCircle, ArrowRight, Link, Unlink } from '@lucide/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as api from '$lib/api/client';
  import { t } from 'svelte-i18n';
  import type { IActivityLog } from 'shared';

  let activities = $state<IActivityLog[]>([]);
  let loading = $state(true);

  onMount(async () => {
    await loadActivities();
  });

  async function loadActivities() {
    try {
      loading = true;
      activities = await api.getActivityLog(undefined, 50);
    } catch (e) {
      console.error('Failed to load activities:', e);
    } finally {
      loading = false;
    }
  }

  function getActivityIcon(action: string) {
    switch (action) {
      case 'created': return Plus;
      case 'completed': return CheckCircle2;
      case 'uncompleted': return XCircle;
      case 'edited': return Edit;
      case 'deleted': return Trash2;
      case 'moved': return ArrowRight;
      case 'dependency_added': return Link;
      case 'dependency_removed': return Unlink;
      default: return Activity;
    }
  }

  function formatDate(dateStr: string): string {
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

  function groupByDate(items: IActivityLog[]): Map<string, IActivityLog[]> {
    const groups = new Map<string, IActivityLog[]>();
    items.forEach(item => {
      const date = new Date(item.createdAt).toLocaleDateString();
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(item);
    });
    return groups;
  }

  let groupedActivities = $derived(groupByDate(activities));
</script>

<div class="h-full max-w-4xl mx-auto p-6">
  <div class="flex items-center gap-3 mb-6">
    <Activity class="h-8 w-8" />
    <h1 class="text-2xl font-bold">{$t('activity.title')}</h1>
  </div>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  {:else if activities.length === 0}
    <Card>
      <CardContent class="py-8 text-center">
        <p class="text-muted-foreground">{$t('activity.no_activity')}</p>
      </CardContent>
    </Card>
  {:else}
    <div class="space-y-6">
      {#each [...groupedActivities.entries()] as [date, items]}
        <div>
          <h3 class="text-sm font-medium text-muted-foreground mb-2">{date}</h3>
          <div class="space-y-2">
            {#each items as activity}
              <div class="flex items-start gap-3 p-3 border rounded-lg">
                <div class="mt-0.5">
                  <svelte:component this={getActivityIcon(activity.action)} class="h-4 w-4 text-muted-foreground" />
                </div>
                <div class="flex-1">
                  <div class="text-sm">
                    {#if activity.taskTitle}
                      <span class="font-medium">{activity.taskTitle}</span>
                    {/if}
                    <span class="text-muted-foreground">
                      {activity.action === 'created' ? $t('activity.created') :
                       activity.action === 'completed' ? $t('activity.completed') :
                       activity.action === 'uncompleted' ? $t('activity.uncompleted') :
                       activity.action === 'edited' ? $t('activity.edited') :
                       activity.action === 'deleted' ? $t('activity.deleted') :
                       activity.action === 'moved' ? $t('activity.moved') :
                       activity.action === 'dependency_added' ? $t('activity.dependency_added') :
                       activity.action === 'dependency_removed' ? $t('activity.dependency_removed') :
                       activity.action}
                    </span>
                  </div>
                </div>
                <div class="text-xs text-muted-foreground">
                  {formatDate(activity.createdAt)}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
