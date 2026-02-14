import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { ISettings, DEFAULT_SETTINGS } from 'shared';

export default async function settingsRoutes(fastify: FastifyInstance) {
  
  // GET /api/settings
  fastify.get('/api/settings', async () => {
    // Assuming single user for now (id=1)
    let settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as ISettings;
    
    if (!settings) {
        // Create default settings if not exists
        const info = db.prepare(`
            INSERT INTO settings (user_id, site_name, language, color_scheme, layout, shortcut_scheme, theme_color, default_due_date)
            VALUES (1, @siteName, @language, @colorScheme, @layout, @shortcutScheme, @themeColor, @defaultDueDate)
        `).run({
            siteName: DEFAULT_SETTINGS.siteName,
            language: DEFAULT_SETTINGS.language,
            colorScheme: DEFAULT_SETTINGS.colorScheme,
            layout: DEFAULT_SETTINGS.layout,
            shortcutScheme: DEFAULT_SETTINGS.shortcutScheme,
            themeColor: DEFAULT_SETTINGS.themeColor,
            defaultDueDate: DEFAULT_SETTINGS.defaultDueDate
        });
        
        settings = db.prepare('SELECT * FROM settings WHERE id = ?').get(info.lastInsertRowid) as ISettings;
    }
    
    // Convert DB columns to JS properties if needed (better-sqlite3 returns snake_case if not configured otherwise)
    // The shared interface expects camelCase. I need to map it manually or use "AS" in SQL.
    // Let's check if I should have used "AS" in the query above.
    // Actually, I should probably do a proper SELECT with aliases.
    
    // Re-fetching with aliases
    settings = db.prepare(`
        SELECT 
            id, user_id as userId, site_name as siteName, 
            language, color_scheme as colorScheme, layout,
            shortcut_scheme as shortcutScheme, theme_color as themeColor,
            default_due_date as defaultDueDate,
            created_at as createdAt, updated_at as updatedAt
        FROM settings WHERE id = 1
    `).get() as ISettings;

    return settings;
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
      defaultDueDate: z.enum(['none', 'today']).optional()
    });

    const body = UpdateSettingsSchema.parse(request.body);
    
    // Construct dynamic update query
    const fields: string[] = [];
    const values: any = { id: 1 };

    if (body.siteName !== undefined) { fields.push('site_name = @siteName'); values.siteName = body.siteName; }
    if (body.language !== undefined) { fields.push('language = @language'); values.language = body.language; }
    if (body.colorScheme !== undefined) { fields.push('color_scheme = @colorScheme'); values.colorScheme = body.colorScheme; }
    if (body.layout !== undefined) { fields.push('layout = @layout'); values.layout = body.layout; }
    if (body.shortcutScheme !== undefined) { fields.push('shortcut_scheme = @shortcutScheme'); values.shortcutScheme = body.shortcutScheme; }
    if (body.themeColor !== undefined) { fields.push('theme_color = @themeColor'); values.themeColor = body.themeColor; }
    if (body.defaultDueDate !== undefined) { fields.push('default_due_date = @defaultDueDate'); values.defaultDueDate = body.defaultDueDate; }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (fields.length === 1) { // Only updated_at
         return reply.status(400).send({ error: 'No fields to update' });
    }

    db.prepare(`UPDATE settings SET ${fields.join(', ')} WHERE id = @id`).run(values);

    const updatedSettings = db.prepare(`
        SELECT 
            id, user_id as userId, site_name as siteName, 
            language, color_scheme as colorScheme, layout,
            shortcut_scheme as shortcutScheme, theme_color as themeColor,
            default_due_date as defaultDueDate,
            created_at as createdAt, updated_at as updatedAt
        FROM settings WHERE id = 1
    `).get() as ISettings;

    return updatedSettings;
  });
}
