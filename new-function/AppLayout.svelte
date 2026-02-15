<script lang="ts">
  import { Menu } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { appStore } from '$lib/stores/app.svelte';
  import Sidebar from './Sidebar.svelte';
  import QuickCapture from './QuickCapture.svelte';
  import UndoToast from './UndoToast.svelte';
  import BatchActionsToolbar from './BatchActionsToolbar.svelte';
  import EisenhowerMatrix from './EisenhowerMatrix.svelte';
  import KanbanBoard from './KanbanBoard.svelte';
  import MorningBriefing from './MorningBriefing.svelte';
  import ProductivityDashboard from './ProductivityDashboard.svelte';
  import FocusMode from './FocusMode.svelte';
  import TaskTemplates from './TaskTemplates.svelte';
  import WeeklyReview from './WeeklyReview.svelte';
  import ActivityLog from './ActivityLog.svelte';

  interface Props {
    projects?: Array<{ id: number; name: string; color?: string; taskCount?: number; completedCount?: number }>;
    tags?: Array<{ name: string; count: number }>;
    tasks?: any[];
    children?: import('svelte').Snippet;
  }

  let { projects = [], tags = [], tasks = [], children }: Props = $props();

  let quickCaptureRef = $state<{ toggle: () => void; open: () => void } | null>(null);

  // Global keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    // Cmd/Ctrl + K: Quick Capture
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      quickCaptureRef?.toggle();
      return;
    }

    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    // j/k: Navigate tasks (could be extended)
    // b: Toggle batch mode
    if (e.key === 'b' && !e.metaKey && !e.ctrlKey) {
      appStore.toggleBatchMode();
      return;
    }

    // Escape: Exit batch mode or close menus
    if (e.key === 'Escape') {
      if (appStore.batchMode) {
        appStore.exitBatchMode();
      }
    }

    // Number shortcuts for views
    if (e.key === '1') appStore.setView('inbox');
    if (e.key === '2') appStore.setView('today');
    if (e.key === '3') appStore.setView('upcoming');
  }

  // View title mapping
  function getViewTitle(view: string): string {
    const titles: Record<string, string> = {
      inbox: 'Inbox',
      today: 'Today',
      upcoming: 'Upcoming',
      anytime: 'Anytime',
      someday: 'Someday',
      logbook: 'Logbook',
      habits: 'Habits',
      project: 'Project',
      tag: 'Tag',
      matrix: 'Eisenhower Matrix',
      kanban: 'Kanban Board',
      briefing: 'Morning Briefing',
      dashboard: 'Productivity Dashboard',
      filter: 'Smart Filter',
      focus: 'Focus Mode',
      templates: 'Templates',
      review: 'Weekly Review',
      activity: 'Activity Log',
    };
    return titles[view] || view;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-screen bg-background text-foreground">
  <!-- Sidebar -->
  <Sidebar
    {projects}
    {tags}
    isOpen={appStore.sidebarOpen}
    onToggle={() => appStore.sidebarOpen = !appStore.sidebarOpen}
  />

  <!-- Main Content -->
  <main class="flex-1 flex flex-col overflow-hidden">
    <!-- Top bar -->
    <header class="flex items-center gap-3 px-4 py-3 border-b shrink-0">
      <Button variant="ghost" size="icon" class="h-8 w-8 md:hidden"
        onclick={() => appStore.sidebarOpen = true}>
        <Menu class="h-4 w-4" />
      </Button>
      <h2 class="text-lg font-semibold">{getViewTitle(appStore.currentView)}</h2>
      <div class="flex-1" />
      {#if !['matrix', 'kanban', 'briefing', 'dashboard', 'focus', 'templates', 'review', 'activity'].includes(appStore.currentView)}
        <Button variant="ghost" size="sm" class="text-xs gap-1"
          onclick={() => appStore.toggleBatchMode()}>
          {appStore.batchMode ? 'Exit Batch' : 'Select'}
        </Button>
      {/if}
    </header>

    <!-- Content area -->
    <div class="flex-1 overflow-y-auto">
      {#if appStore.currentView === 'matrix'}
        <EisenhowerMatrix {tasks} />
      {:else if appStore.currentView === 'kanban'}
        <KanbanBoard {tasks} />
      {:else if appStore.currentView === 'briefing'}
        <MorningBriefing />
      {:else if appStore.currentView === 'dashboard'}
        <ProductivityDashboard />
      {:else if appStore.currentView === 'focus'}
        <FocusMode />
      {:else if appStore.currentView === 'templates'}
        <TaskTemplates />
      {:else if appStore.currentView === 'review'}
        <WeeklyReview />
      {:else if appStore.currentView === 'activity'}
        <ActivityLog />
      {:else}
        <!-- Default task list views rendered by parent via slot -->
        {#if children}
          {@render children()}
        {/if}
      {/if}
    </div>
  </main>
</div>

<!-- Floating elements -->
<QuickCapture bind:this={quickCaptureRef} />
<UndoToast />
<BatchActionsToolbar {projects} />