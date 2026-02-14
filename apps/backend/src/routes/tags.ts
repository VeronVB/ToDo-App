import { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { ITag } from 'shared';

export default async function tagsRoutes(fastify: FastifyInstance) {
  
  // GET /api/tags - Get all tags
  fastify.get('/api/tags', async () => {
    const tags = db.prepare('SELECT id, name, color, created_at as createdAt FROM tags ORDER BY name ASC').all() as ITag[];
    return tags;
  });
}
