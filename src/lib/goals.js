export const GOALS_STORAGE_KEY = "clearbudget-savings-goals";
export const GOALS_UPDATED_EVENT = "clearbudget-goals-updated";

const starterGoals = [
  {
    id: crypto.randomUUID(),
    name: "Emergency Fund",
    targetAmount: 10000,
    currentAmount: 2500,
    targetDate: "2027-07-01",
    monthlyContribution: 400,
    notes: "Build six months of emergency savings.",
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Vacation",
    targetAmount: 3000,
    currentAmount: 750,
    targetDate: "2027-03-01",
    monthlyContribution: 250,
    notes: "",
    createdAt: new Date().toISOString(),
  },
];

export function loadGoals() {
  const savedGoals = localStorage.getItem(GOALS_STORAGE_KEY);

  if (!savedGoals) {
    saveGoals(starterGoals);
    return starterGoals;
  }

  try {
    const parsedGoals = JSON.parse(savedGoals);

    return Array.isArray(parsedGoals)
      ? parsedGoals
      : starterGoals;
  } catch (error) {
    console.error("Unable to load savings goals:", error);
    return starterGoals;
  }
}

export function saveGoals(goals) {
  localStorage.setItem(
    GOALS_STORAGE_KEY,
    JSON.stringify(goals),
  );

  window.dispatchEvent(
    new CustomEvent(GOALS_UPDATED_EVENT, {
      detail: goals,
    }),
  );
}

export function subscribeToGoals(callback) {
  function handleGoalUpdate(event) {
    callback(event.detail ?? loadGoals());
  }

  function handleStorageUpdate(event) {
    if (event.key === GOALS_STORAGE_KEY) {
      callback(loadGoals());
    }
  }

  window.addEventListener(
    GOALS_UPDATED_EVENT,
    handleGoalUpdate,
  );

  window.addEventListener("storage", handleStorageUpdate);

  return function unsubscribe() {
    window.removeEventListener(
      GOALS_UPDATED_EVENT,
      handleGoalUpdate,
    );

    window.removeEventListener(
      "storage",
      handleStorageUpdate,
    );
  };
}

export function formatGoalCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount || 0));
}

export function formatGoalDate(date) {
  if (!date) {
    return "No target date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function calculateGoalDetails(goal) {
  const targetAmount = Number(goal.targetAmount || 0);
  const currentAmount = Number(goal.currentAmount || 0);
  const monthlyContribution = Number(
    goal.monthlyContribution || 0,
  );

  const remaining = Math.max(
    targetAmount - currentAmount,
    0,
  );

  const percentage =
    targetAmount > 0
      ? Math.round((currentAmount / targetAmount) * 100)
      : 0;

  const monthsRemaining =
    remaining > 0 && monthlyContribution > 0
      ? Math.ceil(remaining / monthlyContribution)
      : 0;

  const isComplete =
    targetAmount > 0 && currentAmount >= targetAmount;

  return {
    ...goal,
    targetAmount,
    currentAmount,
    monthlyContribution,
    remaining,
    percentage,
    monthsRemaining,
    isComplete,
  };
}

export function calculateGoalTotals(goals) {
  const goalDetails = goals.map(calculateGoalDetails);

  const totalTarget = goalDetails.reduce(
    (total, goal) => total + goal.targetAmount,
    0,
  );

  const totalSaved = goalDetails.reduce(
    (total, goal) => total + goal.currentAmount,
    0,
  );

  const totalRemaining = Math.max(
    totalTarget - totalSaved,
    0,
  );

  const completedCount = goalDetails.filter(
    (goal) => goal.isComplete,
  ).length;

  const percentage =
    totalTarget > 0
      ? Math.round((totalSaved / totalTarget) * 100)
      : 0;

  return {
    totalTarget,
    totalSaved,
    totalRemaining,
    completedCount,
    percentage,
  };
}