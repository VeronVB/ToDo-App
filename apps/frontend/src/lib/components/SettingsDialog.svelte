<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { Switch } from '$lib/components/ui/switch';
  import * as RadioGroup from '$lib/components/ui/radio-group';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import type { ThemeType, LayoutType, LanguageType, IApiToken, SidebarTagsStyle, SidebarHabitWidget } from 'shared';
  import { t } from 'svelte-i18n';
  import * as api from '$lib/api/client';
  
  import { 
    Copy, Plus, Trash2, Key, Check, List, Grid3x3, ChevronDown, 
    MoreHorizontal, Tag, Flame, Minimize2, Minus, EyeOff,
    Settings, Palette, Terminal 
  } from '@lucide/svelte';
  
  import { Input } from '$lib/components/ui/input';
  import * as Alert from '$lib/components/ui/alert';
  import { Separator } from '$lib/components/ui/separator';

  interface Props {
      open: boolean;
      onOpenChange: (open: boolean) => void;
  }
  let { open, onOpenChange }: Props = $props();

  let tokens = $state<IApiToken[]>([]);
  let newToken = $state<string | null>(null);
  let tokenName = $state('');
  
  let currentTab = $state<'general' | 'appearance' | 'api'>('general');

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

  function handleTabChange(v: 'general' | 'appearance' | 'api') {
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

  const tagsStyleOptions: { value: SidebarTagsStyle; icon: any; label: string; desc: string }[] = [
    { value: 'list', icon: List, label: 'settings.sidebar.tags_list', desc: 'settings.sidebar.tags_list_desc' },
    { value: 'chips', icon: Grid3x3, label: 'settings.sidebar.tags_chips', desc: 'settings.sidebar.tags_chips_desc' },
    { value: 'chips-collapsible', icon: ChevronDown, label: 'settings.sidebar.tags_chips_collapsible', desc: 'settings.sidebar.tags_chips_collapsible_desc' },
    { value: 'popover', icon: MoreHorizontal, label: 'settings.sidebar.tags_popover', desc: 'settings.sidebar.tags_popover_desc' },
    { value: 'chips-limited', icon: Tag, label: 'settings.sidebar.tags_limited', desc: 'settings.sidebar.tags_limited_desc' },
  ];

  const habitWidgetOptions: { value: SidebarHabitWidget; icon: any; label: string; desc: string }[] = [
    { value: 'full', icon: Flame, label: 'settings.sidebar.habit_full', desc: 'settings.sidebar.habit_full_desc' },
    { value: 'mini', icon: Minimize2, label: 'settings.sidebar.habit_mini', desc: 'settings.sidebar.habit_mini_desc' },
    { value: 'micro', icon: Minus, label: 'settings.sidebar.habit_micro', desc: 'settings.sidebar.habit_micro_desc' },
    { value: 'off', icon: EyeOff, label: 'settings.sidebar.habit_off', desc: 'settings.sidebar.habit_off_desc' },
  ];
</script>

{#snippet navigation()}
  <nav class="flex flex-col gap-1 pr-4 w-48 shrink-0 border-r">
    <Button 
      variant={currentTab === 'general' ? 'secondary' : 'ghost'} 
      class="justify-start" 
      onclick={() => handleTabChange('general')}
    >
      <Settings class="mr-2 h-4 w-4 shrink-0" />
      {$t('settings.tabs.general')}
    </Button>
    <Button 
      variant={currentTab === 'appearance' ? 'secondary' : 'ghost'} 
      class="justify-start" 
      onclick={() => handleTabChange('appearance')}
    >
      <Palette class="mr-2 h-4 w-4 shrink-0" />
      {$t('settings.tabs.appearance')}
    </Button>
    <Button 
      variant={currentTab === 'api' ? 'secondary' : 'ghost'} 
      class="justify-start" 
      onclick={() => handleTabChange('api')}
    >
      <Terminal class="mr-2 h-4 w-4 shrink-0" />
      {$t('settings.tabs.api')}
    </Button>
  </nav>
{/snippet}

{#snippet generalTab()}
  <div class="space-y-6 max-w-xl pb-4">
    <div class="grid gap-2">
      <Label>{$t('settings.language')}</Label>
      <Select.Root type="single" value={settingsStore.settings.language} onValueChange={(v) => settingsStore.updateSettings({ language: v as LanguageType })}>
        <Select.Trigger class="w-full">
            {settingsStore.settings.language === 'pl' ? 'Polski' : 'English'}
        </Select.Trigger>
        <Select.Content>
            <Select.Item value="en">{$t('settings.languages.en')}</Select.Item>
            <Select.Item value="pl">{$t('settings.languages.pl')}</Select.Item>
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
            <Select.Item value="default">{$t('settings_appearance.schemes.default')}</Select.Item>
            <Select.Item value="windows">{$t('settings_appearance.schemes.windows')}</Select.Item>
            <Select.Item value="mac">{$t('settings_appearance.schemes.mac')}</Select.Item>
            <Select.Item value="linux">{$t('settings_appearance.schemes.linux')}</Select.Item>
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
  </div>
{/snippet}

{#snippet appearanceTab()}
  <div class="space-y-8 pb-6 max-w-2xl">
    
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium">Motyw i kolory</h3>
        <p class="text-sm text-muted-foreground">Spersonalizuj główny wygląd aplikacji.</p>
      </div>
      
      <div class="space-y-4">
        <RadioGroup.Root value={settingsStore.settings.colorScheme} onValueChange={(v) => settingsStore.updateSettings({ colorScheme: v as ThemeType })} class="grid grid-cols-3 gap-4">
            <div>
              <RadioGroup.Item value="nord" id="nord" class="peer sr-only" />
              <Label for="nord" class="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  <span class="mb-2 block w-full text-center font-semibold">{$t('settings.themes.light')}</span>
              </Label>
            </div>
            <div>
              <RadioGroup.Item value="dracula" id="dracula" class="peer sr-only" />
              <Label for="dracula" class="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  <span class="mb-2 block w-full text-center font-semibold">{$t('settings.themes.dark')}</span>
              </Label>
            </div>
            <div>
              <RadioGroup.Item value="github-dark" id="system" class="peer sr-only" />
              <Label for="system" class="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  <span class="mb-2 block w-full text-center font-semibold">{$t('settings.themes.system')}</span>
              </Label>
            </div>
        </RadioGroup.Root>

        <div class="space-y-2">
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
                          <span>{$t(`settings_appearance.colors.${color}`)}</span>
                      </Select.Item>
                  {/each}
              </Select.Content>
          </Select.Root>
        </div>
      </div>
    </div>

    <Separator />

    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium">Układ interfejsu</h3>
        <p class="text-sm text-muted-foreground">Zarządzaj gęstością i organizacją list.</p>
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
    </div>

    <Separator />

    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium">Pasek boczny</h3>
        <p class="text-sm text-muted-foreground">Skonfiguruj tagi, nawyki i wyświetlane sekcje.</p>
      </div>

      <div class="space-y-3">
        <Label>{$t('settings.sidebar.tags_display')}</Label>
        
        <div class="grid grid-cols-2 gap-2">
          {#each tagsStyleOptions as option}
            {@const Icon = option.icon}
            <button
              class="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all {
                settingsStore.settings.sidebarTagsStyle === option.value 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
              }"
              onclick={() => settingsStore.updateSettings({ sidebarTagsStyle: option.value })}
            >
              <div class="flex items-center gap-2 w-full">
                <Icon class="h-4 w-4 shrink-0 {settingsStore.settings.sidebarTagsStyle === option.value ? 'text-primary' : 'text-muted-foreground'}" />
                <span class="text-sm font-medium flex-1 truncate">{$t(option.label)}</span>
                {#if settingsStore.settings.sidebarTagsStyle === option.value}
                  <Check class="h-4 w-4 text-primary shrink-0" />
                {/if}
              </div>
              <span class="text-[11px] text-muted-foreground leading-tight mt-1">{$t(option.desc)}</span>
            </button>
          {/each}
        </div>
      </div>
      
      <div class="space-y-3 pt-2">
        <Label>{$t('settings.sidebar.habit_widget')}</Label>
        <div class="grid grid-cols-2 gap-2">
          {#each habitWidgetOptions as option}
            {@const Icon = option.icon}
            <button
              class="flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all {
                settingsStore.settings.sidebarHabitWidget === option.value 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
              }"
              onclick={() => settingsStore.updateSettings({ sidebarHabitWidget: option.value })}
            >
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md {
                settingsStore.settings.sidebarHabitWidget === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }">
                <Icon class="h-3.5 w-3.5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium">{$t(option.label)}</div>
                <div class="text-[11px] text-muted-foreground">{$t(option.desc)}</div>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <div class="space-y-3 pt-2">
        <Label>{$t('settings.sidebar.sections')}</Label>
        
        <div class="flex items-center justify-between space-x-2">
          <div>
            <Label for="collapse-projects" class="text-sm">{$t('settings.sidebar.collapsible_projects')}</Label>
            <p class="text-xs text-muted-foreground">{$t('settings.sidebar.collapsible_projects_desc')}</p>
          </div>
          <Switch 
            id="collapse-projects" 
            checked={settingsStore.settings.sidebarProjectsCollapsible} 
            onCheckedChange={(v) => settingsStore.updateSettings({ sidebarProjectsCollapsible: v })}
          />
        </div>
        
        <div class="flex items-center justify-between space-x-2">
          <div>
            <Label for="collapse-tags" class="text-sm">{$t('settings.sidebar.collapsible_tags')}</Label>
            <p class="text-xs text-muted-foreground">{$t('settings.sidebar.collapsible_tags_desc')}</p>
          </div>
          <Switch 
            id="collapse-tags" 
            checked={settingsStore.settings.sidebarTagsCollapsible} 
            onCheckedChange={(v) => settingsStore.updateSettings({ sidebarTagsCollapsible: v })}
          />
        </div>
      </div>
    </div>
  </div>
{/snippet}

{#snippet apiTab()}
  <div class="space-y-6 max-w-2xl pb-4">
    <div class="space-y-4">
      <div class="space-y-2">
          <h3 class="text-lg font-medium">{$t('settings.api.generate')}</h3>
          <p class="text-sm text-muted-foreground">{$t('settings.api.description')}</p>
          
          <div class="flex items-end gap-2">
              <div class="grid gap-1 flex-1">
                  <Label for="token-name">{$t('settings.api.token_name')}</Label>
                  <Input id="token-name" bind:value={tokenName} placeholder={$t('settings.api.token_placeholder')} />
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
  </div>
{/snippet}

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-[850px] h-[80vh] min-h-[500px] flex flex-col p-0 gap-0 z-[51] overflow-hidden">
    
    <Dialog.Header class="p-6 pb-4 shrink-0">
      <Dialog.Title>{$t('settings.title')}</Dialog.Title>
      <Dialog.Description>{$t('settings.description')}</Dialog.Description>
    </Dialog.Header>
    <Separator />
    
    <div class="flex flex-1 overflow-hidden pl-6 py-4">
      
      {@render navigation()}

      <div class="flex-1 pl-6 overflow-y-auto pr-6">
        {#if currentTab === 'general'}
           {@render generalTab()}
        {:else if currentTab === 'appearance'}
           {@render appearanceTab()}
        {:else if currentTab === 'api'}
           {@render apiTab()}
        {/if}
      </div>
      
    </div>

    <Separator />
    <Dialog.Footer class="p-4 shrink-0 bg-muted/20">
      <Button onclick={handleSave}>{$t('settings.done')}</Button>
    </Dialog.Footer>

  </Dialog.Content>
</Dialog.Root>