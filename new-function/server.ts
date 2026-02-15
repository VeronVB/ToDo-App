import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { db } from './db/client.js';
import tasksRoutes from './routes/tasks.js';
import categoriesRoutes from './routes/categories.js';
import prioritiesRoutes from './routes/priorities.js';
import settingsRoutes from './routes/settings.js';
import authRoutes from './routes/auth.js';
import tagsRoutes from './routes/tags.js';
import timeEntriesRoutes from './routes/time_entries.js';
import habitsRoutes from './routes/habits.js';
import dependenciesRoutes from './routes/dependencies.js';
import templatesRoutes from './routes/templates.js';
import advancedRoutes from './routes/advanced.js';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
});

// JWT
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret_dev_key_change_me'
});

// Auth Hook
fastify.addHook('onRequest', async (request, reply) => {
  if (request.method === 'OPTIONS' || request.routeOptions.url === '/health') return;
  const ip = request.ip;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return;
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// CORS
await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173'
    : true
});

// Health check
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: db.open ? 'connected' : 'disconnected'
  };
});

// Register Routes
fastify.register(tasksRoutes);
fastify.register(categoriesRoutes);
fastify.register(prioritiesRoutes);
fastify.register(settingsRoutes);
fastify.register(authRoutes);
fastify.register(tagsRoutes);
fastify.register(timeEntriesRoutes);
fastify.register(habitsRoutes);
fastify.register(dependenciesRoutes);
fastify.register(templatesRoutes);
fastify.register(advancedRoutes);

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    await fastify.listen({ port, host });
    console.log('');
    console.log('🚀 Backend Server Ready!');
    console.log(`📍 URL: http://localhost:${port}`);
    console.log(`🗄️  Database: ${db.name}`);
    console.log('');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();