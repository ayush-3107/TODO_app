const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
require('./models');

const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Todo Backend API is running!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    models: Object.keys(mongoose.models)
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/lists', require('./routes/lists'));
app.use('/api/tasks', require('./routes/tasks'));

// ✅ Correct 404 handler — tested and confirmed working
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Correct global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});