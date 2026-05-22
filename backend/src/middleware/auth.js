const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Require ADMIN role within a project (projectId from req.params or req.body)
async function requireAdmin(req, res, next) {
  const projectId = req.params.projectId || req.body.projectId;
  if (!projectId) return res.status(400).json({ error: 'Project ID required' });

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  req.membership = membership;
  next();
}

// Require membership in a project
async function requireMember(req, res, next) {
  const projectId = req.params.projectId || req.body.projectId;
  if (!projectId) return res.status(400).json({ error: 'Project ID required' });

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId } },
  });

  if (!membership) {
    return res.status(403).json({ error: 'Not a project member' });
  }
  req.membership = membership;
  next();
}

module.exports = { authenticate, requireAdmin, requireMember };
