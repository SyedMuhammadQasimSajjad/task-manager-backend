const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔒 Security Connection String from environment variable
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Cloud se connection fit ho gaya hai! 🔥"))
    .catch((err) => console.log("Database connection mein masla aya:", err));

// 📝 MongoDB Task Schema (Audit Fix: completed field default ke sath add ki hai)
const TaskSchema = new mongoose.Schema({
    title: String,
    priority: String,
    completed: { type: Boolean, default: false }
});
const Task = mongoose.model('Task', TaskSchema);

// ==========================================
// 🌍 FRONTEND MANUAL ROUTES (Static Asset Handlers)
// ==========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/index.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'index.js'));
});

// ==========================================
// 🔄 BACKEND API ROUTES
// ==========================================

// GET ALL TASKS
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE NEW TASK
app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task({
            title: req.body.title,
            priority: req.body.priority,
            completed: req.body.completed || false
        });
        await newTask.save();
        res.status(201).json({ message: 'Task created!', task: newTask });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🛠️ AUDIT FIX: UPDATE TASK COMPLETION STATUS (PUT ROUTE)
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { completed: req.body.completed },
            { new: true } // Taake updated version return kare
        );
        res.json({ message: 'Task status updated!', task: updatedTask });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE TASK
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});