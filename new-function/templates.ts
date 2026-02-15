import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import type { ITaskTemplate } from 'shared';

export default async function templatesRoutes(fastify: FastifyInstance) {

  // GET /api/templates
  fastify.get('/api/templates', async () => {
    const rows = db.prepare(`
      SELECT id, name, title, description, priority, category_id as categoryId,
             recurrence, tags, subtasks, created_at as createdAt, updated_at as updatedAt
      FROM task_templates ORDER BY name ASC
    `).all() as any[];

    return rows.map(r => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : [],
      subtasks: r.subtasks ? JSON.parse(r.subtasks) : []
    }));
  });

  // POST /api/templates
  fastify.post('/api/templates', async (request) => {
    const schema = z.object({
      name: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      categoryId: z.number().optional().nullable(),
      recurrence: z.string().optional().default('none'),
      tags: z.array(z.string()).optional().default([]),
      subtasks: z.array(z.object({
        title: z.string(),
        priority: z.string().optional().default('medium')
      })).optional().default([])
    });

    const body = schema.parse(request.body);

    const info = db.prepare(`
      INSERT INTO task_templates (name, title, description, priority, category_id, recurrence, tags, subtasks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.name, body.title, body.description || null, body.priority,
      body.categoryId || null, body.recurrence,
      JSON.stringify(body.tags), JSON.stringify(body.subtasks)
    );

    return { id: info.lastInsertRowid, ...body };
  });

  // POST /api/templates/:id/use — create task from template
  fastify.post('/api/templates/:id/use', async (request, reply) => {
    const { id } = request.params as { id: string };
    const template = db.prepare(`
      SELECT * FROM task_templates WHERE id = ?
    `).get(id) as any;

    if (!template) return reply.status(404).send({ error: 'Template not found' });

    const tags = template.tags ? JSON.parse(template.tags) : [];
    const subtasks = template.subtasks ? JSON.parse(template.subtasks) : [];

    // Create the main task
    const result = db.prepare('SELECT MAX(position) as maxPos FROM tasks WHERE parent_id IS NULL').get() as { maxPos: number };
    const position = (result?.maxPos || 0) + 1;

    const taskInfo = db.prepare(`
      INSERT INTO tasks (title, description, priority, category_id, position, depth, recurrence)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(template.title, template.description, template.priority, template.category_id, position, template.recurrence || 'none');

    const taskId = taskInfo.lastInsertRowid as number;

    // Add tags
    for (const tagName of tags) {
      let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as { id: number } | undefined;
      if (!tag) {
        const tagInfo = db.prepare('INSERT INTO tags (name) VALUES (?)').run(tagName);
        tag = { id: tagInfo.lastInsertRowid as number };
      }
      db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(taskId, tag.id);
    }

    // Create subtasks
    for (let i = 0; i < subtasks.length; i++) {
      const st = subtasks[i];
      db.prepare(`
        INSERT INTO tasks (title, priority, parent_id, position, depth)
        VALUES (?, ?, ?, ?, 1)
      `).run(st.title, st.priority || 'medium', taskId, i);
    }

    // Log activity
    db.prepare(`INSERT INTO activity_log (task_id, action, details) VALUES (?, 'created', ?)`).run(
      taskId, JSON.stringify({ fromTemplate: template.name })
    );

    return { success: true, taskId };
  });

  // DELETE /api/templates/:id
  fastify.delete('/api/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const info = db.prepare('DELETE FROM task_templates WHERE id = ?').run(id);
    if (info.changes === 0) return reply.status(404).send({ error: 'Template not found' });
    return { success: true };
  });
}