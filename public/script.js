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

const expenseRenderer = {
    renderExpenseItem(expense) {
        return `
            <div>
                <strong>${expense.name || 'Unknown'}</strong> - $${(expense.amount || 0).toFixed(2)}
                <br>
                <small>${expense.category || 'Uncategorized'} | ${expense.date || 'No date'}</small>
            </div>
            <button onclick="deleteExpense(${expense._id})">Delete</button>
        `;
    },

    renderExpenseList(expenses) {
        return expenses.map(this.renderExpenseItem).join('');
    }
};

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
    const expenseItems = document.querySelectorAll('.expense-item-input');
    const items = Array.from(expenseItems).map(item => ({
        name: item.querySelector('.expense-name').value.trim(),
        amount: parseFloat(item.querySelector('.expense-amount').value),
        category: item.querySelector('.expense-category').value
    }));

    const newExpense = {
        date: date || new Date().toISOString().split('T')[0],
        items: items
    };

    console.log('Sending expense data:', newExpense); // Add this line

    if (items.some(item => !item.name || isNaN(item.amount) || !item.category)) {
        alert('Please enter valid expenses.');
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
            console.error('Error:', xhr.responseText);
            alert('Failed to add expenses. Please try again.');
        }
    });
}

function renderExpenses(filteredExpenses = expenses) {
    const expensesList = document.getElementById('expenses');
    expensesList.innerHTML = filteredExpenses.map(expense => {
        const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        return `
        <li class="expense-item">
            <div>
                <strong>${formattedDate}</strong>
                ${Array.isArray(expense.items) ? expense.items.map(item => `
                    <div>
                        <strong>${item.name || 'Unknown'}</strong> - $${(item.amount || 0).toFixed(2)}
                        <br>
                        <small>${item.category || 'Uncategorized'}</small>
                    </div>
                `).join('') : `<div>No items</div>`}
            </div>
            <button onclick="deleteExpense('${expense._id}')">Delete</button>
        </li>
    `}).join('');
}

function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        $.ajax({
            url: `/api/expenses/${expenseId}`,
            type: 'DELETE',
            success: function() {
                expenses = expenses.filter(expense => expense._id !== expenseId);
                renderExpenses();
                updateSummary();
            },
            error: function(xhr, status, error) {
                console.error('Error deleting expense:', error);
                alert('Failed to delete expense. Please try again.');
            }
        });
    }
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
    const totalExpenses = expensesToSum.reduce((total, expense) => {
        return total + expense.items.reduce((itemTotal, item) => itemTotal + item.amount, 0);
    }, 0);
    document.getElementById('total-expenses').textContent = `₱${totalExpenses.toFixed(2)}`;
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function loadExpenses() {
    $.ajax({
        url: '/api/expenses',
        type: 'GET',
        success: function(data) {
            console.log('Received expense data:', data);  // Add this line for debugging
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

function loadCategories() {
    $.ajax({
        url: '/api/categories',
        type: 'GET',
        success: function(categories) {
            const categorySelect = document.querySelector('.expense-category');
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(category => {
                categorySelect.innerHTML += `<option value="${category._id}">${category.name}</option>`;
            });
        },
        error: function(xhr, status, error) {
            console.error('Error loading categories:', error);
        }
    });
}