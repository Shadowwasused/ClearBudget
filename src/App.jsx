import { useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  FiBarChart2,
  FiCalendar,
  FiCreditCard,
  FiDollarSign,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPieChart,
  FiSettings,
  FiTarget,
  FiX,
} from "react-icons/fi";

import { useAuth } from "./context/AuthContext";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import LandingPage from "./pages/LandingPage";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Bills from "./pages/Bills";
import Budget from "./pages/Budget";
import Goals from "./pages/Goals";
import Reports from "./pages/Reports";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Accounts from "./pages/Accounts";
import BetaWelcome from "./pages/BetaWelcome";
import Onboarding from "./pages/Onboarding";
import AuthCallback from "./pages/AuthCallback";
import FeedbackWidget from "./components/FeedbackWidget";

const navigationItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: FiHome,
  },
  {
    name: "Accounts",
    path: "/accounts",
    icon: FiCreditCard,
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
    name: "Savings Goals",
    path: "/goals",
    icon: FiTarget,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FiBarChart2,
  },
  {
    name: "Calendar",
    path: "/calendar",
    icon: FiCalendar,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: FiSettings,
  },
];

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>ClearBudget</h1>
          <p>Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
  path="/onboarding"
  element={
    user ? (
      <Onboarding />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
      <Route
  path="/beta-welcome"
  element={
    user ? (
      <BetaWelcome />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
      <Route
        path="/"
        element={<LandingPage user={user} />}
      />

      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/signup"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Signup />
          )
        }
      />
<Route
  path="/auth/callback"
  element={<AuthCallback />}
/>
      <Route
        path="/*"
        element={
          user ? (
            <ProtectedApp />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function ProtectedApp() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const fullName =
    user?.user_metadata?.full_name?.trim() || "My Account";

  const email = user?.email || "Personal workspace";

  const profileInitial =
    fullName !== "My Account"
      ? fullName.charAt(0).toUpperCase()
      : email.charAt(0).toUpperCase();

  function closeSidebar() {
    setSidebarOpen(false);
  }

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await signOut();
    } catch (error) {
      console.error("Unable to sign out:", error);
      alert("You could not be signed out. Please try again.");
      setSigningOut(false);
    }
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

      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
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
                  isActive
                    ? "nav-link nav-link-active"
                    : "nav-link"
                }
              >
                <Icon />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-avatar">
            {profileInitial}
          </div>

          <div className="sidebar-profile-details">
            <strong>{fullName}</strong>
            <span>{email}</span>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <FiLogOut />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/accounts"
            element={<Accounts />}
          />

          <Route
            path="/transactions"
            element={<Transactions />}
          />

          <Route
            path="/bills"
            element={<Bills />}
          />

          <Route
            path="/budget"
            element={<Budget />}
          />

          <Route
            path="/goals"
            element={<Goals />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/calendar"
            element={<Calendar />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </main>
      <FeedbackWidget />
    </div>
  );
}

export default App;