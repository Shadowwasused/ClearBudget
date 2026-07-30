import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import {
  calculateBudgetDetails,
  calculateBudgetTotals,
  formatBudgetCurrency,
  saveBudgets,
} from "../lib/budgets";

import {
  createBudget,
  deleteBudget as deleteBudgetFromSupabase,
  fetchBudgets,
  updateBudget,
} from "../lib/budgetsApi";

import {
  categories,
  loadTransactions,
  subscribeToTransactions,
} from "../lib/transactions";

const defaultForm = {
  category: "",
  amount: "",
};

function Budget() {
  const [budgets, setBudgets] = useState([]);

  const [transactions, setTransactions] = useState(
    loadTransactions,
  );

  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [loadError, setLoadError] = useState("");

  const currentDate = useMemo(() => new Date(), []);

  useEffect(() => {
    let active = true;

    async function loadSupabaseBudgets() {
      try {
        setLoading(true);
        setLoadError("");

        const data = await fetchBudgets();

        if (!active) {
          return;
        }

        setBudgets(data);

        // Temporary bridge for other pages still using localStorage.
        saveBudgets(data);
      } catch (error) {
        console.error(
          "Unable to load Supabase budgets:",
          error,
        );

        if (active) {
          setLoadError(
            "Budgets could not be loaded. Check your Supabase connection.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSupabaseBudgets();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    // Temporary compatibility bridge during migration.
    saveBudgets(budgets);
  }, [budgets, loading]);

  useEffect(() => {
    const unsubscribe =
      subscribeToTransactions(setTransactions);

    return unsubscribe;
  }, []);

  const budgetDetails = useMemo(() => {
    return budgets.map((budget) =>
      calculateBudgetDetails(
        budget,
        transactions,
        currentDate,
      ),
    );
  }, [budgets, transactions, currentDate]);

  const filteredBudgets = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return budgetDetails
      .filter((budget) =>
        String(budget.category || "")
          .toLowerCase()
          .includes(searchText),
      )
      .sort((firstBudget, secondBudget) =>
        String(firstBudget.category || "").localeCompare(
          String(secondBudget.category || ""),
        ),
      );
  }, [budgetDetails, search]);

  const totals = useMemo(
    () =>
      calculateBudgetTotals(
        budgets,
        transactions,
        currentDate,
      ),
    [budgets, transactions, currentDate],
  );

  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  const availableCategories = categories.filter(
    (category) =>
      !budgets.some(
        (budget) => budget.category === category,
      ),
  );

  function openAddModal() {
    setEditingId(null);

    setForm({
      category:
        availableCategories[0] || categories[0] || "",
      amount: "",
    });

    setModalOpen(true);
  }

  function openEditModal(budget) {
    setEditingId(budget.id);

    setForm({
      category: budget.category,
      amount: String(budget.amount || budget.limit || ""),
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

    const numericAmount = Number(form.amount);

    if (!form.category) {
      alert("Please select a category.");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      alert("Please enter a budget greater than $0.");
      return;
    }

    const categoryAlreadyUsed = budgets.some(
      (budget) =>
        budget.category === form.category &&
        budget.id !== editingId,
    );

    if (categoryAlreadyUsed) {
      alert(
        "A budget already exists for this category.",
      );

      return;
    }

    const budgetData = {
      category: form.category,
      amount: numericAmount,
    };

    try {
      setSaving(true);

      if (editingId) {
        const savedBudget = await updateBudget(
          editingId,
          budgetData,
        );

        setBudgets((currentBudgets) =>
          currentBudgets.map((budget) =>
            budget.id === editingId
              ? savedBudget
              : budget,
          ),
        );
      } else {
        const savedBudget =
          await createBudget(budgetData);

        setBudgets((currentBudgets) => [
          ...currentBudgets,
          savedBudget,
        ]);
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    } catch (error) {
      console.error("Unable to save budget:", error);

      alert(
        "The budget could not be saved. Check the browser console and your Supabase connection.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBudget(id) {
    const budget = budgets.find(
      (item) => item.id === id,
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete the ${
        budget?.category || "selected"
      } budget?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      await deleteBudgetFromSupabase(id);

      setBudgets((currentBudgets) =>
        currentBudgets.filter(
          (currentBudget) => currentBudget.id !== id,
        ),
      );
    } catch (error) {
      console.error("Unable to delete budget:", error);

      alert(
        "The budget could not be deleted. Check the browser console and your Supabase connection.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            Monthly spending plan
          </p>

          <h1>Budget</h1>

          <p className="page-description">
            Set category limits and compare them with your
            actual spending.
          </p>
        </div>

        <button
          className="primary-button button-with-icon"
          type="button"
          onClick={openAddModal}
          disabled={
            loading ||
            availableCategories.length === 0
          }
        >
          <FiPlus />
          Add budget
        </button>
      </div>

      {loadError && (
        <section className="content-card">
          <p className="table-empty-state">
            {loadError}
          </p>
        </section>
      )}

      <div className="budget-summary-grid">
        <section className="summary-card">
          <p>Total budgeted</p>

          <h2>
            {formatBudgetCurrency(
              totals.totalBudgeted,
            )}
          </h2>

          <span>{monthName}</span>
        </section>

        <section className="summary-card">
          <p>Total spent</p>

          <h2 className="money-negative">
            {formatBudgetCurrency(totals.totalSpent)}
          </h2>

          <span>{totals.percentage}% used</span>
        </section>

        <section className="summary-card">
          <p>Remaining</p>

          <h2
            className={
              totals.totalRemaining >= 0
                ? "money-positive"
                : "money-negative"
            }
          >
            {formatBudgetCurrency(
              totals.totalRemaining,
            )}
          </h2>

          <span>
            {totals.totalRemaining >= 0
              ? "Available to spend"
              : "Over total budget"}
          </span>
        </section>

        <section className="summary-card">
          <p>Over budget</p>

          <h2
            className={
              totals.overBudgetCount > 0
                ? "money-negative"
                : "money-positive"
            }
          >
            {totals.overBudgetCount}
          </h2>

          <span>
            {totals.overBudgetCount === 1
              ? "Category"
              : "Categories"}
          </span>
        </section>
      </div>

      <section className="content-card">
        <div className="budget-toolbar">
          <div className="transaction-search">
            <FiSearch />

            <input
              type="search"
              placeholder="Search budgets..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <span className="budget-month-pill">
            {monthName}
          </span>
        </div>

        {loading ? (
          <div className="budget-empty-state">
            <strong>Loading budgets...</strong>

            <span>
              Retrieving your budgets from Supabase.
            </span>
          </div>
        ) : filteredBudgets.length > 0 ? (
          <div className="budget-card-grid">
            {filteredBudgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={openEditModal}
                onDelete={handleDeleteBudget}
                deleting={
                  deletingId === budget.id
                }
              />
            ))}
          </div>
        ) : (
          <div className="budget-empty-state">
            <strong>No budgets found</strong>

            <span>
              Add a category budget to begin tracking
              monthly spending.
            </span>
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={closeModal}
          role="presentation"
        >
          <div
            className="transaction-modal budget-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-modal-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  Monthly category limit
                </p>

                <h2 id="budget-modal-title">
                  {editingId
                    ? "Edit budget"
                    : "Add budget"}
                </h2>
              </div>

              <button
                className="modal-close-button"
                type="button"
                onClick={closeModal}
                aria-label="Close budget form"
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
                <label htmlFor="budget-category">
                  Category
                </label>

                <select
                  id="budget-category"
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  disabled={saving}
                >
                  {categories.map((category) => {
                    const usedByAnotherBudget =
                      budgets.some(
                        (budget) =>
                          budget.category === category &&
                          budget.id !== editingId,
                      );

                    return (
                      <option
                        key={category}
                        value={category}
                        disabled={usedByAnotherBudget}
                      >
                        {category}
                        {usedByAnotherBudget
                          ? " — already budgeted"
                          : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="budget-amount">
                  Monthly limit
                </label>

                <div className="currency-input">
                  <span>$</span>

                  <input
                    id="budget-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={handleInputChange}
                    autoFocus
                    disabled={saving}
                  />
                </div>
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
                      : "Save budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetCard({
  budget,
  onEdit,
  onDelete,
  deleting,
}) {
  const visiblePercentage = Math.min(
    Math.max(budget.percentage, 0),
    100,
  );

  let statusLabel = "On track";
  let statusClass = "budget-status-good";

  if (budget.isOverBudget) {
    statusLabel = "Over budget";
    statusClass = "budget-status-over";
  } else if (budget.percentage >= 80) {
    statusLabel = "Almost reached";
    statusClass = "budget-status-warning";
  }

  return (
    <article className="budget-card">
      <div className="budget-card-heading">
        <div>
          <p>Category budget</p>
          <h3>{budget.category}</h3>
        </div>

        <div className="budget-card-actions">
          <button
            className="icon-button"
            type="button"
            onClick={() => onEdit(budget)}
            aria-label={`Edit ${budget.category} budget`}
            disabled={deleting}
          >
            <FiEdit2 />
          </button>

          <button
            className="icon-button delete-icon-button"
            type="button"
            onClick={() => onDelete(budget.id)}
            aria-label={`Delete ${budget.category} budget`}
            disabled={deleting}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className="budget-card-numbers">
        <div>
          <span>Spent</span>

          <strong>
            {formatBudgetCurrency(budget.spent)}
          </strong>
        </div>

        <div>
          <span>Limit</span>

          <strong>
            {formatBudgetCurrency(budget.limit)}
          </strong>
        </div>
      </div>

      <div className="budget-progress-heading">
        <span>{budget.percentage}% used</span>

        <span
          className={`budget-status ${statusClass}`}
        >
          {budget.isOverBudget && <FiAlertTriangle />}
          {statusLabel}
        </span>
      </div>

      <div className="budget-progress-track">
        <div
          className={`budget-progress-fill ${
            budget.isOverBudget
              ? "budget-progress-over"
              : budget.percentage >= 80
                ? "budget-progress-warning"
                : ""
          }`}
          style={{
            width: `${visiblePercentage}%`,
          }}
        />
      </div>

      <div className="budget-card-footer">
        <span>
          {budget.remaining >= 0
            ? "Remaining"
            : "Over by"}
        </span>

        <strong
          className={
            budget.remaining >= 0
              ? "money-positive"
              : "money-negative"
          }
        >
          {formatBudgetCurrency(
            Math.abs(budget.remaining),
          )}
        </strong>
      </div>
    </article>
  );
}

export default Budget;