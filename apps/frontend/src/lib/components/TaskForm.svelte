<script lang="ts">
  import { tasksStore } from '$lib/stores/tasks.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  
  let title = $state('');
  let description = $state('');
  let priority = $state('medium');
  
  $effect(() => {
      if (uiStore.isTaskDialogOpen) {
          if (uiStore.editingTask) {
              title = uiStore.editingTask.title;
              description = uiStore.editingTask.description || '';
              priority = uiStore.editingTask.priority;
          } else {
              title = '';
              description = '';
              priority = 'medium';
          }
      }
  });

  async function handleSubmit() {
      if (uiStore.editingTask) {
          await tasksStore.updateTask(uiStore.editingTask.id, {
              title,
              description,
              priority: priority as any
          });
      } else {
          await tasksStore.addTask({
              title,
              description,
              priority: priority as any,
              parentId: uiStore.parentForNewTask || undefined
          });
      }
      uiStore.close();
  }
</script>

<Dialog.Root open={uiStore.isTaskDialogOpen} onOpenChange={(open) => !open && uiStore.close()}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{uiStore.editingTask ? 'Edit Task' : 'New Task'}</Dialog.Title>
    </Dialog.Header>
    
    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="title">Title</Label>
        <Input id="title" bind:value={title} placeholder="Task title" />
      </div>
      
      <div class="grid gap-2">
        <Label for="priority">Priority</Label>
        <select id="priority" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" bind:value={priority}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
        </select>
      </div>

      <div class="grid gap-2">
        <Label for="description">Description</Label>
        <Textarea id="description" bind:value={description} placeholder="Optional description" />
      </div>
    </div>
    
    <Dialog.Footer>
      <Button variant="outline" onclick={() => uiStore.close()}>Cancel</Button>
      <Button onclick={handleSubmit}>Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
