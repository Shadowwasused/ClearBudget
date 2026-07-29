export const TRANSACTIONS_STORAGE_KEY = "clearbudget-transactions";
export const TRANSACTIONS_UPDATED_EVENT =
  "clearbudget-transactions-updated";

export const categories = [
  "Groceries",
  "Dining",
  "Transportation",
  "Housing",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Healthcare",
  "Income",
  "Other",
];

export const accounts = [
  "Checking",
  "Savings",
  "Credit Card",
  "Cash",
];

export const starterTransactions = [
  {
    id: crypto.randomUUID(),
    description: "Walmart",
    amount: 128.43,
    date: "2026-07-29",
    category: "Groceries",
    account: "Checking",
    type: "expense",
    notes: "",
  },
  {
    id: crypto.randomUUID(),
    description: "Payroll Deposit",
    amount: 2800,
    date: "2026-07-28",
    category: "Income",
    account: "Checking",
    type: "income",
    notes: "",
  },
  {
    id: crypto.randomUUID(),
    description: "Shell",
    amount: 54.18,
    date: "2026-07-27",
    category: "Transportation",
    account: "Credit Card",
    type: "expense",
    notes: "",
  },
];

export function loadTransactions() {
  const savedTransactions = localStorage.getItem(
    TRANSACTIONS_STORAGE_KEY,
  );

  if (!savedTransactions) {
    saveTransactions(starterTransactions);
    return starterTransactions;
  }

  try {
    const parsedTransactions = JSON.parse(savedTransactions);

    return Array.isArray(parsedTransactions)
      ? parsedTransactions
      : starterTransactions;
  } catch (error) {
    console.error("Unable to load transactions:", error);
    return starterTransactions;
  }
}

export function saveTransactions(transactions) {
  localStorage.setItem(
    TRANSACTIONS_STORAGE_KEY,
    JSON.stringify(transactions),
  );

  window.dispatchEvent(
    new CustomEvent(TRANSACTIONS_UPDATED_EVENT, {
      detail: transactions,
    }),
  );
}

export function subscribeToTransactions(callback) {
  function handleTransactionUpdate(event) {
    callback(event.detail ?? loadTransactions());
  }

  function handleStorageUpdate(event) {
    if (event.key === TRANSACTIONS_STORAGE_KEY) {
      callback(loadTransactions());
    }
  }

  window.addEventListener(
    TRANSACTIONS_UPDATED_EVENT,
    handleTransactionUpdate,
  );

  window.addEventListener("storage", handleStorageUpdate);

  return function unsubscribe() {
    window.removeEventListener(
      TRANSACTIONS_UPDATED_EVENT,
      handleTransactionUpdate,
    );

    window.removeEventListener("storage", handleStorageUpdate);
  };
}

export function calculateTransactionTotals(transactions) {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0,
    );

  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0,
    );

  return {
    income,
    expenses,
    balance: income - expenses,
    savings: income - expenses,
  };
}

export function getTransactionsForMonth(
  transactions,
  year,
  month,
) {
  return transactions.filter((transaction) => {
    const transactionDate = new Date(
      `${transaction.date}T12:00:00`,
    );

    return (
      transactionDate.getFullYear() === year &&
      transactionDate.getMonth() === month
    );
  });
}

export function getMonthlyTotals(
  transactions,
  date = new Date(),
) {
  const monthlyTransactions = getTransactionsForMonth(
    transactions,
    date.getFullYear(),
    date.getMonth(),
  );

  return calculateTransactionTotals(monthlyTransactions);
}

export function getRecentTransactions(
  transactions,
  limit = 5,
) {
  return [...transactions]
    .sort(
      (firstTransaction, secondTransaction) =>
        new Date(secondTransaction.date) -
        new Date(firstTransaction.date),
    )
    .slice(0, limit);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount || 0));
}

export function formatTransactionDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}