import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiMessageSquare,
  FiShield,
  FiStar,
} from "react-icons/fi";

import "./BetaWelcome.css";

export default function BetaWelcome() {
  const navigate = useNavigate();

  function handleStart() {
    navigate("/onboarding", { replace: true });
  }

  return (
    <main className="beta-welcome-page">
      <section className="beta-welcome-card">
        <div className="beta-welcome-badge">
          <FiStar />
          ClearBudget Beta
        </div>

        <h1>Welcome to ClearBudget</h1>

        <p className="beta-welcome-intro">
          Thank you for joining the beta. You now have early access
          while ClearBudget is actively being improved.
        </p>

        <div className="beta-welcome-grid">
          <article>
            <span>
              <FiCheckCircle />
            </span>

            <div>
              <h2>Use the full beta</h2>
              <p>
                Explore accounts, transactions, bills, budgets,
                savings goals, reports, and your calendar.
              </p>
            </div>
          </article>

          <article>
            <span>
              <FiMessageSquare />
            </span>

            <div>
              <h2>Share honest feedback</h2>
              <p>
                Tell us what feels confusing, what breaks, and what
                would make ClearBudget more useful.
              </p>
            </div>
          </article>

          <article>
            <span>
              <FiBarChart2 />
            </span>

            <div>
              <h2>See new features early</h2>
              <p>
                Reporting, analytics, recurring tools, imports, and
                other improvements are on the roadmap.
              </p>
            </div>
          </article>

          <article>
            <span>
              <FiShield />
            </span>

            <div>
              <h2>Remember this is beta software</h2>
              <p>
                Features may change while testing continues. Do not
                rely on ClearBudget as your only financial record.
              </p>
            </div>
          </article>
        </div>

        <div className="beta-welcome-note">
          <strong>Free throughout the beta</strong>
          <span>No credit card or payment information is required.</span>
        </div>

        <button type="button" onClick={handleStart}>
          Start using ClearBudget
          <FiArrowRight />
        </button>
      </section>
    </main>
  );
}