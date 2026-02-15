<script lang="ts">
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { habitsStore } from '$lib/stores/habits.svelte';
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { t } from 'svelte-i18n';
  import { Flame } from '@lucide/svelte';
  
  let title = $state('');
  let description = $state('');
  let priority = $state('medium');
  let isHabit = $state(false);
  
  $effect(() => {
      if (uiStore.isTaskDialogOpen) {
          if (uiStore.editingTask) {
              title = uiStore.editingTask.title;
              description = uiStore.editingTask.description || '';
              priority = uiStore.editingTask.priority;
              isHabit = (uiStore.editingTask as any).isHabit || false;
          } else {
              title = '';
              description = '';
              priority = 'medium';
              isHabit = false;
          }
      }
  });

  async function handleSubmit() {
      if (uiStore.editingTask) {
          await tasksStore.updateTask(uiStore.editingTask.id, {
              title,
              description,
              priority: priority as any,
              isHabit
          });
          if (isHabit) {
            await habitsStore.createHabit(uiStore.editingTask.id);
          }
      } else {
          const newTask = await tasksStore.addTask({
              title,
              description,
              priority: priority as any,
              isHabit,
              parentId: uiStore.parentForNewTask || undefined
          });
          if (isHabit) {
            await habitsStore.fetchHabits();
          }
      }
      uiStore.close();
  }
</script>

<Dialog.Root open={uiStore.isTaskDialogOpen} onOpenChange={(open) => !open && uiStore.close()}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{uiStore.editingTask ? $t('task_form.edit_task') : $t('task_form.new_task')}</Dialog.Title>
    </Dialog.Header>
    
    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="title">{$t('task_form.title')}</Label>
        <Input id="title" bind:value={title} placeholder={$t('task_form.title_placeholder')} />
      </div>
      
      <div class="grid gap-2">
        <Label for="priority">{$t('task_form.priority')}</Label>
        <select id="priority" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" bind:value={priority}>
            <option value="low">{$t('task_form.priorities.low')}</option>
            <option value="medium">{$t('task_form.priorities.medium')}</option>
            <option value="high">{$t('task_form.priorities.high')}</option>
        </select>
      </div>

      <div class="grid gap-2">
        <Label for="description">{$t('task_form.description')}</Label>
        <Textarea id="description" bind:value={description} placeholder={$t('task_form.description_placeholder')} />
      </div>
      
      <div class="flex items-center gap-2">
        <Checkbox id="isHabit" bind:checked={isHabit} />
        <Label for="isHabit" class="flex items-center gap-2 cursor-pointer">
          <Flame class="h-4 w-4 text-orange-500" />
          {$t('task_form.is_habit') || 'This is a habit'}
        </Label>
      </div>
    </div>
    
    <Dialog.Footer>
      <Button variant="outline" onclick={() => uiStore.close()}>{$t('task_form.cancel')}</Button>
      <Button onclick={handleSubmit}>{$t('task_form.save')}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
