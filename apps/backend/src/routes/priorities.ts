import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { IPriority } from 'shared';

export default async function prioritiesRoutes(fastify: FastifyInstance) {
  
  // GET /api/priorities
  fastify.get('/api/priorities', async () => {
    const priorities = db.prepare('SELECT * FROM priorities ORDER BY level ASC').all() as IPriority[];
    return priorities;
  });

  // POST /api/priorities
  fastify.post('/api/priorities', async (request, reply) => {
    const CreatePrioritySchema = z.object({
      name: z.string().min(1),
      level: z.number().int(),
      color: z.string().min(1)
    });

    const body = CreatePrioritySchema.parse(request.body);

    try {
      const info = db.prepare(`
        INSERT INTO priorities (name, level, color)
        VALUES (@name, @level, @color)
      `).run({
        name: body.name,
        level: body.level,
        color: body.color
      });

      const newPriority = db.prepare('SELECT * FROM priorities WHERE id = ?').get(info.lastInsertRowid);
      return newPriority;
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return reply.status(409).send({ error: 'Priority name or level already exists' });
      }
      throw err;
    }
  });

  // DELETE /api/priorities/:id
  fastify.delete('/api/priorities/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const info = db.prepare('DELETE FROM priorities WHERE id = ?').run(id);
    
    if (info.changes === 0) {
      return reply.status(404).send({ error: 'Priority not found' });
    }
    
    return { success: true, id };
  });
}
