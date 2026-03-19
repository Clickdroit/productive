const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// List sessions (optionally filter by date range)
router.get('/', async (req, res) => {
    try {
        const { from, to } = req.query;
        const where = { userId: req.userId };

        if (from || to) {
            where.startedAt = {};
            if (from) where.startedAt.gte = new Date(from);
            if (to) where.startedAt.lte = new Date(to);
        }

        const sessions = await prisma.pomodoroSession.findMany({
            where,
            orderBy: { startedAt: 'desc' },
            take: 50,
        });
        res.json(sessions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Stats
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalSessions, todaySessions, totalMinutes] = await Promise.all([
            prisma.pomodoroSession.count({
                where: { userId: req.userId, completed: true },
            }),
            prisma.pomodoroSession.count({
                where: { userId: req.userId, completed: true, startedAt: { gte: today } },
            }),
            prisma.pomodoroSession.aggregate({
                where: { userId: req.userId, completed: true },
                _sum: { duration: true },
            }),
        ]);

        res.json({
            totalSessions,
            todaySessions,
            totalMinutes: Math.round((totalMinutes._sum.duration || 0) / 60),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Create session
router.post('/', async (req, res) => {
    try {
        const { duration, type } = req.body;
        const session = await prisma.pomodoroSession.create({
            data: {
                duration: duration || 1500,
                type: type || 'work',
                userId: req.userId,
            },
        });
        res.status(201).json(session);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Complete session
router.patch('/:id/complete', async (req, res) => {
    try {
        const session = await prisma.pomodoroSession.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!session) return res.status(404).json({ error: 'Session introuvable' });

        const updated = await prisma.pomodoroSession.update({
            where: { id: req.params.id },
            data: { completed: true, endedAt: new Date() },
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Delete session
router.delete('/:id', async (req, res) => {
    try {
        const session = await prisma.pomodoroSession.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!session) return res.status(404).json({ error: 'Session introuvable' });

        await prisma.pomodoroSession.delete({ where: { id: req.params.id } });
        res.json({ message: 'Session supprimée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
