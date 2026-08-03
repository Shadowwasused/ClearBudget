import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
} from "react-icons/fi";

import {
  formatCurrency,
  formatTransactionDate,
  getMonthlyTotals,
  getRecentTransactions,
} from "../lib/transactions";

import {
  calculateBudgetDetails,
  formatBudgetCurrency,
} from "../lib/budgets";

import { fetchBudgets } from "../lib/budgetsApi";

import {
  formatBillCurrency,
  formatBillDate,
  getBillStatus,
  getUpcomingBills,
} from "../lib/bills";

import { fetchTransactions } from "../lib/transactionsApi";
import { fetchBills } from "../lib/billsApi";
import { fetchAccounts } from "../lib/accountsApi";

import { useUserSettings } from "../context/UserSettingsContext";

function Dashboard() {
  const { multipleAccountsEnabled } =
    useUserSettings();

  const [transactions, setTransactions] =
    useState([]);

  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        setLoadError("");

        const [
          transactionData,
          billData,
          accountData,
          budgetData,
        ] = await Promise.all([
          fetchTransactions(),
          fetchBills(),
          multipleAccountsEnabled
            ? fetchAccounts()
            : Promise.resolve([]),
          fetchBudgets(),
        ]);

        if (!active) {
          return;
        }

        setTransactions(transactionData || []);
        setBills(billData || []);
        setAccounts(accountData || []);
        setBudgets(budgetData || []);
      } catch (error) {
        console.error(
          "Unable to load dashboard data:",
          error,
        );

        if (active) {
          setLoadError(
            "The dashboard could not be loaded. Check your Supabase connection.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      active = false;
    };
  }, [multipleAccountsEnabled]);

  const currentDate = useMemo(
    () => new Date(),
    [],
  );

  const monthlyTotals = useMemo(
    () =>
      getMonthlyTotals(
        transactions,
        currentDate,
      ),
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

  const activeAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => !account.is_archived,
      ),
    [accounts],
  );

  const netWorth = useMemo(() => {
    return activeAccounts.reduce(
      (total, account) =>
        total + Number(account.balance || 0),
      0,
    );
  }, [activeAccounts]);

  const cashAvailable = useMemo(() => {
    const cashAccountTypes = [
      "checking",
      "savings",
      "cash",
    ];

    return activeAccounts
      .filter((account) =>
        cashAccountTypes.includes(
          String(account.account_type || "")
            .trim()
            .toLowerCase(),
        ),
      )
      .reduce(
        (total, account) =>
          total + Number(account.balance || 0),
        0,
      );
  }, [activeAccounts]);

  const netCashFlow =
    Number(monthlyTotals.income || 0) -
    Number(monthlyTotals.expenses || 0);

  const savingsRate =
    Number(monthlyTotals.income || 0) > 0
      ? Math.round(
          (netCashFlow /
            Number(monthlyTotals.income || 0)) *
            100,
        )
      : 0;

  const budgetDetails = useMemo(() => {
    return budgets
      .map((budget) =>
        calculateBudgetDetails(
          budget,
          transactions,
          currentDate,
        ),
      )
      .sort(
        (firstBudget, secondBudget) =>
          secondBudget.percentage -
          firstBudget.percentage,
      );
  }, [budgets, transactions, currentDate]);

  const unpaidBillTotal = useMemo(() => {
    return bills
      .filter((bill) => !bill.paid)
      .reduce(
        (total, bill) =>
          total + Number(bill.amount || 0),
        0,
      );
  }, [bills]);

  const categorySpending = useMemo(() => {
    const totalsByCategory = {};

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
        transactionDate.getMonth() ===
          currentDate.getMonth();

      if (!isCurrentMonth) {
        return;
      }

      const category =
        transaction.category || "Other";

      totalsByCategory[category] =
        (totalsByCategory[category] || 0) +
        Number(transaction.amount || 0);
    });

    return Object.entries(totalsByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort(
        (first, second) =>
          second.amount - first.amount,
      )
      .slice(0, 6);
  }, [transactions, currentDate]);

  const highestCategorySpending = Math.max(
    ...categorySpending.map(
      (category) => category.amount,
    ),
    1,
  );

  const monthName = new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      year: "numeric",
    },
  ).format(currentDate);

  if (loading) {
    return (
      <div className="page-content">
        <section className="content-card">
          <p className="table-empty-state">
            Loading your financial dashboard...
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            Financial overview
          </p>

          <h1>Dashboard</h1>

          <p className="page-description">
            {multipleAccountsEnabled
              ? "Review your accounts, monthly activity, upcoming bills, and recent transactions."
              : "Review your monthly income, spending, budgets, bills, and recent transactions."}
          </p>
        </div>

        <NavLink
          className="primary-button dashboard-add-button"
          to="/transactions"
        >
          Add transaction
        </NavLink>
      </div>

      {loadError && (
        <section className="content-card">
          <p className="table-empty-state">
            {loadError}
          </p>
        </section>
      )}

      <div className="summary-grid">
        {multipleAccountsEnabled && (
          <>
            <SummaryCard
              title="Net worth"
              value={formatCurrency(netWorth)}
              change={`${activeAccounts.length} active ${
                activeAccounts.length === 1
                  ? "account"
                  : "accounts"
              }`}
              valueClass={
                netWorth >= 0
                  ? "money-positive"
                  : "money-negative"
              }
            />

            <SummaryCard
              title="Cash available"
              value={formatCurrency(
                cashAvailable,
              )}
              change="Checking, savings, and cash"
              valueClass={
                cashAvailable >= 0
                  ? "money-positive"
                  : "money-negative"
              }
            />
          </>
        )}

        <SummaryCard
          title="Income this month"
          value={formatCurrency(
            monthlyTotals.income,
          )}
          change={monthName}
          valueClass="money-positive"
        />

        <SummaryCard
          title="Expenses this month"
          value={formatCurrency(
            monthlyTotals.expenses,
          )}
          change={monthName}
          valueClass="money-negative"
        />

        {!multipleAccountsEnabled && (
          <>
            <SummaryCard
              title="Net cash flow"
              value={formatCurrency(
                netCashFlow,
              )}
              change="Income minus expenses"
              valueClass={
                netCashFlow >= 0
                  ? "money-positive"
                  : "money-negative"
              }
            />

            <SummaryCard
              title="Savings rate"
              value={`${savingsRate}%`}
              change={monthName}
              valueClass={
                savingsRate >= 0
                  ? "money-positive"
                  : "money-negative"
              }
            />
          </>
        )}
      </div>

      {multipleAccountsEnabled && (
        <section className="content-card dashboard-accounts-card">
          <div className="card-heading">
            <div>
              <p className="card-label">
                Financial accounts
              </p>

              <h2>Your accounts</h2>
            </div>

            <NavLink
              className="text-link"
              to="/accounts"
            >
              Manage accounts
            </NavLink>
          </div>

          {activeAccounts.length > 0 ? (
            <div className="dashboard-account-grid">
              {activeAccounts.map((account) => (
                <DashboardAccountCard
                  key={account.id}
                  account={account}
                />
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <FiCreditCard />

              <strong>No accounts added</strong>

              <span>
                Add an account to begin tracking your
                net worth.
              </span>
            </div>
          )}
        </section>
      )}

      <div className="dashboard-grid">
        <section className="content-card spending-card">
          <div className="card-heading">
            <div>
              <p className="card-label">
                Monthly activity
              </p>

              <h2>Spending by category</h2>
            </div>

            <span className="dashboard-month-label">
              {monthName}
            </span>
          </div>

          {categorySpending.length > 0 ? (
            <div className="category-spending-list">
              {categorySpending.map((item) => {
                const progress =
                  (item.amount /
                    highestCategorySpending) *
                  100;

                return (
                  <div
                    className="category-spending-item"
                    key={item.category}
                  >
                    <div className="category-spending-heading">
                      <span>
                        {item.category}
                      </span>

                      <strong>
                        {formatCurrency(
                          item.amount,
                        )}
                      </strong>
                    </div>

                    <div className="category-spending-track">
                      <div
                        className="category-spending-fill"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              No expenses have been recorded for this
              month.
            </div>
          )}

          <div className="chart-total">
            Monthly expenses:{" "}
            <strong>
              {formatCurrency(
                monthlyTotals.expenses,
              )}
            </strong>
          </div>
        </section>

        <section className="content-card upcoming-bills-card">
          <div className="card-heading">
            <div>
              <p className="card-label">
                Payment schedule
              </p>

              <h2>Upcoming bills</h2>
            </div>

            <NavLink
              className="text-link"
              to="/bills"
            >
              View all
            </NavLink>
          </div>

          <div className="upcoming-bills-total">
            <span>Total unpaid</span>

            <strong>
              {formatBillCurrency(
                unpaidBillTotal,
              )}
            </strong>
          </div>

          {upcomingBills.length > 0 ? (
            <div className="dashboard-bill-list">
              {upcomingBills.map((bill) => (
                <DashboardBillItem
                  key={bill.id}
                  bill={bill}
                />
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <FiCheckCircle />

              <strong>All caught up</strong>

              <span>
                You have no unpaid bills.
              </span>
            </div>
          )}
        </section>
      </div>

      <section className="content-card dashboard-budget-section">
        <div className="card-heading">
          <div>
            <p className="card-label">
              Monthly spending limits
            </p>

            <h2>Budget progress</h2>
          </div>

          <NavLink
            className="text-link"
            to="/budget"
          >
            Manage budgets
          </NavLink>
        </div>

        {budgetDetails.length > 0 ? (
          <div className="dashboard-budget-list">
            {budgetDetails.map((budget) => (
              <DashboardBudgetItem
                key={budget.id}
                budget={budget}
              />
            ))}
          </div>
        ) : (
          <div className="dashboard-empty-state">
            <strong>No budgets created</strong>

            <span>
              Add monthly category budgets to track
              your spending progress.
            </span>
          </div>
        )}
      </section>

      <section className="content-card">
        <div className="card-heading">
          <div>
            <p className="card-label">
              Latest activity
            </p>

            <h2>Recent transactions</h2>
          </div>

          <NavLink
            className="text-link"
            to="/transactions"
          >
            View all
          </NavLink>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="transaction-list">
            {recentTransactions.map(
              (transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  multipleAccountsEnabled={
                    multipleAccountsEnabled
                  }
                />
              ),
            )}
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

      <h2 className={valueClass}>
        {value}
      </h2>

      <span>{change}</span>
    </section>
  );
}

function DashboardAccountCard({ account }) {
  const accountType = String(
    account.account_type || "Account",
  );

  const balance = Number(
    account.balance || 0,
  );

  return (
    <article
      className="dashboard-account-card"
      style={{
        "--account-accent":
          account.color || "#4f8cff",
      }}
    >
      <div className="dashboard-account-icon">
        <FiCreditCard />
      </div>

      <div className="dashboard-account-details">
        <span>{accountType}</span>
        <strong>{account.name}</strong>
      </div>

      <div
        className={
          balance >= 0
            ? "dashboard-account-balance money-positive"
            : "dashboard-account-balance money-negative"
        }
      >
        {formatCurrency(balance)}
      </div>
    </article>
  );
}

function DashboardBudgetItem({ budget }) {
  const visiblePercentage = Math.min(
    Math.max(
      Number(budget.percentage || 0),
      0,
    ),
    100,
  );

  let statusLabel = "On track";
  let statusClass = "dashboard-budget-good";

  if (budget.isOverBudget) {
    statusLabel = "Over budget";
    statusClass = "dashboard-budget-over";
  } else if (budget.percentage >= 80) {
    statusLabel = "Almost reached";
    statusClass =
      "dashboard-budget-warning";
  }

  return (
    <article className="dashboard-budget-item">
      <div className="dashboard-budget-heading">
        <div>
          <strong>{budget.category}</strong>

          <span>
            {formatBudgetCurrency(
              budget.spent,
            )}{" "}
            of{" "}
            {formatBudgetCurrency(
              budget.limit,
            )}
          </span>
        </div>

        <div className="dashboard-budget-status">
          <strong>
            {budget.percentage}%
          </strong>

          <span className={statusClass}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="dashboard-budget-track">
        <div
          className={`dashboard-budget-fill ${statusClass}`}
          style={{
            width: `${visiblePercentage}%`,
          }}
        />
      </div>

      <div className="dashboard-budget-footer">
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
        <strong>
          {formatBillCurrency(bill.amount)}
        </strong>

        <span
          className={`dashboard-bill-status ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}

function TransactionItem({
  transaction,
  multipleAccountsEnabled,
}) {
  const isIncome =
    transaction.type === "income";

  return (
    <div className="transaction-item">
      <div className="transaction-icon">
        {isIncome ? (
          <FiDollarSign />
        ) : (
          <FiCalendar />
        )}
      </div>

      <div className="transaction-details">
        <strong>
          {transaction.description}
        </strong>

        <span>
          {transaction.category || "Other"}

          {multipleAccountsEnabled &&
            ` · ${
              transaction.account ||
              "Unassigned"
            }`}

          {" · "}

          {formatTransactionDate(
            transaction.date,
          )}
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