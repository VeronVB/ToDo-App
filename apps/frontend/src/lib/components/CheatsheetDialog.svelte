<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Tabs from '$lib/components/ui/tabs';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { CheckSquare, Repeat, Clock, Search, Palette } from '@lucide/svelte';
  import { t } from 'svelte-i18n';

  interface Props {
      open: boolean;
      onOpenChange: (open: boolean) => void;
  }
  let { open, onOpenChange }: Props = $props();

  const shortcuts = $derived([
      { section: $t('help.shortcuts.general'), items: [
          { label: $t('help.shortcuts.add_new_task'), keys: ['⌘', 'N'] },
          { label: $t('help.shortcuts.search'), keys: ['⌘', 'K'] },
          { label: $t('help.shortcuts.focus_search'), keys: ['/'] },
          { label: $t('help.shortcuts.close_dialog'), keys: ['Esc'] },
      ]},
      { section: $t('help.shortcuts.navigation'), items: [
          { label: $t('help.shortcuts.go_to_inbox'), keys: ['⌘', '1'] },
          { label: $t('help.shortcuts.go_to_today'), keys: ['⌘', '2'] },
          { label: $t('help.shortcuts.go_to_upcoming'), keys: ['⌘', '3'] },
          { label: $t('help.shortcuts.go_to_logbook'), keys: ['⌘', 'L'] },
      ]},
      { section: $t('help.shortcuts.task_actions'), items: [
          { label: $t('help.shortcuts.edit_task'), keys: ['⌘', 'E'] },
          { label: $t('help.shortcuts.delete_task'), keys: ['⌘', 'D'] },
          { label: $t('help.shortcuts.toggle_complete'), keys: ['Space'] },
          { label: $t('help.shortcuts.schedule_task'), keys: ['⌘', 'S'] },
      ]}
  ]);
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
    <Dialog.Header class="px-6 py-4 border-b shrink-0">
       <Dialog.Title>{$t('help.title')}</Dialog.Title>
    </Dialog.Header>
    
    <Tabs.Root value="shortcuts" class="flex-1 flex flex-col min-h-0">
       <div class="px-6 border-b shrink-0">
         <Tabs.List class="w-full justify-start rounded-none border-b-0 p-0 bg-transparent h-auto">
            <Tabs.Trigger value="shortcuts" class="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
              {$t('help.tabs.shortcuts')}
            </Tabs.Trigger>
            <Tabs.Trigger value="quick-add" class="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
              {$t('help.tabs.quick_add')}
            </Tabs.Trigger>
             <Tabs.Trigger value="features" class="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
              {$t('help.tabs.features')}
            </Tabs.Trigger>
         </Tabs.List>
       </div>
       
       <ScrollArea class="flex-1">
          <Tabs.Content value="shortcuts" class="p-6 m-0">
             <div class="grid md:grid-cols-2 gap-x-12 gap-y-8">
                {#each shortcuts as section}
                <div>
                   <h4 class="mb-4 text-sm font-semibold text-muted-foreground">{section.section}</h4>
                   <div class="space-y-3">
                      {#each section.items as item}
                      <div class="flex items-center justify-between">
                         <span class="text-sm">{item.label}</span>
                         <div class="flex gap-1">
                             {#each item.keys as key}
                                <kbd class="pointer-events-none inline-flex h-5 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground min-w-[20px]">{key}</kbd>
                             {/each}
                         </div>
                      </div>
                      {/each}
                   </div>
                </div>
                {/each}
             </div>
          </Tabs.Content>
          
          <Tabs.Content value="quick-add" class="p-6 m-0 space-y-6">
             <div class="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900 text-blue-900 dark:text-blue-100 text-sm">
                 <strong>💡 {$t('help.quick_add.title')}</strong>
                 <p class="mt-1 opacity-90">{$t('help.quick_add.description')}</p>
             </div>
             
             <div class="space-y-4">
                 <div class="rounded-lg border p-4 space-y-2">
                     <div class="text-sm text-muted-foreground">Input:</div>
                     <div class="font-mono text-sm bg-muted/50 p-2 rounded">Buy milk tomorrow</div>
                     <div class="text-sm text-muted-foreground mt-2">Parsed:</div>
                     <div class="flex gap-2">
                         <span class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold text-foreground">Buy milk</span>
                         <span class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200">📅 tomorrow</span>
                     </div>
                 </div>
                 
                 <div class="rounded-lg border p-4 space-y-2">
                     <div class="text-sm text-muted-foreground">Input:</div>
                     <div class="font-mono text-sm bg-muted/50 p-2 rounded">Review PR @Work !high</div>
                     <div class="text-sm text-muted-foreground mt-2">Parsed:</div>
                     <div class="flex gap-2">
                         <span class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold text-foreground">Review PR</span>
                         <span class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold bg-orange-50 text-orange-700 border-orange-200">📁 Work</span>
                         <span class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border-red-200">🔴 high</span>
                     </div>
                 </div>
             </div>
          </Tabs.Content>
          
          <Tabs.Content value="features" class="p-6 m-0 space-y-4">
             <div class="flex gap-4 p-4 rounded-lg border">
                <div class="flex-shrink-0 p-2 rounded-lg bg-primary/10 h-fit">
                   <CheckSquare class="h-6 w-6 text-primary" />
                </div>
                <div>
                   <h4 class="font-semibold mb-1">{$t('help.features.subtasks.title')}</h4>
                   <p class="text-sm text-muted-foreground">{$t('help.features.subtasks.desc')}</p>
                </div>
             </div>
             
             <div class="flex gap-4 p-4 rounded-lg border">
                <div class="flex-shrink-0 p-2 rounded-lg bg-primary/10 h-fit">
                   <Repeat class="h-6 w-6 text-primary" />
                </div>
                <div>
                   <h4 class="font-semibold mb-1">{$t('help.features.recurring.title')}</h4>
                   <p class="text-sm text-muted-foreground">{$t('help.features.recurring.desc')}</p>
                </div>
             </div>
             
             <div class="flex gap-4 p-4 rounded-lg border">
                <div class="flex-shrink-0 p-2 rounded-lg bg-primary/10 h-fit">
                   <Clock class="h-6 w-6 text-primary" />
                </div>
                <div>
                   <h4 class="font-semibold mb-1">{$t('help.features.tracking.title')}</h4>
                   <p class="text-sm text-muted-foreground">{$t('help.features.tracking.desc')}</p>
                </div>
             </div>
             
             <div class="flex gap-4 p-4 rounded-lg border">
                <div class="flex-shrink-0 p-2 rounded-lg bg-primary/10 h-fit">
                   <Search class="h-6 w-6 text-primary" />
                </div>
                <div>
                   <h4 class="font-semibold mb-1">{$t('help.features.filters.title')}</h4>
                   <p class="text-sm text-muted-foreground">{$t('help.features.filters.desc')}</p>
                </div>
             </div>
             
              <div class="flex gap-4 p-4 rounded-lg border">
                <div class="flex-shrink-0 p-2 rounded-lg bg-primary/10 h-fit">
                   <Palette class="h-6 w-6 text-primary" />
                </div>
                <div>
                   <h4 class="font-semibold mb-1">{$t('help.features.themes.title')}</h4>
                   <p class="text-sm text-muted-foreground">{$t('help.features.themes.desc')}</p>
                </div>
             </div>
          </Tabs.Content>
       </ScrollArea>
    </Tabs.Root>
  </Dialog.Content>
</Dialog.Root>
