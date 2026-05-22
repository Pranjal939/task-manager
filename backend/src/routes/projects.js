const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin, requireMember } = require('../middleware/auth');

// All routes require auth
router.use(authenticate);

// GET /api/projects — list projects for current user
router.get('/', async (req, res) => {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: req.user.id },
    include: {
      project: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, tasks: true } },
        },
      },
    },
  });
  res.json(memberships.map((m) => ({ ...m.project, myRole: m.role })));
});

// POST /api/projects — create project (creator becomes ADMIN)
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Project name required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: { create: { userId: req.user.id, role: 'ADMIN' } },
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(project);
  }
);

// GET /api/projects/:projectId
router.get('/:projectId', requireMember, async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  res.json({ ...project, myRole: req.membership.role });
});

// PUT /api/projects/:projectId — admin only
router.put('/:projectId', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  const project = await prisma.project.update({
    where: { id: req.params.projectId },
    data: { name, description },
  });
  res.json(project);
});

// DELETE /api/projects/:projectId — admin only
router.delete('/:projectId', requireAdmin, async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.projectId } });
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:projectId/members — invite member (admin only)
router.post(
  '/:projectId/members',
  requireAdmin,
  [body('email').isEmail().withMessage('Valid email required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, role = 'MEMBER' } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: req.params.projectId } },
    });
    if (existing) return res.status(409).json({ error: 'Already a member' });

    const member = await prisma.projectMember.create({
      data: { userId: user.id, projectId: req.params.projectId, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(member);
  }
);

// DELETE /api/projects/:projectId/members/:userId — remove member (admin only)
router.delete('/:projectId/members/:userId', requireAdmin, async (req, res) => {
  const { projectId, userId } = req.params;
  // Can't remove the owner
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (project.ownerId === userId) {
    return res.status(400).json({ error: 'Cannot remove project owner' });
  }
  await prisma.projectMember.delete({
    where: { userId_projectId: { userId, projectId } },
  });
  res.json({ message: 'Member removed' });
});

// PATCH /api/projects/:projectId/members/:userId/role — change role (admin only)
router.patch('/:projectId/members/:userId/role', requireAdmin, async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;
  if (!['ADMIN', 'MEMBER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const member = await prisma.projectMember.update({
    where: { userId_projectId: { userId, projectId } },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json(member);
});

module.exports = router;
