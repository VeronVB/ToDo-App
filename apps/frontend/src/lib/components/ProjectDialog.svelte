<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { projectsStore } from '$lib/stores/projects.svelte';
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      project: { id: string | number, name: string } | null;
  }

  let { open, onOpenChange, project }: Props = $props();

  let name = $state('');

  $effect(() => {
      if (open && project) {
          name = project.name;
      } else if (open) {
          name = '';
      }
  });

  function handleSave() {
      if (!name) return;

      if (project) {
          projectsStore.updateProject(Number(project.id), name);
      } else {
          projectsStore.addProject(name);
      }
      onOpenChange(false);
  }

  function handleDelete() {
      if (!project) return;

      if (settingsStore.settings.confirmDelete) {
          if (!confirm($t('app.confirm_delete_project'))) {
              return;
          }
      }

      const tasksToDelete = tasksStore.tasks.filter(t => t.categoryId?.toString() === project!.id || t.project === project!.id);
      tasksToDelete.forEach(t => tasksStore.deleteTask(t.id));

      projectsStore.deleteProject(Number(project.id));
      onOpenChange(false);
  }
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-[425px] z-[51]">
    <Dialog.Header>
      <Dialog.Title>{project ? $t('app.edit_project') : $t('app.new_project')}</Dialog.Title>
    </Dialog.Header>
    
    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="name">{$t('app.project_name')}</Label>
        <Input id="name" bind:value={name} placeholder={$t('app.project_placeholder')} autofocus />
      </div>
    </div>
    
    <Dialog.Footer class="gap-2 sm:justify-between">
        {#if project}
            <Button type="button" variant="destructive" onclick={handleDelete}>
                {$t('app.delete')}
            </Button>
        {:else}
            <div></div> <!-- Spacer -->
        {/if}
        
        <div class="flex gap-2">
             <Button type="button" variant="ghost" onclick={() => onOpenChange(false)}>{$t('app.cancel')}</Button>
             <Button type="submit" onclick={handleSave}>{$t('app.save')}</Button>
        </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
