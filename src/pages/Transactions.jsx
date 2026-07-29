import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import {
  accounts,
  calculateTransactionTotals,
  categories,
  formatCurrency,
  formatTransactionDate,
  loadTransactions,
  saveTransactions,
} from "../lib/transactions";

const defaultForm = {
  description: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  category: "Groceries",
  account: "Checking",
  type: "expense",
  notes: "",
};

function Transactions() {
 const [transactions, setTransactions] = useState(loadTransactions);

  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

 useEffect(() => {
  saveTransactions(transactions);
}, [transactions]);

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .filter((transaction) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
          transaction.description.toLowerCase().includes(searchText) ||
          transaction.category.toLowerCase().includes(searchText) ||
          transaction.account.toLowerCase().includes(searchText);

        const matchesAccount =
          accountFilter === "all" ||
          transaction.account === accountFilter;

        const matchesCategory =
          categoryFilter === "all" ||
          transaction.category === categoryFilter;

        const matchesType =
          typeFilter === "all" ||
          transaction.type === typeFilter;

        return (
          matchesSearch &&
          matchesAccount &&
          matchesCategory &&
          matchesType
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [
    transactions,
    search,
    accountFilter,
    categoryFilter,
    typeFilter,
  ]);

  const totals = useMemo(
  () => calculateTransactionTotals(transactions),
  [transactions],
);

    const expenses = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

  

  function openAddModal() {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEditModal(transaction) {
    setEditingId(transaction.id);

    setForm({
      description: transaction.description,
      amount: transaction.amount.toString(),
      date: transaction.date,
      category: transaction.category,
      account: transaction.account,
      type: transaction.type,
      notes: transaction.notes || "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanedDescription = form.description.trim();
    const numericAmount = Number(form.amount);

    if (!cleanedDescription) {
      alert("Please enter a description.");
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      alert("Please enter an amount greater than $0.");
      return;
    }

    const transactionData = {
      description: cleanedDescription,
      amount: numericAmount,
      date: form.date,
      category: form.category,
      account: form.account,
      type: form.type,
      notes: form.notes.trim(),
    };

    if (editingId) {
      setTransactions((currentTransactions) =>
        currentTransactions.map((transaction) =>
          transaction.id === editingId
            ? {
                ...transaction,
                ...transactionData,
              }
            : transaction,
        ),
      );
    } else {
      setTransactions((currentTransactions) => [
        {
          id: crypto.randomUUID(),
          ...transactionData,
        },
        ...currentTransactions,
      ]);
    }

    closeModal();
  }

  function deleteTransaction(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?",
    );

    if (!confirmed) {
      return;
    }

    setTransactions((currentTransactions) =>
      currentTransactions.filter(
        (transaction) => transaction.id !== id,
      ),
    );
  }

  function clearFilters() {
    setSearch("");
    setAccountFilter("all");
    setCategoryFilter("all");
    setTypeFilter("all");
  }


  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">Money activity</p>
          <h1>Transactions</h1>
          <p className="page-description">
            Add, review, search, and categorize your income and
            purchases.
          </p>
        </div>

        <button
          className="primary-button button-with-icon"
          type="button"
          onClick={openAddModal}
        >
          <FiPlus />
          Add transaction
        </button>
      </div>

      <div className="transaction-summary-grid">
        <section className="summary-card">
          <p>Total income</p>
          <h2 className="money-positive">
            {formatCurrency(totals.income)}
          </h2>
          <span>All recorded income</span>
        </section>

        <section className="summary-card">
          <p>Total expenses</p>
          <h2 className="money-negative">
            {formatCurrency(totals.expenses)}
          </h2>
          <span>All recorded expenses</span>
        </section>

        <section className="summary-card">
          <p>Net balance</p>
          <h2
            className={
              totals.balance >= 0
                ? "money-positive"
                : "money-negative"
            }
          >
            {formatCurrency(totals.balance)}
          </h2>
          <span>Income minus expenses</span>
        </section>
      </div>

      <section className="content-card">
        <div className="transaction-toolbar">
          <div className="transaction-search">
            <FiSearch />

            <input
              type="search"
              placeholder="Search transactions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={accountFilter}
            onChange={(event) =>
              setAccountFilter(event.target.value)
            }
          >
            <option value="all">All accounts</option>

            {accounts.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >
            <option value="all">All categories</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
          >
            <option value="all">Income and expenses</option>
            <option value="income">Income only</option>
            <option value="expense">Expenses only</option>
          </select>

          <button
            className="secondary-button"
            type="button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        <div className="transaction-table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th>Type</th>
                <th className="table-amount-heading">Amount</th>
                <th className="table-actions-heading">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatTransactionDate(transaction.date)}</td>

                    <td>
                      <div className="transaction-description-cell">
                        <strong>{transaction.description}</strong>

                        {transaction.notes && (
                          <span>{transaction.notes}</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="category-pill">
                        {transaction.category}
                      </span>
                    </td>

                    <td>{transaction.account}</td>

                    <td>
                      <span
                        className={`type-pill ${
                          transaction.type === "income"
                            ? "type-income"
                            : "type-expense"
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>

                    <td
                      className={`table-amount ${
                        transaction.type === "income"
                          ? "money-positive"
                          : "money-negative"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() =>
                            openEditModal(transaction)
                          }
                          aria-label={`Edit ${transaction.description}`}
                        >
                          <FiEdit2 />
                        </button>

                        <button
                          type="button"
                          className="icon-button delete-icon-button"
                          onClick={() =>
                            deleteTransaction(transaction.id)
                          }
                          aria-label={`Delete ${transaction.description}`}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="table-empty-state"
                    colSpan="7"
                  >
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="transaction-table-footer">
          Showing {filteredTransactions.length} of{" "}
          {transactions.length} transactions
        </div>
      </section>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={closeModal}
          role="presentation"
        >
          <div
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  {editingId
                    ? "Update activity"
                    : "Record activity"}
                </p>

                <h2 id="transaction-modal-title">
                  {editingId
                    ? "Edit transaction"
                    : "Add transaction"}
                </h2>
              </div>

              <button
                className="modal-close-button"
                type="button"
                onClick={closeModal}
                aria-label="Close transaction form"
              >
                <FiX />
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={handleSubmit}
            >
              <div className="form-field form-field-full">
                <label htmlFor="transaction-description">
                  Description
                </label>

                <input
                  id="transaction-description"
                  name="description"
                  type="text"
                  placeholder="Example: Grocery Store"
                  value={form.description}
                  onChange={handleInputChange}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="transaction-amount">
                  Amount
                </label>

                <div className="currency-input">
                  <span>$</span>

                  <input
                    id="transaction-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="transaction-date">Date</label>

                <input
                  id="transaction-date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="transaction-category">
                  Category
                </label>

                <select
                  id="transaction-category"
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="transaction-account">
                  Account
                </label>

                <select
                  id="transaction-account"
                  name="account"
                  value={form.account}
                  onChange={handleInputChange}
                >
                  {accounts.map((account) => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field form-field-full">
                <label>Transaction type</label>

                <div className="transaction-type-selector">
                  <label
                    className={
                      form.type === "expense"
                        ? "transaction-type-option transaction-type-option-active"
                        : "transaction-type-option"
                    }
                  >
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={form.type === "expense"}
                      onChange={handleInputChange}
                    />

                    Expense
                  </label>

                  <label
                    className={
                      form.type === "income"
                        ? "transaction-type-option transaction-type-option-active"
                        : "transaction-type-option"
                    }
                  >
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={form.type === "income"}
                      onChange={handleInputChange}
                    />

                    Income
                  </label>
                </div>
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="transaction-notes">
                  Notes
                </label>

                <textarea
                  id="transaction-notes"
                  name="notes"
                  rows="3"
                  placeholder="Optional transaction details"
                  value={form.notes}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-actions form-field-full">
                <button
                  className="secondary-button modal-cancel-button"
                  type="button"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  type="submit"
                >
                  {editingId
                    ? "Save changes"
                    : "Save transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;