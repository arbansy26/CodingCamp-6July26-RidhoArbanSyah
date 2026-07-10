# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a single-page expense tracker as three plain files: `index.html`, `css/style.css`, and `js/script.js`. No build tools, no modules, no test framework. Chart.js is loaded via CDN. Data is stored in `localStorage` and synced on every add/delete.

## Tasks

- [x] 1. Create `index.html` with full page structure and Chart.js CDN
  - Create `index.html` at the project root
  - Add `<!DOCTYPE html>`, `<meta charset>`, `<meta name="viewport">`, `<title>`, and a `<link href="css/style.css" rel="stylesheet">` tag
  - Add the Chart.js CDN script tag: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`
  - Add `<script src="js/script.js" defer></script>` at the end of `<head>` (or before `</body>`)
  - Inside `<body>`, add a `<div class="container">` wrapping four sections in order:
    - `<section class="balance-section">` — heading "Total Spent" and `<p id="balance-display">$0.00</p>`
    - `<section class="form-section">` — `<form id="transaction-form">` with three `.field` divs (Item Name text input with `id="item-name"` and `maxlength="100"`, Amount number input with `id="amount"` and `min="0.01" max="999999999.99" step="0.01"`, Category select with `id="category"` and four options: a default "-- Select --" plus Food, Transport, Fun), each `.field` has a `<label>` and a `<span class="error">` for inline validation messages, and an "Add Transaction" submit button
    - `<section class="chart-section">` — `<canvas id="spending-chart">` and `<p id="chart-empty" class="empty-msg">No spending data yet.</p>`
    - `<section class="list-section">` — heading "Transactions", `<p id="list-empty" class="empty-msg">No transactions added yet.</p>`, and `<ul id="transaction-list">`
  - Add `<div id="storage-error" class="error-banner" hidden>Storage unavailable. Changes will not be saved.</div>` at the bottom of `.container`
  - _Requirements: 1.1, 2.4, 5.5, 6.4, 7.1_

- [x] 2. Create `css/style.css` with layout and component styles
  - [x] 2.1 Add base reset and body styles
    - Reset `box-sizing: border-box` on `*`
    - Set `body` to `font-family: sans-serif`, `font-size: 16px`, `background: #f9fafb`, `color: #1f2937`, `margin: 0`
    - _Requirements: 7.3_
  - [x] 2.2 Add two-column grid layout for `.container`
    - `.container`: `display: grid`, `grid-template-columns: 1fr 1fr`, `gap: 16px`, `max-width: 960px`, `margin: 0 auto`, `padding: 16px`
    - `.balance-section` and `.list-section`: `grid-column: 1 / -1` (full width)
    - `.form-section`: `grid-column: 1`
    - `.chart-section`: `grid-column: 2`
    - _Requirements: 7.1_
  - [x] 2.3 Add mobile responsive breakpoint at 600px
    - `@media (max-width: 600px)`: override `.container` to `grid-template-columns: 1fr`, set all four sections to `grid-column: 1`
    - _Requirements: 7.2_
  - [x] 2.4 Add form, list, chart, and balance component styles
    - `.field`: `display: flex`, `flex-direction: column`, `gap: 4px`, `margin-bottom: 12px`
    - `label`: `font-weight: 600`
    - `input`, `select`: `padding: 8px`, `border: 1px solid #d1d5db`, `border-radius: 4px`, `font-size: 16px`
    - `button[type="submit"]`: `padding: 10px 16px`, `background: #2563eb`, `color: #fff`, `border: none`, `border-radius: 4px`, `cursor: pointer`, `font-size: 16px`
    - `button[type="submit"]:hover`: darken background slightly
    - `.error`: `color: #dc2626`, `font-size: 14px`
    - `#balance-display`: `font-size: 2rem`, `font-weight: 700`
    - `ul#transaction-list`: `list-style: none`, `padding: 0`, `margin: 0`, `max-height: 300px`, `overflow-y: auto`
    - `li` in the list: `display: flex`, `align-items: center`, `gap: 8px`, `padding: 8px 0`, `border-bottom: 1px solid #e5e7eb`
    - `.delete-btn`: small button, `background: #ef4444`, `color: #fff`, `border: none`, `border-radius: 4px`, `cursor: pointer`, `margin-left: auto`
    - `.error-banner`: `background: #fef2f2`, `color: #991b1b`, `padding: 12px`, `border-radius: 4px`, `margin-top: 8px`
    - `.empty-msg`: `color: #6b7280`, `font-style: italic`
    - _Requirements: 7.1, 7.3, 2.2_

- [x] 3. Implement storage functions in `js/script.js`
  - Create `js/script.js` at the project root
  - Declare module-level state at the top:
    ```js
    let transactions = [];
    let nextId = 0;
    let chart = null;
    ```
  - Implement `loadFromStorage()` — wrap `localStorage.getItem('expense_transactions')` in `try/catch`; on success parse JSON into `transactions` and derive `nextId` as `Math.max(...transactions.map(t => t.id)) + 1` (or 0 if empty); on failure call `showStorageError()` and initialise with empty state
  - Implement `saveToStorage()` — wrap `localStorage.setItem('expense_transactions', JSON.stringify(transactions))` in `try/catch`; on failure call `showStorageError()`
  - Implement `showStorageError()` — unhide `#storage-error`
  - _Requirements: 6.1, 6.3, 6.4, 2.5, 3.5_

