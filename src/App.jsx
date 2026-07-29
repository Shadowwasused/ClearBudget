import { useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import {
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiHome,
  FiMenu,
  FiPieChart,
  FiSettings,
  FiX,
} from "react-icons/fi";

const navigationItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: FiHome,
  },
  {
    name: "Transactions",
    path: "/transactions",
    icon: FiDollarSign,
  },
  {
    name: "Bills",
    path: "/bills",
    icon: FiCalendar,
  },
  {
    name: "Budget",
    path: "/budget",
    icon: FiPieChart,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FiBarChart2,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: FiSettings,
  },
];

function Dashboard() {
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">Financial overview</p>
          <h1>Dashboard</h1>
          <p className="page-description">
            Review your money, spending, bills, and savings.
          </p>
        </div>

        <button className="primary-button" type="button">
          Add transaction
        </button>
      </div>

      <div className="summary-grid">
        <SummaryCard
          title="Total balance"
          value="$12,450.00"
          change="+$825.00 this month"
        />

        <SummaryCard
          title="Monthly income"
          value="$5,600.00"
          change="+4.2% from last month"
        />

        <SummaryCard
          title="Monthly spending"
          value="$3,245.70"
          change="$2,354.30 remaining"
        />

        <SummaryCard
          title="Savings"
          value="$2,354.30"
          change="42% of monthly income"
        />
      </div>

      <div className="dashboard-grid">
        <section className="content-card spending-card">
          <div className="card-heading">
            <div>
              <p className="card-label">Monthly activity</p>
              <h2>Spending overview</h2>
            </div>

            <select className="month-select" defaultValue="July">
              <option>July</option>
              <option>June</option>
              <option>May</option>
            </select>
          </div>

          <div className="chart-placeholder">
            <div className="chart-bar chart-bar-one" />
            <div className="chart-bar chart-bar-two" />
            <div className="chart-bar chart-bar-three" />
            <div className="chart-bar chart-bar-four" />
            <div className="chart-bar chart-bar-five" />
            <div className="chart-bar chart-bar-six" />
            <div className="chart-bar chart-bar-seven" />
          </div>

          <div className="chart-labels">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </section>

        <section className="content-card">
          <div className="card-heading">
            <div>
              <p className="card-label">Next 30 days</p>
              <h2>Upcoming bills</h2>
            </div>

            <NavLink className="text-link" to="/bills">
              View all
            </NavLink>
          </div>

          <div className="bill-list">
            <BillItem name="Rent" date="August 1" amount="$1,450.00" />
            <BillItem name="Electric" date="August 5" amount="$142.00" />
            <BillItem name="Internet" date="August 9" amount="$79.99" />
            <BillItem name="Car insurance" date="August 14" amount="$185.00" />
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

        <div className="transaction-list">
          <TransactionItem
            name="Grocery Store"
            category="Groceries"
            date="July 28"
            amount="-$124.68"
          />

          <TransactionItem
            name="Payroll Deposit"
            category="Income"
            date="July 26"
            amount="+$2,800.00"
            positive
          />

          <TransactionItem
            name="Gas Station"
            category="Transportation"
            date="July 25"
            amount="-$58.42"
          />
        </div>
      </section>
    </div>
  );
}

function Transactions() {
  return (
    <PagePlaceholder
      eyebrow="Money activity"
      title="Transactions"
      description="Add, review, search, and categorize your income and purchases."
      buttonText="Add transaction"
    />
  );
}

function Bills() {
  return (
    <PagePlaceholder
      eyebrow="Payment schedule"
      title="Bills"
      description="Track upcoming bills, due dates, payment status, and recurring expenses."
      buttonText="Add bill"
    />
  );
}

function Budget() {
  return (
    <PagePlaceholder
      eyebrow="Spending plan"
      title="Budget"
      description="Create monthly budgets and track spending by category."
      buttonText="Create budget"
    />
  );
}

function Reports() {
  return (
    <PagePlaceholder
      eyebrow="Financial analysis"
      title="Reports"
      description="Review income, spending, savings, and printable financial summaries."
      buttonText="Create report"
    />
  );
}

function Settings() {
  return (
    <PagePlaceholder
      eyebrow="Application preferences"
      title="Settings"
      description="Manage your profile, accounts, categories, notifications, and report options."
      buttonText="Save settings"
    />
  );
}

function PagePlaceholder({ eyebrow, title, description, buttonText }) {
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>

        <button className="primary-button" type="button">
          {buttonText}
        </button>
      </div>

      <section className="content-card empty-state">
        <div className="empty-state-icon">
          <FiDollarSign />
        </div>

        <h2>{title} is ready to build</h2>
        <p>
          The navigation is connected. We will build the full {title.toLowerCase()}{" "}
          feature next.
        </p>
      </section>
    </div>
  );
}

function SummaryCard({ title, value, change }) {
  return (
    <section className="summary-card">
      <p>{title}</p>
      <h2>{value}</h2>
      <span>{change}</span>
    </section>
  );
}

function BillItem({ name, date, amount }) {
  return (
    <div className="bill-item">
      <div className="bill-icon">
        <FiCalendar />
      </div>

      <div className="bill-details">
        <strong>{name}</strong>
        <span>Due {date}</span>
      </div>

      <strong className="bill-amount">{amount}</strong>
    </div>
  );
}

function TransactionItem({ name, category, date, amount, positive = false }) {
  return (
    <div className="transaction-item">
      <div className="transaction-icon">
        <FiDollarSign />
      </div>

      <div className="transaction-details">
        <strong>{name}</strong>
        <span>
          {category} · {date}
        </span>
      </div>

      <strong
        className={
          positive
            ? "transaction-amount transaction-positive"
            : "transaction-amount"
        }
      >
        {amount}
      </strong>
    </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      <button
        className="mobile-menu-button"
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
      >
        <FiMenu />
      </button>

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <FiDollarSign />
            </div>

            <div>
              <strong>ClearBudget</strong>
              <span>Personal finance</span>
            </div>
          </div>

          <button
            className="sidebar-close-button"
            type="button"
            onClick={closeSidebar}
            aria-label="Close navigation"
          >
            <FiX />
          </button>
        </div>

        <nav className="sidebar-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                <Icon />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-avatar">J</div>

          <div>
            <strong>My Account</strong>
            <span>Personal workspace</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;