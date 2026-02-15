import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';

interface HabitWithMetrics {
  id: number;
  title: string;
  streak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
  isHabit: boolean;
}

function calculateStreaks(completionDates: string[]): { current: number; longest: number } {
  if (completionDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  const sortedDates = [...completionDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastCompleted = new Date(sortedDates[0]);
  lastCompleted.setHours(0, 0, 0, 0);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const lastCompletedStr = lastCompleted.toISOString().split('T')[0];
  
  if (lastCompletedStr === todayStr || lastCompletedStr === yesterdayStr) {
    currentStreak = 1;
    let checkDate = new Date(lastCompleted);
    checkDate.setDate(checkDate.getDate() - 1);
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(checkDate);
      const compDate = new Date(sortedDates[i]);
      currentDate.setHours(0, 0, 0, 0);
      compDate.setHours(0, 0, 0, 0);
      
      const diff = Math.floor((currentDate.getTime() - compDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  
  return { current: currentStreak, longest: longestStreak };
}

export default async function habitsRoutes(fastify: FastifyInstance) {
  
  fastify.get<{ Querystring: { year?: string } }>('/api/habits/heatmap', async (request) => {
    const { year } = request.query;
    const targetYear = year || new Date().getFullYear().toString();
    
    const habits = db.prepare(`
      SELECT id, title 
      FROM tasks 
      WHERE is_habit = 1
    `).all() as { id: number; title: string }[];
    
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;
    
    const result: Record<number, { title: string; data: Record<string, number> }> = {};
    
    for (const habit of habits) {
      const completions = db.prepare(`
        SELECT completed_date 
        FROM habit_completions 
        WHERE task_id = ? AND completed_date >= ? AND completed_date <= ?
        ORDER BY completed_date ASC
      `).all(habit.id, startDate, endDate) as { completed_date: string }[];
      
      const data: Record<string, number> = {};
      for (const c of completions) {
        data[c.completed_date] = 1;
      }
      
      result[habit.id] = { title: habit.title, data };
    }
    
    return result;
  });

  fastify.get('/api/habits/overview', async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const yearStart = `${new Date().getFullYear()}-01-01`;
    
    const habits = db.prepare(`
      SELECT id, title 
      FROM tasks 
      WHERE is_habit = 1
    `).all() as { id: number; title: string }[];
    
    if (habits.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        weekCompletions: 0,
        yearCompletions: 0,
        activeHabits: 0,
        todayCompleted: 0,
        totalHabits: 0
      };
    }
    
    let totalCurrentStreak = 0;
    let totalLongestStreak = 0;
    let weekCompletions = 0;
    let yearCompletions = 0;
    let todayCompleted = 0;
    
    for (const habit of habits) {
      const allCompletions = db.prepare(`
        SELECT completed_date 
        FROM habit_completions 
        WHERE task_id = ?
        ORDER BY completed_date DESC
      `).all(habit.id) as { completed_date: string }[];
      
      const dates = allCompletions.map(c => c.completed_date);
      const streaks = calculateStreaks(dates);
      
      totalCurrentStreak += streaks.current;
      totalLongestStreak = Math.max(totalLongestStreak, streaks.longest);
      
      const weekComps = allCompletions.filter(c => c.completed_date >= weekAgoStr && c.completed_date <= today);
      weekCompletions += weekComps.length;
      
      const yearComps = allCompletions.filter(c => c.completed_date >= yearStart && c.completed_date <= today);
      yearCompletions += yearComps.length;
      
      if (dates.includes(today)) {
        todayCompleted++;
      }
    }
    
    return {
      currentStreak: Math.round(totalCurrentStreak / habits.length),
      longestStreak: totalLongestStreak,
      weekCompletions,
      yearCompletions,
      activeHabits: habits.length,
      todayCompleted,
      totalHabits: habits.length
    };
  });

  fastify.get('/api/habits', async () => {
    const habits = db.prepare(`
      SELECT id, title, description, priority, category_id as categoryId, 
             due_date as dueDate, recurrence, is_habit as isHabit,
             created_at as createdAt
      FROM tasks 
      WHERE is_habit = 1
      ORDER BY created_at DESC
    `).all() as any[];
    
    const today = new Date().toISOString().split('T')[0];
    
    const result: HabitWithMetrics[] = [];
    
    for (const habit of habits) {
      const completions = db.prepare(`
        SELECT completed_date 
        FROM habit_completions 
        WHERE task_id = ?
        ORDER BY completed_date DESC
      `).all(habit.id) as { completed_date: string }[];
      
      const dates = completions.map(c => c.completed_date);
      const streaks = calculateStreaks(dates);
      
      result.push({
        id: habit.id,
        title: habit.title,
        streak: streaks.current,
        longestStreak: streaks.longest,
        totalCompletions: completions.length,
        lastCompletedDate: dates[0] || null,
        isHabit: true
      });
    }
    
    return result;
  });

  fastify.post('/api/habits/:taskId', async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    
    if (task.is_habit) {
      return reply.status(400).send({ error: 'Task is already a habit' });
    }
    
    db.prepare('UPDATE tasks SET is_habit = 1 WHERE id = ?').run(taskId);
    
    return { success: true, taskId: Number(taskId) };
  });

  fastify.delete('/api/habits/:habitId', async (request, reply) => {
    const { habitId } = request.params as { habitId: string };
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND is_habit = 1').get(habitId) as any;
    if (!task) {
      return reply.status(404).send({ error: 'Habit not found' });
    }
    
    db.prepare('UPDATE tasks SET is_habit = 0 WHERE id = ?').run(habitId);
    db.prepare('DELETE FROM habit_completions WHERE task_id = ?').run(habitId);
    
    return { success: true };
  });

  fastify.post('/api/habits/:taskId/complete', async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const today = new Date().toISOString().split('T')[0];
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND is_habit = 1').get(taskId) as any;
    if (!task) {
      return reply.status(404).send({ error: 'Habit not found' });
    }
    
    const existing = db.prepare(`
      SELECT * FROM habit_completions 
      WHERE task_id = ? AND completed_date = ?
    `).get(taskId, today);
    
    if (existing) {
      return { success: true, message: 'Already completed today' };
    }
    
    db.prepare(`
      INSERT INTO habit_completions (task_id, completed_date)
      VALUES (?, ?)
    `).run(taskId, today);
    
    return { success: true, completedDate: today };
  });

  fastify.delete('/api/habits/:taskId/complete/:date', async (request, reply) => {
    const { taskId, date } = request.params as { taskId: string; date: string };
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND is_habit = 1').get(taskId) as any;
    if (!task) {
      return reply.status(404).send({ error: 'Habit not found' });
    }
    
    const result = db.prepare(`
      DELETE FROM habit_completions 
      WHERE task_id = ? AND completed_date = ?
    `).run(taskId, date);
    
    if (result.changes === 0) {
      return reply.status(404).send({ error: 'Completion not found' });
    }
    
    return { success: true };
  });

  fastify.get('/api/habits/:taskId/heatmap', async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND is_habit = 1').get(taskId) as any;
    if (!task) {
      return reply.status(404).send({ error: 'Habit not found' });
    }
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const startDate = oneYearAgo.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    const completions = db.prepare(`
      SELECT completed_date 
      FROM habit_completions 
      WHERE task_id = ? AND completed_date >= ? AND completed_date <= ?
      ORDER BY completed_date ASC
    `).all(taskId, startDate, today) as { completed_date: string }[];
    
    const data: Record<string, number> = {};
    for (const c of completions) {
      data[c.completed_date] = 1;
    }
    
    const allCompletions = db.prepare(`
      SELECT completed_date 
      FROM habit_completions 
      WHERE task_id = ?
      ORDER BY completed_date DESC
    `).all(taskId) as { completed_date: string }[];
    
    const dates = allCompletions.map(c => c.completed_date);
    const streaks = calculateStreaks(dates);
    
    return {
      data,
      streak: streaks.current,
      longestStreak: streaks.longest,
      totalCompletions: allCompletions.length,
      lastCompletedDate: dates[0] || null
    };
  });
}
