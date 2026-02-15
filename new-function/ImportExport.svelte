<script lang="ts">
  import { Download, Upload, X, FileJson, AlertCircle, CheckCircle } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as api from '$lib/api/client';
  import { tasksStore } from '$lib/stores/tasks.svelte';

  interface Props {
    isOpen?: boolean;
    onClose?: () => void;
  }

  let { isOpen = false, onClose }: Props = $props();

  let importing = $state(false);
  let exporting = $state(false);
  let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleExport() {
    exporting = true;
    message = null;
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todo-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message = { type: 'success', text: 'Data exported successfully!' };
    } catch (e) {
      message = { type: 'error', text: 'Export failed. Please try again.' };
    }
    exporting = false;
  }

  async function handleImport(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    importing = true;
    message = null;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await api.importData(data);
      await tasksStore.fetchTasks();
      message = { type: 'success', text: `Imported successfully!` };
    } catch (e) {
      message = { type: 'error', text: 'Import failed. Please check the file format.' };
    }
    importing = false;
    input.value = '';
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onclick={onClose}>
    <div class="bg-card border rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6" onclick|stopPropagation>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold">Import / Export</h2>
        <Button variant="ghost" size="icon" class="h-7 w-7" onclick={onClose}>
          <X class="h-4 w-4" />
        </Button>
      </div>

      <div class="space-y-4">
        <!-- Export -->
        <div class="p-4 border rounded-lg space-y-3">
          <div class="flex items-center gap-2">
            <Download class="h-5 w-5 text-blue-500" />
            <h3 class="font-medium">Export Data</h3>
          </div>
          <p class="text-xs text-muted-foreground">Download all tasks, projects, and settings as JSON.</p>
          <Button size="sm" class="w-full gap-1.5" onclick={handleExport} disabled={exporting}>
            <FileJson class="h-3.5 w-3.5" />
            {exporting ? 'Exporting...' : 'Download JSON'}
          </Button>
        </div>

        <!-- Import -->
        <div class="p-4 border rounded-lg space-y-3">
          <div class="flex items-center gap-2">
            <Upload class="h-5 w-5 text-green-500" />
            <h3 class="font-medium">Import Data</h3>
          </div>
          <p class="text-xs text-muted-foreground">Restore from a previously exported JSON file.</p>
          <label class="block">
            <input type="file" accept=".json" onchange={handleImport} class="hidden" />
            <Button size="sm" variant="outline" class="w-full gap-1.5 cursor-pointer" disabled={importing}
              onclick={(e) => { (e.currentTarget as HTMLElement).parentElement?.querySelector('input')?.click(); }}>
              <FileJson class="h-3.5 w-3.5" />
              {importing ? 'Importing...' : 'Select JSON File'}
            </Button>
          </label>
        </div>

        <!-- Status message -->
        {#if message}
          <div class="flex items-center gap-2 p-3 rounded-lg text-sm
            {message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}">
            {#if message.type === 'success'}
              <CheckCircle class="h-4 w-4 shrink-0" />
            {:else}
              <AlertCircle class="h-4 w-4 shrink-0" />
            {/if}
            {message.text}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}