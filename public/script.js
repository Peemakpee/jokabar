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

    newItem.querySelector('.remove-item-btn').addEventListener('click', function () {
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
        success: function (savedExpense) {
            expenses.push(savedExpense);
            renderExpenses();
            updateSummary();
            e.target.reset();
            showModal('Expense added successfully!');
        },
        error: function (xhr, status, error) {
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
        const totalAmount = expense.items.reduce((sum, item) => sum + item.amount, 0);
        return `
      <li class="expense-item">
        <div class="expense-header">
          <strong>${formattedDate}</strong>
          <span>Total: ₱${totalAmount.toFixed(2)}</span>
        </div>
        <table class="expense-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expense.items.map(item => `
              <tr>
                <td>${item.name || 'Unknown'}</td>
                <td>${item.category || 'Uncategorized'}</td>
                <td>₱${(item.amount || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="expense-actions">
          <button onclick="showEditModal('${expense._id}')" class="btn-secondary">Edit</button>
          <button onclick="showDeleteModal('${expense._id}')" class="btn-secondary">Delete</button>
        </div>
      </li>
    `;
    }).join('');
}

function showDeleteModal(expenseId) {
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'block';

    document.getElementById('confirmDelete').onclick = function () {
        deleteExpense(expenseId);
        modal.style.display = 'none';
    }

    document.getElementById('cancelDelete').onclick = function () {
        modal.style.display = 'none';
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

function deleteExpense(expenseId) {
    $.ajax({
        url: `/api/expenses/${expenseId}`,
        type: 'DELETE',
        success: function () {
            expenses = expenses.filter(expense => expense._id !== expenseId);
            renderExpenses();
            updateSummary();
            showModal('Expense deleted successfully!');
        },
        error: function (xhr, status, error) {
            console.error('Error deleting expense:', error);
            showModal('Failed to delete expense. Please try again.');
        }
    });
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
        success: function (data) {
            console.log('Received expense data:', data);  // Add this line for debugging
            expenses = Array.isArray(data) ? data : [];
            renderExpenses();
            updateSummary();
        },
        error: function (xhr, status, error) {
            console.error('Error:', error);
            alert('Failed to load expenses. Please refresh the page.');
        }
    });
}

function loadCategories() {
    $.ajax({
        url: '/api/categories',
        type: 'GET',
        success: function (categories) {
            const categorySelect = document.querySelector('.expense-category');
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(category => {
                categorySelect.innerHTML += `<option value="${category._id}">${category.name}</option>`;
            });
        },
        error: function (xhr, status, error) {
            console.error('Error loading categories:', error);
        }
    });
}

function updateExpense(expenseId) {
    const expense = expenses.find(e => e._id === expenseId);
    if (!expense) return;

    // Populate form with existing expense data
    document.getElementById('expense-date').value = expense.date.split('T')[0];
    const expenseItems = document.getElementById('expense-items');
    expenseItems.innerHTML = '';

    expense.items.forEach(item => {
        const newItem = document.createElement('div');
        newItem.className = 'expense-item-input';
        newItem.innerHTML = `
            <input type="text" class="expense-name" placeholder="Expense Name" required value="${item.name}">
            <input type="number" class="expense-amount" placeholder="Amount" required value="${item.amount}">
            <select class="expense-category" required>
                <option value="">Select Category</option>
                <option value="fuel" ${item.category === 'fuel' ? 'selected' : ''}>Fuel</option>
                <option value="maintenance" ${item.category === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                <option value="rent" ${item.category === 'rent' ? 'selected' : ''}>Rent</option>
                <option value="other" ${item.category === 'other' ? 'selected' : ''}>Other</option>
            </select>
            <button type="button" class="remove-item-btn">Remove</button>
        `;
        expenseItems.appendChild(newItem);

        newItem.querySelector('.remove-item-btn').addEventListener('click', function () {
            expenseItems.removeChild(newItem);
        });
    });

    // Change form submission to update instead of add
    const form = document.getElementById('add-expense-form');
    form.onsubmit = function (e) {
        e.preventDefault();
        submitUpdateExpense(expenseId);
    };

    // Change submit button text
    document.querySelector('#add-expense-form button[type="submit"]').textContent = 'Update Expense';
}

function submitUpdateExpense(expenseId) {
    const date = document.getElementById('expense-date').value;
    const expenseItems = document.querySelectorAll('.expense-item-input');
    const items = Array.from(expenseItems).map(item => ({
        name: item.querySelector('.expense-name').value.trim(),
        amount: parseFloat(item.querySelector('.expense-amount').value),
        category: item.querySelector('.expense-category').value
    }));

    const updatedExpense = {
        date: date,
        items: items
    };

    $.ajax({
        url: `/api/expenses/${expenseId}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(updatedExpense),
        success: function (updatedExpense) {
            const index = expenses.findIndex(e => e._id === expenseId);
            if (index !== -1) {
                expenses[index] = updatedExpense;
            }
            renderExpenses();
            updateSummary();
            resetForm();
        },
        error: function (xhr, status, error) {
            console.error('Error:', xhr.responseText);
            alert('Failed to update expense. Please try again.');
        }
    });
}

function resetForm() {
    const form = document.getElementById('add-expense-form');
    form.reset();
    form.onsubmit = addExpenses;
    document.querySelector('#add-expense-form button[type="submit"]').textContent = 'Submit Expenses';
}

function showModal(message) {
    const modal = document.getElementById('successModal');
    const modalMessage = document.getElementById('modalMessage');
    modalMessage.textContent = message;
    modal.style.display = 'block';

    const span = document.getElementsByClassName('close')[0];
    span.onclick = function () {
        modal.style.display = 'none';
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

function showEditModal(expenseId) {
    const expense = expenses.find(e => e._id === expenseId);
    if (!expense) return;

    const modal = document.getElementById('editModal');
    const modalContent = modal.querySelector('.modal-content');

    modalContent.innerHTML = `
    <h3>Edit Expense</h3>
    <form id="edit-expense-form">
      <input type="date" id="edit-expense-date" value="${expense.date.split('T')[0]}" required>
      <div id="edit-expense-items">
        ${expense.items.map((item, index) => `
          <div class="expense-item-input">
            <input type="text" class="expense-name" placeholder="Expense Name" required value="${item.name}">
            <input type="number" class="expense-amount" placeholder="Amount" required value="${item.amount}">
            <select class="expense-category" required>
              <option value="">Select Category</option>
              <option value="fuel" ${item.category === 'fuel' ? 'selected' : ''}>Fuel</option>
              <option value="maintenance" ${item.category === 'maintenance' ? 'selected' : ''}>Maintenance</option>
              <option value="rent" ${item.category === 'rent' ? 'selected' : ''}>Rent</option>
              <option value="other" ${item.category === 'other' ? 'selected' : ''}>Other</option>
            </select>
            ${index > 0 ? '<button type="button" class="remove-item-btn">Remove</button>' : ''}
          </div>
        `).join('')}
      </div>
      <button type="button" id="add-edit-item-btn" class="btn-secondary">Add Another Item</button>
      <button type="submit" class="btn-primary">Update Expense</button>
    </form>
  `;

    modal.style.display = 'block';

    const form = document.getElementById('edit-expense-form');
    form.onsubmit = function (e) {
        e.preventDefault();
        submitUpdateExpense(expenseId);
        modal.style.display = 'none';
    };

    document.getElementById('add-edit-item-btn').onclick = addEditExpenseItem;

    const removeButtons = modalContent.querySelectorAll('.remove-item-btn');
    removeButtons.forEach(button => {
        button.onclick = function () {
            this.closest('.expense-item-input').remove();
        };
    });

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

function addEditExpenseItem() {
    const editExpenseItems = document.getElementById('edit-expense-items');
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
    editExpenseItems.appendChild(newItem);

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

        newItem.querySelector('.remove-item-btn').addEventListener('click', function () {
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
            success: function (savedExpense) {
                expenses.push(savedExpense);
                renderExpenses();
                updateSummary();
                e.target.reset();
                showModal('Expense added successfully!');
            },
            error: function (xhr, status, error) {
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
            const totalAmount = expense.items.reduce((sum, item) => sum + item.amount, 0);
            return `
      <li class="expense-item">
        <div class="expense-header">
          <strong>${formattedDate}</strong>
          <span>Total: ₱${totalAmount.toFixed(2)}</span>
        </div>
        <table class="expense-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expense.items.map(item => `
              <tr>
                <td>${item.name || 'Unknown'}</td>
                <td>${item.category || 'Uncategorized'}</td>
                <td>₱${(item.amount || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="expense-actions">
          <button onclick="showEditModal('${expense._id}')" class="btn-secondary">Edit</button>
          <button onclick="showDeleteModal('${expense._id}')" class="btn-secondary">Delete</button>
        </div>
      </li>
    `;
        }).join('');
    }

    function showDeleteModal(expenseId) {
        const modal = document.getElementById('deleteModal');
        modal.style.display = 'block';

        document.getElementById('confirmDelete').onclick = function () {
            deleteExpense(expenseId);
            modal.style.display = 'none';
        }

        document.getElementById('cancelDelete').onclick = function () {
            modal.style.display = 'none';
        }

        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    }

    function deleteExpense(expenseId) {
        $.ajax({
            url: `/api/expenses/${expenseId}`,
            type: 'DELETE',
            success: function () {
                expenses = expenses.filter(expense => expense._id !== expenseId);
                renderExpenses();
                updateSummary();
                showModal('Expense deleted successfully!');
            },
            error: function (xhr, status, error) {
                console.error('Error deleting expense:', error);
                showModal('Failed to delete expense. Please try again.');
            }
        });
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
            success: function (data) {
                console.log('Received expense data:', data);  // Add this line for debugging
                expenses = Array.isArray(data) ? data : [];
                renderExpenses();
                updateSummary();
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
                alert('Failed to load expenses. Please refresh the page.');
            }
        });
    }

    function loadCategories() {
        $.ajax({
            url: '/api/categories',
            type: 'GET',
            success: function (categories) {
                const categorySelect = document.querySelector('.expense-category');
                categorySelect.innerHTML = '<option value="">Select Category</option>';
                categories.forEach(category => {
                    categorySelect.innerHTML += `<option value="${category._id}">${category.name}</option>`;
                });
            },
            error: function (xhr, status, error) {
                console.error('Error loading categories:', error);
            }
        });
    }

    function updateExpense(expenseId) {
        const expense = expenses.find(e => e._id === expenseId);
        if (!expense) return;

        // Populate form with existing expense data
        document.getElementById('expense-date').value = expense.date.split('T')[0];
        const expenseItems = document.getElementById('expense-items');
        expenseItems.innerHTML = '';

        expense.items.forEach(item => {
            const newItem = document.createElement('div');
            newItem.className = 'expense-item-input';
            newItem.innerHTML = `
            <input type="text" class="expense-name" placeholder="Expense Name" required value="${item.name}">
            <input type="number" class="expense-amount" placeholder="Amount" required value="${item.amount}">
            <select class="expense-category" required>
                <option value="">Select Category</option>
                <option value="fuel" ${item.category === 'fuel' ? 'selected' : ''}>Fuel</option>
                <option value="maintenance" ${item.category === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                <option value="rent" ${item.category === 'rent' ? 'selected' : ''}>Rent</option>
                <option value="other" ${item.category === 'other' ? 'selected' : ''}>Other</option>
            </select>
            <button type="button" class="remove-item-btn">Remove</button>
        `;
            expenseItems.appendChild(newItem);

            newItem.querySelector('.remove-item-btn').addEventListener('click', function () {
                expenseItems.removeChild(newItem);
            });
        });

        // Change form submission to update instead of add
        const form = document.getElementById('add-expense-form');
        form.onsubmit = function (e) {
            e.preventDefault();
            submitUpdateExpense(expenseId);
        };

        // Change submit button text
        document.querySelector('#add-expense-form button[type="submit"]').textContent = 'Update Expense';
    }

    function submitUpdateExpense(expenseId) {
        const date = document.getElementById('expense-date').value;
        const expenseItems = document.querySelectorAll('.expense-item-input');
        const items = Array.from(expenseItems).map(item => ({
            name: item.querySelector('.expense-name').value.trim(),
            amount: parseFloat(item.querySelector('.expense-amount').value),
            category: item.querySelector('.expense-category').value
        }));

        const updatedExpense = {
            date: date,
            items: items
        };

        $.ajax({
            url: `/api/expenses/${expenseId}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedExpense),
            success: function (updatedExpense) {
                const index = expenses.findIndex(e => e._id === expenseId);
                if (index !== -1) {
                    expenses[index] = updatedExpense;
                }
                renderExpenses();
                updateSummary();
                resetForm();
            },
            error: function (xhr, status, error) {
                console.error('Error:', xhr.responseText);
                alert('Failed to update expense. Please try again.');
            }
        });
    }

    function resetForm() {
        const form = document.getElementById('add-expense-form');
        form.reset();
        form.onsubmit = addExpenses;
        document.querySelector('#add-expense-form button[type="submit"]').textContent = 'Submit Expenses';
    }

    function showModal(message) {
        const modal = document.getElementById('successModal');
        const modalMessage = document.getElementById('modalMessage');
        modalMessage.textContent = message;
        modal.style.display = 'block';

        const span = document.getElementsByClassName('close')[0];
        span.onclick = function () {
            modal.style.display = 'none';
        }

        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    }

    function showEditModal(expenseId) {
        const expense = expenses.find(e => e._id === expenseId);
        if (!expense) return;

        const modal = document.getElementById('editModal');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
    <h3>Edit Expense</h3>
    <form id="edit-expense-form">
      <input type="date" id="edit-expense-date" value="${expense.date.split('T')[0]}" required>
      <div id="edit-expense-items">
        ${expense.items.map((item, index) => `
          <div class="expense-item-input">
            <input type="text" class="expense-name" placeholder="Expense Name" required value="${item.name}">
            <input type="number" class="expense-amount" placeholder="Amount" required value="${item.amount}">
            <select class="expense-category" required>
              <option value="">Select Category</option>
              <option value="fuel" ${item.category === 'fuel' ? 'selected' : ''}>Fuel</option>
              <option value="maintenance" ${item.category === 'maintenance' ? 'selected' : ''}>Maintenance</option>
              <option value="rent" ${item.category === 'rent' ? 'selected' : ''}>Rent</option>
              <option value="other" ${item.category === 'other' ? 'selected' : ''}>Other</option>
            </select>
            ${index > 0 ? '<button type="button" class="remove-item-btn">Remove</button>' : ''}
          </div>
        `).join('')}
      </div>
      <button type="button" id="add-edit-item-btn" class="btn-secondary">Add Another Item</button>
      <button type="submit" class="btn-primary">Update Expense</button>
    </form>
  `;

        modal.style.display = 'block';

        const form = document.getElementById('edit-expense-form');
        form.onsubmit = function (e) {
            e.preventDefault();
            submitUpdateExpense(expenseId);
            modal.style.display = 'none';
        };

        document.getElementById('add-edit-item-btn').onclick = addEditExpenseItem;

        const removeButtons = modalContent.querySelectorAll('.remove-item-btn');
        removeButtons.forEach(button => {
            button.onclick = function () {
                this.closest('.expense-item-input').remove();
            };
        });

        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    }

    function addEditExpenseItem() {
        const editExpenseItems = document.getElementById('edit-expense-items');
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
        editExpenseItems.appendChild(newItem);

        newItem.querySelector('.remove-item-btn').onclick = function () {
            editExpenseItems.removeChild(newItem);
        };
    }
}