// Module-level state
let transactions = [];
let nextId = 0;
let chart = null;

/**
 * Loads transactions from localStorage into the in-memory array.
 * Derives nextId from the highest existing id + 1.
 * On any error (storage unavailable, invalid JSON), shows the error banner
 * and initialises with empty state.
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem('expense_transactions');
    transactions = raw ? JSON.parse(raw) : [];
    nextId = transactions.length
      ? Math.max(...transactions.map(t => t.id)) + 1
      : 0;
  } catch (e) {
    showStorageError();
    transactions = [];
    nextId = 0;
  }
}

/**
 * Persists the current in-memory transactions array to localStorage.
 * On failure (storage unavailable, quota exceeded) shows the error banner
 * but leaves the in-memory state intact so the session continues normally.
 */
function saveToStorage() {
  try {
    localStorage.setItem('expense_transactions', JSON.stringify(transactions));
  } catch (e) {
    showStorageError();
  }
}

/**
 * Unhides the #storage-error banner to inform the user that
 * localStorage is unavailable or encountered an error.
 */
function showStorageError() {
  document.getElementById('storage-error').hidden = false;
}

/**
 * Escapes HTML special characters in a string to prevent XSS.
 * Replaces &, <, >, and " with their HTML entity equivalents.
 * Requirements: 2.1
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Rebuilds the transaction list in the DOM from the in-memory array.
 * Toggles the empty-state message and wires delete buttons.
 * Requirements: 2.1, 2.4, 3.1
 */
function renderList() {
  const ul = document.getElementById('transaction-list');
  const empty = document.getElementById('list-empty');
  ul.innerHTML = '';
  empty.hidden = transactions.length > 0;
  transactions.forEach(t => {
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.innerHTML = `
      <span class="item-name">${escapeHtml(t.name)}</span>
      <span class="item-amount">$${t.amount.toFixed(2)}</span>
      <span class="item-category">${t.category}</span>
      <button class="delete-btn" aria-label="Delete ${escapeHtml(t.name)}">✕</button>
    `;
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTransaction(t.id));
    ul.appendChild(li);
  });
}

/**
 * Sums all transaction amounts and updates the #balance-display element.
 * Treats null/undefined amounts as 0.
 * Requirements: 4.1, 4.4
 */
function updateBalance() {
  const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  document.getElementById('balance-display').textContent = '$' + total.toFixed(2);
}

/**
 * Aggregates spending per category and updates (or initialises) the Chart.js pie chart.
 * Shows #chart-empty when there is no positive-amount data.
 * The chart instance is never destroyed — only its data is replaced on subsequent calls.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
function updateChart() {
  const categories = ['Food', 'Transport', 'Fun'];
  const totals = categories.map(cat =>
    transactions
      .filter(t => t.category === cat && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const hasData = totals.some(v => v > 0);
  document.getElementById('chart-empty').hidden = hasData;

  const labels = categories.filter((_, i) => totals[i] > 0);
  const data   = totals.filter(v => v > 0);

  if (!chart) {
    const ctx = document.getElementById('spending-chart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{ data, backgroundColor: ['#f87171', '#60a5fa', '#34d399'] }]
      },
      options: {
        plugins: {
          tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(2)}` } },
          legend: { position: 'bottom' }
        }
      }
    });
  } else {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  }
}

/**
 * Creates a new transaction object, appends it to the array, persists it,
 * and re-renders all UI components.
 * Requirements: 1.2, 1.3
 */
function addTransaction(name, amount, category) {
  const t = { id: nextId++, name, amount: parseFloat(amount), category };
  transactions.push(t);
  saveToStorage();
  renderList();
  updateBalance();
  updateChart();
}

/**
 * Removes the transaction with the given id from the in-memory array,
 * persists the change to localStorage, and re-renders all UI components.
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage();
  renderList();
  updateBalance();
  updateChart();
}

/**
 * Clears all inline validation error messages on the transaction form.
 * Called at the start of every submission attempt so stale errors are removed.
 */
function clearErrors() {
  document.getElementById('error-name').textContent = '';
  document.getElementById('error-amount').textContent = '';
  document.getElementById('error-category').textContent = '';
}

/**
 * Handles form submission with inline validation.
 * Validates name, amount, and category; shows error messages for invalid fields.
 * Only calls addTransaction() when all fields pass validation.
 * Requirements: 1.1, 1.4, 1.5, 1.6
 */
document.getElementById('transaction-form').addEventListener('submit', e => {
  e.preventDefault();
  clearErrors();

  const name     = document.getElementById('item-name').value.trim();
  const amount   = document.getElementById('amount').value;
  const category = document.getElementById('category').value;
  let valid = true;

  if (!name) {
    document.getElementById('error-name').textContent = 'Item name is required.';
    valid = false;
  }
  if (!amount || isNaN(amount) || +amount < 0.01 || +amount > 999999999.99) {
    document.getElementById('error-amount').textContent = 'Enter an amount between 0.01 and 999,999,999.99.';
    valid = false;
  }
  if (!category) {
    document.getElementById('error-category').textContent = 'Please select a category.';
    valid = false;
  }

  if (valid) {
    addTransaction(name, +amount, category);
    document.getElementById('transaction-form').reset();
  }
});

document.addEventListener("DOMContentLoaded", () => {
    loadFromStorage();
    renderList();
    updateBalance();
    updateChart();
});