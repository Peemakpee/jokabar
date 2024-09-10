const mongoose = require('mongoose');

const expenseItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  }
});

const expenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  items: [expenseItemSchema],
});

module.exports = mongoose.model('Expense', expenseSchema);
