import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiPlus,
  FiPrinter,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import {
  calculateTransactionTotals,
  categories,
  formatCurrency,
  formatTransactionDate,
  saveTransactions,
} from "../lib/transactions";

import {
  createTransaction,
  createTransactionWithRecurring,
  deleteTransaction as deleteTransactionFromSupabase,
  fetchTransactions,
  updateTransaction,
} from "../lib/transactionsApi";
import { fetchAccounts } from "../lib/accountsApi";
import { useUserSettings } from "../context/UserSettingsContext";

const defaultForm = {
  description: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  category: "Groceries",
  account: "",
  accountId: "",
  type: "expense",
  notes: "",

  isRecurring: false,
  frequency: "monthly",
  endDate: "",
};

function Transactions() {
  const { multipleAccountsEnabled } = useUserSettings();

  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [accountOptions, setAccountOptions] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] =
    useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let active = true;

    async function loadAccounts() {
      if (!multipleAccountsEnabled) {
        setAccountOptions([]);
        setAccountFilter("all");
        setAccountsLoading(false);
        return;
      }

      try {
        setAccountsLoading(true);

        const data = await fetchAccounts();

        if (!active) {
          return;
        }

        const activeAccounts = (data || []).filter(
          (account) => !account.is_archived,
        );

        setAccountOptions(activeAccounts);
      } catch (error) {
        console.error("Unable to load accounts:", error);

        if (active) {
          setAccountOptions([]);
        }
      } finally {
        if (active) {
          setAccountsLoading(false);
        }
      }
    }

    loadAccounts();

    return () => {
      active = false;
    };
  }, [multipleAccountsEnabled]);
  useEffect(() => {
    let active = true;

    async function loadSupabaseTransactions() {
      try {
        setLoading(true);
        setLoadError("");

        const data = await fetchTransactions();

        if (!active) {
          return;
        }

        setTransactions(data);

        // Temporary bridge for pages that still use localStorage.
        saveTransactions(data);
      } catch (error) {
        console.error(
          "Unable to load Supabase transactions:",
          error,
        );

        if (active) {
          setLoadError(
            "Transactions could not be loaded. Check your Supabase connection.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSupabaseTransactions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    // Keeps the current Dashboard, Reports, Calendar,
    // and Budget pages synchronized during migration.
    saveTransactions(transactions);
  }, [transactions, loading]);

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .filter((transaction) => {
        const searchText = search.trim().toLowerCase();

        const description = String(
          transaction.description || "",
        ).toLowerCase();

        const category = String(
          transaction.category || "",
        ).toLowerCase();

        const account = String(
          transaction.account || "",
        ).toLowerCase();

        const matchesSearch =
          description.includes(searchText) ||
          category.includes(searchText) ||
          (multipleAccountsEnabled &&
            account.includes(searchText));

        const matchesAccount =
          !multipleAccountsEnabled ||
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
      .sort(
        (first, second) =>
          new Date(second.date) - new Date(first.date),
      );
  }, [
    transactions,
    search,
    accountFilter,
    categoryFilter,
    typeFilter,
    multipleAccountsEnabled,
  ]);

  const totals = useMemo(
    () => calculateTransactionTotals(transactions),
    [transactions],
  );

  const filteredTotals = useMemo(
    () => calculateTransactionTotals(filteredTransactions),
    [filteredTransactions],
  );

  const reportPeriodLabel = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return "No transactions in the current view";
    }

    const sortedDates = filteredTransactions
      .map((transaction) => new Date(`${transaction.date}T12:00:00`))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((first, second) => first - second);

    if (sortedDates.length === 0) {
      return "Current filtered view";
    }

    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const firstDate = formatter.format(sortedDates[0]);
    const lastDate = formatter.format(sortedDates[sortedDates.length - 1]);

    return firstDate === lastDate
      ? firstDate
      : `${firstDate} – ${lastDate}`;
  }, [filteredTransactions]);

  function openAddModal() {
    setEditingId(null);

    setForm({
      ...defaultForm,
      date: new Date().toISOString().slice(0, 10),
    });

    setModalOpen(true);
  }

  function openEditModal(transaction) {
    setEditingId(transaction.id);

    setForm({
      description: transaction.description || "",
      amount: String(transaction.amount || ""),
      date: transaction.date,
      category: transaction.category || "Groceries",
      account: multipleAccountsEnabled
        ? transaction.account || ""
        : "",
      accountId: multipleAccountsEnabled
        ? transaction.accountId || ""
        : "",
      type: transaction.type || "expense",
      notes: transaction.notes || "",

isRecurring: false,
frequency: "monthly",
endDate: "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

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

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanedDescription = form.description.trim();
    const numericAmount = Number(form.amount);

    if (!cleanedDescription) {
      alert("Please enter a description.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Please enter an amount greater than $0.");
      return;
    }

    if (!form.date) {
      alert("Please select a transaction date.");
      return;
    }

    let selectedAccount = null;
    if (form.isRecurring && !form.frequency) {
  alert("Please select a recurring frequency.");
  return;
}

if (
  form.isRecurring &&
  form.endDate &&
  form.endDate < form.date
) {
  alert(
    "The recurring end date cannot be before the transaction date.",
  );
  return;
}

    if (multipleAccountsEnabled) {
      selectedAccount = accountOptions.find(
        (account) =>
          String(account.id) === String(form.accountId),
      );

      if (!selectedAccount) {
        alert("Please select an account.");
        return;
      }
    }

    const existingTransaction = editingId
      ? transactions.find(
          (transaction) => transaction.id === editingId,
        )
      : null;

    const transactionData = {
      description: cleanedDescription,
      amount: numericAmount,
      date: form.date,
      category: form.category,
      accountId: multipleAccountsEnabled
        ? selectedAccount.id
        : existingTransaction?.accountId || null,
      account: multipleAccountsEnabled
        ? selectedAccount.name
        : existingTransaction?.account || "",
      type: form.type,
      notes: form.notes.trim(),
       isRecurring: form.isRecurring,
  frequency: form.frequency,
  endDate: form.endDate || null,
    };

    try {
      setSaving(true);

      if (editingId) {
        const savedTransaction = await updateTransaction(
          editingId,
          transactionData,
        );

        setTransactions((currentTransactions) =>
          currentTransactions.map((transaction) =>
            transaction.id === editingId
              ? savedTransaction
              : transaction,
          ),
        );
      } else {
  let savedTransaction;

  if (form.isRecurring) {
    const result =
      await createTransactionWithRecurring(
        transactionData,
      );

    savedTransaction = result.transaction;
  } else {
    savedTransaction =
      await createTransaction(transactionData);
  }

  setTransactions((currentTransactions) => [
    savedTransaction,
    ...currentTransactions,
  ]);
}

      setModalOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    } catch (error) {
      console.error("Unable to save transaction:", error);

      alert(
        "The transaction could not be saved. Check the browser console and your Supabase connection.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTransaction(id) {
    const transaction = transactions.find(
      (item) => item.id === id,
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        transaction?.description || "this transaction"
      }?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      await deleteTransactionFromSupabase(id);

      setTransactions((currentTransactions) =>
        currentTransactions.filter(
          (currentTransaction) =>
            currentTransaction.id !== id,
        ),
      );
    } catch (error) {
      console.error("Unable to delete transaction:", error);

      alert(
        "The transaction could not be deleted. Check the browser console and your Supabase connection.",
      );
    } finally {
      setDeletingId(null);
    }
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
            {multipleAccountsEnabled
              ? "Add, review, search, categorize, and assign your income and purchases to accounts."
              : "Add, review, search, and categorize your income and purchases without selecting an account."}
          </p>
        </div>

        <div className="transaction-heading-actions no-print">
          <button
            className="secondary-button button-with-icon transaction-print-button"
            type="button"
            onClick={() => window.print()}
            disabled={loading}
          >
            <FiPrinter />
            Print transactions
          </button>

          <button
            className="primary-button button-with-icon"
            type="button"
            onClick={openAddModal}
            disabled={loading}
          >
            <FiPlus />
            Add transaction
          </button>
        </div>
      </div>

      <section className="print-only transactions-print-report">
        <header className="transactions-print-header">
          <div className="transactions-print-brand">
            <div className="transactions-print-logo">C</div>

            <div>
              <h1>ClearBudget Transactions Report</h1>
              <p>{reportPeriodLabel}</p>
            </div>
          </div>

          <div className="transactions-print-meta">
            <span>Printed</span>
            <strong>
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
          </div>
        </header>

        <div className="transactions-print-summary">
          <div>
            <span>Total income</span>
            <strong>{formatCurrency(filteredTotals.income)}</strong>
          </div>

          <div>
            <span>Total expenses</span>
            <strong>{formatCurrency(filteredTotals.expenses)}</strong>
          </div>

          <div>
            <span>Net cash flow</span>
            <strong>{formatCurrency(filteredTotals.balance)}</strong>
          </div>

          <div>
            <span>Transactions</span>
            <strong>{filteredTransactions.length}</strong>
          </div>
        </div>

        <div className="transactions-print-filter-note">
          This report reflects the filters currently selected on the Transactions page.
        </div>

        <table className="transactions-print-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              {multipleAccountsEnabled && <th>Account</th>}
              <th>Type</th>
              <th className="transactions-print-amount">Amount</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr key={`print-${transaction.id}`}>
                  <td>{formatTransactionDate(transaction.date)}</td>
                  <td>
                    <strong>{transaction.description}</strong>
                    {transaction.notes && (
                      <span className="transactions-print-notes">
                        {transaction.notes}
                      </span>
                    )}
                  </td>
                  <td>{transaction.category || "Other"}</td>
                  {multipleAccountsEnabled && (
                    <td>
                      {transaction.account || "Unassigned"}
                    </td>
                  )}
                  <td className="transactions-print-type">
                    {transaction.type === "income" ? "Income" : "Expense"}
                  </td>
                  <td className="transactions-print-amount">
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="transactions-print-empty"
                  colSpan={multipleAccountsEnabled ? 6 : 5}
                >
                  No transactions match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <footer className="transactions-print-footer">
          <span>ClearBudget · Transactions Report</span>
          <span className="transactions-print-page-number" />
        </footer>
      </section>

      {loadError && (
        <section className="content-card">
          <p className="table-empty-state">{loadError}</p>
        </section>
      )}

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
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          {multipleAccountsEnabled && (
            <select
              value={accountFilter}
              onChange={(event) =>
                setAccountFilter(event.target.value)
              }
            >
              <option value="all">All accounts</option>

              {accountOptions.map((account) => (
                <option
                  key={account.id}
                  value={account.name}
                >
                  {account.name}
                </option>
              ))}
            </select>
          )}

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
            <option value="all">
              Income and expenses
            </option>

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
                {multipleAccountsEnabled && (
                  <th>Account</th>
                )}
                <th>Type</th>

                <th className="table-amount-heading">
                  Amount
                </th>

                <th className="table-actions-heading">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    className="table-empty-state"
                    colSpan={
                      multipleAccountsEnabled ? 7 : 6
                    }
                  >
                    Loading transactions from Supabase...
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      {formatTransactionDate(
                        transaction.date,
                      )}
                    </td>

                    <td>
                      <div className="transaction-description-cell">
                        <strong>
                          {transaction.description}
                        </strong>

                        {transaction.notes && (
                          <span>{transaction.notes}</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="category-pill">
                        {transaction.category || "Other"}
                      </span>
                    </td>

                    {multipleAccountsEnabled && (
                      <td>
                        {transaction.account || "Unassigned"}
                      </td>
                    )}

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
                      {transaction.type === "income"
                        ? "+"
                        : "-"}

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
                          disabled={
                            deletingId === transaction.id
                          }
                        >
                          <FiEdit2 />
                        </button>

                        <button
                          type="button"
                          className="icon-button delete-icon-button"
                          onClick={() =>
                            handleDeleteTransaction(
                              transaction.id,
                            )
                          }
                          aria-label={`Delete ${transaction.description}`}
                          disabled={
                            deletingId === transaction.id
                          }
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
                    colSpan={
                      multipleAccountsEnabled ? 7 : 6
                    }
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
            onMouseDown={(event) =>
              event.stopPropagation()
            }
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
                disabled={saving}
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
                  disabled={saving}
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
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="transaction-date">
                  Date
                </label>

                <input
                  id="transaction-date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleInputChange}
                  disabled={saving}
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
                  disabled={saving}
                >
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {multipleAccountsEnabled && (
                <div className="form-field">
                  <label htmlFor="transaction-account">
                    Account
                  </label>

                  <select
                    id="transaction-account"
                    name="accountId"
                    value={form.accountId || ""}
                    onChange={(event) => {
                      const selectedId =
                        event.target.value;

                      const selectedAccount =
                        accountOptions.find(
                          (account) =>
                            String(account.id) ===
                            String(selectedId),
                        );

                      setForm((currentForm) => ({
                        ...currentForm,
                        accountId: selectedId,
                        account:
                          selectedAccount?.name || "",
                      }));
                    }}
                    disabled={saving || accountsLoading}
                  >
                    <option value="">
                      {accountsLoading
                        ? "Loading accounts..."
                        : "Select an account"}
                    </option>

                    {accountOptions.map((account) => (
                      <option
                        key={account.id}
                        value={account.id}
                      >
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                      disabled={saving}
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
                      disabled={saving}
                    />

                    Income
                  </label>
                </div>
              </div>
{!editingId && (
  <>
    <div className="form-field form-field-full">
      <label className="recurring-toggle">
        <input
          type="checkbox"
          checked={form.isRecurring}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              isRecurring: event.target.checked,
            }))
          }
        />

        <span>Make this a recurring transaction</span>
      </label>
    </div>

    

{form.isRecurring && (
  <>
    <div className="form-field">
      <label>Frequency</label>

      <select
        value={form.frequency}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            frequency: event.target.value,
          }))
        }
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="biweekly">
          Every 2 Weeks
        </option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>

    <div className="form-field">
      <label>End Date (optional)</label>

      <input
        type="date"
        value={form.endDate}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            endDate: event.target.value,
          }))
        }
      />
    </div>
  </>
)}
  </>
)}

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
                  disabled={saving}
                />
              </div>

              <div className="modal-actions form-field-full">
                <button
                  className="secondary-button modal-cancel-button"
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
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