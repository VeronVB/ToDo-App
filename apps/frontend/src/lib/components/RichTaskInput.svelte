<script lang="ts">
  import { cn } from "$lib/utils";
  import { onMount } from "svelte";
  
  interface Props {
    value: string;
    placeholder?: string;
    oninput?: (value: string) => void;
    class?: string;
  }

  let { value = $bindable(''), placeholder = '', oninput, class: className }: Props = $props();

  let textareaRef: HTMLTextAreaElement;
  let highlightRef: HTMLDivElement;

  // Synchronizacja scrollowania (ważne przy dłuższych tekstach)
  function syncScroll() {
    if (textareaRef && highlightRef) {
      highlightRef.scrollTop = textareaRef.scrollTop;
      highlightRef.scrollLeft = textareaRef.scrollLeft;
    }
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    value = target.value;
    if (oninput) oninput(value);
    autoResize();
  }

  function autoResize() {
    if (textareaRef) {
      textareaRef.style.height = 'auto';
      textareaRef.style.height = textareaRef.scrollHeight + 'px';
    }
  }

  // Regexy do tokenów
  const REGEX = {
    project: /(@[\w\p{L}]+)/gu, // @Słowo (obsługa polskich znaków)
    priority: /(!\w+)/g, // !priority
    tag: /(#[\w\p{L}]+)/gu // #tag
  };

  // Parsowanie tekstu na HTML z kolorami
  function renderHighlights(text: string) {
    if (!text) return text + '<br>'; // Hack dla pustego diva

    // Escape HTML żeby nie zepsuć renderowania
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Daty (uproszczone wykrywanie dla wizualizacji, pełne parsowanie w logice)
    // Słowa kluczowe EN i PL
    const dateWords = [
        'today', 'tomorrow', 'next week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        'dzisiaj', 'dziś', 'jutro', 'pojutrze', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'
    ];
    const dateRegex = new RegExp(`\\b(${dateWords.join('|')})\\b`, 'gi');

    // Kolejność zamiany jest ważna
    
    // 1. Projekty @
    escaped = escaped.replace(REGEX.project, '<span class="text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50 rounded-sm font-medium">$&</span>');
    
    // 2. Priorytety !
    escaped = escaped.replace(REGEX.priority, (match) => {
        const low = match.toLowerCase();
        let colorClass = 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';
        if (low.match(/!(high|wysoki)/)) colorClass = 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/50';
        if (low.match(/!(medium|sredni|średni)/)) colorClass = 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/50';
        if (low.match(/!(low|niski)/)) colorClass = 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/50';
        return `<span class="${colorClass} rounded-sm font-medium">${match}</span>`;
    });

    // 3. Tagi #
    escaped = escaped.replace(REGEX.tag, '<span class="text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/50 rounded-sm font-medium">$&</span>');

    // 4. Daty
    escaped = escaped.replace(dateRegex, '<span class="text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/50 rounded-sm font-medium">$&</span>');

    // Obsługa nowej linii
    return escaped.replace(/\n/g, '<br>');
  }

  $effect(() => {
      // Trigger resize on value change external
      if (textareaRef && value) autoResize();
  });
</script>

<div class={cn("relative w-full font-sans text-sm", className)}>
  <!-- Warstwa wizualna (bąbelki) -->
  <div 
    bind:this={highlightRef}
    class="pointer-events-none absolute inset-0 z-0 w-full h-full whitespace-pre-wrap break-words bg-transparent p-3 border border-transparent text-foreground overflow-hidden"
    aria-hidden="true"
  >
    {@html renderHighlights(value)}
  </div>

  <!-- Warstwa interaktywna (input) -->
  <!-- text-transparent/50 pozwala widzieć kursor, ale ukrywa tekst, który jest renderowany przez div pod spodem. 
       Używamy caret-foreground żeby kursor był widoczny. 
       Mix-blend-mode może być potrzebny w niektórych przypadkach, ale tutaj proste stackowanie zadziała jeśli fonty są identyczne.
       Trick: Ustawiamy kolor tekstu textarea na przezroczysty, ale caret (kursor) na widoczny kolor.
  -->
  <textarea
    bind:this={textareaRef}
    {value}
    {placeholder}
    oninput={handleInput}
    onscroll={syncScroll}
    rows="1"
    class="relative z-10 w-full h-full min-h-[80px] bg-transparent p-3 text-transparent caret-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md border border-input resize-none whitespace-pre-wrap break-words leading-normal"
    style="font-family: inherit; font-size: inherit; line-height: inherit; letter-spacing: inherit;"
  ></textarea>
</div>

<style>
    /* Upewnij się, że fonty w obu warstwach są identyczne */
    div, textarea {
        font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    }
</style>
