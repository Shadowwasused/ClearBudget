import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiDollarSign,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTarget,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import {
  calculateGoalDetails,
  calculateGoalTotals,
  formatGoalCurrency,
  formatGoalDate,
  saveGoals,
} from "../lib/goals";

import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal as deleteGoalFromSupabase,
  addContribution,
} from "../lib/goalsApi";

const defaultGoalForm = {
  name: "",
  targetAmount: "",
  currentAmount: "",
  targetDate: "",
  monthlyContribution: "",
  notes: "",
};

function Goals() {
  const [goals, setGoals] = useState([]);

const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [deletingId, setDeletingId] = useState(null);
const [loadError, setLoadError] = useState("");
  const [goalForm, setGoalForm] = useState(defaultGoalForm);
  const [contributionAmount, setContributionAmount] =
    useState("");

  const [editingId, setEditingId] = useState(null);
  const [contributionGoal, setContributionGoal] =
    useState(null);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [contributionModalOpen, setContributionModalOpen] =
    useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

 useEffect(() => {
  let active = true;

  async function loadSupabaseGoals() {
    try {
      setLoading(true);
      setLoadError("");

      const data = await fetchGoals();

      if (!active) return;

      setGoals(data);

      // Temporary bridge while the rest of the app
      // still reads localStorage.
      saveGoals(data);
    } catch (error) {
      console.error(error);

      if (active) {
        setLoadError(
          "Unable to load goals from Supabase.",
        );
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  loadSupabaseGoals();

  return () => {
    active = false;
  };
}, []);
useEffect(() => {
  if (loading) return;

  saveGoals(goals);
}, [goals, loading]);

  const goalDetails = useMemo(
    () => goals.map(calculateGoalDetails),
    [goals],
  );

  const totals = useMemo(
    () => calculateGoalTotals(goals),
    [goals],
  );

  const filteredGoals = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return goalDetails
      .filter((goal) => {
        const matchesSearch = goal.name
          .toLowerCase()
          .includes(searchText);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && !goal.isComplete) ||
          (statusFilter === "complete" && goal.isComplete);

        return matchesSearch && matchesStatus;
      })
      .sort((firstGoal, secondGoal) => {
        if (firstGoal.isComplete !== secondGoal.isComplete) {
          return firstGoal.isComplete ? 1 : -1;
        }

        return firstGoal.name.localeCompare(secondGoal.name);
      });
  }, [goalDetails, search, statusFilter]);

  function openAddModal() {
    setEditingId(null);
    setGoalForm(defaultGoalForm);
    setGoalModalOpen(true);
  }

  function openEditModal(goal) {
    setEditingId(goal.id);

    setGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate || "",
      monthlyContribution:
        goal.monthlyContribution?.toString() || "",
      notes: goal.notes || "",
    });

    setGoalModalOpen(true);
  }

  function closeGoalModal() {
    setGoalModalOpen(false);
    setEditingId(null);
    setGoalForm(defaultGoalForm);
  }

  function handleGoalInputChange(event) {
    const { name, value } = event.target;

    setGoalForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleGoalSubmit(event) {
  event.preventDefault();

  const name = goalForm.name.trim();
  const targetAmount = Number(goalForm.targetAmount);
  const currentAmount = Number(
    goalForm.currentAmount || 0,
  );
  const monthlyContribution = Number(
    goalForm.monthlyContribution || 0,
  );

  if (!name) {
    alert("Please enter a goal name.");
    return;
  }

  if (
    !Number.isFinite(targetAmount) ||
    targetAmount <= 0
  ) {
    alert("Please enter a target amount greater than $0.");
    return;
  }

  if (
    !Number.isFinite(currentAmount) ||
    !Number.isFinite(monthlyContribution) ||
    currentAmount < 0 ||
    monthlyContribution < 0
  ) {
    alert("Savings amounts cannot be negative.");
    return;
  }

  const goalData = {
    name,
    targetAmount,
    currentAmount,
    targetDate: goalForm.targetDate,
    monthlyContribution,
    notes: goalForm.notes.trim(),
  };

  try {
    setSaving(true);

    if (editingId) {
      const savedGoal = await updateGoal(
        editingId,
        goalData,
      );

      setGoals((currentGoals) =>
        currentGoals.map((goal) =>
          goal.id === editingId ? savedGoal : goal,
        ),
      );
    } else {
      const savedGoal = await createGoal(goalData);

      setGoals((currentGoals) => [
        ...currentGoals,
        savedGoal,
      ]);
    }

    closeGoalModal();
  } catch (error) {
    console.error("Unable to save goal:", error);

    alert(
      "The savings goal could not be saved. Check the browser console and Supabase connection.",
    );
  } finally {
    setSaving(false);
  }
}

async function handleDeleteGoal(id) {
  const goal = goals.find((item) => item.id === id);

  const confirmed = window.confirm(
    `Are you sure you want to delete ${
      goal?.name || "this savings goal"
    }?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingId(id);

    await deleteGoalFromSupabase(id);

    setGoals((currentGoals) =>
      currentGoals.filter(
        (currentGoal) => currentGoal.id !== id,
      ),
    );
  } catch (error) {
    console.error("Unable to delete goal:", error);

    alert(
      "The savings goal could not be deleted. Check the browser console and Supabase connection.",
    );
  } finally {
    setDeletingId(null);
  }
}

function openContributionModal(goal) {
  setContributionGoal(goal);
  setContributionAmount("");
  setContributionModalOpen(true);
}

function closeContributionModal() {
  setContributionModalOpen(false);
  setContributionGoal(null);
  setContributionAmount("");
}

async function handleContributionSubmit(event) {
  event.preventDefault();

  const amount = Number(contributionAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a contribution greater than $0.");
    return;
  }

  if (!contributionGoal) {
    return;
  }

  try {
    setSaving(true);

    const savedGoal = await addContribution(
      contributionGoal.id,
      amount,
      contributionGoal.currentAmount,
    );

    setGoals((currentGoals) =>
      currentGoals.map((goal) =>
        goal.id === savedGoal.id ? savedGoal : goal,
      ),
    );

    closeContributionModal();
  } catch (error) {
    console.error(
      "Unable to add goal contribution:",
      error,
    );

    alert(
      "The contribution could not be saved. Check the browser console and Supabase connection.",
    );
  } finally {
    setSaving(false);
  }
}


  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            Long-term financial planning
          </p>

          <h1>Savings Goals</h1>

          <p className="page-description">
            Create goals, record contributions, and monitor your
            progress.
          </p>
        </div>

        <button
          className="primary-button button-with-icon"
          type="button"
          onClick={openAddModal}
        >
          <FiPlus />
          Add goal
        </button>
      </div>

      <div className="goal-summary-grid">
        <section className="summary-card">
          <p>Total goal amount</p>
          <h2>{formatGoalCurrency(totals.totalTarget)}</h2>
          <span>{goals.length} savings goals</span>
        </section>

        <section className="summary-card">
          <p>Total saved</p>
          <h2 className="money-positive">
            {formatGoalCurrency(totals.totalSaved)}
          </h2>
          <span>{totals.percentage}% funded</span>
        </section>

        <section className="summary-card">
          <p>Still needed</p>
          <h2>{formatGoalCurrency(totals.totalRemaining)}</h2>
          <span>Across all active goals</span>
        </section>

        <section className="summary-card">
          <p>Completed</p>
          <h2 className="money-positive">
            {totals.completedCount}
          </h2>
          <span>Goals reached</span>
        </section>
      </div>

      <section className="content-card">
        <div className="goal-toolbar">
          <div className="transaction-search">
            <FiSearch />

            <input
              type="search"
              placeholder="Search goals..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">All goals</option>
            <option value="active">Active goals</option>
            <option value="complete">Completed goals</option>
          </select>
        </div>

        {filteredGoals.length > 0 ? (
          <div className="goal-card-grid">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEditModal}
                onDelete={handleDeleteGoal}
                onContribute={openContributionModal}
              />
            ))}
          </div>
        ) : (
          <div className="goal-empty-state">
            <FiTarget />
            <strong>No savings goals found</strong>
            <span>
              Create a goal to start tracking your progress.
            </span>
          </div>
        )}
      </section>

      {goalModalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={closeGoalModal}
          role="presentation"
        >
          <div
            className="transaction-modal goal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-modal-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  Savings target
                </p>

                <h2 id="goal-modal-title">
                  {editingId ? "Edit goal" : "Add goal"}
                </h2>
              </div>

              <button
                className="modal-close-button"
                type="button"
                onClick={closeGoalModal}
                aria-label="Close goal form"
              >
                <FiX />
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={handleGoalSubmit}
            >
              <div className="form-field form-field-full">
                <label htmlFor="goal-name">Goal name</label>

                <input
                  id="goal-name"
                  name="name"
                  type="text"
                  placeholder="Example: Emergency Fund"
                  value={goalForm.name}
                  onChange={handleGoalInputChange}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="goal-target">
                  Target amount
                </label>

                <div className="currency-input">
                  <span>$</span>

                  <input
                    id="goal-target"
                    name="targetAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={goalForm.targetAmount}
                    onChange={handleGoalInputChange}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="goal-current">
                  Already saved
                </label>

                <div className="currency-input">
                  <span>$</span>

                  <input
                    id="goal-current"
                    name="currentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={goalForm.currentAmount}
                    onChange={handleGoalInputChange}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="goal-contribution">
                  Monthly contribution
                </label>

                <div className="currency-input">
                  <span>$</span>

                  <input
                    id="goal-contribution"
                    name="monthlyContribution"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={goalForm.monthlyContribution}
                    onChange={handleGoalInputChange}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="goal-date">
                  Target date
                </label>

                <input
                  id="goal-date"
                  name="targetDate"
                  type="date"
                  value={goalForm.targetDate}
                  onChange={handleGoalInputChange}
                />
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="goal-notes">Notes</label>

                <textarea
                  id="goal-notes"
                  name="notes"
                  rows="3"
                  placeholder="Optional details about this goal"
                  value={goalForm.notes}
                  onChange={handleGoalInputChange}
                />
              </div>

              <div className="modal-actions form-field-full">
                <button
                  className="secondary-button modal-cancel-button"
                  type="button"
                  onClick={closeGoalModal}
                >
                  Cancel
                </button>

                <button className="primary-button" type="submit">
                  {editingId ? "Save changes" : "Save goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {contributionModalOpen && contributionGoal && (
        <div
          className="modal-backdrop"
          onMouseDown={closeContributionModal}
          role="presentation"
        >
          <div
            className="transaction-modal contribution-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contribution-modal-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  Record savings
                </p>

                <h2 id="contribution-modal-title">
                  Add contribution
                </h2>
              </div>

              <button
                className="modal-close-button"
                type="button"
                onClick={closeContributionModal}
                aria-label="Close contribution form"
              >
                <FiX />
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={handleContributionSubmit}
            >
              <div className="contribution-goal-name form-field-full">
                <span>Adding savings to</span>
                <strong>{contributionGoal.name}</strong>
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="contribution-amount">
                  Contribution amount
                </label>

                <div className="currency-input">
                  <span>$</span>

                  <input
                    id="contribution-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={contributionAmount}
                    onChange={(event) =>
                      setContributionAmount(event.target.value)
                    }
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-actions form-field-full">
                <button
                  className="secondary-button modal-cancel-button"
                  type="button"
                  onClick={closeContributionModal}
                >
                  Cancel
                </button>

                <button className="primary-button" type="submit">
                  Add contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onContribute,
}) {
  const visiblePercentage = Math.min(
    Math.max(goal.percentage, 0),
    100,
  );

  return (
    <article
      className={`goal-card ${
        goal.isComplete ? "goal-card-complete" : ""
      }`}
    >
      <div className="goal-card-heading">
        <div className="goal-title-area">
          <div className="goal-icon">
            {goal.isComplete ? <FiCheckCircle /> : <FiTarget />}
          </div>

          <div>
            <p>
              {goal.isComplete
                ? "Goal completed"
                : "Savings goal"}
            </p>

            <h3>{goal.name}</h3>
          </div>
        </div>

        <div className="goal-card-actions">
          <button
            className="icon-button"
            type="button"
            onClick={() => onEdit(goal)}
            aria-label={`Edit ${goal.name}`}
          >
            <FiEdit2 />
          </button>

          <button
            className="icon-button delete-icon-button"
            type="button"
            onClick={() => onDelete(goal.id)}
            aria-label={`Delete ${goal.name}`}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className="goal-amount-row">
        <div>
          <span>Saved</span>
          <strong>
            {formatGoalCurrency(goal.currentAmount)}
          </strong>
        </div>

        <div>
          <span>Target</span>
          <strong>
            {formatGoalCurrency(goal.targetAmount)}
          </strong>
        </div>
      </div>

      <div className="goal-progress-heading">
        <span>{goal.percentage}% complete</span>

        <strong>
          {goal.isComplete
            ? "Complete"
            : `${formatGoalCurrency(goal.remaining)} remaining`}
        </strong>
      </div>

      <div className="goal-progress-track">
        <div
          className="goal-progress-fill"
          style={{
            width: `${visiblePercentage}%`,
          }}
        />
      </div>

      <div className="goal-details-grid">
        <div>
          <span>Target date</span>
          <strong>{formatGoalDate(goal.targetDate)}</strong>
        </div>

        <div>
          <span>Monthly plan</span>
          <strong>
            {formatGoalCurrency(goal.monthlyContribution)}
          </strong>
        </div>

        <div>
          <span>Estimated time</span>
          <strong>
            {goal.isComplete
              ? "Completed"
              : goal.monthsRemaining > 0
                ? `${goal.monthsRemaining} months`
                : "No estimate"}
          </strong>
        </div>
      </div>

      {goal.notes && (
        <p className="goal-notes">{goal.notes}</p>
      )}

      <button
        className="goal-contribution-button"
        type="button"
        onClick={() => onContribute(goal)}
        disabled={goal.isComplete}
      >
        <FiDollarSign />
        {goal.isComplete ? "Goal reached" : "Add contribution"}
      </button>
    </article>
  );
}

export default Goals;