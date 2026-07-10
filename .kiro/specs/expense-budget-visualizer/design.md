# Design Document — Expense & Budget Visualizer

## Overview

A single-page web application delivered as three files: `index.html`, `css/style.css`, and `js/script.js`. There is no build step, no framework, and no backend. Chart.js is loaded via CDN. Data lives in an in-memory array that is synced to `localStorage` on every mutation and restored on page load.

The design is intentionally flat: one HTML file, one stylesheet, one script. All state lives in a single `transactions` array. Every user action (add / delete) calls a fixed sequence: mutate the array → save to storage → re-render everything.

---

## Architecture

```
User interaction
      │
      ▼
  js/script.js (event handlers)
      │
      ├─► addTransaction()     — validates input, pushes to array
      ├─► deleteTransaction()  — splices from array
      │
      ▼
  saveToStorage()              — JSON.stringify → localStorage
      │
      ▼
  renderList()                 — rebuilds <ul> from array
  updateBalance()              — sums array, updates DOM
  updateChart()                — updates Chart.js instance
```

**Data flow (one direction):**

```
In-memory array (transactions[])
        │  saveToStorage()
        ▼
  localStorage ("transactions")
        │  loadFromStorage()  ← called once on DOMContentLoaded
        ▼
  In-memory array restored
        │  render functions
        ▼
  DOM (list, balance, chart)
```

The render functions are always called together after any mutation so the UI is never out of sync with the array.

---

## Components and Interfaces

### HTML Structure (`index.html`)

```
<body>
  <div class="container">

    <!-- Balance -->
    <section class="balance-section">
      <h2>Total Spent</h2>
      <p id="balance-display">$0.00</p>
    </section>

    <!-- Input Form -->
    <section class="form-section">
      <form id="transaction-form">
        <div class="field">
          <label for="item-name">Item Name</label>
          <input id="item-name" type="text" maxlength="100" />
          <span class="error" id="error-name"></span>
        </div>
        <div class="field">
          <label for="amount">Amount</label>
          <input id="amount" type="number" min="0.01" max="999999999.99" step="0.01" />
          <span class="error" id="error-amount"></span>
        </div>
        <div class="field">
          <label for="category">Category</label>
          <select id="category">
            <option value="">-- Select --</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Fun">Fun</option>
          </select>
          <span class="error" id="error-category"></span>
        </div>
        <button type="submit">Add Transaction</button>
      </form>
    </section>

    <!-- Chart -->
    <section class="chart-section">
      <canvas id="spending-chart"></canvas>
      <p id="chart-empty" class="empty-msg">No spending data yet.</p>
    </section>

    <!-- Transaction List -->
    <section class="list-section">
      <h2>Transactions</h2>
      <p id="list-empty" class="empty-msg">No transactions added yet.</p>
      <ul id="transaction-list"></ul>
    </section>

    <!-- Storage error banner -->
    <div id="storage-error" class="error-banner" hidden>
      Storage unavailable. Changes will not be saved.
    </div>

  </div>
</body>
```

Each transaction list item (`<li>`) is built dynamically by `renderList()`:

```html
<li data-id="0">
  <span class="item-name">Coffee</span>
  <span class="item-amount">$4.50</span>
  <span class="item-category">Food</span>
  <button class="delete-btn" aria-label="Delete Coffee">✕</button>
</li>
```

The `data-id` attribute holds the array index used by `deleteTransaction()`.

---

## Data Models

### Transaction Object

```js
{
  id: Number,       // auto-increment, assigned at creation, never reused
  name: String,     // item name, 1–100 chars
  amount: Number,   // positive float, 0.01–999999999.99
  category: String  // "Food" | "Transport" | "Fun"
}
```

### In-Memory State

```js
let transactions = [];   // the single source of truth
let nextId = 0;          // incremented on every addTransaction call
let chart = null;        // Chart.js instance, created once on load
```

### localStorage Key

```
Key: "expense_transactions"
Value: JSON array of Transaction objects
```

---

## Key JavaScript Functions (`js/script.js`)

### `loadFromStorage()`
Called once on `DOMContentLoaded`. Wraps `localStorage.getItem` in a `try/catch`. On success, parses JSON and populates `transactions[]` and `nextId`. On failure, shows the error banner and starts with an empty array.

```js
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
```

### `saveToStorage()`
Wraps `localStorage.setItem` in a `try/catch`. On failure, shows the error banner but does **not** revert the in-memory array — the user's changes are still visible for the session.

```js
function saveToStorage() {
  try {
    localStorage.setItem('expense_transactions', JSON.stringify(transactions));
  } catch (e) {
    showStorageError();
  }
}
```

### `addTransaction(name, amount, category)`
Validates inputs, creates a transaction object, pushes to `transactions[]`, calls `saveToStorage()`, then calls all three render functions.

```js
function addTransaction(name, amount, category) {
  const t = { id: nextId++, name, amount: parseFloat(amount), category };
  transactions.push(t);
  saveToStorage();
  renderList();
  updateBalance();
  updateChart();
}
```

