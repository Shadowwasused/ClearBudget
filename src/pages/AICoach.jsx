import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBarChart2,
  FiCheckCircle,
  FiRefreshCw,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

import { fetchFinancialSummary } from "../lib/financialSummaryApi";
import { generateFinancialReview } from "../lib/aiCoachApi";
import { formatCurrency } from "../lib/transactions";

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function AICoach() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [aiReview, setAiReview] = useState(null);

const [generatingReview, setGeneratingReview] =
  useState(false);

const [reviewError, setReviewError] =
  useState("");

  async function loadSummary({
    showRefreshState = false,
  } = {}) {
    try {
      setErrorMessage("");

      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await fetchFinancialSummary();
      setSummary(data);
    } catch (error) {
      console.error(
        "Unable to load AI Coach summary:",
        error,
      );

      setErrorMessage(
        error?.message ||
          "ClearBudget could not generate your financial summary.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  const coachInsights = useMemo(() => {
    if (!summary) {
      return [];
    }

    const insights = [];

    const {
      currentMonth,
      changes,
      budgets,
      upcomingBills,
      goals,
      spendingByCategory,
    } = summary;

    if (currentMonth.netCashFlow >= 0) {
      insights.push({
        type: "positive",
        title: "Positive monthly cash flow",
        message: `You are currently ahead by ${formatCurrency(
          currentMonth.netCashFlow,
        )} this month.`,
      });
    } else {
      insights.push({
        type: "warning",
        title: "Negative monthly cash flow",
        message: `Your expenses currently exceed your income by ${formatCurrency(
          Math.abs(currentMonth.netCashFlow),
        )}.`,
      });
    }

    if (changes.expenseChange > 0) {
      insights.push({
        type: "warning",
        title: "Spending increased",
        message: `Expenses are ${formatCurrency(
          changes.expenseChange,
        )} higher than last month.`,
      });
    } else if (changes.expenseChange < 0) {
      insights.push({
        type: "positive",
        title: "Spending improved",
        message: `Expenses are ${formatCurrency(
          Math.abs(changes.expenseChange),
        )} lower than last month.`,
      });
    }

    const overBudget = budgets.filter(
      (budget) => budget.isOverBudget,
    );

    if (overBudget.length > 0) {
      insights.push({
        type: "warning",
        title: "Budget attention needed",
        message: `${overBudget.length} ${
          overBudget.length === 1
            ? "category is"
            : "categories are"
        } currently over budget.`,
      });
    }

    if (upcomingBills.length > 0) {
      const totalUpcoming = upcomingBills.reduce(
        (total, bill) =>
          total + Number(bill.amount || 0),
        0,
      );

      insights.push({
        type: "info",
        title: "Upcoming obligations",
        message: `${upcomingBills.length} unpaid ${
          upcomingBills.length === 1
            ? "bill"
            : "bills"
        } totaling ${formatCurrency(
          totalUpcoming,
        )} are due within 30 days.`,
      });
    }

    const topCategory = spendingByCategory[0];

    if (topCategory) {
      insights.push({
        type: "info",
        title: "Top spending category",
        message: `${topCategory.category} is your largest spending category at ${formatCurrency(
          topCategory.amount,
        )}.`,
      });
    }

    const incompleteGoals = goals.filter(
      (goal) =>
        Number(goal.percentageComplete || 0) <
        100,
    );

    if (incompleteGoals.length > 0) {
      insights.push({
        type: "info",
        title: "Savings goals in progress",
        message: `You currently have ${incompleteGoals.length} active ${
          incompleteGoals.length === 1
            ? "goal"
            : "goals"
        } still in progress.`,
      });
    }

    return insights.slice(0, 6);
  }, [summary]);

  if (loading) {
    return (
      <div className="page-content">
        <section className="content-card">
          <p className="table-empty-state">
            Building your financial summary...
          </p>
        </section>
      </div>
    );
  }
  async function handleGenerateReview() {
  try {
    setGeneratingReview(true);
    setReviewError("");

    const result =
      await generateFinancialReview();

    setAiReview(result.review);
  } catch (error) {
    console.error(error);

    setReviewError(
      error.message ||
        "Unable to generate AI review."
    );
  } finally {
    setGeneratingReview(false);
  }
}

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            ClearBudget intelligence
          </p>

          <h1>AI Financial Coach</h1>

          <p className="page-description">
            Review your current cash flow, spending,
            budgets, bills, and savings goals in one
            place.
          </p>
        </div>

        <button
          className="secondary-button button-with-icon"
          type="button"
          onClick={() =>
            loadSummary({
              showRefreshState: true,
            })
          }
          disabled={refreshing}
        >
          <FiRefreshCw />

          {refreshing
            ? "Refreshing..."
            : "Refresh review"}
        </button>
      </div>

      {errorMessage && (
        <section className="content-card">
          <p className="money-negative">
            <FiAlertCircle /> {errorMessage}
          </p>
        </section>
      )}

      {summary && (
        <>
        <section className="content-card">
  <div className="card-heading">
    <div>
      <p className="card-label">
        AI Financial Coach
      </p>

      <h2>Personalized Review</h2>
    </div>

    <button
      className="primary-button"
      onClick={handleGenerateReview}
      disabled={generatingReview}
    >
      {generatingReview
        ? "Generating..."
        : "Generate Review"}
    </button>
  </div>

  {reviewError && (
    <p className="money-negative">
      {reviewError}
    </p>
  )}

  {aiReview && (
    <>
      <h2>{aiReview.score}</h2>

      <h3>{aiReview.headline}</h3>

      <p>{aiReview.summary}</p>

      <h3>Observations</h3>

      <ul>
        {aiReview.observations?.map(
          (item) => (
            <li key={item}>{item}</li>
          ),
        )}
      </ul>

      <h3>Recommendations</h3>

      <ul>
        {aiReview.recommendations?.map(
          (item) => (
            <li key={item}>{item}</li>
          ),
        )}
      </ul>
    </>
  )}
</section>
          <div className="report-summary-grid">
            <SummaryCard
              title="Income this month"
              value={formatCurrency(
                summary.currentMonth.income,
              )}
              icon={<FiTrendingUp />}
              valueClass="money-positive"
            />

            <SummaryCard
              title="Expenses this month"
              value={formatCurrency(
                summary.currentMonth.expenses,
              )}
              icon={<FiTrendingDown />}
              valueClass="money-negative"
            />

            <SummaryCard
              title="Net cash flow"
              value={formatCurrency(
                summary.currentMonth.netCashFlow,
              )}
              icon={<FiBarChart2 />}
              valueClass={
                summary.currentMonth.netCashFlow >= 0
                  ? "money-positive"
                  : "money-negative"
              }
            />

            <SummaryCard
              title="Savings rate"
              value={`${summary.currentMonth.savingsRate}%`}
              icon={<FiTarget />}
              valueClass={
                summary.currentMonth.savingsRate >= 0
                  ? "money-positive"
                  : "money-negative"
              }
            />
          </div>

          <section className="content-card">
            <div className="card-heading">
              <div>
                <p className="card-label">
                  Coach review
                </p>

                <h2>Financial insights</h2>
              </div>

              <span className="dashboard-month-label">
                Updated{" "}
                {formatDate(summary.generatedAt)}
              </span>
            </div>

            {coachInsights.length > 0 ? (
              <div className="ai-coach-insight-list">
                {coachInsights.map((insight) => (
                  <article
                    className={`ai-coach-insight ai-coach-insight-${insight.type}`}
                    key={`${insight.title}-${insight.message}`}
                  >
                    <div className="ai-coach-insight-icon">
                      {insight.type === "positive" ? (
                        <FiCheckCircle />
                      ) : insight.type === "warning" ? (
                        <FiAlertCircle />
                      ) : (
                        <FiBarChart2 />
                      )}
                    </div>

                    <div>
                      <strong>{insight.title}</strong>
                      <span>{insight.message}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                Add more financial activity to generate
                insights.
              </div>
            )}
          </section>

          <div className="report-bottom-grid">
            <section className="content-card">
              <div className="card-heading">
                <div>
                  <p className="card-label">
                    Spending
                  </p>

                  <h2>Top categories</h2>
                </div>
              </div>

              {summary.spendingByCategory.length >
              0 ? (
                <div className="report-category-list">
                  {summary.spendingByCategory
                    .slice(0, 6)
                    .map((item) => (
                      <div
                        className="report-category-heading"
                        key={item.category}
                      >
                        <div>
                          <strong>
                            {item.category}
                          </strong>

                          <span>
                            Current month
                          </span>
                        </div>

                        <strong>
                          {formatCurrency(
                            item.amount,
                          )}
                        </strong>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  No expense activity for this month.
                </div>
              )}
            </section>

            <section className="content-card">
              <div className="card-heading">
                <div>
                  <p className="card-label">
                    Savings
                  </p>

                  <h2>Goals</h2>
                </div>
              </div>

              {summary.goals.length > 0 ? (
                <div className="ai-coach-goal-list">
                  {summary.goals.map((goal) => (
                    <article
                      className="ai-coach-goal-card"
                      key={goal.id}
                    >
                      <div>
                        <strong>{goal.name}</strong>

                        <span>
                          {formatCurrency(
                            goal.currentAmount,
                          )}{" "}
                          of{" "}
                          {formatCurrency(
                            goal.targetAmount,
                          )}
                        </span>
                      </div>

                      <strong>
                        {goal.percentageComplete}%
                      </strong>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  No savings goals have been created.
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  valueClass = "",
}) {
  return (
    <section className="summary-card report-summary-card">
      <div className="report-summary-heading">
        <p>{title}</p>
        <span>{icon}</span>
      </div>

      <h2 className={valueClass}>{value}</h2>
    </section>
  );
}

export default AICoach;