const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireMember } = require('../middleware/auth');

router.use(authenticate);

// GET /api/tasks/dashboard — current user's task summary
router.get('/dashboard', async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  const [total, todo, inProgress, done, overdue] = await Promise.all([
    prisma.task.count({ where: { assigneeId: userId } }),
    prisma.task.count({ where: { assigneeId: userId, status: 'TODO' } }),
    prisma.task.count({ where: { assigneeId: userId, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { assigneeId: userId, status: 'DONE' } }),
    prisma.task.count({
      where: { assigneeId: userId, dueDate: { lt: now }, status: { not: 'DONE' } },
    }),
  ]);

  const recentTasks = await prisma.task.findMany({
    where: { assigneeId: userId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });

  res.json({ stats: { total, todo, inProgress, done, overdue }, recentTasks });
});

// GET /api/tasks/project/:projectId — tasks for a project
router.get('/project/:projectId', requireMember, async (req, res) => {
  const { status, assigneeId, priority } = req.query;
  const where = { projectId: req.params.projectId };
  if (status) where.status = status;
  if (assigneeId) where.assigneeId = assigneeId;
  if (priority) where.priority = priority;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tasks);
});

// POST /api/tasks — create task
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('projectId').notEmpty().withMessage('Project ID required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, projectId, assigneeId, priority, dueDate, status } = req.body;

    // Verify membership
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a project member' });

    // If assigning to someone, verify they're a member
    if (assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: assigneeId, projectId } },
      });
      if (!assigneeMembership) {
        return res.status(400).json({ error: 'Assignee is not a project member' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId: assigneeId || null,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'TODO',
        creatorId: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(task);
  }
);

// GET /api/tasks/:taskId
router.get('/:taskId', async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Verify membership
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
  });
  if (!membership) return res.status(403).json({ error: 'Access denied' });

  res.json(task);
});

// PUT /api/tasks/:taskId
router.put('/:taskId', async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
  });
  if (!membership) return res.status(403).json({ error: 'Access denied' });

  const { title, description, status, priority, dueDate, assigneeId } = req.body;

  // If assigning to someone, verify they're a member
  if (assigneeId) {
    const assigneeMembership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: assigneeId, projectId: task.projectId } },
    });
    if (!assigneeMembership) {
      return res.status(400).json({ error: 'Assignee is not a project member' });
    }
  }

  const updated = await prisma.task.update({
    where: { id: req.params.taskId },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });
  res.json(updated);
});

// DELETE /api/tasks/:taskId
router.delete('/:taskId', async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
  });
  if (!membership) return res.status(403).json({ error: 'Access denied' });

  // Only admin or task creator can delete
  if (membership.role !== 'ADMIN' && task.creatorId !== req.user.id) {
    return res.status(403).json({ error: 'Only admins or task creator can delete' });
  }

  await prisma.task.delete({ where: { id: req.params.taskId } });
  res.json({ message: 'Task deleted' });
});

module.exports = router;
