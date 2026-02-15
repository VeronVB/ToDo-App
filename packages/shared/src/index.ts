// ═══════════════════════════════════════════════════════════════════════════
// SHARED TYPES - Todo App v2
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
  createdAt: string;
  updatedAt: string;
  
  // Computed (nie w DB)
  children?: ITask[];
  progress?: number;
  project?: string;
  tags?: ITag[];
}

export interface ICategory {
  id: number;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
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
  sidebarHabitWidget: 'full'
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: '#a3be8c',
  medium: '#ebcb8b',
  high: '#bf616a'
};