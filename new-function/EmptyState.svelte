<script lang="ts">
  import { Inbox, Sun, Calendar, Moon, BookOpen, CheckCircle2 } from '@lucide/svelte';

  interface Props {
    view?: string;
    title?: string;
    description?: string;
  }

  let { view = 'inbox', title, description }: Props = $props();

  const states: Record<string, { icon: any; title: string; description: string; emoji: string }> = {
    inbox: {
      icon: Inbox,
      title: 'Inbox Zero!',
      description: 'No tasks waiting to be processed. Use ⌘K to add one.',
      emoji: '📥'
    },
    today: {
      icon: Sun,
      title: "You're all caught up!",
      description: "No tasks scheduled for today. Enjoy your free time!",
      emoji: '☀️'
    },
    upcoming: {
      icon: Calendar,
      title: 'Nothing upcoming',
      description: 'No scheduled tasks ahead. Plan your week with ⌘K.',
      emoji: '📅'
    },
    someday: {
      icon: Moon,
      title: 'Someday list is empty',
      description: 'A place for ideas and tasks without deadlines.',
      emoji: '🌙'
    },
    logbook: {
      icon: BookOpen,
      title: 'No completed tasks yet',
      description: 'Completed tasks will appear here.',
      emoji: '📖'
    },
    default: {
      icon: CheckCircle2,
      title: 'No tasks here',
      description: 'This view is empty.',
      emoji: '✨'
    }
  };

  let state = $derived(states[view] || states.default);
</script>

<div class="flex flex-col items-center justify-center py-20 px-4 text-center">
  <div class="text-5xl mb-4">{state.emoji}</div>
  <div class="mb-2">
    <state.icon class="h-8 w-8 text-muted-foreground/40 mx-auto" />
  </div>
  <h3 class="text-lg font-semibold mt-2">{title || state.title}</h3>
  <p class="text-sm text-muted-foreground mt-1 max-w-[280px]">{description || state.description}</p>
</div>