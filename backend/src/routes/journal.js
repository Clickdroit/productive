const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// List entries
router.get('/', async (req, res) => {
    try {
        const { month, year, search } = req.query;
        const where = { userId: req.userId };

        if (month && year) {
            const start = new Date(parseInt(year), parseInt(month) - 1, 1);
            const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            where.date = { gte: start, lte: end };
        }
        if (search) {
            where.content = { contains: search, mode: 'insensitive' };
        }

        const entries = await prisma.journalEntry.findMany({
            where,
            orderBy: { date: 'desc' },
        });
        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/stats/mood', async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const targetMonth = month ? parseInt(month, 10) - 1 : now.getMonth();
        const targetYear = year ? parseInt(year, 10) : now.getFullYear();
        const start = new Date(targetYear, targetMonth, 1);
        const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
        const entries = await prisma.journalEntry.findMany({
            where: { userId: req.userId, date: { gte: start, lte: end } },
            select: { mood: true },
        });
        const moods = {};
        entries.forEach((entry) => {
            const key = entry.mood || 'none';
            moods[key] = (moods[key] || 0) + 1;
        });
        res.json(moods);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get entry by date
router.get('/date/:date', async (req, res) => {
    try {
        const targetDate = new Date(req.params.date);
        targetDate.setHours(0, 0, 0, 0);

        let entry = await prisma.journalEntry.findUnique({
            where: { userId_date: { userId: req.userId, date: targetDate } },
        });

        if (!entry) {
            // Return empty entry scaffold for new dates
            entry = { date: targetDate, content: '', mood: null, isNew: true };
        }

        res.json(entry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Create or update entry for a date
router.post('/', async (req, res) => {
    try {
        const { date, content, mood } = req.body;
        if (!date) return res.status(400).json({ error: 'La date est requise' });

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const entry = await prisma.journalEntry.upsert({
            where: { userId_date: { userId: req.userId, date: targetDate } },
            update: {
                ...(content !== undefined && { content }),
                ...(mood !== undefined && { mood }),
            },
            create: {
                date: targetDate,
                content: content || '',
                mood: mood || null,
                userId: req.userId,
            },
        });
        res.json(entry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Delete entry
router.delete('/:id', async (req, res) => {
    try {
        const entry = await prisma.journalEntry.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!entry) return res.status(404).json({ error: 'Entrée introuvable' });

        await prisma.journalEntry.delete({ where: { id: req.params.id } });
        res.json({ message: 'Entrée supprimée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
