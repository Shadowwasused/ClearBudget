import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiDollarSign,
  FiLock,
  FiPieChart,
  FiTarget,
} from "react-icons/fi";

import "./LandingPage.css";

const features = [
  {
    icon: FiDollarSign,
    title: "Track your money",
    description:
      "Keep accounts, income, expenses, and transactions organized in one clear workspace.",
  },
  {
    icon: FiCalendar,
    title: "Stay ahead of bills",
    description:
      "See upcoming bills and important financial dates before they become surprises.",
  },
  {
    icon: FiPieChart,
    title: "Build a practical budget",
    description:
      "Create spending targets and understand where your money is going each month.",
  },
  {
    icon: FiTarget,
    title: "Reach savings goals",
    description:
      "Track progress toward emergency funds, vacations, major purchases, and more.",
  },
  {
    icon: FiBarChart2,
    title: "Understand your progress",
    description:
      "Use simple reports and summaries without being overwhelmed by complicated tools.",
  },
  {
    icon: FiLock,
    title: "Your private workspace",
    description:
      "Every account has its own secure sign-in and personal financial workspace.",
  },
];

function LandingPage({ user }) {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link className="landing-brand" to="/">
          <span className="landing-brand-icon">
            <FiDollarSign />
          </span>

          <span>
            <strong>ClearBudget</strong>
            <small>Personal finance made clear</small>
          </span>
        </Link>

        <nav className="landing-nav" aria-label="Public navigation">
          <a href="#features">Features</a>
          <a href="#beta">Beta</a>
          <a href="#pricing">Pricing</a>

          {user ? (
            <Link className="landing-sign-in" to="/dashboard">
              Open dashboard
            </Link>
          ) : (
            <Link className="landing-sign-in" to="/login">
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow">
              Now accepting beta testers
            </span>

            <h1>
              A simpler way to understand your money.
            </h1>

            <p>
              ClearBudget brings accounts, transactions, bills,
              budgets, savings goals, calendars, and reports into one
              clean workspace—without an expensive subscription.
            </p>

            <div className="landing-hero-actions">
              {user ? (
                <Link className="landing-primary-button" to="/dashboard">
                  Go to your dashboard
                  <FiArrowRight />
                </Link>
              ) : (
                <>
                  <Link className="landing-primary-button" to="/signup">
                    Join the free beta
                    <FiArrowRight />
                  </Link>

                  <Link className="landing-secondary-button" to="/login">
                    I already have an account
                  </Link>
                </>
              )}
            </div>

            <div className="landing-trust-row">
              <span>
                <FiCheck />
                Free during beta
              </span>
              <span>
                <FiCheck />
                No credit card required
              </span>
              <span>
                <FiCheck />
                Works on desktop and mobile
              </span>
            </div>
          </div>

          <div className="landing-preview-card">
            <div className="landing-preview-header">
              <div>
                <span>ClearBudget overview</span>
                <strong>Your financial picture</strong>
              </div>

              <span className="landing-beta-chip">BETA</span>
            </div>

            <div className="landing-preview-grid">
              <article>
                <span>Total balance</span>
                <strong>$8,420.50</strong>
                <small>Across all accounts</small>
              </article>

              <article>
                <span>Monthly savings</span>
                <strong>$685.00</strong>
                <small>On track this month</small>
              </article>

              <article>
                <span>Upcoming bills</span>
                <strong>4</strong>
                <small>Next 14 days</small>
              </article>

              <article>
                <span>Budget used</span>
                <strong>62%</strong>
                <small>Healthy spending pace</small>
              </article>
            </div>

            <div className="landing-progress-panel">
              <div>
                <span>Emergency fund</span>
                <strong>$2,500 of $10,000</strong>
              </div>

              <div className="landing-progress-track">
                <span />
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section-heading">
            <span>Everything in one place</span>
            <h2>Built for real everyday budgeting</h2>
            <p>
              ClearBudget is designed to be useful immediately, while
              still giving you room to grow into more advanced tools.
            </p>
          </div>

          <div className="landing-feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className="landing-feature-card">
                  <span className="landing-feature-icon">
                    <Icon />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-beta-section" id="beta">
          <div>
            <span className="landing-eyebrow">Help shape ClearBudget</span>
            <h2>Join the beta and build it with us.</h2>
            <p>
              Beta members receive early access while ClearBudget is
              actively being improved. Use the app, report issues, and
              tell us which features would make managing money easier.
            </p>
          </div>

          <div className="landing-beta-list">
            <span>
              <FiCheck />
              Early access to new features
            </span>
            <span>
              <FiCheck />
              Free access throughout the beta
            </span>
            <span>
              <FiCheck />
              A direct voice in product improvements
            </span>
            <span>
              <FiCheck />
              No payment information required
            </span>
          </div>
        </section>

        <section className="landing-section" id="pricing">
          <div className="landing-section-heading">
            <span>Simple future pricing</span>
            <h2>Affordable plans after the beta</h2>
            <p>
              Pricing is not active yet. Beta testers can use
              ClearBudget free while the product is being developed.
            </p>
          </div>

          <div className="landing-pricing-grid">
            <article className="landing-price-card">
              <span>Free</span>
              <strong>$0</strong>
              <p>Core budgeting tools for everyday personal finance.</p>
            </article>

            <article className="landing-price-card landing-price-featured">
              <span>Pro</span>
              <strong>$4.99</strong>
              <small>per month</small>
              <p>
                Advanced reports, analytics, recurring tools, exports,
                and premium features.
              </p>
            </article>

            <article className="landing-price-card">
              <span>Lifetime</span>
              <strong>$39.99</strong>
              <p>
                A possible limited launch offer for early supporters.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-final-cta">
          <span className="landing-eyebrow">ClearBudget Beta</span>
          <h2>Start building a clearer financial picture today.</h2>
          <p>
            Create your private workspace and help shape the future of
            ClearBudget.
          </p>

          {user ? (
            <Link className="landing-primary-button" to="/dashboard">
              Open your dashboard
              <FiArrowRight />
            </Link>
          ) : (
            <Link className="landing-primary-button" to="/signup">
              Join the free beta
              <FiArrowRight />
            </Link>
          )}
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-brand">
          <span className="landing-brand-icon">
            <FiDollarSign />
          </span>

          <span>
            <strong>ClearBudget</strong>
            <small>Personal finance made clear</small>
          </span>
        </div>

        <p>
          Beta software is still in active development. Features may
          change as ClearBudget improves.
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;