const express = require('express');
const router = express.Router();
const expenseRepository = require('../repositories/ExpenseRepository');

router.get('/', async (req, res) => {
  try {
    const expenses = await expenseRepository.findAll();
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { date, items } = req.body;

    if (!date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid expense data' });
    }

    const expense = await expenseRepository.create({ date, items });
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, items } = req.body;

    if (!date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid update data' });
    }

    const updatedExpense = await expenseRepository.update(id, { date, items });

    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedExpense = await expenseRepository.delete(id);

    if (!deletedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
