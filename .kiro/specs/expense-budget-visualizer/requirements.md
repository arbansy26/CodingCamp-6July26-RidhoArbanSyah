# Requirements Document

## Introduction

The Expense & Budget Visualizer is a single-page web application built with HTML, CSS, and Vanilla JavaScript.
It allows users to record personal spending transactions, view a running total balance, and see a pie chart
of spending distributed by category. All data is persisted in the browser's Local Storage so it survives
page refreshes. No backend or build tooling is required.

## Glossary

- **App**: The single-page Expense & Budget Visualizer web application.
- **Transaction**: A single spending record consisting of an item name, a numeric amount, and a category.
- **Category**: One of three fixed labels that classify a transaction — Food, Transport, or Fun.
- **Transaction_List**: The scrollable on-screen list that displays all saved transactions.
- **Balance_Display**: The on-screen element at the top of the page that shows the running total of all transaction amounts.
- **Input_Form**: The HTML form containing the Item Name, Amount, and Category fields plus a submit button.
- **Chart**: The Chart.js-powered pie chart that visualises spending distribution by category.
- **Local_Storage**: The browser's `localStorage` Web Storage API used to persist transaction data.

---

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to fill in a form and submit it, so that a new transaction is recorded in the list.

#### Acceptance Criteria

1. THE Input_Form SHALL contain an Item Name text field accepting up to 100 characters, an Amount number field accepting values between 0.01 and 999,999,999.99, and a Category selector with exactly three options: Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with all fields filled, THE App SHALL append the new Transaction to the end of the Transaction_List, where each Transaction entry displays the Item Name, Amount, and Category values as submitted.
3. WHEN the user submits the Input_Form with all fields filled, THE App SHALL save the updated Transaction_List to Local_Storage before resetting the Input_Form.
4. WHEN the user submits the Input_Form with all fields filled, THE App SHALL reset the Item Name field to empty, the Amount field to empty, and the Category selector to its default unselected state.
5. IF the user submits the Input_Form with one or more fields empty, THEN THE Input_Form SHALL display an inline validation message adjacent to each empty field indicating that the field is required, and SHALL NOT append a Transaction to the Transaction_List or write to Local_Storage.
6. IF the Amount field contains a value less than 0.01, greater than 999,999,999.99, or a non-numeric value, THEN THE Input_Form SHALL display an inline validation message adjacent to the Amount field indicating the valid range, and SHALL NOT append a Transaction to the Transaction_List.

---

### Requirement 2: View the Transaction List

**User Story:** As a user, I want to see all my recorded transactions in a list, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display every saved Transaction showing its item name (up to 100 characters), amount (formatted to 2 decimal places), and category.
2. WHILE the number of transactions exceeds the visible area, THE Transaction_List SHALL be scrollable without hiding any items.
3. WHEN the App loads, THE Transaction_List SHALL render all Transactions previously saved in Local_Storage within 2 seconds.
4. WHEN there are no Transactions, THE Transaction_List SHALL display an empty-state message indicating that no transactions have been added yet.
5. IF Local_Storage is unavailable or returns a parse error on load, THE App SHALL display an error message and render an empty Transaction_List.

---

### Requirement 3: Delete a Transaction

**User Story:** As a user, I want to remove a transaction from the list, so that I can correct mistakes or remove unwanted entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL display a delete control for each Transaction.
2. WHEN the user activates the delete control for a Transaction, THE App SHALL remove that Transaction from the Transaction_List and re-render the list so the deleted item is no longer visible.
3. WHEN the user activates the delete control for a Transaction, THE App SHALL update Local_Storage so the deleted Transaction is no longer present in the persisted data.
4. WHEN the user activates the delete control for a Transaction, THE App SHALL recalculate and update the Balance_Display and Chart to reflect the removal.
5. IF Local_Storage is unavailable when attempting to persist the deletion, THE App SHALL display an error message and still remove the Transaction from the Transaction_List in memory.

---

### Requirement 4: Display Total Balance

**User Story:** As a user, I want to see my total spending at a glance, so that I know how much I have spent overall.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of the amounts of all current Transactions, treating any Transaction with a missing or null amount as contributing 0 to the sum.
2. WHEN a Transaction is added, THE Balance_Display SHALL update to reflect the new sum within 1 second without requiring a page reload.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL update to reflect the new sum within 1 second without requiring a page reload.
4. WHEN there are no Transactions, THE Balance_Display SHALL show 0.

---

### Requirement 5: Visualise Spending by Category

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL display spending distribution as a pie chart using the Chart.js library, with one segment per Category that has at least one Transaction, where each segment's arc size is proportional to that Category's share of the total absolute Transaction amount.
2. THE Chart SHALL label each segment with the Category name and its percentage share of total spending, rounded to one decimal place.
3. WHEN a Transaction is added, THE Chart SHALL update to reflect the new spending distribution without requiring a page reload.
4. WHEN a Transaction is deleted, THE Chart SHALL update to reflect the new spending distribution without requiring a page reload.
5. WHEN there are no Transactions, THE Chart SHALL display an empty-state message indicating that no spending data is available, with no segments rendered.
6. IF a Transaction has a zero or negative amount, THEN THE Chart SHALL exclude that Transaction from the spending distribution calculation.

---

### Requirement 6: Persist Data Across Page Reloads

**User Story:** As a user, I want my transactions to be saved automatically, so that my data is not lost when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN the App loads, THE App SHALL read all previously stored Transactions from Local_Storage and restore the Transaction_List, Balance_Display, and Chart within 500ms of the page load event.
2. WHEN the App loads and Local_Storage contains no transaction data, THE App SHALL render an empty Transaction_List, a Balance_Display showing 0, and an empty-state Chart.
3. WHEN any Transaction is added or deleted, THE App SHALL write the complete current transaction dataset to Local_Storage before the UI reflects the change.
4. IF Local_Storage is unavailable or the stored data cannot be parsed as valid JSON, THE App SHALL display a user-visible error message and initialise with an empty transaction state.

---

### Requirement 7: Responsive and Readable Layout

**User Story:** As a user, I want the application to look clean and readable on any screen size, so that I can use it comfortably on both desktop and mobile.

#### Acceptance Criteria

1. THE App SHALL use a single CSS file for all styles and a single JavaScript file for all behaviour.
2. WHILE the viewport width is below 600px, THE App SHALL reflow the layout so that the Input_Form, Transaction_List, Balance_Display, and Chart each occupy 100% of the viewport width.
3. THE App SHALL apply a minimum colour contrast ratio of 4.5:1 between text and background colours, a minimum body text font size of 14px, and a minimum spacing of 8px between adjacent UI elements, so that all text is readable without magnification on a standard screen.
