require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./database');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Use the MONGO_URI from .env
const MONGO_URI = process.env.MONGO_URI;
connectDB(MONGO_URI);

// API endpoint to add a new expense
app.use('/api/expenses', expenseRoutes);

// API endpoint to manage categories
app.use('/api/categories', categoryRoutes);

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