### `deleteTransaction(id)`
Finds the transaction by `id`, splices it out of `transactions[]`, calls `saveToStorage()`, then calls all three render functions.

```js
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage();
  renderList();
  updateBalance();
  updateChart();
}
```

### `renderList()`
Clears `#transaction-list`, toggles the empty-state message, then appends one `<li>` per transaction. Each `<li>` gets a delete button whose `click` handler calls `deleteTransaction(t.id)`.

```js
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
```

> `escapeHtml()` is a small helper that replaces `&`, `<`, `>`, `"` to prevent XSS from user-entered names.

### `updateBalance()`
Sums all `amount` values (treats missing/null as 0), formats to 2 decimal places, writes to `#balance-display`.

```js
function updateBalance() {
  const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  document.getElementById('balance-display').textContent = '$' + total.toFixed(2);
}
```

### `updateChart()`
Aggregates totals per category (skipping zero/negative amounts), then either initialises `chart` on first call or updates `chart.data` and calls `chart.update()`. Shows or hides `#chart-empty` based on whether there is any data.

```js
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
```

The chart is **never destroyed and recreated** — only its data is replaced and `chart.update()` is called. This avoids canvas flickering and memory leaks.

### Form Validation (inline, inside submit handler)

Validation runs synchronously inside the `submit` event handler before `addTransaction` is called. Each error `<span>` is cleared at the start of every submission attempt, then populated if a rule fails. If any error is set, the function returns early without touching `transactions[]` or `localStorage`.

```js
document.getElementById('transaction-form').addEventListener('submit', e => {
  e.preventDefault();
  clearErrors();

  const name     = document.getElementById('item-name').value.trim();
  const amount   = document.getElementById('amount').value;
  const category = document.getElementById('category').value;
  let valid = true;

  if (!name) {
    showError('error-name', 'Item name is required.');
    valid = false;
  }
  if (!amount || isNaN(amount) || +amount < 0.01 || +amount > 999999999.99) {
    showError('error-amount', 'Enter an amount between 0.01 and 999,999,999.99.');
    valid = false;
  }
  if (!category) {
    showError('error-category', 'Please select a category.');
    valid = false;
  }

  if (valid) {
    addTransaction(name, +amount, category);
    document.getElementById('transaction-form').reset();
  }
});
```

---

## Chart.js Integration

- Loaded via CDN in `index.html`: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`
- A single `chart` variable holds the one Chart instance for the page lifetime.
- On first render (when `chart === null`), `new Chart(ctx, config)` is called.
- On all subsequent renders, only `chart.data.labels`, `chart.data.datasets[0].data` are replaced, then `chart.update()` is called.
- Categories with zero total are excluded from `labels` and `data` arrays so Chart.js does not render empty segments.
- When there are no positive-amount transactions, the `<canvas>` is hidden and `#chart-empty` is shown instead.

---

## Responsive Layout (`css/style.css`)

A single breakpoint at `600px` using a mobile-first approach.

**Default (≥ 600px) — two-column grid:**
```css
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
}
.balance-section { grid-column: 1 / -1; }  /* full width */
.form-section    { grid-column: 1; }
.chart-section   { grid-column: 2; }
.list-section    { grid-column: 1 / -1; }  /* full width */
```

**Mobile (< 600px) — single column:**
```css
@media (max-width: 600px) {
  .container {
    grid-template-columns: 1fr;
  }
  .balance-section,
  .form-section,
  .chart-section,
  .list-section {
    grid-column: 1;
  }
}
```

**Accessibility minimums:**
- Body font: `font-size: 16px` (≥ 14px minimum)
- All gaps/padding: ≥ `8px`
- Text/background contrast: dark text (`#1f2937`) on light background (`#f9fafb`) — ratio ≈ 14:1

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable on load | `try/catch` in `loadFromStorage()` → show `#storage-error` banner, start with empty array |
| `localStorage` data is invalid JSON | Same `try/catch` catches `JSON.parse` throw → same outcome |
| `localStorage` unavailable on save | `try/catch` in `saveToStorage()` → show `#storage-error` banner, in-memory state unchanged |
| `localStorage` full (QuotaExceededError) | Same `try/catch` in `saveToStorage()` → same outcome |
| Form submitted with empty fields | Inline `<span class="error">` messages shown, no write to array or storage |
| Amount out of range or non-numeric | Inline error on `#error-amount`, no write |
| User-entered name contains HTML | `escapeHtml()` in `renderList()` prevents XSS |

---

## Testing Strategy

Since this is a plain HTML/CSS/JS MVP with no build tooling, automated tests are out of scope. Manual smoke testing covers the key paths:

1. **Add transaction** — fill form, submit, verify list item appears, balance updates, chart updates.
2. **Validation** — submit with each field empty individually; submit with amount `0`, negative, and non-numeric.
3. **Delete** — click delete, verify item removed, balance and chart update.
4. **Persistence** — add transactions, refresh page, verify data restored.
5. **Storage error** — test in a private/incognito window if storage is blocked; verify error banner appears.
6. **Responsive** — resize browser below 600px; verify single-column layout.
7. **Empty states** — load with no data; verify empty-state messages on list and chart.
