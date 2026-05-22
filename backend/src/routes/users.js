const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const prisma = require('../lib/prisma');

router.use(authenticate);

// GET /api/users/search?email=... — find user by email (for inviting)
router.get('/search', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email query required' });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
