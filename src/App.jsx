import { useState } from "react";
import Transactions from "./pages/Transactions";
import Dashboard from "./pages/Dashboard";
import Bills from "./pages/Bills";
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