import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';

export default async function advancedRoutes(fastify: FastifyInstance) {

  // ═══ SAVED FILTERS (Smart Lists) ═══

  fastify.get('/api/filters', async () => {
    const rows = db.prepare(`
      SELECT id, name, icon, color, filter_config as filterConfig, position, created_at as createdAt
      FROM saved_filters ORDER BY position ASC
    `).all() as any[];
    return rows.map(r => ({ ...r, filterConfig: JSON.parse(r.filterConfig) }));
  });

  fastify.post('/api/filters', async (request) => {
    const schema = z.object({
      name: z.string().min(1),
      icon: z.string().optional().default('🔍'),
      color: z.string().optional().default('#666666'),
      filterConfig: z.object({
        priorities: z.array(z.string()).optional(),
        categories: z.array(z.number()).optional(),
        tags: z.array(z.string()).optional(),
        dueDateRange: z.string().optional(),
        completed: z.boolean().optional(),
        isHabit: z.boolean().optional(),
        hasNotes: z.boolean().optional(),
        searchText: z.string().optional()
      })
    });
    const body = schema.parse(request.body);
    const result = db.prepare('SELECT MAX(position) as maxPos FROM saved_filters').get() as { maxPos: number };
    const position = (result?.maxPos || 0) + 1;

    const info = db.prepare(`
      INSERT INTO saved_filters (name, icon, color, filter_config, position)
      VALUES (?, ?, ?, ?, ?)
    `).run(body.name, body.icon, body.color, JSON.stringify(body.filterConfig), position);

    return { id: info.lastInsertRowid, ...body, position };
  });

  fastify.delete('/api/filters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const info = db.prepare('DELETE FROM saved_filters WHERE id = ?').run(id);
    if (info.changes === 0) return reply.status(404).send({ error: 'Filter not found' });
    return { success: true };
  });

  // ═══ ACTIVITY LOG ═══

  fastify.get<{ Querystring: { taskId?: string; limit?: string } }>('/api/activity', async (request) => {
    const { taskId, limit } = request.query;
    const lim = Math.min(parseInt(limit || '50'), 200);

    let query = `
      SELECT al.id, al.task_id as taskId, al.action, al.details, al.created_at as createdAt,
             t.title as taskTitle
      FROM activity_log al
      LEFT JOIN tasks t ON al.task_id = t.id
    `;
    const params: any[] = [];

    if (taskId) {
      query += ' WHERE al.task_id = ?';
      params.push(taskId);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(lim);

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => ({ ...r, details: r.details ? JSON.parse(r.details) : null }));
  });

  // ═══ REMINDERS ═══

  fastify.get('/api/reminders/pending', async () => {
    const now = new Date().toISOString();
    const rows = db.prepare(`
      SELECT tr.id, tr.task_id as taskId, tr.remind_at as remindAt, tr.reminded,
             t.title as taskTitle, t.due_date as dueDate
      FROM task_reminders tr
      JOIN tasks t ON tr.task_id = t.id
      WHERE tr.reminded = 0 AND tr.remind_at <= ?
      ORDER BY tr.remind_at ASC
    `).all(now) as any[];
    return rows;
  });

  fastify.post('/api/tasks/:id/reminders', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({ remindAt: z.string() });
    const { remindAt } = schema.parse(request.body);

    db.prepare('INSERT INTO task_reminders (task_id, remind_at) VALUES (?, ?)').run(id, remindAt);
    return { success: true };
  });

  fastify.patch('/api/reminders/:id/dismiss', async (request) => {
    const { id } = request.params as { id: string };
    db.prepare('UPDATE task_reminders SET reminded = 1 WHERE id = ?').run(id);
    return { success: true };
  });

  // ═══ BATCH ACTIONS ═══

  fastify.post('/api/tasks/batch', async (request) => {
    const schema = z.object({
      taskIds: z.array(z.number()),
      action: z.enum(['complete', 'uncomplete', 'delete', 'move', 'reschedule', 'priority']),
      data: z.any().optional()
    });
    const { taskIds, action, data } = schema.parse(request.body);

    const batchTransaction = db.transaction(() => {
      for (const taskId of taskIds) {
        switch (action) {
          case 'complete':
            db.prepare('UPDATE tasks SET completed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(taskId);
            db.prepare(`INSERT INTO activity_log (task_id, action) VALUES (?, 'completed')`).run(taskId);
            break;
          case 'uncomplete':
            db.prepare('UPDATE tasks SET completed = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(taskId);
            db.prepare(`INSERT INTO activity_log (task_id, action) VALUES (?, 'uncompleted')`).run(taskId);
            break;
          case 'delete':
            db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
            db.prepare(`INSERT INTO activity_log (task_id, action) VALUES (?, 'deleted')`).run(taskId);
            break;
          case 'move':
            if (data?.categoryId !== undefined) {
              db.prepare('UPDATE tasks SET category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(data.categoryId, taskId);
            }
            break;
          case 'reschedule':
            if (data?.dueDate !== undefined) {
              db.prepare('UPDATE tasks SET due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(data.dueDate, taskId);
            }
            break;
          case 'priority':
            if (data?.priority) {
              db.prepare('UPDATE tasks SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(data.priority, taskId);
            }
            break;
        }
      }
    });

    batchTransaction();
    return { success: true, affected: taskIds.length };
  });

  // ═══ PRODUCTIVITY STATS ═══

  fastify.get('/api/stats/productivity', async () => {
    // Completed by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const completedByDay = db.prepare(`
      SELECT date(updated_at) as date, COUNT(*) as count
      FROM tasks
      WHERE completed = 1 AND date(updated_at) >= ?
      GROUP BY date(updated_at)
      ORDER BY date ASC
    `).all(startDate) as { date: string; count: number }[];

    const totalCompleted = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 1').get() as { count: number };
    const totalCreated = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    const totalActive = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 0').get() as { count: number };

    // Busiest day of week
    const busiestDay = db.prepare(`
      SELECT CASE strftime('%w', updated_at)
        WHEN '0' THEN 'Sunday' WHEN '1' THEN 'Monday' WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday' WHEN '4' THEN 'Thursday' WHEN '5' THEN 'Friday'
        WHEN '6' THEN 'Saturday' END as dayName,
        COUNT(*) as count
      FROM tasks WHERE completed = 1
      GROUP BY strftime('%w', updated_at)
      ORDER BY count DESC LIMIT 1
    `).get() as { dayName: string; count: number } | undefined;

    // Current streak (consecutive days with at least 1 completion)
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = db.prepare('SELECT COUNT(*) as c FROM tasks WHERE completed = 1 AND date(updated_at) = ?').get(dateStr) as { c: number };
      if (count.c > 0) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      completedByDay,
      totalCompleted: totalCompleted.count,
      totalCreated: totalCreated.count,
      totalActive: totalActive.count,
      busiestDay: busiestDay?.dayName || 'N/A',
      currentStreak,
      avgCompletionTime: 0 // TODO: calculate from time_entries
    };
  });

  // ═══ MORNING BRIEFING ═══

  fastify.get('/api/briefing', async () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const selectFields = `id, title, description, completed, priority,
      category_id as categoryId, parent_id as parentId, position, depth,
      due_date as dueDate, recurrence, is_habit as isHabit,
      created_at as createdAt, updated_at as updatedAt`;

    const overdueTasks = db.prepare(`
      SELECT ${selectFields} FROM tasks
      WHERE completed = 0 AND due_date IS NOT NULL AND date(due_date) < ?
      ORDER BY due_date ASC
    `).all(today) as any[];

    const todayTasks = db.prepare(`
      SELECT ${selectFields} FROM tasks
      WHERE completed = 0 AND date(due_date) = ?
      ORDER BY priority DESC, position ASC
    `).all(today) as any[];

    const upcomingTasks = db.prepare(`
      SELECT ${selectFields} FROM tasks
      WHERE completed = 0 AND date(due_date) > ? AND date(due_date) <= ?
      ORDER BY due_date ASC
    `).all(today, tomorrow) as any[];

    const completedYesterday = db.prepare(
      'SELECT COUNT(*) as c FROM tasks WHERE completed = 1 AND date(updated_at) = ?'
    ).get(yesterday) as { c: number };

    const completedThisWeek = db.prepare(
      'SELECT COUNT(*) as c FROM tasks WHERE completed = 1 AND date(updated_at) >= ?'
    ).get(weekStartStr) as { c: number };

    const totalActive = db.prepare('SELECT COUNT(*) as c FROM tasks WHERE completed = 0').get() as { c: number };

    // Habits
    const totalHabits = db.prepare('SELECT COUNT(*) as c FROM tasks WHERE is_habit = 1').get() as { c: number };
    const habitsCompletedToday = db.prepare(
      'SELECT COUNT(*) as c FROM habit_completions WHERE completed_date = ?'
    ).get(today) as { c: number };

    return {
      overdueTasks: overdueTasks.map(t => ({ ...t, completed: Boolean(t.completed) })),
      todayTasks: todayTasks.map(t => ({ ...t, completed: Boolean(t.completed) })),
      upcomingTasks: upcomingTasks.map(t => ({ ...t, completed: Boolean(t.completed) })),
      stats: {
        completedYesterday: completedYesterday.c,
        completedThisWeek: completedThisWeek.c,
        totalActive: totalActive.c,
        streakDays: 0
      },
      habits: {
        pendingToday: totalHabits.c - habitsCompletedToday.c,
        totalHabits: totalHabits.c
      }
    };
  });

  // ═══ IMPORT/EXPORT ═══

  fastify.get('/api/export', async () => {
    const tasks = db.prepare(`
      SELECT id, title, description, completed, priority,
        category_id as categoryId, parent_id as parentId, position, depth,
        due_date as dueDate, recurrence, is_habit as isHabit, notes_markdown as notesMarkdown,
        created_at as createdAt, updated_at as updatedAt
      FROM tasks ORDER BY position ASC
    `).all() as any[];

    const categories = db.prepare('SELECT * FROM categories').all();
    const tags = db.prepare('SELECT * FROM tags').all();
    const taskTags = db.prepare('SELECT * FROM task_tags').all();
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();

    return {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      tasks: tasks.map(t => ({ ...t, completed: Boolean(t.completed) })),
      categories,
      tags,
      taskTags,
      settings
    };
  });

  fastify.post('/api/import', async (request, reply) => {
    const schema = z.object({
      tasks: z.array(z.any()),
      categories: z.array(z.any()).optional(),
      tags: z.array(z.any()).optional(),
      taskTags: z.array(z.any()).optional()
    });

    const data = schema.parse(request.body);
    let imported = 0;

    const importTransaction = db.transaction(() => {
      // Import categories
      const catIdMap = new Map<number, number>();
      if (data.categories) {
        for (const cat of data.categories) {
          try {
            const info = db.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)').run(
              cat.name, cat.color || '#666', cat.icon || null
            );
            catIdMap.set(cat.id, info.lastInsertRowid as number);
          } catch {
            const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(cat.name) as { id: number };
            if (existing) catIdMap.set(cat.id, existing.id);
          }
        }
      }

      // Import tags
      const tagIdMap = new Map<number, number>();
      if (data.tags) {
        for (const tag of data.tags) {
          try {
            const info = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)').run(tag.name, tag.color || null);
            tagIdMap.set(tag.id, info.lastInsertRowid as number);
          } catch {
            const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(tag.name) as { id: number };
            if (existing) tagIdMap.set(tag.id, existing.id);
          }
        }
      }

      // Import tasks (two passes: root first, then children)
      const taskIdMap = new Map<number, number>();
      const rootTasks = data.tasks.filter((t: any) => !t.parentId);
      const childTasks = data.tasks.filter((t: any) => t.parentId);

      for (const task of rootTasks) {
        const catId = task.categoryId ? (catIdMap.get(task.categoryId) || task.categoryId) : null;
        const info = db.prepare(`
          INSERT INTO tasks (title, description, completed, priority, category_id, position, depth, due_date, recurrence, notes_markdown)
          VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
        `).run(
          task.title, task.description || null, task.completed ? 1 : 0,
          task.priority || 'medium', catId, task.position || 0,
          task.dueDate || null, task.recurrence || 'none', task.notesMarkdown || null
        );
        taskIdMap.set(task.id, info.lastInsertRowid as number);
        imported++;
      }

      for (const task of childTasks) {
        const parentId = taskIdMap.get(task.parentId);
        if (!parentId) continue;
        const catId = task.categoryId ? (catIdMap.get(task.categoryId) || task.categoryId) : null;
        const info = db.prepare(`
          INSERT INTO tasks (title, description, completed, priority, category_id, parent_id, position, depth, due_date, recurrence)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          task.title, task.description || null, task.completed ? 1 : 0,
          task.priority || 'medium', catId, parentId, task.position || 0,
          task.depth || 1, task.dueDate || null, task.recurrence || 'none'
        );
        taskIdMap.set(task.id, info.lastInsertRowid as number);
        imported++;
      }

      // Import task-tag associations
      if (data.taskTags) {
        for (const tt of data.taskTags) {
          const newTaskId = taskIdMap.get(tt.task_id);
          const newTagId = tagIdMap.get(tt.tag_id);
          if (newTaskId && newTagId) {
            try {
              db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(newTaskId, newTagId);
            } catch { /* duplicate */ }
          }
        }
      }
    });

    importTransaction();
    return { success: true, imported };
  });

  // ═══ CATEGORIES WITH PROGRESS ═══

  fastify.get('/api/categories/progress', async () => {
    const categories = db.prepare(`
      SELECT c.id, c.name, c.color, c.icon, c.created_at as createdAt,
        (SELECT COUNT(*) FROM tasks WHERE category_id = c.id) as taskCount,
        (SELECT COUNT(*) FROM tasks WHERE category_id = c.id AND completed = 1) as completedCount
      FROM categories c ORDER BY c.name ASC
    `).all() as any[];

    return categories.map(c => ({
      ...c,
      progress: c.taskCount > 0 ? Math.round((c.completedCount / c.taskCount) * 100) : 0
    }));
  });
}