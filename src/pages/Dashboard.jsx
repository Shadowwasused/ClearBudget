import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
} from "react-icons/fi";

import {
  calculateTransactionTotals,
  formatCurrency,
  formatTransactionDate,
  getMonthlyTotals,
  getRecentTransactions,
  loadTransactions,
  subscribeToTransactions,
} from "../lib/transactions";

import {
  formatBillCurrency,
  formatBillDate,
  getBillStatus,
  getUpcomingBills,
  loadBills,
  subscribeToBills,
} from "../lib/bills";

function Dashboard() {
  const [transactions, setTransactions] = useState(loadTransactions);
  const [bills, setBills] = useState(loadBills);

  useEffect(() => {
    const unsubscribeTransactions =
      subscribeToTransactions(setTransactions);

    const unsubscribeBills = subscribeToBills(setBills);

    return () => {
      unsubscribeTransactions();
      unsubscribeBills();
    };
  }, []);

  const currentDate = useMemo(() => new Date(), []);

  const allTimeTotals = useMemo(
    () => calculateTransactionTotals(transactions),
    [transactions],
  );

  const monthlyTotals = useMemo(
    () => getMonthlyTotals(transactions, currentDate),
    [transactions, currentDate],
  );

  const recentTransactions = useMemo(
    () => getRecentTransactions(transactions, 5),
    [transactions],
  );

  const upcomingBills = useMemo(
    () => getUpcomingBills(bills, 5),
    [bills],
  );

  const unpaidBillTotal = useMemo(() => {
    return bills
      .filter((bill) => !bill.paid)
      .reduce(
        (total, bill) => total + Number(bill.amount || 0),
        0,
      );
  }, [bills]);

  const weeklySpending = useMemo(() => {
    const weeks = [0, 0, 0, 0];

    transactions.forEach((transaction) => {
      if (transaction.type !== "expense") {
        return;
      }

      const transactionDate = new Date(
        `${transaction.date}T12:00:00`,
      );

      const isCurrentMonth =
        transactionDate.getFullYear() ===
          currentDate.getFullYear() &&
        transactionDate.getMonth() === currentDate.getMonth();

      if (!isCurrentMonth) {
        return;
      }

      const dayOfMonth = transactionDate.getDate();

      const weekIndex = Math.min(
        Math.floor((dayOfMonth - 1) / 7),
        3,
      );

      weeks[weekIndex] += Number(transaction.amount || 0);
    });

    return weeks;
  }, [transactions, currentDate]);

  const highestWeeklySpending = Math.max(
    ...weeklySpending,
    1,
  );

  const savingsRate =
    monthlyTotals.income > 0
      ? Math.round(
          (monthlyTotals.savings / monthlyTotals.income) * 100,
        )
      : 0;

  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">Financial overview</p>

          <h1>Dashboard</h1>

          <p className="page-description">
            Review your balance, monthly spending, bills, income, and
            recent activity.
          </p>
        </div>

        <NavLink
          className="primary-button dashboard-add-button"
          to="/transactions"
        >
          Add transaction
        </NavLink>
      </div>

      <div className="summary-grid">
        <SummaryCard
          title="Total balance"
          value={formatCurrency(allTimeTotals.balance)}
          change="Income minus expenses"
          valueClass={
            allTimeTotals.balance >= 0
              ? "money-positive"
              : "money-negative"
          }
        />

        <SummaryCard
          title="Monthly income"
          value={formatCurrency(monthlyTotals.income)}
          change={monthName}
          valueClass="money-positive"
        />

        <SummaryCard
          title="Monthly spending"
          value={formatCurrency(monthlyTotals.expenses)}
          change={monthName}
          valueClass="money-negative"
        />

        <SummaryCard
          title="Monthly savings"
          value={formatCurrency(monthlyTotals.savings)}
          change={`${savingsRate}% of monthly income`}
          valueClass={
            monthlyTotals.savings >= 0
              ? "money-positive"
              : "money-negative"
          }
        />
      </div>

      <div className="dashboard-grid">
        <section className="content-card spending-card">
          <div className="card-heading">
            <div>
              <p className="card-label">Monthly activity</p>
              <h2>Spending overview</h2>
            </div>

            <span className="dashboard-month-label">
              {monthName}
            </span>
          </div>

          <div className="chart-placeholder">
            {weeklySpending.map((amount, index) => {
              const height =
                amount > 0
                  ? Math.max(
                      (amount / highestWeeklySpending) * 100,
                      8,
                    )
                  : 4;

              return (
                <div
                  key={`week-${index + 1}`}
                  className="chart-bar live-chart-bar"
                  style={{ height: `${height}%` }}
                  title={`Week ${index + 1}: ${formatCurrency(
                    amount,
                  )}`}
                />
              );
            })}
          </div>

          <div className="chart-labels">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>

          <div className="chart-total">
            Monthly expenses:{" "}
            <strong>
              {formatCurrency(monthlyTotals.expenses)}
            </strong>
          </div>
        </section>

        <section className="content-card upcoming-bills-card">
          <div className="card-heading">
            <div>
              <p className="card-label">Payment schedule</p>
              <h2>Upcoming bills</h2>
            </div>

            <NavLink className="text-link" to="/bills">
              View all
            </NavLink>
          </div>

          <div className="upcoming-bills-total">
            <span>Total unpaid</span>
            <strong>{formatBillCurrency(unpaidBillTotal)}</strong>
          </div>

          {upcomingBills.length > 0 ? (
            <div className="dashboard-bill-list">
              {upcomingBills.map((bill) => (
                <DashboardBillItem key={bill.id} bill={bill} />
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <FiCheckCircle />

              <strong>All caught up</strong>

              <span>You have no unpaid bills.</span>
            </div>
          )}
        </section>
      </div>

      <section className="content-card">
        <div className="card-heading">
          <div>
            <p className="card-label">Latest activity</p>
            <h2>Recent transactions</h2>
          </div>

          <NavLink className="text-link" to="/transactions">
            View all
          </NavLink>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="transaction-list">
            {recentTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </div>
        ) : (
          <div className="dashboard-empty-state">
            No transactions have been added yet.
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  change,
  valueClass = "",
}) {
  return (
    <section className="summary-card">
      <p>{title}</p>
      <h2 className={valueClass}>{value}</h2>
      <span>{change}</span>
    </section>
  );
}

function DashboardBillItem({ bill }) {
  const status = getBillStatus(bill);

  return (
    <div className="dashboard-bill-item">
      <div className="dashboard-bill-icon">
        <FiCalendar />
      </div>

      <div className="dashboard-bill-details">
        <strong>{bill.name}</strong>

        <span>
          Due {formatBillDate(bill.dueDate)}
          {bill.autopay ? " · Autopay" : ""}
        </span>
      </div>

      <div className="dashboard-bill-side">
        <strong>{formatBillCurrency(bill.amount)}</strong>

        <span
          className={`dashboard-bill-status ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}

function TransactionItem({ transaction }) {
  const isIncome = transaction.type === "income";

  return (
    <div className="transaction-item">
      <div className="transaction-icon">
        {isIncome ? <FiDollarSign /> : <FiCalendar />}
      </div>

      <div className="transaction-details">
        <strong>{transaction.description}</strong>

        <span>
          {transaction.category} ·{" "}
          {formatTransactionDate(transaction.date)}
        </span>
      </div>

      <strong
        className={
          isIncome
            ? "transaction-amount transaction-positive"
            : "transaction-amount money-negative"
        }
      >
        {isIncome ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </strong>
    </div>
  );
}

export default Dashboard;