- [x] 4. Implement state mutation and rendering functions in `js/script.js`
  - [x] 4.1 Implement `escapeHtml(str)`
    - Replace `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;` using a temporary `<div>` trick or explicit `.replace()` chain
    - _Requirements: 2.1_ (XSS safety for displayed names)
  - [x] 4.2 Implement `renderList()`
    - Get `#transaction-list` and `#list-empty`
    - Set `ul.innerHTML = ''`
    - Toggle `empty.hidden` based on `transactions.length > 0`
    - For each transaction, create a `<li>` with `data-id`, inner spans for name (via `escapeHtml`), amount (formatted to 2 decimal places with `$` prefix), and category, plus a `.delete-btn` with `aria-label="Delete {name}"` and a click listener that calls `deleteTransaction(t.id)`
    - Append each `<li>` to the `<ul>`
    - _Requirements: 2.1, 2.4, 3.1_
  - [x] 4.3 Implement `updateBalance()`
    - Sum all `t.amount` values (treating null/undefined as 0) using `reduce`
    - Write `'$' + total.toFixed(2)` to `#balance-display`
    - _Requirements: 4.1, 4.4_
  - [x] 4.4 Implement `updateChart()`
    - Define `categories = ['Food', 'Transport', 'Fun']`
    - Compute `totals` per category — filter to `t.category === cat && t.amount > 0`, sum amounts
    - Derive `labels` (categories where total > 0) and `data` (non-zero totals)
    - Toggle `#chart-empty` visibility: show when no positive totals exist, hide when chart has data
    - If `chart === null`, initialise a new `Chart` instance on `#spending-chart` as a `'pie'` type with `labels`, `data`, and `backgroundColor: ['#f87171', '#60a5fa', '#34d399']`; add tooltip callback to format label as `"Category: X.XX"` and set legend position to `'bottom'`
    - If `chart` already exists, update `chart.data.labels`, `chart.data.datasets[0].data`, and call `chart.update()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 4.5 Implement `addTransaction(name, amount, category)`
    - Create a transaction object `{ id: nextId++, name, amount: parseFloat(amount), category }`
    - Push to `transactions`
    - Call `saveToStorage()`, `renderList()`, `updateBalance()`, `updateChart()` in that order
    - _Requirements: 1.2, 1.3_

- [x] 5. Implement form submit handler with inline validation in `js/script.js`
  - Add a `'submit'` event listener on `#transaction-form`
  - Call `e.preventDefault()` at the top
  - Implement `clearErrors()` helper to set all three `<span class="error">` elements to empty string
  - Call `clearErrors()` at the start of every submission attempt
  - Read and trim `item-name` value, read `amount` value, read `category` value
  - Validate each field:
    - If `name` is empty → set `#error-name` text to "Item name is required." and mark `valid = false`
    - If `amount` is empty, `isNaN(amount)`, `< 0.01`, or `> 999999999.99` → set `#error-amount` text to "Enter an amount between 0.01 and 999,999,999.99." and mark `valid = false`
    - If `category` is empty → set `#error-category` text to "Please select a category." and mark `valid = false`
  - If `valid` is `true`, call `addTransaction(name, +amount, category)` then call `document.getElementById('transaction-form').reset()`
  - _Requirements: 1.1, 1.4, 1.5, 1.6_

- [x] 6. Implement `deleteTransaction(id)` in `js/script.js`
  - Filter `transactions` to exclude the item with matching `id`: `transactions = transactions.filter(t => t.id !== id)`
  - Call `saveToStorage()`, `renderList()`, `updateBalance()`, `updateChart()` in that order
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 7. Wire initialisation on `DOMContentLoaded` in `js/script.js`
  - Add a `'DOMContentLoaded'` event listener on `document`
  - Inside the listener, call `loadFromStorage()` first, then `renderList()`, `updateBalance()`, `updateChart()` in that order
  - This ensures the page always renders the persisted state before the user can interact
  - _Requirements: 6.1, 6.2, 2.3_

- [ ] 8. Final checkpoint
  - Open `index.html` directly in a browser (no server needed)
  - Manually verify: add a transaction, confirm it appears in the list, balance updates, chart updates
  - Manually verify: delete a transaction, confirm removal, balance and chart update
  - Manually verify: refresh the page, confirm data is restored from localStorage
  - Manually verify: submit the form with each field empty one at a time, confirm inline error messages
  - Manually verify: resize the browser below 600px, confirm single-column layout
  - Ensure all code is in the three files only: `index.html`, `css/style.css`, `js/script.js`

## Notes

- No build tools, no npm, no test framework — open `index.html` directly in a browser to run the app
- Tasks 3–7 all write to `js/script.js`; complete them in order so each function is available before it is called
- The `chart` variable must be declared at module scope so both `updateChart()` (which initialises it) and subsequent calls (which update it) share the same reference
- `escapeHtml()` must be implemented before `renderList()` since it is called inside it
- The `DOMContentLoaded` listener (Task 7) ties everything together — nothing renders until it fires

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["3"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 5, "tasks": ["4.5"] },
    { "id": 6, "tasks": ["5"] },
    { "id": 7, "tasks": ["6"] },
    { "id": 8, "tasks": ["7"] }
  ]
}
```
