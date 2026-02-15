import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';

export default async function dependenciesRoutes(fastify: FastifyInstance) {

  // GET /api/tasks/:id/dependencies
  fastify.get('/api/tasks/:id/dependencies', async (request) => {
    const { id } = request.params as { id: string };

    const deps = db.prepare(`
      SELECT td.id, td.task_id as taskId, td.depends_on_id as dependsOnId,
             t.title as dependsOnTitle, t.completed as dependsOnCompleted,
             td.created_at as createdAt
      FROM task_dependencies td
      JOIN tasks t ON td.depends_on_id = t.id
      WHERE td.task_id = ?
    `).all(id) as any[];

    return deps.map(d => ({
      ...d,
      dependsOnCompleted: Boolean(d.dependsOnCompleted)
    }));
  });

  // POST /api/tasks/:id/dependencies
  fastify.post('/api/tasks/:id/dependencies', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({ dependsOnId: z.number() });
    const { dependsOnId } = schema.parse(request.body);

    if (Number(id) === dependsOnId) {
      return reply.status(400).send({ error: 'Task cannot depend on itself' });
    }

    // Check circular dependency
    const checkCircular = (taskId: number, targetId: number, visited = new Set<number>()): boolean => {
      if (visited.has(taskId)) return false;
      visited.add(taskId);
      const deps = db.prepare('SELECT depends_on_id FROM task_dependencies WHERE task_id = ?').all(taskId) as { depends_on_id: number }[];
      for (const dep of deps) {
        if (dep.depends_on_id === targetId) return true;
        if (checkCircular(dep.depends_on_id, targetId, visited)) return true;
      }
      return false;
    };

    if (checkCircular(dependsOnId, Number(id))) {
      return reply.status(400).send({ error: 'Circular dependency detected' });
    }

    try {
      db.prepare('INSERT INTO task_dependencies (task_id, depends_on_id) VALUES (?, ?)').run(id, dependsOnId);

      // Log activity
      db.prepare(`INSERT INTO activity_log (task_id, action, details) VALUES (?, 'dependency_added', ?)`).run(
        id, JSON.stringify({ dependsOnId })
      );

      return { success: true };
    } catch (err: any) {
      if (err.message.includes('UNIQUE')) {
        return reply.status(409).send({ error: 'Dependency already exists' });
      }
      throw err;
    }
  });

  // DELETE /api/tasks/:id/dependencies/:depId
  fastify.delete('/api/tasks/:id/dependencies/:depId', async (request, reply) => {
    const { id, depId } = request.params as { id: string; depId: string };

    const info = db.prepare('DELETE FROM task_dependencies WHERE id = ? AND task_id = ?').run(depId, id);
    if (info.changes === 0) {
      return reply.status(404).send({ error: 'Dependency not found' });
    }

    db.prepare(`INSERT INTO activity_log (task_id, action, details) VALUES (?, 'dependency_removed', ?)`).run(
      id, JSON.stringify({ dependencyId: depId })
    );

    return { success: true };
  });
}