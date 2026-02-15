<script lang="ts">
  import { Eye, Pencil, Bold, Italic, List, ListOrdered, Link, Code, Heading1, Heading2 } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';

  interface Props {
    value?: string;
    onchange?: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
  }

  let { value = '', onchange, placeholder = 'Write notes in Markdown...', minHeight = '200px' }: Props = $props();

  let mode = $state<'edit' | 'preview'>('edit');
  let textareaEl = $state<HTMLTextAreaElement | null>(null);

  // Simple markdown to HTML renderer (no external deps)
  function renderMarkdown(md: string): string {
    let html = md
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-1">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-sm font-mono">$1</code>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener">$1</a>')
      // Unordered lists
      .replace(/^[\-\*] (.+)$/gm, '<li class="ml-4">$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      // Blockquote
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 pl-3 text-muted-foreground italic">$1</blockquote>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="my-3 border-muted" />')
      // Checkboxes
      .replace(/^\- \[x\] (.+)$/gm, '<div class="flex gap-2 items-center"><input type="checkbox" checked disabled class="rounded" /><span class="line-through text-muted-foreground">$1</span></div>')
      .replace(/^\- \[ \] (.+)$/gm, '<div class="flex gap-2 items-center"><input type="checkbox" disabled class="rounded" /><span>$1</span></div>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br />');

    return `<div class="prose prose-sm dark:prose-invert max-w-none"><p class="mb-2">${html}</p></div>`;
  }

  function insertAtCursor(before: string, after: string = '') {
    if (!textareaEl) return;
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
    value = newValue;
    onchange?.(newValue);

    // Restore cursor
    requestAnimationFrame(() => {
      if (textareaEl) {
        textareaEl.focus();
        const pos = start + before.length + selected.length;
        textareaEl.setSelectionRange(
          selected ? pos + after.length : start + before.length,
          selected ? pos + after.length : start + before.length
        );
      }
    });
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    value = target.value;
    onchange?.(target.value);
  }

  const toolbar = [
    { icon: Bold, action: () => insertAtCursor('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertAtCursor('*', '*'), title: 'Italic' },
    { icon: Code, action: () => insertAtCursor('`', '`'), title: 'Code' },
    { icon: Heading1, action: () => insertAtCursor('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertAtCursor('## '), title: 'Heading 2' },
    { icon: List, action: () => insertAtCursor('- '), title: 'List' },
    { icon: ListOrdered, action: () => insertAtCursor('1. '), title: 'Numbered list' },
    { icon: Link, action: () => insertAtCursor('[', '](url)'), title: 'Link' },
  ];
</script>

<div class="border rounded-lg overflow-hidden">
  <!-- Toolbar -->
  <div class="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30">
    {#each toolbar as item}
      <Button variant="ghost" size="icon" class="h-7 w-7" title={item.title}
        onclick={item.action} disabled={mode === 'preview'}>
        <item.icon class="h-3.5 w-3.5" />
      </Button>
    {/each}
    <div class="flex-1" />
    <div class="flex rounded-md border overflow-hidden">
      <button
        class="px-2 py-1 text-xs {mode === 'edit' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}"
        onclick={() => mode = 'edit'}
      >
        <Pencil class="h-3 w-3 inline mr-1" />Edit
      </button>
      <button
        class="px-2 py-1 text-xs {mode === 'preview' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}"
        onclick={() => mode = 'preview'}
      >
        <Eye class="h-3 w-3 inline mr-1" />Preview
      </button>
    </div>
  </div>

  <!-- Content -->
  {#if mode === 'edit'}
    <textarea
      bind:this={textareaEl}
      {value}
      oninput={handleInput}
      {placeholder}
      class="w-full bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none"
      style="min-height: {minHeight};"
    ></textarea>
  {:else}
    <div class="px-3 py-2 overflow-y-auto" style="min-height: {minHeight};">
      {#if value.trim()}
        {@html renderMarkdown(value)}
      {:else}
        <p class="text-sm text-muted-foreground italic">Nothing to preview</p>
      {/if}
    </div>
  {/if}
</div>