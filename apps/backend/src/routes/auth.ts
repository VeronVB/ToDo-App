import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { IApiToken } from 'shared';

export default async function authRoutes(fastify: FastifyInstance) {
  
  // GET /api/tokens - List all tokens
  fastify.get('/api/tokens', async () => {
    const tokens = db.prepare('SELECT id, name, created_at as createdAt FROM api_tokens ORDER BY created_at DESC').all() as IApiToken[];
    return tokens;
  });

  // POST /api/tokens - Generate new token
  fastify.post('/api/tokens', async (request, reply) => {
    const CreateTokenSchema = z.object({
      name: z.string().min(1)
    });

    const body = CreateTokenSchema.parse(request.body);
    
    // Insert into DB to track it
    const info = db.prepare('INSERT INTO api_tokens (name) VALUES (?)').run(body.name);
    const id = info.lastInsertRowid;
    
    // Generate JWT
    // Payload contains the ID so we can verify existence later if needed (though current hook just verifies signature)
    // To implement revocation properly, the hook should check if payload.jti (or id) exists in DB.
    // For now, let's stick to simple signature verification as requested, but store ID in payload for future proofing.
    const token = fastify.jwt.sign({ id, name: body.name });

    return { token, id, name: body.name };
  });

  // DELETE /api/tokens/:id - Revoke token
  fastify.delete('/api/tokens/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const info = db.prepare('DELETE FROM api_tokens WHERE id = ?').run(id);
    
    if (info.changes === 0) {
      return reply.status(404).send({ error: 'Token not found' });
    }
    
    return { success: true };
  });
}
