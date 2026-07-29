import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiCalendar, FiDollarSign } from "react-icons/fi";

import {
  calculateTransactionTotals,
  formatCurrency,
  formatTransactionDate,
  getMonthlyTotals,
  getRecentTransactions,
  loadTransactions,
  subscribeToTransactions,
} from "../lib/transactions";

function Dashboard() {
  const [transactions, setTransactions] = useState(loadTransactions);

  useEffect(() => {
    const unsubscribe = subscribeToTransactions(setTransactions);

    return unsubscribe;
  }, []);

  const currentDate = new Date();

  const allTimeTotals = useMemo(
    () => calculateTransactionTotals(transactions),
    [transactions],
  );

  const monthlyTotals = useMemo(
    () => getMonthlyTotals(transactions, currentDate),
    [transactions],
  );

  const recentTransactions = useMemo(
    () => getRecentTransactions(transactions, 5),
    [transactions],
  );

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
        transactionDate.getFullYear() === currentDate.getFullYear() &&
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
  }, [transactions]);

  const highestWeeklySpending = Math.max(...weeklySpending, 1);

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
            Review your balance, monthly spending, income, and recent
            activity.
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

        <section className="content-card">
          <div className="card-heading">
            <div>
              <p className="card-label">Monthly snapshot</p>
              <h2>{monthName}</h2>
            </div>
          </div>

          <div className="snapshot-list">
            <SnapshotRow
              label="Income"
              value={formatCurrency(monthlyTotals.income)}
              valueClass="money-positive"
            />

            <SnapshotRow
              label="Expenses"
              value={formatCurrency(monthlyTotals.expenses)}
              valueClass="money-negative"
            />

            <SnapshotRow
              label="Saved"
              value={formatCurrency(monthlyTotals.savings)}
              valueClass={
                monthlyTotals.savings >= 0
                  ? "money-positive"
                  : "money-negative"
              }
            />

            <SnapshotRow
              label="Transactions"
              value={transactions.length.toString()}
            />
          </div>

          <div className="savings-progress-section">
            <div className="savings-progress-heading">
              <span>Savings rate</span>
              <strong>{savingsRate}%</strong>
            </div>

            <div className="savings-progress-track">
              <div
                className="savings-progress-fill"
                style={{
                  width: `${Math.min(
                    Math.max(savingsRate, 0),
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>
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

function SnapshotRow({
  label,
  value,
  valueClass = "",
}) {
  return (
    <div className="snapshot-row">
      <span>{label}</span>
      <strong className={valueClass}>{value}</strong>
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