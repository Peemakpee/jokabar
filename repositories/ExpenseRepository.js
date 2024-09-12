const BaseRepository = require('./BaseRepository');
const Expense = require('../models/Expense');

class ExpenseRepository extends BaseRepository {
  constructor() {
    super(Expense);
  }

  // Add any expense-specific methods here
  async findByDateRange(startDate, endDate) {
    return this.model.find({
      date: { $gte: startDate, $lte: endDate }
    });
  }
}

module.exports = new ExpenseRepository();
