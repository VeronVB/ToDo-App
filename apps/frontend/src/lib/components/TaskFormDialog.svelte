<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import * as RadioGroup from '$lib/components/ui/radio-group';
  import { Calendar } from '$lib/components/ui/calendar';
  import * as Popover from '$lib/components/ui/popover';
  import { cn } from '$lib/utils';
  import { Calendar as CalendarIcon } from '@lucide/svelte';
  import { DateFormatter, type DateValue, getLocalTimeZone, parseDate } from '@internationalized/date';
  import { t, locale } from 'svelte-i18n';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { projectsStore } from '$lib/stores/projects.svelte';
  import { appStore } from '$lib/stores/app.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import * as chrono from 'chrono-node';
  import RichTaskInput from './RichTaskInput.svelte';
  import { untrack } from 'svelte';

  interface Props {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onSubmit: (task: any) => void;
  }

  let { open, onOpenChange, onSubmit }: Props = $props();

  let title = $state('');
  let description = $state('');
  let priority = $state('medium');
  let category = $state('');
  let dueDate = $state<DateValue | undefined>(undefined);
  let recurrence = $state('none');
  let isHabit = $state(false);
  let hintIndex = $state(0);
  let tempNewProjectName = $state(''); 

  const df = new DateFormatter('en-US', {
      dateStyle: 'long'
  });

  $effect(() => {
      if (open) {
          untrack(() => {
            hintIndex = Math.floor(Math.random() * 10);
            if (uiStore.editingTask) {
                title = uiStore.editingTask.title;
                if (uiStore.editingTask.tags && uiStore.editingTask.tags.length > 0) {
                    title += ' ' + uiStore.editingTask.tags.map(t => '#' + t.name).join(' ');
                }
                description = uiStore.editingTask.description || '';
                priority = uiStore.editingTask.priority;
                category = uiStore.editingTask.categoryId ? uiStore.editingTask.categoryId.toString() : ''; 
                if (uiStore.editingTask.project) category = uiStore.editingTask.project;
                recurrence = uiStore.editingTask.recurrence || 'none';
                
                if (uiStore.editingTask.dueDate) {
                    try {
                        dueDate = parseDate(uiStore.editingTask.dueDate.split('T')[0]);
                    } catch (e) {
                        dueDate = undefined;
                    }
                } else {
                    dueDate = undefined;
                }
            } else {
                resetForm();
                
                // Context-aware prepopulation
                if (appStore.currentView === 'project' && appStore.selectedProject) {
                    const p = projectsStore.projects.find(p => p.id.toString() === appStore.selectedProject?.toString());
                    if (p) title = `@${p.name} `;
                } else if (appStore.currentView === 'tag' && appStore.selectedTag) {
                    title = `#${appStore.selectedTag} `;
                } else if (appStore.currentView === 'today') {
                    title = ($locale?.startsWith('pl') ? 'dzisiaj ' : 'today ');
                }
            }
          });
      }
  });

  // Live Update Effect
  $effect(() => {
      if (title && open) {
          // untrack(() => { ... }) isn't strictly needed here if we only write to other fields
          // but let's be safe if any dependency cycle exists
          const nlp = parseNaturalLanguage(title, false);
          
          if (nlp.priority) priority = nlp.priority;
          
          if (nlp.project) {
              category = nlp.project;
              tempNewProjectName = '';
          } else if (nlp.newProjectName) {
              category = ''; 
              tempNewProjectName = nlp.newProjectName;
          }

          if (nlp.date) {
              try {
                 const iso = nlp.date.toISOString().split('T')[0];
                 dueDate = parseDate(iso);
              } catch(e) {}
          }
      }
  });


  function parseNaturalLanguage(input: string, createProject = false) {
      let text = input;
      let parsedDate: Date | null = null;
      let parsedPriority = '';
      let parsedProject = ''; 
      let newProjectName = '';
      let parsedTags: string[] = [];

      // 0. Parse Tags (#Tag)
      const tagMatches = text.matchAll(/#([\w\p{L}]+)/gu);
      let hasHabitTag = false;
      for (const match of tagMatches) {
          const tagName = match[1].toLowerCase();
          if (tagName === 'habit' || tagName === 'nawyk') {
              hasHabitTag = true;
          } else {
              parsedTags.push(match[1]);
          }
      }
      
      // Return habit flag via parsedTags special marker
      if (hasHabitTag) {
          parsedTags.push('__IS_HABIT__');
      }

      // 1. Parse Project (@Project)
      const projectMatch = text.match(/@([\w\p{L}]+)/u);
      if (projectMatch) {
          const projName = projectMatch[1];
          const found = projectsStore.projects.find(p => p.name.toLowerCase() === projName.toLowerCase());
          if (found) {
              parsedProject = found.id.toString();
          } else if (createProject) {
              // Creating handled in handleSubmit
              newProjectName = projName;
          } else {
              newProjectName = projName;
          }
      }

      // 2. Parse Priority
      const priorityRegex = /!(high|medium|low|wysoki|sredni|średni|niski)/i;
      const priorityMatch = text.match(priorityRegex);
      if (priorityMatch) {
          const p = priorityMatch[1].toLowerCase();
          if (['high', 'wysoki'].includes(p)) parsedPriority = 'high';
          else if (['medium', 'sredni', 'średni'].includes(p)) parsedPriority = 'medium';
          else if (['low', 'niski'].includes(p)) parsedPriority = 'low';
      }

      // 3. Parse Date
      let dateText = text;
      const plMap: Record<string, string> = {
          'jutro': 'tomorrow',
          'dzisiaj': 'today',
          'dziś': 'today',
          'pojutrze': 'day after tomorrow',
          'poniedziałek': 'monday',
          'wtorek': 'tuesday',
          'środa': 'wednesday',
          'sroda': 'wednesday',
          'czwartek': 'thursday',
          'piątek': 'friday',
          'sobota': 'saturday',
          'niedziela': 'sunday'
      };
      
      Object.keys(plMap).forEach(key => {
          const regex = new RegExp(`\\b${key}\\b`, 'gi');
          dateText = dateText.replace(regex, plMap[key]);
      });

      const parsedDates = chrono.parse(dateText);
      if (parsedDates.length > 0) {
          parsedDate = parsedDates[0].start.date();
      }
      
      return {
          title: text, 
          date: parsedDate,
          priority: parsedPriority,
          project: parsedProject,
          newProjectName,
          tags: parsedTags
      };
  }

  // Live Update Effect
  $effect(() => {
      if (title && open) {
          const nlp = parseNaturalLanguage(title, false);
          
          if (nlp.priority) priority = nlp.priority;
          
          if (nlp.project) {
              category = nlp.project;
              tempNewProjectName = '';
          } else if (nlp.newProjectName) {
              category = ''; 
              tempNewProjectName = nlp.newProjectName;
          }

          if (nlp.date) {
              try {
                 const iso = nlp.date.toISOString().split('T')[0];
                 dueDate = parseDate(iso);
              } catch(e) {}
          }
      }
  });

  // Smart Date Logic: If Category is selected for a NEW task, auto-set Date to Today (if setting enabled)
  $effect(() => {
      if (!uiStore.editingTask && category && !dueDate && settingsStore.settings.defaultDueDate === 'today') {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          try {
             dueDate = parseDate(`${year}-${month}-${day}`);
          } catch (e) {
             // ignore
          }
      }
  });

  async function handleSubmit(e: Event) {
      e.preventDefault();
      if (!title) return; 
      
      const nlp = parseNaturalLanguage(title, false); 
      let finalTitle = nlp.title;
      let finalDueDate = dueDate;
      let finalPriority = priority;
      let finalCategory = category;
      let finalIsHabit = isHabit;
      let finalTags = nlp.tags.filter(t => t !== '__IS_HABIT__');
      
      // Check for habit tag
      if (nlp.tags.includes('__IS_HABIT__')) {
          finalIsHabit = true;
      }

      // Create project if needed
      if (nlp.newProjectName && !finalCategory) {
          try {
              const newId = await projectsStore.addProject(nlp.newProjectName);
              finalCategory = newId.toString();
          } catch (err) {
              console.error(err);
          }
      } else if (nlp.project) {
          finalCategory = nlp.project;
      }

      // Cleanup Title
      finalTitle = finalTitle.replace(/@([\w\p{L}]+)/u, '').trim();
      finalTitle = finalTitle.replace(/#([\w\p{L}]+)/gu, '').trim();
      finalTitle = finalTitle.replace(/!(high|medium|low|wysoki|sredni|średni|niski)/i, '').trim();
      const wordsToRemove = ['tomorrow', 'today', 'jutro', 'dzisiaj', 'dziś', 'poniedziałek', 'monday', 'next week', 'za tydzień'];
      const regex = new RegExp(`\\b(${wordsToRemove.join('|')})\\b`, 'gi');
      finalTitle = finalTitle.replace(regex, '').trim();
      finalTitle = finalTitle.replace(/\s+/g, ' ').trim();

      const taskData = {
          title: finalTitle || title, 
          description,
          priority: finalPriority,
          categoryId: finalCategory ? parseInt(finalCategory) : undefined, 
          dueDate: finalDueDate ? finalDueDate.toString() : undefined,
          recurrence,
          parentId: uiStore.parentForNewTask ?? undefined,
          tags: finalTags,
          isHabit: finalIsHabit
      };

      console.log('[DEBUG] TaskFormDialog: Submitting task data:', taskData);
      console.log('[DEBUG] TaskFormDialog: finalCategory (string):', finalCategory);

      onSubmit(taskData);
      onOpenChange(false);
  }

  function resetForm() {
      title = '';
      description = '';
      priority = 'medium';
      category = '';
      dueDate = undefined;
      recurrence = 'none';
      tempNewProjectName = '';
  }
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-[500px] z-[51]">
    <Dialog.Header>
      <Dialog.Title>{uiStore.editingTask ? $t('task_form.edit_title') : $t('task_form.title')}</Dialog.Title>
      <Dialog.Description>
        {$t('task_form.description')}
      </Dialog.Description>
    </Dialog.Header>
    
    <form onsubmit={handleSubmit} class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="title">{$t('task_form.title_label')}</Label>
        
        <RichTaskInput 
            bind:value={title} 
            placeholder={$t('task_form.title_placeholder')} 
            class="min-h-[80px]"
        />
        
        <p class="text-xs text-muted-foreground text-center mt-1">
            {$t(`task_form.nlp_hints.${hintIndex}`)}
        </p>
      </div>
      
      <div class="grid gap-2">
        <Label for="description">{$t('task_form.desc_label')}</Label>
        <Textarea id="description" bind:value={description} placeholder={$t('task_form.desc_placeholder')} class="min-h-[60px]" />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
         <div class="grid gap-2">
            <Label>{$t('task_form.category_label')}</Label>
             <Select.Root type="single" bind:value={category}>
                <Select.Trigger class="w-full">
                  {#if tempNewProjectName}
                    <span class="text-primary font-medium">+ {tempNewProjectName}</span>
                  {:else}
                    {projectsStore.projects.find(p => p.id.toString() === category)?.name || $t('task_form.select_category')}
                  {/if}
                </Select.Trigger>
                <Select.Content>
                  {#each projectsStore.projects as project}
                    <Select.Item value={project.id.toString()}>{project.name}</Select.Item>
                  {/each}
                </Select.Content>
             </Select.Root>
         </div>

         <div class="grid gap-2">
            <Label>{$t('task_form.due_date_label')}</Label>
            <Popover.Root>
              <Popover.Trigger>
                 {#snippet child({ props })}
                    <Button
                      variant="outline"
                      class={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                      {...props}
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {dueDate ? df.format(dueDate.toDate(getLocalTimeZone())) : $t('task_form.pick_date')}
                    </Button>
                 {/snippet}
              </Popover.Trigger>
              <Popover.Content class="w-auto p-0" align="start">
                <Calendar bind:value={dueDate} type="single" />
              </Popover.Content>
            </Popover.Root>
         </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label>{$t('task_form.priority_label')}</Label>
            <Select.Root type="single" bind:value={priority}>
                <Select.Trigger class="w-full capitalize">
                  {priority ? $t(`task_form.priorities.${priority}`) : $t('task_form.priorities.medium')}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="low">{$t('task_form.priorities.low')}</Select.Item>
                  <Select.Item value="medium">{$t('task_form.priorities.medium')}</Select.Item>
                  <Select.Item value="high">{$t('task_form.priorities.high')}</Select.Item>
                </Select.Content>
            </Select.Root>
          </div>

          <div class="grid gap-2">
            <Label>{$t('task_form.recurrence_label')}</Label>
            <Select.Root type="single" bind:value={recurrence}>
                <Select.Trigger class="w-full capitalize">
                  {$t(`task_form.recurrence.${recurrence}`)}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="none">{$t('task_form.recurrence.none')}</Select.Item>
                  <Select.Item value="daily">{$t('task_form.recurrence.daily')}</Select.Item>
                  <Select.Item value="weekly">{$t('task_form.recurrence.weekly')}</Select.Item>
                  <Select.Item value="monthly">{$t('task_form.recurrence.monthly')}</Select.Item>
                </Select.Content>
            </Select.Root>
          </div>
      </div>
      
      <Dialog.Footer>
         <Button type="button" variant="ghost" onclick={() => onOpenChange(false)}>{$t('task_form.cancel')}</Button>
         <Button type="submit">{$t('task_form.save')}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
