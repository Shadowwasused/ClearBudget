export const BILLS_STORAGE_KEY = "clearbudget-bills";
export const BILLS_UPDATED_EVENT = "clearbudget-bills-updated";

export const billFrequencies = [
  "One time",
  "Weekly",
  "Biweekly",
  "Monthly",
  "Quarterly",
  "Yearly",
];

const starterBills = [
  {
    id: crypto.randomUUID(),
    name: "Rent",
    amount: 1450,
    dueDate: "2026-08-01",
    category: "Housing",
    frequency: "Monthly",
    autopay: false,
    paid: false,
    notes: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Electric",
    amount: 142,
    dueDate: "2026-08-05",
    category: "Utilities",
    frequency: "Monthly",
    autopay: true,
    paid: false,
    notes: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Internet",
    amount: 79.99,
    dueDate: "2026-08-09",
    category: "Utilities",
    frequency: "Monthly",
    autopay: true,
    paid: false,
    notes: "",
  },
];

export function loadBills() {
  const savedBills = localStorage.getItem(BILLS_STORAGE_KEY);

  if (!savedBills) {
    saveBills(starterBills);
    return starterBills;
  }

  try {
    const parsedBills = JSON.parse(savedBills);

    return Array.isArray(parsedBills) ? parsedBills : starterBills;
  } catch (error) {
    console.error("Unable to load bills:", error);
    return starterBills;
  }
}

export function saveBills(bills) {
  localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));

  window.dispatchEvent(
    new CustomEvent(BILLS_UPDATED_EVENT, {
      detail: bills,
    }),
  );
}

export function subscribeToBills(callback) {
  function handleBillUpdate(event) {
    callback(event.detail ?? loadBills());
  }

  function handleStorageUpdate(event) {
    if (event.key === BILLS_STORAGE_KEY) {
      callback(loadBills());
    }
  }

  window.addEventListener(BILLS_UPDATED_EVENT, handleBillUpdate);
  window.addEventListener("storage", handleStorageUpdate);

  return function unsubscribe() {
    window.removeEventListener(
      BILLS_UPDATED_EVENT,
      handleBillUpdate,
    );

    window.removeEventListener("storage", handleStorageUpdate);
  };
}

export function formatBillCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount || 0));
}

export function formatBillDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function getDaysUntilDue(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.ceil((due - today) / millisecondsPerDay);
}

export function getBillStatus(bill) {
  if (bill.paid) {
    return {
      label: "Paid",
      className: "bill-status-paid",
    };
  }

  const daysUntilDue = getDaysUntilDue(bill.dueDate);

  if (daysUntilDue < 0) {
    return {
      label: "Overdue",
      className: "bill-status-overdue",
    };
  }

  if (daysUntilDue === 0) {
    return {
      label: "Due today",
      className: "bill-status-warning",
    };
  }

  if (daysUntilDue <= 7) {
    return {
      label: `Due in ${daysUntilDue} day${
        daysUntilDue === 1 ? "" : "s"
      }`,
      className: "bill-status-warning",
    };
  }

  return {
    label: "Upcoming",
    className: "bill-status-upcoming",
  };
}

export function calculateBillTotals(bills) {
  const unpaidBills = bills.filter((bill) => !bill.paid);
  const paidBills = bills.filter((bill) => bill.paid);

  const unpaidAmount = unpaidBills.reduce(
    (total, bill) => total + Number(bill.amount || 0),
    0,
  );

  const paidAmount = paidBills.reduce(
    (total, bill) => total + Number(bill.amount || 0),
    0,
  );

  const overdueBills = unpaidBills.filter(
    (bill) => getDaysUntilDue(bill.dueDate) < 0,
  );

  return {
    unpaidCount: unpaidBills.length,
    paidCount: paidBills.length,
    overdueCount: overdueBills.length,
    unpaidAmount,
    paidAmount,
  };
}

export function getUpcomingBills(bills, limit = 5) {
  return [...bills]
    .filter((bill) => !bill.paid)
    .sort(
      (firstBill, secondBill) =>
        new Date(firstBill.dueDate) - new Date(secondBill.dueDate),
    )
    .slice(0, limit);
}