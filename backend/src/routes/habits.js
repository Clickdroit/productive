const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// List habits with completions
router.get('/', async (req, res) => {
    try {
        const habits = await prisma.habit.findMany({
            where: { userId: req.userId },
            include: { completions: { orderBy: { date: 'desc' }, take: 90 } },
            orderBy: { createdAt: 'asc' },
        });
        res.json(habits);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Create
router.post('/', async (req, res) => {
    try {
        const { name, color, icon } = req.body;
        if (!name) return res.status(400).json({ error: 'Le nom est requis' });

        const habit = await prisma.habit.create({
            data: {
                name,
                color: color || '#8b5cf6',
                icon: icon || '✅',
                userId: req.userId,
            },
            include: { completions: true },
        });
        res.status(201).json(habit);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Update
router.put('/:id', async (req, res) => {
    try {
        const habit = await prisma.habit.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!habit) return res.status(404).json({ error: 'Habitude introuvable' });

        const { name, color, icon } = req.body;
        const updated = await prisma.habit.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(color !== undefined && { color }),
                ...(icon !== undefined && { icon }),
            },
            include: { completions: true },
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Toggle completion for a date
router.post('/:id/toggle', async (req, res) => {
    try {
        const habit = await prisma.habit.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!habit) return res.status(404).json({ error: 'Habitude introuvable' });

        const { date } = req.body;
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const existing = await prisma.habitCompletion.findUnique({
            where: { habitId_date: { habitId: req.params.id, date: targetDate } },
        });

        if (existing) {
            await prisma.habitCompletion.delete({ where: { id: existing.id } });
            res.json({ completed: false });
        } else {
            await prisma.habitCompletion.create({
                data: { habitId: req.params.id, date: targetDate },
            });
            res.json({ completed: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Delete
router.delete('/:id', async (req, res) => {
    try {
        const habit = await prisma.habit.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!habit) return res.status(404).json({ error: 'Habitude introuvable' });

        await prisma.habit.delete({ where: { id: req.params.id } });
        res.json({ message: 'Habitude supprimée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
