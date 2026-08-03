import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiMessageSquare,
  FiRefreshCw,
  FiShield,
  FiStar,
  FiUsers,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import {
  fetchAdminFeedback,
  fetchAdminOverview,
  updateFeedbackStatus,
} from "../lib/adminApi";

const statusOptions = [
  {
    value: "new",
    label: "New",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "closed",
    label: "Closed",
  },
];

const categoryLabels = {
  bug: "Bug",
  feature: "Feature Request",
  improvement: "Improvement",
  general: "General Feedback",
};

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function Admin() {
  const { profile, user } = useAuth();

  const [overview, setOverview] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    totalFeedback: 0,
    newFeedback: 0,
    bugs: 0,
    featureRequests: 0,
  });

  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] =
    useState(null);

  const recentFeedback = useMemo(
    () => feedback.slice(0, 8),
    [feedback],
  );

  async function loadAdminData({
    showRefreshState = false,
  } = {}) {
    try {
      setErrorMessage("");

      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [overviewData, feedbackData] =
        await Promise.all([
          fetchAdminOverview(),
          fetchAdminFeedback(),
        ]);

      setOverview(overviewData);
      setFeedback(feedbackData);
    } catch (error) {
      console.error(
        "Unable to load admin dashboard:",
        error,
      );

      setErrorMessage(
        error?.message ||
          "ClearBudget could not load the admin dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleStatusChange(
    feedbackId,
    status,
  ) {
    try {
      setStatusUpdatingId(feedbackId);
      setErrorMessage("");

      await updateFeedbackStatus(
        feedbackId,
        status,
      );

      setFeedback((current) =>
        current.map((item) =>
          item.id === feedbackId
            ? {
                ...item,
                status,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      const refreshedOverview =
        await fetchAdminOverview();

      setOverview(refreshedOverview);
    } catch (error) {
      console.error(
        "Unable to update feedback status:",
        error,
      );

      setErrorMessage(
        error?.message ||
          "The feedback status could not be updated.",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading admin-page-heading">
        <div>
          <p className="page-eyebrow">
            ClearBudget administration
          </p>

          <h1>Admin Dashboard</h1>

          <p className="page-description">
            Review beta activity, users, and feedback from
            one secure area.
          </p>
        </div>

        <button
          className="admin-refresh-button"
          type="button"
          onClick={() =>
            loadAdminData({
              showRefreshState: true,
            })
          }
          disabled={refreshing}
        >
          <FiRefreshCw />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <section className="admin-welcome-card">
        <div className="admin-welcome-icon">
          <FiShield />
        </div>

        <div>
          <p>Signed in as administrator</p>

          <h2>
            {profile?.fullName ||
              user?.user_metadata?.full_name ||
              user?.email}
          </h2>

          <span>{user?.email}</span>
        </div>
      </section>

      {errorMessage && (
        <div className="admin-error-message">
          <FiAlertCircle />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <section className="admin-loading-card">
          <FiRefreshCw />
          <p>Loading admin data...</p>
        </section>
      ) : (
        <>
          <div className="admin-summary-grid">
            <article className="admin-summary-card">
              <span className="admin-summary-icon">
                <FiUsers />
              </span>

              <div>
                <p>Total users</p>
                <strong>{overview.totalUsers}</strong>
                <span>
                  {overview.newUsersToday} joined today
                </span>
              </div>
            </article>

            <article className="admin-summary-card">
              <span className="admin-summary-icon">
                <FiMessageSquare />
              </span>

              <div>
                <p>Total feedback</p>
                <strong>{overview.totalFeedback}</strong>
                <span>
                  {overview.newFeedback} still new
                </span>
              </div>
            </article>

            <article className="admin-summary-card">
              <span className="admin-summary-icon">
                <FiAlertCircle />
              </span>

              <div>
                <p>Bug reports</p>
                <strong>{overview.bugs}</strong>
                <span>Submitted by beta testers</span>
              </div>
            </article>

            <article className="admin-summary-card">
              <span className="admin-summary-icon">
                <FiStar />
              </span>

              <div>
                <p>Feature requests</p>
                <strong>
                  {overview.featureRequests}
                </strong>
                <span>Ideas from your users</span>
              </div>
            </article>
          </div>

          <section className="admin-section-card">
            <div className="admin-section-heading">
              <div>
                <p className="page-eyebrow">
                  Feedback inbox
                </p>

                <h2>Recent submissions</h2>
              </div>

              <span>
                Showing {recentFeedback.length} of{" "}
                {feedback.length}
              </span>
            </div>

            {recentFeedback.length === 0 ? (
              <div className="admin-empty-state">
                <FiMessageSquare />
                <h3>No feedback yet</h3>
                <p>
                  New beta feedback will appear here
                  automatically.
                </p>
              </div>
            ) : (
              <div className="admin-feedback-list">
                {recentFeedback.map((item) => (
                  <article
                    className="admin-feedback-card"
                    key={item.id}
                  >
                    <div className="admin-feedback-topline">
                      <span
                        className={`admin-feedback-category admin-feedback-category-${item.category}`}
                      >
                        {categoryLabels[item.category] ||
                          item.category}
                      </span>

                      <span className="admin-feedback-date">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <h3>{item.title}</h3>

                    <p className="admin-feedback-message">
                      {item.message}
                    </p>

                    <div className="admin-feedback-meta">
                      <span>
                        <strong>Email:</strong>{" "}
                        {item.email || "Unavailable"}
                      </span>

                      <span>
                        <strong>Page:</strong>{" "}
                        {item.pageUrl || "Unknown"}
                      </span>

                      <span>
                        <strong>Version:</strong>{" "}
                        {item.appVersion || "beta"}
                      </span>
                    </div>

                    <div className="admin-feedback-actions">
                      <label>
                        <span>Status</span>

                        <select
                          value={item.status}
                          disabled={
                            statusUpdatingId === item.id
                          }
                          onChange={(event) =>
                            handleStatusChange(
                              item.id,
                              event.target.value,
                            )
                          }
                        >
                          {statusOptions.map(
                            (option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <div
                        className={`admin-status-pill admin-status-${item.status}`}
                      >
                        {item.status === "new" && (
                          <FiClock />
                        )}

                        {item.status ===
                          "in_progress" && (
                          <FiActivity />
                        )}

                        {item.status ===
                          "completed" && (
                          <FiCheckCircle />
                        )}

                        {item.status === "closed" && (
                          <FiCheckCircle />
                        )}

                        <span>
                          {
                            statusOptions.find(
                              (option) =>
                                option.value ===
                                item.status,
                            )?.label
                          }
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Admin;