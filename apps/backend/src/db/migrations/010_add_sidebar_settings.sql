-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 010: Add Sidebar Customization to Settings
-- ═══════════════════════════════════════════════════════════════════════════

-- sidebar_tags_style: 'list' | 'chips' | 'chips-collapsible' | 'popover' | 'chips-limited'
ALTER TABLE settings ADD COLUMN sidebar_tags_style TEXT DEFAULT 'chips-collapsible';

-- sidebar_projects_collapsed / sidebar_tags_collapsed: persisted collapse state
ALTER TABLE settings ADD COLUMN sidebar_projects_collapsible BOOLEAN DEFAULT 1;
ALTER TABLE settings ADD COLUMN sidebar_tags_collapsible BOOLEAN DEFAULT 1;
