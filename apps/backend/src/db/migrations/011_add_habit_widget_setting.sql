-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 011: Add Sidebar Habit Widget Size Setting
-- ═══════════════════════════════════════════════════════════════════════════

-- sidebar_habit_widget: 'full' | 'mini' | 'micro' | 'off'
ALTER TABLE settings ADD COLUMN sidebar_habit_widget TEXT DEFAULT 'full';
