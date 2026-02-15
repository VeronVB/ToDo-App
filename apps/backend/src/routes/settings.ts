import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { ISettings, DEFAULT_SETTINGS } from 'shared';

export default async function settingsRoutes(fastify: FastifyInstance) {
  
  const SELECT_SETTINGS = `
    SELECT 
      id, user_id as userId, site_name as siteName, 
      language, color_scheme as colorScheme, layout,
      shortcut_scheme as shortcutScheme, theme_color as themeColor,
      default_due_date as defaultDueDate,
      sidebar_tags_style as sidebarTagsStyle,
      sidebar_projects_collapsible as sidebarProjectsCollapsible,
      sidebar_tags_collapsible as sidebarTagsCollapsible,
      sidebar_habit_widget as sidebarHabitWidget,
      created_at as createdAt, updated_at as updatedAt
    FROM settings WHERE id = 1
  `;

  function fixBooleans(settings: any): ISettings {
    settings.sidebarProjectsCollapsible = Boolean(settings.sidebarProjectsCollapsible);
    settings.sidebarTagsCollapsible = Boolean(settings.sidebarTagsCollapsible);
    return settings;
  }

  // GET /api/settings
  fastify.get('/api/settings', async () => {
    let settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as ISettings;
    
    if (!settings) {
      const info = db.prepare(`
        INSERT INTO settings (user_id, site_name, language, color_scheme, layout, shortcut_scheme, theme_color, default_due_date, sidebar_tags_style, sidebar_projects_collapsible, sidebar_tags_collapsible, sidebar_habit_widget)
        VALUES (1, @siteName, @language, @colorScheme, @layout, @shortcutScheme, @themeColor, @defaultDueDate, @sidebarTagsStyle, @sidebarProjectsCollapsible, @sidebarTagsCollapsible, @sidebarHabitWidget)
      `).run({
        siteName: DEFAULT_SETTINGS.siteName,
        language: DEFAULT_SETTINGS.language,
        colorScheme: DEFAULT_SETTINGS.colorScheme,
        layout: DEFAULT_SETTINGS.layout,
        shortcutScheme: DEFAULT_SETTINGS.shortcutScheme,
        themeColor: DEFAULT_SETTINGS.themeColor,
        defaultDueDate: DEFAULT_SETTINGS.defaultDueDate,
        sidebarTagsStyle: DEFAULT_SETTINGS.sidebarTagsStyle,
        sidebarProjectsCollapsible: DEFAULT_SETTINGS.sidebarProjectsCollapsible ? 1 : 0,
        sidebarTagsCollapsible: DEFAULT_SETTINGS.sidebarTagsCollapsible ? 1 : 0,
        sidebarHabitWidget: DEFAULT_SETTINGS.sidebarHabitWidget
      });
    }

    return fixBooleans(db.prepare(SELECT_SETTINGS).get());
  });

  // PUT /api/settings
  fastify.put('/api/settings', async (request, reply) => {
    const UpdateSettingsSchema = z.object({
      siteName: z.string().optional(),
      language: z.enum(['en', 'pl']).optional(),
      colorScheme: z.enum(['nord', 'dracula', 'catppuccin', 'github-dark']).optional(),
      layout: z.enum(['compact', 'comfortable', 'spacious']).optional(),
      shortcutScheme: z.enum(['default', 'windows', 'mac', 'linux']).optional(),
      themeColor: z.enum(['neutral', 'red', 'orange', 'green', 'blue', 'yellow', 'violet']).optional(),
      defaultDueDate: z.enum(['none', 'today']).optional(),
      sidebarTagsStyle: z.enum(['list', 'chips', 'chips-collapsible', 'popover', 'chips-limited']).optional(),
      sidebarProjectsCollapsible: z.boolean().optional(),
      sidebarTagsCollapsible: z.boolean().optional(),
      sidebarHabitWidget: z.enum(['full', 'mini', 'micro', 'off']).optional(),
      confirmDelete: z.boolean().optional()
    });

    const body = UpdateSettingsSchema.parse(request.body);
    
    const fields: string[] = [];
    const values: any = { id: 1 };

    if (body.siteName !== undefined) { fields.push('site_name = @siteName'); values.siteName = body.siteName; }
    if (body.language !== undefined) { fields.push('language = @language'); values.language = body.language; }
    if (body.colorScheme !== undefined) { fields.push('color_scheme = @colorScheme'); values.colorScheme = body.colorScheme; }
    if (body.layout !== undefined) { fields.push('layout = @layout'); values.layout = body.layout; }
    if (body.shortcutScheme !== undefined) { fields.push('shortcut_scheme = @shortcutScheme'); values.shortcutScheme = body.shortcutScheme; }
    if (body.themeColor !== undefined) { fields.push('theme_color = @themeColor'); values.themeColor = body.themeColor; }
    if (body.defaultDueDate !== undefined) { fields.push('default_due_date = @defaultDueDate'); values.defaultDueDate = body.defaultDueDate; }
    if (body.sidebarTagsStyle !== undefined) { fields.push('sidebar_tags_style = @sidebarTagsStyle'); values.sidebarTagsStyle = body.sidebarTagsStyle; }
    if (body.sidebarProjectsCollapsible !== undefined) { fields.push('sidebar_projects_collapsible = @sidebarProjectsCollapsible'); values.sidebarProjectsCollapsible = body.sidebarProjectsCollapsible ? 1 : 0; }
    if (body.sidebarTagsCollapsible !== undefined) { fields.push('sidebar_tags_collapsible = @sidebarTagsCollapsible'); values.sidebarTagsCollapsible = body.sidebarTagsCollapsible ? 1 : 0; }
    if (body.sidebarHabitWidget !== undefined) { fields.push('sidebar_habit_widget = @sidebarHabitWidget'); values.sidebarHabitWidget = body.sidebarHabitWidget; }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (fields.length === 1) {
      return reply.status(400).send({ error: 'No fields to update' });
    }

    db.prepare(`UPDATE settings SET ${fields.join(', ')} WHERE id = @id`).run(values);

    return fixBooleans(db.prepare(SELECT_SETTINGS).get());
  });
}