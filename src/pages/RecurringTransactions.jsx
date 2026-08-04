import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiEdit2,
  FiPause,
  FiPlay,
  FiPlus,
  FiRefreshCw,
  FiRepeat,
  FiTrash2,
} from "react-icons/fi";

import {
  deleteRecurringTransaction,
  getRecurringTransactions,
  toggleRecurringTransaction,
} from "../lib/recurringTransactionsApi";

import "./RecurringTransactions.css";

const frequencyLabels = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  yearly: "Yearly",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function RecurringTransactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const activeItems = useMemo(
    () => items.filter((item) => item.is_active),
    [items],
  );

  const monthlyIncome = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.is_active &&
            item.type === "income" &&
            item.frequency === "monthly",
        )
        .reduce(
          (total, item) =>
            total + Number(item.amount || 0),
          0,
        ),
    [items],
  );

  const monthlyExpenses = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.is_active &&
            item.type === "expense" &&
            item.frequency === "monthly",
        )
        .reduce(
          (total, item) =>
            total + Number(item.amount || 0),
          0,
        ),
    [items],
  );

  async function loadItems(showRefresh = false) {
    try {
      setErrorMessage("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getRecurringTransactions();
      setItems(data);
    } catch (error) {
      console.error(
        "Unable to load recurring transactions:",
        error,
      );

      setErrorMessage(
        error?.message ||
          "Recurring transactions could not be loaded.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleToggle(item) {
    try {
      setUpdatingId(item.id);
      setErrorMessage("");

      const updated =
        await toggleRecurringTransaction(
          item.id,
          !item.is_active,
        );

      setItems((current) =>
        current.map((existing) =>
          existing.id === item.id
            ? updated
            : existing,
        ),
      );
    } catch (error) {
      console.error(
        "Unable to update recurring transaction:",
        error,
      );

      setErrorMessage(
        error?.message ||
          "The recurring transaction could not be updated.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete "${item.description}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(item.id);
      setErrorMessage("");

      await deleteRecurringTransaction(item.id);

      setItems((current) =>
        current.filter(
          (existing) => existing.id !== item.id,
        ),
      );
    } catch (error) {
      console.error(
        "Unable to delete recurring transaction:",
        error,
      );

      setErrorMessage(
        error?.message ||
          "The recurring transaction could not be deleted.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading recurring-page-heading">
        <div>
          <p className="page-eyebrow">
            Automated money tracking
          </p>

          <h1>Recurring Transactions</h1>

          <p className="page-description">
            Manage repeating income, expenses, subscriptions,
            and scheduled payments.
          </p>
        </div>

        <div className="recurring-heading-actions">
          <button
            className="secondary-button button-with-icon"
            type="button"
            onClick={() => loadItems(true)}
            disabled={refreshing}
          >
            <FiRefreshCw />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="primary-button button-with-icon"
            type="button"
            onClick={() =>
              alert(
                "The new recurring transaction form is the next step.",
              )
            }
          >
            <FiPlus />
            New recurring transaction
          </button>
        </div>
      </div>

      {errorMessage && (
        <section className="content-card">
          <p className="money-negative">
            {errorMessage}
          </p>
        </section>
      )}

      <section className="recurring-summary-grid">
        <article className="recurring-summary-card">
          <span>Active schedules</span>
          <strong>{activeItems.length}</strong>
          <small>
            {items.length} total recurring items
          </small>
        </article>

        <article className="recurring-summary-card">
          <span>Monthly recurring income</span>
          <strong className="money-positive">
            {formatCurrency(monthlyIncome)}
          </strong>
          <small>Monthly schedules only</small>
        </article>

        <article className="recurring-summary-card">
          <span>Monthly recurring expenses</span>
          <strong className="money-negative">
            {formatCurrency(monthlyExpenses)}
          </strong>
          <small>Monthly schedules only</small>
        </article>
      </section>

      {loading ? (
        <section className="content-card recurring-empty-state">
          <FiRefreshCw />
          <strong>
            Loading recurring transactions...
          </strong>
        </section>
      ) : items.length === 0 ? (
        <section className="content-card recurring-empty-state">
          <FiRepeat />

          <strong>
            No recurring transactions yet
          </strong>

          <span>
            Add regular income, bills, subscriptions, or
            other repeating transactions.
          </span>

          <button
            className="primary-button button-with-icon"
            type="button"
            onClick={() =>
              alert(
                "The recurring transaction form is the next step.",
              )
            }
          >
            <FiPlus />
            Add your first schedule
          </button>
        </section>
      ) : (
        <section className="recurring-list">
          {items.map((item) => (
            <article
              className={`recurring-card ${
                item.is_active
                  ? ""
                  : "recurring-card-paused"
              }`}
              key={item.id}
            >
              <div
                className={`recurring-type-icon recurring-type-${item.type}`}
              >
                <FiRepeat />
              </div>

              <div className="recurring-card-main">
                <div className="recurring-card-heading">
                  <div>
                    <span
                      className={`recurring-type-label recurring-type-label-${item.type}`}
                    >
                      {item.type}
                    </span>

                    <h2>{item.description}</h2>
                  </div>

                  <strong
                    className={
                      item.type === "income"
                        ? "money-positive"
                        : "money-negative"
                    }
                  >
                    {item.type === "expense"
                      ? "-"
                      : "+"}
                    {formatCurrency(item.amount)}
                  </strong>
                </div>

                <div className="recurring-card-details">
                  <span>
                    <FiRepeat />
                    {frequencyLabels[item.frequency] ||
                      item.frequency}
                  </span>

                  <span>
                    <FiCalendar />
                    Next: {formatDate(item.next_run_date)}
                  </span>

                  <span
                    className={
                      item.is_active
                        ? "recurring-status-active"
                        : "recurring-status-paused"
                    }
                  >
                    {item.is_active
                      ? "Active"
                      : "Paused"}
                  </span>
                </div>

                {item.category && (
                  <p className="recurring-card-category">
                    Category: {item.category}
                  </p>
                )}

                {item.notes && (
                  <p className="recurring-card-notes">
                    {item.notes}
                  </p>
                )}

                <div className="recurring-card-actions">
                  <button
                    type="button"
                    disabled={updatingId === item.id}
                    onClick={() =>
                      alert(
                        "Editing will be added with the form in the next step.",
                      )
                    }
                  >
                    <FiEdit2 />
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={updatingId === item.id}
                    onClick={() => handleToggle(item)}
                  >
                    {item.is_active ? (
                      <FiPause />
                    ) : (
                      <FiPlay />
                    )}

                    {item.is_active ? "Pause" : "Resume"}
                  </button>

                  <button
                    className="recurring-delete-button"
                    type="button"
                    disabled={updatingId === item.id}
                    onClick={() => handleDelete(item)}
                  >
                    <FiTrash2 />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default RecurringTransactions;