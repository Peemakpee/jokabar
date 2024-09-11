const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

router.post('/', async (req, res) => {
  try {
    console.log('Received expense data:', req.body);
    const { date, items } = req.body;
    console.log('Date:', date);
    console.log('Items:', items);

    if (!date) {
      console.log('Date is missing');
      return res.status(400).json({ message: 'Date is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('Items array is invalid:', items);
      return res.status(400).json({ message: 'Items array is required and must not be empty' });
    }
    if (items.some(item => !item.name || !item.amount || !item.category)) {
      console.log('Some items are missing required fields');
      return res.status(400).json({ message: 'Each item must have a name, amount, and category' });
    }

    const expense = new Expense({
      date,
      items: items.map(item => ({
        name: item.name,
        amount: item.amount,
        category: item.category
      }))
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error saving expense:', error);
    res.status(400).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, items } = req.body;

    console.log('Received PUT request for expense ID:', id);
    console.log('Request body:', req.body);

    if (!date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid update data' });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(id, { date, items }, { new: true });

    if (!updatedExpense) {
      console.log('Expense not found for ID:', id);
      return res.status(404).json({ message: 'Expense not found' });
    }

    console.log('Updated expense:', updatedExpense);
    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
