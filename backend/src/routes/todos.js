const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

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
            orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
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
        const { title, description, priority, status, dueDate } = req.body;
        if (!title) return res.status(400).json({ error: 'Le titre est requis' });

        const todo = await prisma.todo.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                status: status || 'TODO',
                dueDate: dueDate ? new Date(dueDate) : null,
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

        const { title, description, priority, status, dueDate } = req.body;
        const updated = await prisma.todo.update({
            where: { id: req.params.id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(priority !== undefined && { priority }),
                ...(status !== undefined && { status }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
            },
        });
        res.json(updated);
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
