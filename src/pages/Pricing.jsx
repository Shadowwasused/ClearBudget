import { Link } from "react-router-dom";
import {
  FiCheck,
  FiShield,
  FiStar,
  FiZap,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import "./Pricing.css";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "",
    description:
      "Core budgeting tools for everyday personal finance.",
    icon: FiShield,
    features: [
      "Income and expense tracking",
      "Bill management",
      "Basic budgeting",
      "Savings goals",
      "Basic reports",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 4.99,
    priceLabel: "per month",
    description:
      "Advanced reports, analytics, recurring tools, exports, and premium features.",
    icon: FiZap,
    featured: true,
    features: [
      "Everything in Free",
      "Advanced reports",
      "Financial analytics",
      "Recurring transactions",
      "Printable reports",
      "CSV exports",
      "Premium budgeting tools",
      "Early access to new features",
    ],
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 39.99,
    priceLabel: "one-time payment",
    description:
      "A possible limited launch offer for early supporters.",
    icon: FiStar,
    features: [
      "Lifetime Pro access",
      "All future Pro updates",
      "No recurring payment",
      "Early supporter status",
      "Priority access to new features",
    ],
  },
];

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits:
      Number(value) % 1 === 0 ? 0 : 2,
  }).format(value);
}

function Pricing() {
  const { user, profile } = useAuth();

  const currentPlan = profile?.plan || "free";
  const isBeta =
    profile?.subscriptionStatus === "beta";

  return (
    <main className="pricing-page">
      <header className="pricing-header">
        <Link className="pricing-brand" to="/">
          <span>C</span>
          ClearBudget
        </Link>

        <div className="pricing-header-actions">
          {user ? (
            <Link to="/dashboard">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login">Sign In</Link>

              <Link
                className="pricing-header-primary"
                to="/signup"
              >
                Join Beta
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="pricing-hero">
        <div className="pricing-beta-badge">
          ClearBudget Beta
        </div>

        <h1>Affordable plans after the beta</h1>

        <p>
          Pricing is not active yet. Beta testers can use
          ClearBudget free while the product is being
          developed.
        </p>

        <div className="pricing-beta-notice">
          <FiStar />

          <div>
            <strong>
              Premium features are free during beta
            </strong>

            <span>
              Current beta testers receive Pro access
              without being charged.
            </span>
          </div>
        </div>
      </section>

      <section className="pricing-grid">
        {plans.map((plan) => {
          const Icon = plan.icon;

          const isCurrentPlan =
            user && currentPlan === plan.id;

          return (
            <article
              key={plan.id}
              className={
                plan.featured
                  ? "pricing-card pricing-card-featured"
                  : "pricing-card"
              }
            >
              {plan.featured && (
                <div className="pricing-popular-badge">
                  Most Popular
                </div>
              )}

              <div className="pricing-plan-icon">
                <Icon />
              </div>

              <p className="pricing-plan-name">
                {plan.name}
              </p>

              <div className="pricing-price">
                <strong>
                  {formatPrice(plan.price)}
                </strong>

                {plan.priceLabel && (
                  <span>{plan.priceLabel}</span>
                )}
              </div>

              <p className="pricing-description">
                {plan.description}
              </p>

              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <FiCheck />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan && isBeta ? (
                <button
                  className="pricing-current-button"
                  type="button"
                  disabled
                >
                  Current Beta Plan
                </button>
              ) : user ? (
                <button
                  className="pricing-plan-button"
                  type="button"
                  disabled
                  title="Payments will be available after beta"
                >
                  Available After Beta
                </button>
              ) : (
                <Link
                  className="pricing-plan-button"
                  to="/signup"
                >
                  Join the Beta
                </Link>
              )}
            </article>
          );
        })}
      </section>
<section className="pricing-comparison">
  <h2>Compare Plans</h2>

  <table className="pricing-table">
    <thead>
      <tr>
        <th>Feature</th>
        <th>Free</th>
        <th>Pro</th>
        <th>Lifetime</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>Income & Expense Tracking</td>
        <td>✓</td>
        <td>✓</td>
        <td>✓</td>
      </tr>

      <tr>
        <td>Budgets</td>
        <td>✓</td>
        <td>✓</td>
        <td>✓</td>
      </tr>

      <tr>
        <td>Savings Goals</td>
        <td>✓</td>
        <td>✓</td>
        <td>✓</td>
      </tr>

      <tr>
        <td>Advanced Reports</td>
        <td>—</td>
        <td>✓</td>
        <td>✓</td>
      </tr>

      <tr>
        <td>Recurring Transactions</td>
        <td>—</td>
        <td>✓</td>
        <td>✓</td>
      </tr>

      <tr>
        <td>CSV Export</td>
        <td>—</td>
        <td>✓</td>
        <td>✓</td>
      </tr>

      <tr>
        <td>Future AI Insights</td>
        <td>—</td>
        <td>✓</td>
        <td>✓</td>
      </tr>

      <tr>
        <td>Priority Support</td>
        <td>—</td>
        <td>✓</td>
        <td>✓</td>
      </tr>
    </tbody>
  </table>
</section>
      <section className="pricing-footer-note">
        <h2>No payment required during beta</h2>

        <p>
          Beta users will be notified before paid plans
          launch. No subscription or payment will begin
          automatically.
        </p>
      </section>
    </main>
  );
}

export default Pricing;