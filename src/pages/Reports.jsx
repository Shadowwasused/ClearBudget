import { useEffect, useMemo, useState } from "react";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiPieChart,
  FiTrendingUp,
} from "react-icons/fi";

import {
  formatCurrency,
  formatTransactionDate,
  loadTransactions,
  subscribeToTransactions,
} from "../lib/transactions";

function Reports() {
  const [transactions, setTransactions] = useState(
    loadTransactions,
  );

  const [range, setRange] = useState("6");

  useEffect(() => {
    const unsubscribe =
      subscribeToTransactions(setTransactions);

    return unsubscribe;
  }, []);

  const reportData = useMemo(() => {
    const monthCount = Number(range);
    const today = new Date();

    const startDate = new Date(
      today.getFullYear(),
      today.getMonth() - monthCount + 1,
      1,
    );

    const filteredTransactions = transactions.filter(
      (transaction) => {
        const transactionDate = new Date(
          `${transaction.date}T12:00:00`,
        );

        return transactionDate >= startDate;
      },
    );

    const totalIncome = filteredTransactions
      .filter(
        (transaction) =>
          transaction.type === "income",
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0,
      );

    const totalExpenses = filteredTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense",
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0,
      );

    const netSavings = totalIncome - totalExpenses;

    const savingsRate =
      totalIncome > 0
        ? Math.round((netSavings / totalIncome) * 100)
        : 0;

    const categoryMap = {};

    filteredTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense",
      )
      .forEach((transaction) => {
        const category =
          transaction.category || "Other";

        categoryMap[category] =
          (categoryMap[category] || 0) +
          Number(transaction.amount || 0);
      });

    const categoryTotals = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          totalExpenses > 0
            ? Math.round((amount / totalExpenses) * 100)
            : 0,
      }))
      .sort((first, second) => second.amount - first.amount);

    const monthlyData = [];

    for (
      let index = monthCount - 1;
      index >= 0;
      index -= 1
    ) {
      const monthDate = new Date(
        today.getFullYear(),
        today.getMonth() - index,
        1,
      );

      const monthIncome = filteredTransactions
        .filter((transaction) => {
          if (transaction.type !== "income") {
            return false;
          }

          const transactionDate = new Date(
            `${transaction.date}T12:00:00`,
          );

          return (
            transactionDate.getFullYear() ===
              monthDate.getFullYear() &&
            transactionDate.getMonth() ===
              monthDate.getMonth()
          );
        })
        .reduce(
          (total, transaction) =>
            total + Number(transaction.amount || 0),
          0,
        );

      const monthExpenses = filteredTransactions
        .filter((transaction) => {
          if (transaction.type !== "expense") {
            return false;
          }

          const transactionDate = new Date(
            `${transaction.date}T12:00:00`,
          );

          return (
            transactionDate.getFullYear() ===
              monthDate.getFullYear() &&
            transactionDate.getMonth() ===
              monthDate.getMonth()
          );
        })
        .reduce(
          (total, transaction) =>
            total + Number(transaction.amount || 0),
          0,
        );

      monthlyData.push({
        label: new Intl.DateTimeFormat("en-US", {
          month: "short",
        }).format(monthDate),
        fullLabel: new Intl.DateTimeFormat("en-US", {
          month: "long",
          year: "numeric",
        }).format(monthDate),
        income: monthIncome,
        expenses: monthExpenses,
        savings: monthIncome - monthExpenses,
      });
    }

    const largestExpenses = filteredTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense",
      )
      .sort(
        (first, second) =>
          Number(second.amount || 0) -
          Number(first.amount || 0),
      )
      .slice(0, 5);

    return {
      filteredTransactions,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      categoryTotals,
      monthlyData,
      largestExpenses,
    };
  }, [transactions, range]);

  const highestMonthlyAmount = Math.max(
    ...reportData.monthlyData.flatMap((month) => [
      month.income,
      month.expenses,
    ]),
    1,
  );

  const highestCategoryAmount = Math.max(
    ...reportData.categoryTotals.map(
      (category) => category.amount,
    ),
    1,
  );

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            Financial analysis
          </p>

          <h1>Reports</h1>

          <p className="page-description">
            Review spending patterns, income trends, and
            overall financial performance.
          </p>
        </div>

        <div className="report-range-control">
          <FiCalendar />

          <select
            value={range}
            onChange={(event) =>
              setRange(event.target.value)
            }
          >
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
          </select>
        </div>
      </div>

      <div className="report-summary-grid">
        <ReportSummaryCard
          label="Total income"
          value={formatCurrency(
            reportData.totalIncome,
          )}
          icon={<FiArrowUpRight />}
          valueClass="money-positive"
          detail={`${range}-month period`}
        />

        <ReportSummaryCard
          label="Total expenses"
          value={formatCurrency(
            reportData.totalExpenses,
          )}
          icon={<FiArrowDownRight />}
          valueClass="money-negative"
          detail={`${range}-month period`}
        />

        <ReportSummaryCard
          label="Net savings"
          value={formatCurrency(
            reportData.netSavings,
          )}
          icon={<FiDollarSign />}
          valueClass={
            reportData.netSavings >= 0
              ? "money-positive"
              : "money-negative"
          }
          detail="Income minus expenses"
        />

        <ReportSummaryCard
          label="Savings rate"
          value={`${reportData.savingsRate}%`}
          icon={<FiTrendingUp />}
          valueClass={
            reportData.savingsRate >= 0
              ? "money-positive"
              : "money-negative"
          }
          detail="Percentage of income saved"
        />
      </div>

      <div className="report-main-grid">
        <section className="content-card report-trend-card">
          <div className="card-heading">
            <div>
              <p className="card-label">
                Monthly comparison
              </p>

              <h2>Income and expenses</h2>
            </div>

            <FiBarChart2 className="report-card-icon" />
          </div>

          <div className="report-chart">
            {reportData.monthlyData.map((month) => {
              const incomeHeight =
                month.income > 0
                  ? Math.max(
                      (month.income /
                        highestMonthlyAmount) *
                        100,
                      4,
                    )
                  : 2;

              const expenseHeight =
                month.expenses > 0
                  ? Math.max(
                      (month.expenses /
                        highestMonthlyAmount) *
                        100,
                      4,
                    )
                  : 2;

              return (
                <div
                  className="report-chart-group"
                  key={month.fullLabel}
                >
                  <div className="report-chart-bars">
                    <div
                      className="report-chart-bar report-income-bar"
                      style={{
                        height: `${incomeHeight}%`,
                      }}
                      title={`${month.fullLabel} income: ${formatCurrency(
                        month.income,
                      )}`}
                    />

                    <div
                      className="report-chart-bar report-expense-bar"
                      style={{
                        height: `${expenseHeight}%`,
                      }}
                      title={`${month.fullLabel} expenses: ${formatCurrency(
                        month.expenses,
                      )}`}
                    />
                  </div>

                  <span>{month.label}</span>
                </div>
              );
            })}
          </div>

          <div className="report-chart-legend">
            <span>
              <i className="report-income-key" />
              Income
            </span>

            <span>
              <i className="report-expense-key" />
              Expenses
            </span>
          </div>
        </section>

        <section className="content-card">
          <div className="card-heading">
            <div>
              <p className="card-label">
                Expense distribution
              </p>

              <h2>Spending by category</h2>
            </div>

            <FiPieChart className="report-card-icon" />
          </div>

          {reportData.categoryTotals.length > 0 ? (
            <div className="report-category-list">
              {reportData.categoryTotals
                .slice(0, 6)
                .map((category) => (
                  <div
                    className="report-category-item"
                    key={category.category}
                  >
                    <div className="report-category-heading">
                      <div>
                        <strong>
                          {category.category}
                        </strong>

                        <span>
                          {category.percentage}% of spending
                        </span>
                      </div>

                      <strong>
                        {formatCurrency(category.amount)}
                      </strong>
                    </div>

                    <div className="report-category-track">
                      <div
                        className="report-category-fill"
                        style={{
                          width: `${
                            (category.amount /
                              highestCategoryAmount) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="report-empty-state">
              No expense transactions are available for
              this period.
            </div>
          )}
        </section>
      </div>

      <div className="report-bottom-grid">
        <section className="content-card">
          <div className="card-heading">
            <div>
              <p className="card-label">
                Monthly results
              </p>

              <h2>Savings history</h2>
            </div>
          </div>

          <div className="report-month-list">
            {reportData.monthlyData.map((month) => (
              <div
                className="report-month-row"
                key={month.fullLabel}
              >
                <div>
                  <strong>{month.fullLabel}</strong>

                  <span>
                    Income {formatCurrency(month.income)} ·
                    Expenses{" "}
                    {formatCurrency(month.expenses)}
                  </span>
                </div>

                <strong
                  className={
                    month.savings >= 0
                      ? "money-positive"
                      : "money-negative"
                  }
                >
                  {formatCurrency(month.savings)}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="content-card">
          <div className="card-heading">
            <div>
              <p className="card-label">
                Highest transactions
              </p>

              <h2>Largest expenses</h2>
            </div>
          </div>

          {reportData.largestExpenses.length > 0 ? (
            <div className="report-expense-list">
              {reportData.largestExpenses.map(
                (transaction) => (
                  <div
                    className="report-expense-row"
                    key={transaction.id}
                  >
                    <div>
                      <strong>
                        {transaction.description}
                      </strong>

                      <span>
                        {transaction.category} ·{" "}
                        {formatTransactionDate(
                          transaction.date,
                        )}
                      </span>
                    </div>

                    <strong className="money-negative">
                      {formatCurrency(transaction.amount)}
                    </strong>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="report-empty-state">
              No expenses found for this period.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ReportSummaryCard({
  label,
  value,
  icon,
  valueClass,
  detail,
}) {
  return (
    <section className="summary-card report-summary-card">
      <div className="report-summary-heading">
        <p>{label}</p>

        <span>{icon}</span>
      </div>

      <h2 className={valueClass}>{value}</h2>

      <small>{detail}</small>
    </section>
  );
}

export default Reports;