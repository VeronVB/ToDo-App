import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { ITask, ITag } from 'shared';
import { addDays, addWeeks, addMonths } from 'date-fns';

export default async function tasksRoutes(fastify: FastifyInstance) {
  
  // GET /api/tasks - List all tasks (hierarchical or flat search)
  fastify.get<{ Querystring: { view?: string, search?: string } }>('/api/tasks', async (request) => {
    const { view, search } = request.query;
    console.log(`[API] GET /tasks search="${search}" view="${view}"`);

    let query = `
      SELECT 
        id, title, description, completed, priority, 
        category_id as categoryId, parent_id as parentId, 
        position, depth, due_date as dueDate, recurrence, is_habit as isHabit,
        pending_parent_completion as pendingParentCompletion,
        created_at as createdAt, updated_at as updatedAt 
      FROM tasks 
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      // Normalize search term (remove leading # for tag search)
      const term = search.trim();
      const tagTerm = term.startsWith('#') ? term.slice(1) : term;

      conditions.push(`(
        title LIKE ? OR 
        description LIKE ? OR 
        EXISTS (
            SELECT 1 FROM task_tags tt 
            JOIN tags t ON tt.tag_id = t.id 
            WHERE tt.task_id = tasks.id AND t.name LIKE ?
        )
      )`);
      params.push(`%${term}%`, `%${term}%`, `%${tagTerm}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY position ASC';

    const rows = db.prepare(query).all(...params) as ITask[];

    const taskIds = rows.map(r => r.id);
    if (taskIds.length > 0) {
        const placeholders = taskIds.map(() => '?').join(',');
        const tagsMap = new Map<number, ITag[]>();
        
        const taskTags = db.prepare(`
            SELECT tt.task_id, t.id, t.name, t.color, t.created_at as createdAt
            FROM task_tags tt
            JOIN tags t ON tt.tag_id = t.id
            WHERE tt.task_id IN (${placeholders})
        `).all(...taskIds) as (ITag & { task_id: number })[];

        taskTags.forEach(tt => {
            if (!tagsMap.has(tt.task_id)) {
                tagsMap.set(tt.task_id, []);
            }
            tagsMap.get(tt.task_id)?.push({
                id: tt.id,
                name: tt.name,
                color: tt.color,
                createdAt: tt.createdAt
            });
        });

        rows.forEach(row => {
            row.tags = tagsMap.get(row.id) || [];
            row.children = [];
            (row as any).completed = Boolean(row.completed);
            (row as any).pendingParentCompletion = Boolean(row.pendingParentCompletion);
        });
    } else {
        rows.forEach(row => {
            row.tags = [];
            row.children = [];
            (row as any).completed = Boolean(row.completed);
            (row as any).pendingParentCompletion = Boolean(row.pendingParentCompletion);
        });
    }

    // If searching, return flat list
    if (search) {
        return rows;
    }

    // Otherwise, build tree
    const taskMap = new Map<number, ITask>();
    rows.forEach(row => {
        taskMap.set(row.id, row);
    });

    const rootTasks: ITask[] = [];
    rows.forEach(row => {
        if (row.parentId) {
            const parent = taskMap.get(row.parentId);
            if (parent) {
                parent.children?.push(row);
            } else {
                rootTasks.push(row);
            }
        } else {
            rootTasks.push(row);
        }
    });

    return rootTasks;
  });

  // POST /api/tasks - Create new task
  fastify.post('/api/tasks', async (request, reply) => {
    const CreateTaskSchema = z.object({
      title: z.string().min(1),
      description: z.string().optional().nullable(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      categoryId: z.number().optional().nullable(),
      parentId: z.number().optional().nullable(),
      dueDate: z.string().optional().nullable(),
      recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).optional().default('none'),
      tags: z.array(z.string()).optional(),
      isHabit: z.boolean().optional().default(false)
    });

    const body = CreateTaskSchema.parse(request.body);
    
    const createTransaction = db.transaction(() => {
        // Get max position
        let position = 0;
        if (body.parentId) {
            const result = db.prepare('SELECT MAX(position) as maxPos FROM tasks WHERE parent_id = ?').get(body.parentId) as { maxPos: number };
            position = (result?.maxPos || 0) + 1;
        } else {
            const result = db.prepare('SELECT MAX(position) as maxPos FROM tasks WHERE parent_id IS NULL').get() as { maxPos: number };
            position = (result?.maxPos || 0) + 1;
        }
        
        // Calculate depth
        let depth = 0;
        if (body.parentId) {
            const parent = db.prepare('SELECT depth FROM tasks WHERE id = ?').get(body.parentId) as { depth: number };
            if (parent) depth = parent.depth + 1;
        }

        const info = db.prepare(`
          INSERT INTO tasks (title, description, priority, category_id, parent_id, position, depth, due_date, recurrence, is_habit)
          VALUES (@title, @description, @priority, @categoryId, @parentId, @position, @depth, @dueDate, @recurrence, @isHabit)
        `).run({
          title: body.title,
          description: body.description || null,
          priority: body.priority,
          categoryId: body.categoryId || null,
          parentId: body.parentId || null,
          position,
          depth,
          dueDate: body.dueDate || null,
          recurrence: body.recurrence || 'none',
          isHabit: body.isHabit ? 1 : 0
        });

        const taskId = info.lastInsertRowid as number;

        // Handle Tags
        if (body.tags && body.tags.length > 0) {
            for (const tagName of body.tags) {
                // Find or create tag
                let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as { id: number };
                if (!tag) {
                    const tagInfo = db.prepare('INSERT INTO tags (name) VALUES (?)').run(tagName);
                    tag = { id: tagInfo.lastInsertRowid as number };
                }
                // Link tag
                db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(taskId, tag.id);
            }
        }

        return taskId;
    });

    const newTaskId = createTransaction();

    const newTask = db.prepare(`
      SELECT 
        id, title, description, completed, priority, 
        category_id as categoryId, parent_id as parentId, 
        position, depth, due_date as dueDate, recurrence, is_habit as isHabit,
        pending_parent_completion as pendingParentCompletion,
        created_at as createdAt, updated_at as updatedAt 
      FROM tasks WHERE id = ?
    `).get(newTaskId) as ITask;

    // Fetch tags for new task
    const tags = db.prepare(`
        SELECT t.id, t.name, t.color, t.created_at as createdAt
        FROM task_tags tt
        JOIN tags t ON tt.tag_id = t.id
        WHERE tt.task_id = ?
    `).all(newTaskId) as ITag[];

    (newTask as any).completed = Boolean(newTask.completed);
    (newTask as any).pendingParentCompletion = Boolean(newTask.pendingParentCompletion);
    newTask.children = [];
    newTask.tags = tags;

    return newTask;
  });

  // PATCH /api/tasks/:id - Update task
  fastify.patch('/api/tasks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const UpdateTaskSchema = z.object({
      title: z.string().optional(),
      description: z.string().optional().nullable(),
      completed: z.boolean().optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      categoryId: z.number().optional().nullable(),
      dueDate: z.string().optional().nullable(),
      recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
      tags: z.array(z.string()).optional(),
      isHabit: z.boolean().optional()
    });

    const body = UpdateTaskSchema.parse(request.body);
    
    const updateTransaction = db.transaction(() => {
        // Helper: Process recurrence for a completed task
        const processRecurrence = (task: ITask, originalTaskId: number) => {
            console.log(`[DEBUG processRecurrence] Called for task: ${originalTaskId}, recurrence: ${task.recurrence}`);
            if (!task.recurrence || task.recurrence === 'none') return;

            let nextDate: Date;
            const baseDate = task.dueDate ? new Date(task.dueDate) : new Date();
            
            switch (task.recurrence) {
                case 'daily': nextDate = addDays(baseDate, 1); break;
                case 'weekly': nextDate = addWeeks(baseDate, 1); break;
                case 'monthly': nextDate = addMonths(baseDate, 1); break;
                default: nextDate = addDays(baseDate, 1);
            }

            const nextDateStr = nextDate.toISOString();

            // Calculate position (append to end of list at root level)
            const result = db.prepare('SELECT MAX(position) as maxPos FROM tasks WHERE parent_id IS NULL').get() as { maxPos: number };
            const position = (result?.maxPos || 0) + 1;

            // Determine Category ID - walk up ancestor chain
            let newCategoryId = task.categoryId;
            let ancestorId = task.parentId;
            
            while (!newCategoryId && ancestorId) {
                const ancestor = db.prepare('SELECT category_id as categoryId, parent_id as parentId FROM tasks WHERE id = ?').get(ancestorId) as { categoryId: number, parentId: number };
                if (ancestor) {
                    if (ancestor.categoryId) {
                        newCategoryId = ancestor.categoryId;
                    }
                    ancestorId = ancestor.parentId;
                } else {
                    break;
                }
            }

            console.log(`[RECURRENCE] Spawning new task from ID: ${originalTaskId}, NewParent: NULL, Category: ${newCategoryId}`);

            const insertInfo = db.prepare(`
                INSERT INTO tasks (title, description, priority, category_id, parent_id, position, depth, due_date, recurrence, completed)
                VALUES (@title, @description, @priority, @categoryId, @parentId, @position, @depth, @dueDate, @recurrence, 0)
            `).run({
                title: task.title,
                description: task.description,
                priority: task.priority,
                categoryId: newCategoryId,
                parentId: null, // Always root
                position: position,
                depth: 0, // Always depth 0
                dueDate: nextDateStr,
                recurrence: task.recurrence
            });

            const newTaskId = insertInfo.lastInsertRowid;
            
            console.log('[RECURRENCE DEBUG] Created New Task ID:', newTaskId);

            // Copy Tags
            const existingTags = db.prepare('SELECT tag_id FROM task_tags WHERE task_id = ?').all(originalTaskId) as { tag_id: number }[];
            for (const t of existingTags) {
                db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(newTaskId, t.tag_id);
            }
        };

        // Helper: Cascade completion to children
        const completeChildren = (parentId: number) => {
            console.log(`[DEBUG completeChildren] Processing parent: ${parentId}`);
            const children = db.prepare(`
                SELECT 
                    id, title, description, completed, priority, 
                    category_id as categoryId, parent_id as parentId, 
                    position, depth, due_date as dueDate, recurrence, is_habit as isHabit,
                    pending_parent_completion as pendingParentCompletion
                FROM tasks WHERE parent_id = ?
            `).all(parentId) as ITask[];

            console.log(`[DEBUG completeChildren] Found ${children.length} children`);

            for (const child of children) {
                // If child has pending_parent_completion, process its recurrence NOW
                if (child.pendingParentCompletion) {
                    console.log(`[DEBUG] Processing deferred recurrence for pending child: ${child.id}`);
                    processRecurrence(child, child.id);
                    // Reset the pending flag
                    db.prepare('UPDATE tasks SET pending_parent_completion = 0 WHERE id = ?').run(child.id);
                }
                
                // Mark complete
                db.prepare('UPDATE tasks SET completed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(child.id);
                
                // Recurse into grandchildren
                completeChildren(child.id);
            }
        };

        // 1. Get current task state BEFORE any updates
        const currentTask = db.prepare(`
            SELECT 
                id, title, description, completed, priority, 
                category_id as categoryId, parent_id as parentId, 
                position, depth, due_date as dueDate, recurrence, is_habit as isHabit,
                pending_parent_completion as pendingParentCompletion
            FROM tasks WHERE id = ?
        `).get(id) as ITask;
        
        if (!currentTask) throw new Error('Task not found');

        // Convert SQLite integers to booleans for logic
        const wasCompleted = Boolean(currentTask.completed);

        // Construct dynamic update query
        const fields: string[] = [];
        const values: any = { id };

        if (body.title !== undefined) { fields.push('title = @title'); values.title = body.title; }
        if (body.description !== undefined) { fields.push('description = @description'); values.description = body.description; }
        if (body.completed !== undefined) { fields.push('completed = @completed'); values.completed = body.completed ? 1 : 0; }
        if (body.priority !== undefined) { fields.push('priority = @priority'); values.priority = body.priority; }
        if (body.categoryId !== undefined) { fields.push('category_id = @categoryId'); values.categoryId = body.categoryId; }
        if (body.dueDate !== undefined) { fields.push('due_date = @dueDate'); values.dueDate = body.dueDate; }
        if (body.recurrence !== undefined) { fields.push('recurrence = @recurrence'); values.recurrence = body.recurrence; }
        if (body.isHabit !== undefined) { fields.push('is_habit = @isHabit'); values.isHabit = body.isHabit ? 1 : 0; }

        fields.push('updated_at = CURRENT_TIMESTAMP');

        if (fields.length > 1) {
             db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = @id`).run(values);
        }

        // Handle Tags Update
        if (body.tags !== undefined) {
            db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(id);
            
            for (const tagName of body.tags) {
                let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as { id: number };
                if (!tag) {
                    const tagInfo = db.prepare('INSERT INTO tags (name) VALUES (?)').run(tagName);
                    tag = { id: tagInfo.lastInsertRowid as number };
                }
                db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(id, tag.id);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // COMPLETION LOGIC (Recurrence + Cascade)
        // ═══════════════════════════════════════════════════════════════
        if (body.completed === true && !wasCompleted) {
            // Only process if transitioning from incomplete → complete
            
            if (currentTask.parentId && currentTask.recurrence && currentTask.recurrence !== 'none') {
                // ─── CASE 1: Child task with recurrence ───
                // Defer recurrence creation until parent is completed.
                // Just set the pending flag. Do NOT cascade, do NOT create new task.
                console.log(`[COMPLETION] Child ${id} with recurrence "${currentTask.recurrence}" → setting pending_parent_completion=1`);
                db.prepare('UPDATE tasks SET pending_parent_completion = 1 WHERE id = ?').run(id);
                
            } else {
                // ─── CASE 2: Root task OR child without recurrence ───
                
                // 2a. Process own recurrence (creates new root task if applicable)
                console.log(`[COMPLETION] Task ${id} → processing own recurrence`);
                processRecurrence(currentTask, Number(id));
                
                // 2b. Before cascade, set pending flag on incomplete children that have recurrence
                // (these haven't been individually checked off yet)
                const incompleteRecurringChildren = db.prepare(`
                    SELECT id FROM tasks 
                    WHERE parent_id = ? AND completed = 0 AND recurrence != 'none' AND recurrence IS NOT NULL
                `).all(Number(id)) as { id: number }[];
                
                for (const child of incompleteRecurringChildren) {
                    console.log(`[COMPLETION] Auto-setting pending_parent_completion=1 for unchecked recurring child: ${child.id}`);
                    db.prepare('UPDATE tasks SET pending_parent_completion = 1 WHERE id = ?').run(child.id);
                }
                
                // 2c. Cascade completion to all children
                // completeChildren will process pending recurrences and mark everything complete
                console.log(`[COMPLETION] Cascading completion from parent: ${id}`);
                completeChildren(Number(id));
            }
        }

        // Handle uncompleting a task - clear pending_parent_completion if set
        if (body.completed === false && wasCompleted) {
            db.prepare('UPDATE tasks SET pending_parent_completion = 0 WHERE id = ?').run(id);
        }
    });

    updateTransaction();

    const updatedTask = db.prepare(`
      SELECT 
        id, title, description, completed, priority, 
        category_id as categoryId, parent_id as parentId, 
        position, depth, due_date as dueDate, recurrence, is_habit as isHabit,
        pending_parent_completion as pendingParentCompletion,
        created_at as createdAt, updated_at as updatedAt 
      FROM tasks WHERE id = ?
    `).get(id) as ITask;

    const tags = db.prepare(`
        SELECT t.id, t.name, t.color, t.created_at as createdAt
        FROM task_tags tt
        JOIN tags t ON tt.tag_id = t.id
        WHERE tt.task_id = ?
    `).all(id) as ITag[];

    (updatedTask as any).completed = Boolean(updatedTask.completed);
    (updatedTask as any).pendingParentCompletion = Boolean(updatedTask.pendingParentCompletion);
    updatedTask.tags = tags;

    return updatedTask;
  });

  // DELETE /api/tasks/:id
  fastify.delete('/api/tasks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    
    if (info.changes === 0) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    
    return { success: true, id };
  });

  // POST /api/tasks/:id/move - Move task
  fastify.post('/api/tasks/:id/move', async (request, reply) => {
    const { id } = request.params as { id: string };
    const MoveTaskSchema = z.object({
      parentId: z.number().nullable(),
      newPosition: z.number()
    });
    
    const { parentId, newPosition } = MoveTaskSchema.parse(request.body);
    
    const moveTransaction = db.transaction(() => {
        const task = db.prepare('SELECT parent_id, position FROM tasks WHERE id = ?').get(id) as { parent_id: number | null, position: number };
        if (!task) throw new Error('Task not found');

        let newDepth = 0;
        if (parentId) {
            const parent = db.prepare('SELECT depth FROM tasks WHERE id = ?').get(parentId) as { depth: number };
            if (parent) newDepth = parent.depth + 1;
        }

        if (task.parent_id === parentId) {
             if (task.position < newPosition) {
                 db.prepare(`
                    UPDATE tasks 
                    SET position = position - 1 
                    WHERE (parent_id IS @parentId OR (parent_id IS NULL AND @parentId IS NULL))
                    AND position > @oldPos AND position <= @newPos
                 `).run({ parentId: task.parent_id, oldPos: task.position, newPos: newPosition });
             } else {
                 db.prepare(`
                    UPDATE tasks 
                    SET position = position + 1 
                    WHERE (parent_id IS @parentId OR (parent_id IS NULL AND @parentId IS NULL))
                    AND position >= @newPos AND position < @oldPos
                 `).run({ parentId: task.parent_id, oldPos: task.position, newPos: newPosition });
             }
        } else {
            db.prepare(`
                UPDATE tasks 
                SET position = position - 1 
                WHERE (parent_id IS @oldParentId OR (parent_id IS NULL AND @oldParentId IS NULL))
                AND position > @oldPos
            `).run({ oldParentId: task.parent_id, oldPos: task.position });

            db.prepare(`
                UPDATE tasks 
                SET position = position + 1 
                WHERE (parent_id IS @newParentId OR (parent_id IS NULL AND @newParentId IS NULL))
                AND position >= @newPos
            `).run({ newParentId: parentId, newPos: newPosition });
        }

        db.prepare('UPDATE tasks SET parent_id = ?, position = ?, depth = ? WHERE id = ?')
          .run(parentId, newPosition, newDepth, id);
          
        const updateChildrenDepth = (parentId: number, parentDepth: number) => {
             const children = db.prepare('SELECT id FROM tasks WHERE parent_id = ?').all(parentId) as { id: number }[];
             const childDepth = parentDepth + 1;
             for (const child of children) {
                 db.prepare('UPDATE tasks SET depth = ? WHERE id = ?').run(childDepth, child.id);
                 updateChildrenDepth(child.id, childDepth);
             }
        };
        
        updateChildrenDepth(Number(id), newDepth);
    });

    try {
        moveTransaction();
        return { success: true };
    } catch (err: any) {
        return reply.status(500).send({ error: err.message });
    }
  });
}
