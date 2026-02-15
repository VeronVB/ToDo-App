<script lang="ts">
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import * as Tabs from "$lib/components/ui/tabs";
  import { t } from 'svelte-i18n';

  $effect(() => {
    settingsStore.fetchSettings();
  });

  let siteName = $state(settingsStore.settings.siteName);
  
  $effect(() => {
      siteName = settingsStore.settings.siteName;
  });

  async function saveGeneral() {
      await settingsStore.updateSettings({ siteName });
  }

  function setTheme(theme: any) {
      settingsStore.updateSettings({ colorScheme: theme });
      document.documentElement.setAttribute('class', theme === 'github-dark' ? 'dark' : ''); 
      document.documentElement.setAttribute('data-theme', theme); 
  }

  function setLayout(l: string) {
      // Cast to any to satisfy type checker if string is not exact enum in this context
      settingsStore.updateSettings({ layout: l as any });
  }

  const themeKeys: Record<string, string> = {
    'nord': 'settings_appearance.themes.light',
    'dracula': 'settings_appearance.themes.dark',
    'catppuccin': 'settings_appearance.themes.system',
    'github-dark': 'settings_appearance.themes.system'
  };

  const layoutKeys: Record<string, string> = {
    'compact': 'settings_appearance.layouts.compact',
    'comfortable': 'settings_appearance.layouts.comfortable',
    'spacious': 'settings_appearance.layouts.spacious'
  };
</script>

<Tabs.Root value="general" class="w-full">
  <Tabs.List class="grid w-full grid-cols-2">
    <Tabs.Trigger value="general">{$t('settings_tabs.general')}</Tabs.Trigger>
    <Tabs.Trigger value="appearance">{$t('settings_tabs.appearance')}</Tabs.Trigger>
  </Tabs.List>
  
  <Tabs.Content value="general">
    <div class="space-y-4 py-4">
      <div class="grid gap-2">
        <Label for="site-name">{$t('settings_general.site_name')}</Label>
        <Input id="site-name" bind:value={siteName} />
      </div>
      <Button onclick={saveGeneral}>{$t('settings_general.save_changes')}</Button>
    </div>
  </Tabs.Content>
  
  <Tabs.Content value="appearance">
    <div class="space-y-4 py-4">
      <div class="grid gap-2">
         <Label>{$t('settings_appearance.color_scheme')}</Label>
         <div class="flex gap-2 flex-wrap">
             {#each ['nord', 'dracula', 'catppuccin', 'github-dark'] as theme}
                 <Button 
                    variant={settingsStore.settings.colorScheme === theme ? 'default' : 'outline'}
                    onclick={() => setTheme(theme)}
                 >
                    {$t(themeKeys[theme] || theme)}
                 </Button>
             {/each}
         </div>
      </div>
      
       <div class="grid gap-2">
         <Label>{$t('settings_appearance.layout_density')}</Label>
         <div class="flex gap-2">
             {#each ['compact', 'comfortable', 'spacious'] as layout}
                 <Button 
                    variant={settingsStore.settings.layout === layout ? 'default' : 'outline'}
                    onclick={() => setLayout(layout)}
                 >
                    {$t(layoutKeys[layout] || layout)}
                 </Button>
             {/each}
         </div>
      </div>
    </div>
  </Tabs.Content>
</Tabs.Root>
