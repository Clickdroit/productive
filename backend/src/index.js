require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const noteRoutes = require('./routes/notes');
const pomodoroRoutes = require('./routes/pomodoro');
const habitRoutes = require('./routes/habits');
const journalRoutes = require('./routes/journal');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/prod/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/prod/api/auth', authRoutes);
app.use('/prod/api/todos', todoRoutes);
app.use('/prod/api/notes', noteRoutes);
app.use('/prod/api/pomodoro', pomodoroRoutes);
app.use('/prod/api/habits', habitRoutes);
app.use('/prod/api/journal', journalRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
