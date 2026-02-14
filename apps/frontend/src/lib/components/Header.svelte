<script lang="ts">
  import { Search, HelpCircle, Menu, Settings } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    onMenuClick: () => void;
  }

  let { onMenuClick }: Props = $props();

</script>

<header class="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="flex h-14 items-center px-4 gap-4">
    <!-- Left: Logo & Mobile Menu -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <Button variant="ghost" size="icon" class="md:hidden" onclick={onMenuClick}>
        <Menu class="h-5 w-5" />
      </Button>
      <div class="flex items-center gap-2 font-semibold text-lg">
        <span class="text-primary">●</span> {$t('app.title')}
      </div>
    </div>

    <!-- Center: Search -->
    <div class="flex-1 flex justify-center">
      <Button variant="outline" class="w-full max-w-[240px] md:max-w-md justify-between text-muted-foreground hidden sm:flex h-9 shadow-sm hover:shadow-md transition-all" onclick={() => uiStore.openSearch()}>
        <span class="flex items-center gap-2">
            <Search class="h-4 w-4" />
            <span class="text-sm">{$t('app.search_placeholder')}</span>
        </span>
        <kbd class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span class="text-xs">⌘</span>K
        </kbd>
      </Button>
      <Button variant="ghost" size="icon" class="sm:hidden" onclick={() => uiStore.openSearch()}>
          <Search class="h-5 w-5" />
      </Button>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-1 flex-shrink-0">
      <Button variant="ghost" size="icon" title={$t('menu.help')} onclick={() => uiStore.openCheatsheet()}>
        <HelpCircle class="h-5 w-5 text-muted-foreground" />
      </Button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
           {#snippet child({ props })}
            <Button variant="ghost" size="icon" {...props} title={$t('menu.quick_menu')}>
               <Menu class="h-5 w-5 text-muted-foreground" />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-56">
          <DropdownMenu.Label>{$t('menu.quick_menu')}</DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={() => uiStore.openCheatsheet()}>{$t('menu.keyboard_shortcuts')}</DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => uiStore.openSettings()}>{$t('menu.settings')}</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={() => uiStore.openCheatsheet()}>{$t('menu.help')}</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
</header>
