const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/jokabar')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Define Expense Schema
const expenseSchema = new mongoose.Schema({
  name: String,
  amount: Number,
  category: String,
  date: Date
});

// Create Expense model
const Expense = mongoose.model('Expense', expenseSchema);

// API endpoint to add a new expense
app.post('/api/expenses', async (req, res) => {
  console.log('Received data:', req.body);
  try {
    const expense = req.body;
    if (!expense.name || !expense.amount || !expense.category || !expense.date) {
      return res.status(400).json({ message: "Invalid expense data" });
    }
    const savedExpense = await Expense.create(expense);
    console.log('Expense saved:', savedExpense);
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error('Error saving expense:', error);
    res.status(400).json({ message: error.message });
  }
});

// API endpoint to get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    // Fetch all expenses from the database
    const expenses = await Expense.find();
    
    // Send the expenses as a response
    res.json(expenses);
  } catch (error) {
    // If there's an error, send a 500 status with the error message
    res.status(500).json({ message: error.message });
  }
});

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
