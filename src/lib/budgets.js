export const BUDGETS_STORAGE_KEY = "clearbudget-budgets";
export const BUDGETS_UPDATED_EVENT = "clearbudget-budgets-updated";

const starterBudgets = [
  {
    id: crypto.randomUUID(),
    category: "Groceries",
    amount: 600,
  },
  {
    id: crypto.randomUUID(),
    category: "Dining",
    amount: 250,
  },
  {
    id: crypto.randomUUID(),
    category: "Transportation",
    amount: 350,
  },
];

export function loadBudgets() {
  const savedBudgets = localStorage.getItem(BUDGETS_STORAGE_KEY);

  if (!savedBudgets) {
    saveBudgets(starterBudgets);
    return starterBudgets;
  }

  try {
    const parsedBudgets = JSON.parse(savedBudgets);

    return Array.isArray(parsedBudgets)
      ? parsedBudgets
      : starterBudgets;
  } catch (error) {
    console.error("Unable to load budgets:", error);
    return starterBudgets;
  }
}

export function saveBudgets(budgets) {
  localStorage.setItem(
    BUDGETS_STORAGE_KEY,
    JSON.stringify(budgets),
  );

  window.dispatchEvent(
    new CustomEvent(BUDGETS_UPDATED_EVENT, {
      detail: budgets,
    }),
  );
}

export function subscribeToBudgets(callback) {
  function handleBudgetUpdate(event) {
    callback(event.detail ?? loadBudgets());
  }

  function handleStorageUpdate(event) {
    if (event.key === BUDGETS_STORAGE_KEY) {
      callback(loadBudgets());
    }
  }

  window.addEventListener(
    BUDGETS_UPDATED_EVENT,
    handleBudgetUpdate,
  );

  window.addEventListener("storage", handleStorageUpdate);

  return function unsubscribe() {
    window.removeEventListener(
      BUDGETS_UPDATED_EVENT,
      handleBudgetUpdate,
    );

    window.removeEventListener(
      "storage",
      handleStorageUpdate,
    );
  };
}

export function formatBudgetCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount || 0));
}

export function getCategorySpending(
  transactions,
  category,
  date = new Date(),
) {
  return transactions
    .filter((transaction) => {
      if (transaction.type !== "expense") {
        return false;
      }

      if (transaction.category !== category) {
        return false;
      }

      const transactionDate = new Date(
        `${transaction.date}T12:00:00`,
      );

      return (
        transactionDate.getFullYear() === date.getFullYear() &&
        transactionDate.getMonth() === date.getMonth()
      );
    })
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0,
    );
}

export function calculateBudgetDetails(
  budget,
  transactions,
  date = new Date(),
) {
  const limit = Number(budget.amount || 0);

  const spent = getCategorySpending(
    transactions,
    budget.category,
    date,
  );

  const remaining = limit - spent;

  const percentage =
    limit > 0 ? Math.round((spent / limit) * 100) : 0;

  return {
    ...budget,
    limit,
    spent,
    remaining,
    percentage,
    isOverBudget: spent > limit,
  };
}

export function calculateBudgetTotals(
  budgets,
  transactions,
  date = new Date(),
) {
  const details = budgets.map((budget) =>
    calculateBudgetDetails(
      budget,
      transactions,
      date,
    ),
  );

  const totalBudgeted = details.reduce(
    (total, budget) => total + budget.limit,
    0,
  );

  const totalSpent = details.reduce(
    (total, budget) => total + budget.spent,
    0,
  );

  const totalRemaining = totalBudgeted - totalSpent;

  const overBudgetCount = details.filter(
    (budget) => budget.isOverBudget,
  ).length;

  const percentage =
    totalBudgeted > 0
      ? Math.round((totalSpent / totalBudgeted) * 100)
      : 0;

  return {
    totalBudgeted,
    totalSpent,
    totalRemaining,
    overBudgetCount,
    percentage,
  };
}