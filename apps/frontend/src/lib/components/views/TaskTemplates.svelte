<script lang="ts">
  import { onMount } from 'svelte';
  import { FileText, Plus, Play, Trash2 } from '@lucide/svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as api from '$lib/api/client';
  import { t } from 'svelte-i18n';
  import type { ITaskTemplate } from 'shared';

  let templates = $state<ITaskTemplate[]>([]);
  let loading = $state(true);
  let showForm = $state(false);
  let newTemplate = $state({ name: '', title: '', description: '', priority: 'medium' as const });

  onMount(async () => {
    await loadTemplates();
  });

  async function loadTemplates() {
    try {
      loading = true;
      templates = await api.getTemplates();
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      loading = false;
    }
  }

  async function createTemplate() {
    if (!newTemplate.name || !newTemplate.title) return;
    try {
      await api.createTemplate(newTemplate);
      await loadTemplates();
      showForm = false;
      newTemplate = { name: '', title: '', description: '', priority: 'medium' };
    } catch (e) {
      console.error('Failed to create template:', e);
    }
  }

  async function useTemplate(id: number) {
    try {
      const result = await api.useTemplate(id);
      console.log('Task created:', result.taskId);
      alert('Task created from template!');
    } catch (e) {
      console.error('Failed to use template:', e);
    }
  }

  async function deleteTemplate(id: number) {
    if (!confirm('Delete this template?')) return;
    try {
      await api.deleteTemplate(id);
      await loadTemplates();
    } catch (e) {
      console.error('Failed to delete template:', e);
    }
  }
</script>

<div class="h-full max-w-4xl mx-auto p-6">
  <div class="flex items-center gap-3 mb-6">
    <FileText class="h-8 w-8" />
    <h1 class="text-2xl font-bold">{$t('templates.title')}</h1>
    <Button class="ml-auto" onclick={() => showForm = !showForm}>
      <Plus class="mr-2 h-4 w-4" />
      {$t('templates.create')}
    </Button>
  </div>

  {#if showForm}
    <Card class="mb-6">
      <CardHeader>
        <CardTitle>{$t('templates.create')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div>
            <Label>Template Name</Label>
            <Input bind:value={newTemplate.name} placeholder="e.g., Daily Standup" />
          </div>
          <div>
            <Label>Task Title</Label>
            <Input bind:value={newTemplate.title} placeholder="e.g., Prepare standup notes" />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Input bind:value={newTemplate.description} placeholder="Description..." />
          </div>
          <div class="flex gap-2">
            <Button onclick={createTemplate}>{$t('app.save')}</Button>
            <Button variant="outline" onclick={() => showForm = false}>{$t('app.cancel')}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  {:else if templates.length === 0}
    <Card>
      <CardContent class="py-8 text-center">
        <p class="text-muted-foreground mb-4">{$t('templates.no_templates')}</p>
        <p class="text-sm text-muted-foreground">{$t('templates.create_first')}</p>
      </CardContent>
    </Card>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each templates as template}
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">{template.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="font-medium">{template.title}</p>
            {#if template.description}
              <p class="text-sm text-muted-foreground mt-1">{template.description}</p>
            {/if}
            <div class="flex gap-2 mt-4">
              <Button size="sm" onclick={() => useTemplate(template.id)}>
                <Play class="mr-1 h-3 w-3" />
                {$t('templates.use')}
              </Button>
              <Button size="sm" variant="destructive" onclick={() => deleteTemplate(template.id)}>
                <Trash2 class="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>
