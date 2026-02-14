<script lang="ts">
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import * as Tabs from "$lib/components/ui/tabs";

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
</script>

<Tabs.Root value="general" class="w-full">
  <Tabs.List class="grid w-full grid-cols-2">
    <Tabs.Trigger value="general">General</Tabs.Trigger>
    <Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
  </Tabs.List>
  
  <Tabs.Content value="general">
    <div class="space-y-4 py-4">
      <div class="grid gap-2">
        <Label for="site-name">Site Name</Label>
        <Input id="site-name" bind:value={siteName} />
      </div>
      <Button onclick={saveGeneral}>Save Changes</Button>
    </div>
  </Tabs.Content>
  
  <Tabs.Content value="appearance">
    <div class="space-y-4 py-4">
      <div class="grid gap-2">
         <Label>Color Scheme</Label>
         <div class="flex gap-2 flex-wrap">
             {#each ['nord', 'dracula', 'catppuccin', 'github-dark'] as theme}
                 <Button 
                    variant={settingsStore.settings.colorScheme === theme ? 'default' : 'outline'}
                    onclick={() => setTheme(theme)}
                 >
                    {theme}
                 </Button>
             {/each}
         </div>
      </div>
      
       <div class="grid gap-2">
         <Label>Layout Density</Label>
         <div class="flex gap-2">
             {#each ['compact', 'comfortable', 'spacious'] as layout}
                 <Button 
                    variant={settingsStore.settings.layout === layout ? 'default' : 'outline'}
                    onclick={() => setLayout(layout)}
                 >
                    {layout}
                 </Button>
             {/each}
         </div>
      </div>
    </div>
  </Tabs.Content>
</Tabs.Root>
