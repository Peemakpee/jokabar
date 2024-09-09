let expenses = [];

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-expense-form');
    const expensesList = document.getElementById('expenses');
    const filterButton = document.getElementById('filter-button');
    const addItemButton = document.getElementById('add-item-btn');

    form.addEventListener('submit', addExpenses);
    filterButton.addEventListener('click', filterExpenses);
    addItemButton.addEventListener('click', addExpenseItem);

    loadExpenses();
    updateSummary();
});

function addExpenseItem() {
    const expenseItems = document.getElementById('expense-items');
    const newItem = document.createElement('div');
    newItem.className = 'expense-item-input';
    newItem.innerHTML = `
        <input type="text" class="expense-name" placeholder="Expense Name" required>
        <input type="number" class="expense-amount" placeholder="Amount" required>
        <select class="expense-category" required>
            <option value="">Select Category</option>
            <option value="fuel">Fuel</option>
            <option value="maintenance">Maintenance</option>
            <option value="rent">Rent</option>
            <option value="other">Other</option>
        </select>
        <button type="button" class="remove-item-btn">Remove</button>
    `;
    expenseItems.appendChild(newItem);

    newItem.querySelector('.remove-item-btn').addEventListener('click', function() {
        expenseItems.removeChild(newItem);
    });
}

function addExpenses(e) {
    e.preventDefault();

    const date = document.getElementById('expense-date').value;
    const expenseItem = document.querySelector('.expense-item-input');
    const newExpense = {
        name: expenseItem.querySelector('.expense-name').value.trim(),
        amount: parseFloat(expenseItem.querySelector('.expense-amount').value),
        category: expenseItem.querySelector('.expense-category').value,
        date: date || new Date().toISOString().split('T')[0]
    };

    if (!newExpense.name || isNaN(newExpense.amount) || !newExpense.category) {
        alert('Please enter a valid expense.');
        return;
    }

    $.ajax({
        url: '/api/expenses',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newExpense),
        success: function(savedExpense) {
            expenses.push(savedExpense);
            renderExpenses();
            updateSummary();
            e.target.reset();
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
            alert('Failed to add expense. Please try again.');
        }
    });
}

function renderExpenses(filteredExpenses = expenses) {
    const expensesList = document.getElementById('expenses');
    expensesList.innerHTML = '';

    if (!Array.isArray(filteredExpenses)) {
        console.error('filteredExpenses is not an array:', filteredExpenses);
        return;
    }

    filteredExpenses.forEach((expense, index) => {
        if (!expense || typeof expense !== 'object') {
            console.error('Invalid expense object:', expense);
            return;
        }

        const li = document.createElement('li');
        li.className = 'expense-item';
        li.innerHTML = `
            <div>
                <strong>${expense.name || 'Unknown'}</strong> - $${(expense.amount || 0).toFixed(2)}
                <br>
                <small>${expense.category || 'Uncategorized'} | ${expense.date || 'No date'}</small>
            </div>
            <button onclick="deleteExpense(${index})">Delete</button>
        `;
        expensesList.appendChild(li);
    });
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    saveExpenses();
    renderExpenses();
    updateSummary();
}

function filterExpenses() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    const filteredExpenses = expenses.filter(expense => {
        return expense.date >= startDate && expense.date <= endDate;
    });

    renderExpenses(filteredExpenses);
    updateSummary(filteredExpenses);
}

function updateSummary(expensesToSum = expenses) {
    const totalExpenses = expensesToSum.reduce((total, expense) => total + expense.amount, 0);
    document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function loadExpenses() {
    $.ajax({
        url: '/api/expenses',
        type: 'GET',
        success: function(data) {
            expenses = Array.isArray(data) ? data : [];
            renderExpenses();
            updateSummary();
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
            alert('Failed to load expenses. Please refresh the page.');
        }
    });
}