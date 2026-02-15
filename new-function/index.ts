// ═══════════════════════════════════════════════════════════════════════════
// SHARED TYPES - Todo App v3
// ═══════════════════════════════════════════════════════════════════════════

export interface ITask {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  categoryId?: number;
  parentId?: number;
  position: number;
  depth: number;
  dueDate?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  pendingParentCompletion?: boolean;
  isHabit?: boolean;
  notesMarkdown?: string;
  createdAt: string;
  updatedAt: string;

  // Computed (not in DB)
  children?: ITask[];
  progress?: number;
  project?: string;
  tags?: ITag[];
  dependencies?: ITaskDependency[];
  isBlocked?: boolean;
  selected?: boolean; // for batch actions UI
}

export interface ITaskDependency {
  id: number;
  taskId: number;
  dependsOnId: number;
  dependsOnTitle?: string;
  dependsOnCompleted?: boolean;
  createdAt: string;
}

export interface ITaskTemplate {
  id: number;
  name: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  categoryId?: number;
  recurrence?: string;
  tags?: string[];
  subtasks?: { title: string; priority: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ISavedFilter {
  id: number;
  name: string;
  icon: string;
  color: string;
  filterConfig: IFilterConfig;
  position: number;
  createdAt: string;
}

export interface IFilterConfig {
  priorities?: string[];
  categories?: number[];
  tags?: string[];
  dueDateRange?: 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'overdue' | 'no_date' | 'has_date';
  completed?: boolean;
  isHabit?: boolean;
  hasNotes?: boolean;
  searchText?: string;
}

export interface IActivityLog {
  id: number;
  taskId?: number;
  taskTitle?: string;
  action: 'created' | 'completed' | 'uncompleted' | 'edited' | 'deleted' | 'moved' | 'dependency_added' | 'dependency_removed';
  details?: Record<string, any>;
  createdAt: string;
}

export interface ITaskReminder {
  id: number;
  taskId: number;
  remindAt: string;
  reminded: boolean;
  createdAt: string;
}

export interface ICategory {
  id: number;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
  // Computed
  taskCount?: number;
  completedCount?: number;
  progress?: number;
}

export interface ITag {
  id: number;
  name: string;
  color?: string;
  createdAt: string;
}

export interface IPriority {
  id: number;
  name: string;
  level: number;
  color: string;
  createdAt: string;
}

export type SidebarTagsStyle = 'list' | 'chips' | 'chips-collapsible' | 'popover' | 'chips-limited';
export type SidebarHabitWidget = 'full' | 'mini' | 'micro' | 'off';

export interface ISettings {
  id: number;
  userId: number;
  siteName: string;
  language: 'en' | 'pl';
  colorScheme: 'nord' | 'dracula' | 'catppuccin' | 'github-dark';
  layout: 'compact' | 'comfortable' | 'spacious';
  confirmDelete: boolean;
  shortcutScheme: 'default' | 'windows' | 'mac' | 'linux';
  themeColor: 'neutral' | 'red' | 'orange' | 'green' | 'blue' | 'yellow' | 'violet';
  defaultDueDate: 'none' | 'today';
  sidebarTagsStyle: SidebarTagsStyle;
  sidebarProjectsCollapsible: boolean;
  sidebarTagsCollapsible: boolean;
  sidebarHabitWidget: SidebarHabitWidget;
  autoArchiveDays: number;
  savedFiltersOrder: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITimeEntry {
  id: number;
  taskId: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  createdAt: string;
  isRunning?: boolean;
}

export interface IApiToken {
  id: number;
  name: string;
  createdAt: string;
}

// Eisenhower Matrix quadrant
export type EisenhowerQuadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate';

// Kanban column type
export type KanbanGroupBy = 'status' | 'priority' | 'project';

// Morning briefing data
export interface IMorningBriefing {
  overdueTasks: ITask[];
  todayTasks: ITask[];
  upcomingTasks: ITask[];
  stats: {
    completedYesterday: number;
    completedThisWeek: number;
    totalActive: number;
    streakDays: number;
  };
  habits: {
    pendingToday: number;
    totalHabits: number;
  };
}

// Productivity stats
export interface IProductivityStats {
  completedByDay: { date: string; count: number }[];
  avgCompletionTime: number;
  totalCompleted: number;
  totalCreated: number;
  busiestDay: string;
  currentStreak: number;
  longestStreak: number;
}

export type ThemeType = ISettings['colorScheme'];
export type LayoutType = ISettings['layout'];
export type LanguageType = ISettings['language'];
export type ThemeColorType = ISettings['themeColor'];
export type PriorityLevel = ITask['priority'];

export const DEFAULT_SETTINGS: Omit<ISettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  siteName: 'Todo App',
  language: 'en',
  colorScheme: 'nord',
  layout: 'comfortable',
  confirmDelete: true,
  shortcutScheme: 'default',
  themeColor: 'neutral',
  defaultDueDate: 'none',
  sidebarTagsStyle: 'chips-collapsible',
  sidebarProjectsCollapsible: true,
  sidebarTagsCollapsible: true,
  sidebarHabitWidget: 'full',
  autoArchiveDays: 0,
  savedFiltersOrder: '[]'
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: '#a3be8c',
  medium: '#ebcb8b',
  high: '#bf616a'
};

export const EISENHOWER_LABELS: Record<EisenhowerQuadrant, { en: string; pl: string }> = {
  do_first: { en: 'Do First', pl: 'Zrób najpierw' },
  schedule: { en: 'Schedule', pl: 'Zaplanuj' },
  delegate: { en: 'Delegate', pl: 'Deleguj' },
  eliminate: { en: 'Eliminate', pl: 'Wyeliminuj' }
};