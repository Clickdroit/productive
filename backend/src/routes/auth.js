const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { z } = require('zod');
const validate = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Email invalide'),
        password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
        name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    }),
});

// ── Register ─────────────────────────────────────────────────
router.post('/register', validate(registerSchema), async (req, res) => {
    try {
        const { email, password, name } = req.body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }

        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, password: hashed, name },
        });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { id: user.id, email: user.email, name: user.name },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Email invalide'),
        password: z.string().min(1, 'Mot de passe requis'),
    }),
});

// ── Login ────────────────────────────────────────────────────
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ── Get current user ─────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, email: true, name: true, xp: true, level: true, createdAt: true },
        });
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
