<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { Switch } from '$lib/components/ui/switch';
  import * as RadioGroup from '$lib/components/ui/radio-group';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import type { ThemeType, LayoutType, LanguageType, IApiToken } from 'shared';
  import { t } from 'svelte-i18n';
  import * as api from '$lib/api/client';
  import { Copy, Plus, Trash2, Key, Check } from '@lucide/svelte';
  import { Input } from '$lib/components/ui/input';
  import * as Alert from '$lib/components/ui/alert';

  interface Props {
      open: boolean;
      onOpenChange: (open: boolean) => void;
  }
  let { open, onOpenChange }: Props = $props();

  let tokens = $state<IApiToken[]>([]);
  let newToken = $state<string | null>(null);
  let tokenName = $state('');
  let currentTab = $state('general');

  async function fetchTokens() {
      try {
          tokens = await api.getTokens();
      } catch (e) {
          console.error(e);
      }
  }

  async function handleGenerateToken() {
      if (!tokenName) return;
      try {
          const res = await api.createToken(tokenName);
          newToken = res.token;
          tokenName = '';
          fetchTokens();
      } catch (e) {
          console.error(e);
      }
  }

  async function handleDeleteToken(id: number) {
      if (confirm($t('settings.api.confirm_revoke'))) {
          await api.deleteToken(id);
          fetchTokens();
      }
  }

  function handleTabChange(v: string) {
      currentTab = v;
      if (v === 'api') {
          fetchTokens();
          newToken = null;
      }
  }

  function copyToken() {
      if (newToken) {
          navigator.clipboard.writeText(newToken);
      }
  }

  function handleSave() {
     onOpenChange(false);
  }
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-[600px] z-[51]">
    <Dialog.Header>
      <Dialog.Title>{$t('settings.title')}</Dialog.Title>
      <Dialog.Description>{$t('settings.description')}</Dialog.Description>
    </Dialog.Header>
    
    <Tabs.Root value={currentTab} onValueChange={handleTabChange} class="w-full">
      <Tabs.List class="grid w-full grid-cols-3">
        <Tabs.Trigger value="general">{$t('settings.tabs.general')}</Tabs.Trigger>
        <Tabs.Trigger value="appearance">{$t('settings.tabs.appearance')}</Tabs.Trigger>
        <Tabs.Trigger value="api">{$t('settings.tabs.api')}</Tabs.Trigger>
      </Tabs.List>
      
      <Tabs.Content value="general" class="space-y-4 py-4">
         <div class="grid gap-2">
           <Label>{$t('settings.language')}</Label>
           <Select.Root type="single" value={settingsStore.settings.language} onValueChange={(v) => settingsStore.updateSettings({ language: v as LanguageType })}>
              <Select.Trigger class="w-full">
                 {settingsStore.settings.language === 'pl' ? 'Polski' : 'English'}
              </Select.Trigger>
              <Select.Content>
                 <Select.Item value="en">English</Select.Item>
                 <Select.Item value="pl">Polski</Select.Item>
              </Select.Content>
           </Select.Root>
        </div>

         <div class="grid gap-2">
            <Label>{$t('settings.shortcuts_scheme')}</Label>
            <Select.Root type="single" value={settingsStore.settings.shortcutScheme} onValueChange={(v) => settingsStore.updateSettings({ shortcutScheme: v as any })}>
               <Select.Trigger class="w-full capitalize">
                  {settingsStore.settings.shortcutScheme}
               </Select.Trigger>
               <Select.Content>
                  <Select.Item value="default">Default</Select.Item>
                  <Select.Item value="windows">Windows</Select.Item>
                  <Select.Item value="mac">Mac</Select.Item>
                  <Select.Item value="linux">Linux</Select.Item>
               </Select.Content>
            </Select.Root>
         </div>

         <div class="grid gap-2">
            <Label>{$t('settings.default_due_date')}</Label>
            <Select.Root type="single" value={settingsStore.settings.defaultDueDate || 'none'} onValueChange={(v) => settingsStore.updateSettings({ defaultDueDate: v as any })}>
               <Select.Trigger class="w-full">
                  {$t(`settings.due_dates.${settingsStore.settings.defaultDueDate || 'none'}`)}
               </Select.Trigger>
               <Select.Content>
                  <Select.Item value="none">{$t('settings.due_dates.none')}</Select.Item>
                  <Select.Item value="today">{$t('settings.due_dates.today')}</Select.Item>
               </Select.Content>
            </Select.Root>
         </div>
         
          <div class="flex items-center justify-between space-x-2">
            <Label for="confirm-delete">{$t('settings.confirm_deletions')}</Label>
            <Switch 
                id="confirm-delete" 
                checked={settingsStore.settings.confirmDelete} 
                onCheckedChange={(v) => settingsStore.updateSettings({ confirmDelete: v })}
            />
         </div>
      </Tabs.Content>
      
      <Tabs.Content value="appearance" class="space-y-6 py-4">
         <div class="space-y-2">
             <Label>{$t('settings.theme')}</Label>
             <RadioGroup.Root value={settingsStore.settings.colorScheme} onValueChange={(v) => settingsStore.updateSettings({ colorScheme: v as ThemeType })} class="grid grid-cols-3 gap-4">
                 <div>
                    <RadioGroup.Item value="nord" id="nord" class="peer sr-only" />
                    <Label
                      for="nord"
                      class="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span class="mb-2 block w-full text-center font-semibold">{$t('settings.themes.light')}</span>
                    </Label>
                 </div>
                 <div>
                    <RadioGroup.Item value="dracula" id="dracula" class="peer sr-only" />
                    <Label
                      for="dracula"
                      class="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span class="mb-2 block w-full text-center font-semibold">{$t('settings.themes.dark')}</span>
                    </Label>
                 </div>
                 <div>
                    <RadioGroup.Item value="github-dark" id="system" class="peer sr-only" />
                    <Label
                      for="system"
                      class="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span class="mb-2 block w-full text-center font-semibold">{$t('settings.themes.system')}</span>
                    </Label>
                 </div>
             </RadioGroup.Root>
         </div>

         <div class="space-y-3">
             <Label>{$t('settings.accent_color') || 'Accent Color'}</Label>
             <Select.Root type="single" value={settingsStore.settings.themeColor} onValueChange={(v) => settingsStore.updateSettings({ themeColor: v as any })}>
               <Select.Trigger class="w-full capitalize">
                  <div class="flex items-center gap-2">
                     <span class={`theme-${settingsStore.settings.themeColor} flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/10`}>
                         <span class="h-3 w-3 rounded-full bg-primary"></span>
                     </span>
                     <span>{settingsStore.settings.themeColor}</span>
                  </div>
               </Select.Trigger>
               <Select.Content class="max-h-[200px]">
                  {#each ['neutral', 'red', 'orange', 'green', 'blue', 'yellow', 'violet'] as color}
                     <Select.Item value={color} class="flex items-center gap-2 capitalize">
                         <span class={`theme-${color} flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/10`}>
                             <span class="h-3 w-3 rounded-full bg-primary"></span>
                         </span>
                         <span>{color}</span>
                     </Select.Item>
                  {/each}
               </Select.Content>
            </Select.Root>
         </div>

          <div class="space-y-2">
             <Label>{$t('settings.layout_density')}</Label>
             <Select.Root type="single" value={settingsStore.settings.layout} onValueChange={(v) => settingsStore.updateSettings({ layout: v as LayoutType })}>
               <Select.Trigger class="w-full">
                  {$t(`settings.densities.${settingsStore.settings.layout}`)}
               </Select.Trigger>
               <Select.Content>
                 <Select.Item value="compact">{$t('settings.densities.compact')}</Select.Item>
                 <Select.Item value="comfortable">{$t('settings.densities.comfortable')}</Select.Item>
                 <Select.Item value="spacious">{$t('settings.densities.spacious')}</Select.Item>
              </Select.Content>
           </Select.Root>
          </div>
       </Tabs.Content>

       <Tabs.Content value="api" class="space-y-6 py-4">
          <div class="space-y-4">
              <div class="space-y-2">
                  <h3 class="text-lg font-medium">{$t('settings.api.generate')}</h3>
                  <p class="text-sm text-muted-foreground">{$t('settings.api.description')}</p>
                  
                  <div class="flex items-end gap-2">
                      <div class="grid gap-1 flex-1">
                          <Label for="token-name">{$t('settings.api.token_name')}</Label>
                          <Input id="token-name" bind:value={tokenName} placeholder="e.g. Mobile App" />
                      </div>
                      <Button onclick={handleGenerateToken} disabled={!tokenName}>
                          <Plus class="mr-2 h-4 w-4" />
                          {$t('settings.api.generate')}
                      </Button>
                  </div>
              </div>

              {#if newToken}
                  <Alert.Root variant="default" class="bg-primary/10 border-primary/20">
                      <Key class="h-4 w-4" />
                      <Alert.Title>{$t('settings.api.generated_title')}</Alert.Title>
                      <Alert.Description class="mt-2">
                          <p class="text-sm mb-2">{$t('settings.api.generated_desc')}</p>
                          <div class="flex items-center gap-2">
                              <code class="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm flex-1 break-all">
                                  {newToken}
                              </code>
                              <Button variant="ghost" size="icon" onclick={copyToken}>
                                  <Copy class="h-4 w-4" />
                              </Button>
                          </div>
                      </Alert.Description>
                  </Alert.Root>
              {/if}

              <div class="space-y-2">
                  <h3 class="text-lg font-medium">{$t('settings.api.active_tokens')}</h3>
                  {#if tokens.length === 0}
                      <p class="text-sm text-muted-foreground">{$t('settings.api.no_tokens')}</p>
                  {:else}
                      <div class="rounded-md border">
                          {#each tokens as token}
                              <div class="flex items-center justify-between p-3 border-b last:border-0">
                                  <div>
                                      <p class="font-medium">{token.name}</p>
                                      <p class="text-xs text-muted-foreground">{$t('settings.api.created_at')} {new Date(token.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive hover:bg-destructive/10" onclick={() => handleDeleteToken(token.id)}>
                                      <Trash2 class="h-4 w-4" />
                                  </Button>
                              </div>
                          {/each}
                      </div>
                  {/if}
              </div>
          </div>
       </Tabs.Content>
     </Tabs.Root>

     <Dialog.Footer>
      <Button onclick={handleSave}>{$t('settings.done')}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
