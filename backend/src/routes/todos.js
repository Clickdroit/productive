const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { awardXP } = require('../utils/gamification');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// List all todos
router.get('/', async (req, res) => {
    try {
        const { status, priority } = req.query;
        const where = { userId: req.userId };
        if (status) where.status = status;
        if (priority) where.priority = priority;

        const todos = await prisma.todo.findMany({
            where,
            orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        });
        res.json(todos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Create
router.post('/', async (req, res) => {
    try {
        const { title, description, checklist, tags, priority, status, dueDate } = req.body;
        if (!title) return res.status(400).json({ error: 'Le titre est requis' });
        const maxPos = await prisma.todo.aggregate({
            where: { userId: req.userId },
            _max: { position: true },
        });

        const todo = await prisma.todo.create({
            data: {
                title,
                description,
                checklist,
                tags: Array.isArray(tags) ? tags : [],
                priority: priority || 'MEDIUM',
                status: status || 'TODO',
                dueDate: dueDate ? new Date(dueDate) : null,
                position: (maxPos._max.position ?? -1) + 1,
                userId: req.userId,
            },
        });
        res.status(201).json(todo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Update
router.put('/:id', async (req, res) => {
    try {
        const todo = await prisma.todo.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!todo) return res.status(404).json({ error: 'Tâche introuvable' });

        const { title, description, checklist, tags, priority, status, dueDate, position } = req.body;
        const updated = await prisma.todo.update({
            where: { id: req.params.id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(checklist !== undefined && { checklist }),
                ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
                ...(priority !== undefined && { priority }),
                ...(status !== undefined && { status }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(position !== undefined && { position }),
            },
        });

        let xpResult = null;
        if (status === 'DONE' && todo.status !== 'DONE') {
            xpResult = await awardXP(req.userId, 10);
        }
        
        res.json({ ...updated, xpResult });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Reorder
router.post('/reorder', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids doit être un tableau' });
        const userTodos = await prisma.todo.findMany({
            where: { userId: req.userId },
            select: { id: true },
        });
        const userIds = new Set(userTodos.map((t) => t.id));
        if (ids.some((id) => !userIds.has(id))) {
            return res.status(400).json({ error: 'ID de tâche invalide' });
        }
        await prisma.$transaction(ids.map((id, index) => prisma.todo.update({
            where: { id },
            data: { position: index },
        })));
        const todos = await prisma.todo.findMany({
            where: { userId: req.userId },
            orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        });
        res.json(todos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Delete
router.delete('/:id', async (req, res) => {
    try {
        const todo = await prisma.todo.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!todo) return res.status(404).json({ error: 'Tâche introuvable' });

        await prisma.todo.delete({ where: { id: req.params.id } });
        res.json({ message: 'Tâche supprimée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
