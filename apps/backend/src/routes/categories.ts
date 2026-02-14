import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { ICategory } from 'shared';

export default async function categoriesRoutes(fastify: FastifyInstance) {
  
  // GET /api/categories
  fastify.get('/api/categories', async () => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all() as ICategory[];
    return categories;
  });

  // POST /api/categories
  fastify.post('/api/categories', async (request, reply) => {
    const CreateCategorySchema = z.object({
      name: z.string().min(1),
      color: z.string().min(1),
      icon: z.string().optional()
    });

    const body = CreateCategorySchema.parse(request.body);

    try {
      const info = db.prepare(`
        INSERT INTO categories (name, color, icon)
        VALUES (@name, @color, @icon)
      `).run({
        name: body.name,
        color: body.color,
        icon: body.icon || null
      });

      const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
      return newCategory;
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return reply.status(409).send({ error: 'Category name already exists' });
      }
      throw err;
    }
  });

  // DELETE /api/categories/:id
  fastify.delete('/api/categories/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const info = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    
    if (info.changes === 0) {
      return reply.status(404).send({ error: 'Category not found' });
    }
    
    return { success: true, id };
  });
}
