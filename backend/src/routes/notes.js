const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// List
router.get('/', async (req, res) => {
    try {
        const notes = await prisma.note.findMany({
            where: { userId: req.userId },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Get one
router.get('/:id', async (req, res) => {
    try {
        const note = await prisma.note.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!note) return res.status(404).json({ error: 'Note introuvable' });
        res.json(note);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Create
router.post('/', async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title) return res.status(400).json({ error: 'Le titre est requis' });

        const note = await prisma.note.create({
            data: { title, content: content || '', userId: req.userId },
        });
        res.status(201).json(note);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Update
router.put('/:id', async (req, res) => {
    try {
        const note = await prisma.note.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!note) return res.status(404).json({ error: 'Note introuvable' });

        const { title, content } = req.body;
        const updated = await prisma.note.update({
            where: { id: req.params.id },
            data: {
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
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
        const note = await prisma.note.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!note) return res.status(404).json({ error: 'Note introuvable' });

        await prisma.note.delete({ where: { id: req.params.id } });
        res.json({ message: 'Note supprimée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
