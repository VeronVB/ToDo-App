import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { ITimeEntry } from 'shared';

export default async function timeEntriesRoutes(fastify: FastifyInstance) {
  
  // GET /api/time_entries - List time entries (optionally filtered by taskId)
  fastify.get<{ Querystring: { taskId?: string } }>('/api/time_entries', async (request) => {
    const { taskId } = request.query;
    console.log(`[API] GET /time_entries taskId="${taskId}"`);

    let query = `
      SELECT 
        id, task_id as taskId, start_time as startTime, 
        end_time as endTime, duration, notes, created_at as createdAt
      FROM time_entries
    `;
    
    const params: any[] = [];
    
    if (taskId) {
      query += ' WHERE task_id = ?';
      params.push(taskId);
    }
    
    query += ' ORDER BY start_time DESC';

    const rows = db.prepare(query).all(...params) as ITimeEntry[];
    
    return rows.map(row => ({
      ...row,
      endTime: row.endTime || null,
      duration: row.duration || null,
      notes: row.notes || null
    }));
  });

  // GET /api/time_entries/active - Get active (running) timer
  fastify.get('/api/time_entries/active', async (request) => {
    console.log(`[API] GET /time_entries/active`);

    const row = db.prepare(`
      SELECT 
        id, task_id as taskId, start_time as startTime, 
        end_time as endTime, duration, notes, created_at as createdAt
      FROM time_entries
      WHERE end_time IS NULL
      ORDER BY start_time DESC
      LIMIT 1
    `).get() as ITimeEntry | undefined;

    if (!row) {
      return null;
    }

    // Calculate current duration (elapsed time since start)
    const startTime = new Date(row.startTime).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);

    return {
      ...row,
      endTime: null,
      duration: elapsedSeconds,
      notes: row.notes || null,
      isRunning: true
    };
  });

  // POST /api/time_entries - Start a new time entry (timer)
  fastify.post('/api/time_entries', async (request, reply) => {
    const CreateTimeEntrySchema = z.object({
      taskId: z.number(),
      notes: z.string().optional().nullable()
    });

    const body = CreateTimeEntrySchema.parse(request.body);
    console.log(`[API] POST /time_entries taskId=${body.taskId}`);

    // Check if there's already an active timer - stop it first
    const activeEntry = db.prepare(`
      SELECT id FROM time_entries WHERE end_time IS NULL LIMIT 1
    `).get() as { id: number } | undefined;

    if (activeEntry) {
      // Stop the active timer
      const startTime = db.prepare('SELECT start_time FROM time_entries WHERE id = ?').get(activeEntry.id) as { start_time: string };
      const start = new Date(startTime.start_time).getTime();
      const now = Date.now();
      const duration = Math.floor((now - start) / 1000);
      
      db.prepare(`
        UPDATE time_entries 
        SET end_time = datetime('now'), duration = ? 
        WHERE id = ?
      `).run(duration, activeEntry.id);
      
      console.log(`[API] Auto-stopped previous timer (id=${activeEntry.id}, duration=${duration}s)`);
    }

    // Create new time entry
    const info = db.prepare(`
      INSERT INTO time_entries (task_id, start_time, notes)
      VALUES (?, datetime('now'), ?)
    `).run(body.taskId, body.notes || null);

    const newEntryId = info.lastInsertRowid as number;

    const newEntry = db.prepare(`
      SELECT 
        id, task_id as taskId, start_time as startTime, 
        end_time as endTime, duration, notes, created_at as createdAt
      FROM time_entries WHERE id = ?
    `).get(newEntryId) as ITimeEntry;

    return {
      ...newEntry,
      endTime: null,
      duration: 0,
      isRunning: true
    };
  });

  // PATCH /api/time_entries/:id - Update time entry (stop/pause/resume or update notes)
  fastify.patch<{ Params: { id: string } }>('/api/time_entries/:id', async (request, reply) => {
    const { id } = request.params;
    console.log(`[API] PATCH /time_entries/${id}`);

    const UpdateTimeEntrySchema = z.object({
      action: z.enum(['stop', 'update']),
      notes: z.string().optional().nullable()
    });

    const body = UpdateTimeEntrySchema.parse(request.body);

    // Get current entry
    const current = db.prepare(`
      SELECT id, task_id as taskId, start_time as startTime, end_time as endTime, duration, notes
      FROM time_entries WHERE id = ?
    `).get(id) as { id: number, taskId: number, startTime: string, endTime: string | null, duration: number | null, notes: string | null } | undefined;

    if (!current) {
      return reply.status(404).send({ error: 'Time entry not found' });
    }

    if (body.action === 'stop') {
      // Calculate final duration
      let finalDuration = current.duration || 0;
      
      if (!current.endTime) {
        const startTime = new Date(current.startTime).getTime();
        const now = Date.now();
        finalDuration = Math.floor((now - startTime) / 1000);
      }

      db.prepare(`
        UPDATE time_entries 
        SET end_time = datetime('now'), duration = ?, notes = ?
        WHERE id = ?
      `).run(finalDuration, body.notes || current.notes || null, id);

      const updated = db.prepare(`
        SELECT 
          id, task_id as taskId, start_time as startTime, 
          end_time as endTime, duration, notes, created_at as createdAt
        FROM time_entries WHERE id = ?
      `).get(id) as ITimeEntry;

      return {
        ...updated,
        notes: updated.notes || null,
        isRunning: false
      };
    }

    if (body.action === 'update') {
      db.prepare(`
        UPDATE time_entries SET notes = ? WHERE id = ?
      `).run(body.notes || null, id);

      const updated = db.prepare(`
        SELECT 
          id, task_id as taskId, start_time as startTime, 
          end_time as endTime, duration, notes, created_at as createdAt
        FROM time_entries WHERE id = ?
      `).get(id) as ITimeEntry;

      return {
        ...updated,
        notes: updated.notes || null,
        isRunning: !updated.endTime
      };
    }

    return reply.status(400).send({ error: 'Invalid action' });
  });

  // DELETE /api/time_entries/:id - Delete time entry
  fastify.delete<{ Params: { id: string } }>('/api/time_entries/:id', async (request, reply) => {
    const { id } = request.params;
    console.log(`[API] DELETE /time_entries/${id}`);

    const info = db.prepare('DELETE FROM time_entries WHERE id = ?').run(id);

    if (info.changes === 0) {
      return reply.status(404).send({ error: 'Time entry not found' });
    }

    return { success: true, id };
  });

  // GET /api/time_entries/task/:taskId/stats - Get time stats for a task
  fastify.get<{ Params: { taskId: string } }>('/api/time_entries/task/:taskId/stats', async (request) => {
    const { taskId } = request.params;
    console.log(`[API] GET /time_entries/task/${taskId}/stats`);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalSessions,
        SUM(duration) as totalDuration,
        MAX(duration) as maxDuration
      FROM time_entries 
      WHERE task_id = ? AND duration IS NOT NULL
    `).get(taskId) as { totalSessions: number, totalDuration: number | null, maxDuration: number | null };

    return {
      totalSessions: stats.totalSessions || 0,
      totalDuration: stats.totalDuration || 0,
      maxDuration: stats.maxDuration || 0
    };
  });
}
