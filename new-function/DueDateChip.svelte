<script lang="ts">
  import { t } from 'svelte-i18n';

  interface Props {
    dueDate: string;
    compact?: boolean;
  }
  let { dueDate, compact = false }: Props = $props();

  let info = $derived.by(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 ring-red-200 dark:ring-red-800' };
    if (diff === 0) return { label: $t('sidebar.today') || 'Today', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-blue-200 dark:ring-blue-800' };
    if (diff === 1) return { label: $t('habits.yesterday') === 'Yesterday' ? 'Tomorrow' : 'Jutro', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 ring-green-200 dark:ring-green-800' };
    if (diff <= 3) return { label: `${diff}d`, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 ring-yellow-200 dark:ring-yellow-800' };
    if (diff <= 7) return { label: `${diff}d`, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 ring-orange-200 dark:ring-orange-800' };
    
    return { label: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), color: 'bg-muted text-muted-foreground' };
  });
</script>

<span class="inline-flex items-center rounded-full px-{compact ? '1.5' : '2'} py-0.5 text-[{compact ? '9' : '10'}px] font-medium ring-1 ring-inset {info.color} whitespace-nowrap">
  {info.label}
</span>