import {
  FiHome,
  FiCreditCard,
  FiFileText,
  FiPieChart,
  FiSettings,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
  FiDollarSign,
} from "react-icons/fi";
import "./index.css";

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">$</div>

          <div>
            <h1>ClearBudget</h1>
            <p>Personal Finance</p>
          </div>
        </div>

        <nav className="navigation">
          <button className="nav-item active">
            <FiHome />
            Dashboard
          </button>

          <button className="nav-item">
            <FiCreditCard />
            Transactions
          </button>

          <button className="nav-item">
            <FiFileText />
            Bills
          </button>

          <button className="nav-item">
            <FiPieChart />
            Budget
          </button>

          <button className="nav-item">
            <FiTarget />
            Goals
          </button>

          <button className="nav-item">
            <FiDollarSign />
            Reports
          </button>

          <button className="nav-item">
            <FiSettings />
            Settings
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Financial overview</p>
            <h2>Welcome to ClearBudget</h2>
          </div>

          <button className="primary-button">Add Transaction</button>
        </header>

        <section className="summary-grid">
          <article className="summary-card">
            <div className="summary-icon">
              <FiDollarSign />
            </div>

            <div>
              <p>Total Balance</p>
              <h3>$8,420.36</h3>
              <span className="positive">+$620 this month</span>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon">
              <FiTrendingUp />
            </div>

            <div>
              <p>Monthly Income</p>
              <h3>$5,200.00</h3>
              <span className="positive">Up 4.2%</span>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon">
              <FiTrendingDown />
            </div>

            <div>
              <p>Monthly Spending</p>
              <h3>$3,480.75</h3>
              <span className="negative">68% of income</span>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon">
              <FiFileText />
            </div>

            <div>
              <p>Upcoming Bills</p>
              <h3>$842.16</h3>
              <span>5 bills remaining</span>
            </div>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel spending-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">This month</p>
                <h3>Spending Overview</h3>
              </div>

              <button className="secondary-button">View Report</button>
            </div>

            <div className="chart-placeholder">
              <div className="bar bar-1"></div>
              <div className="bar bar-2"></div>
              <div className="bar bar-3"></div>
              <div className="bar bar-4"></div>
              <div className="bar bar-5"></div>
              <div className="bar bar-6"></div>
            </div>

            <div className="chart-labels">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Next 30 days</p>
                <h3>Upcoming Bills</h3>
              </div>
            </div>

            <div className="bill-list">
              <div className="bill-row">
                <div>
                  <strong>Electric</strong>
                  <span>Due August 2</span>
                </div>
                <strong>$184.52</strong>
              </div>

              <div className="bill-row">
                <div>
                  <strong>Internet</strong>
                  <span>Due August 5</span>
                </div>
                <strong>$79.99</strong>
              </div>

              <div className="bill-row">
                <div>
                  <strong>Car Payment</strong>
                  <span>Due August 9</span>
                </div>
                <strong>$425.00</strong>
              </div>

              <div className="bill-row">
                <div>
                  <strong>Phone</strong>
                  <span>Due August 12</span>
                </div>
                <strong>$94.20</strong>
              </div>
            </div>
          </article>

          <article className="panel transactions-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Latest activity</p>
                <h3>Recent Transactions</h3>
              </div>

              <button className="secondary-button">View All</button>
            </div>

            <div className="transaction-list">
              <div className="transaction-row">
                <div className="transaction-details">
                  <div className="transaction-icon">W</div>

                  <div>
                    <strong>Walmart</strong>
                    <span>Groceries · July 28</span>
                  </div>
                </div>

                <strong className="negative">-$84.17</strong>
              </div>

              <div className="transaction-row">
                <div className="transaction-details">
                  <div className="transaction-icon">S</div>

                  <div>
                    <strong>Shell</strong>
                    <span>Gas · July 27</span>
                  </div>
                </div>

                <strong className="negative">-$46.20</strong>
              </div>

              <div className="transaction-row">
                <div className="transaction-details">
                  <div className="transaction-icon">P</div>

                  <div>
                    <strong>Payroll Deposit</strong>
                    <span>Income · July 26</span>
                  </div>
                </div>

                <strong className="positive">+$2,600.00</strong>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default App;