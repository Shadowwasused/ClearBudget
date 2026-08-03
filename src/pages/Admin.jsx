import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiLock,
  FiMail,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiStar,
  FiUnlock,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

import {
  fetchAdminFeedback,
  fetchAdminOverview,
  fetchAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
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

function formatDate(value, includeTime = true) {
  if (!value) {
    return "Unknown";
  }

  const options = includeTime
    ? {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    : {
        month: "short",
        day: "numeric",
        year: "numeric",
      };

  return new Intl.DateTimeFormat(
    "en-US",
    options,
  ).format(new Date(value));
}

function getWorkspaceLabel(user) {
  if (user.role === "admin") {
    return "Administrator";
  }

  if (user.role === "beta") {
    return "Beta";
  }

  if (user.role === "premium") {
    return "Premium";
  }

  if (user.role === "support") {
    return "Support";
  }

  return "Personal";
}

function getResolvedWorkspaceTheme(user) {
  if (
    user.theme &&
    user.theme !== "role"
  ) {
    return user.theme;
  }

  return user.role === "admin"
    ? "graphite"
    : "midnight";
}

function Admin() {
  const { profile, user } = useAuth();

  const [activeTab, setActiveTab] =
    useState("overview");

  const [overview, setOverview] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    totalFeedback: 0,
    newFeedback: 0,
    bugs: 0,
    featureRequests: 0,
  });

  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    statusUpdatingId,
    setStatusUpdatingId,
  ] = useState(null);

  const [userSearch, setUserSearch] =
    useState("");

  const [userSort, setUserSort] =
    useState("newest");

  const [selectedUser, setSelectedUser] =
    useState(null);

  const recentFeedback = useMemo(
    () => feedback.slice(0, 8),
    [feedback],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch =
      userSearch.trim().toLowerCase();

    return [...users]
      .filter((adminUser) => {
        const searchableText = [
          adminUser.fullName,
          adminUser.email,
          adminUser.role,
          adminUser.accountStatus,
          adminUser.currency,
          adminUser.theme,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          normalizedSearch,
        );
      })
      .sort((firstUser, secondUser) => {
        const firstDate = new Date(
          firstUser.createdAt,
        ).getTime();

        const secondDate = new Date(
          secondUser.createdAt,
        ).getTime();

        if (userSort === "oldest") {
          return firstDate - secondDate;
        }

        if (userSort === "name") {
          return firstUser.fullName.localeCompare(
            secondUser.fullName,
          );
        }

        return secondDate - firstDate;
      });
  }, [users, userSearch, userSort]);

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

      const [
        overviewData,
        userData,
        feedbackData,
      ] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminUsers(),
        fetchAdminFeedback(),
      ]);

      setOverview(overviewData);
      setUsers(userData);
      setFeedback(feedbackData);

      if (selectedUser) {
        const refreshedSelectedUser =
          userData.find(
            (adminUser) =>
              adminUser.id === selectedUser.id,
          );

        setSelectedUser(
          refreshedSelectedUser || null,
        );
      }
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

      setFeedback((currentFeedback) =>
        currentFeedback.map((item) =>
          item.id === feedbackId
            ? {
                ...item,
                status,
                updatedAt:
                  new Date().toISOString(),
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

  async function handleUserRoleUpdated(
    userId,
    newRole,
  ) {
    setUsers((currentUsers) =>
      currentUsers.map((adminUser) =>
        adminUser.id === userId
          ? {
              ...adminUser,
              role: newRole,
            }
          : adminUser,
      ),
    );

    setSelectedUser((currentUser) => {
      if (
        !currentUser ||
        currentUser.id !== userId
      ) {
        return currentUser;
      }

      return {
        ...currentUser,
        role: newRole,
      };
    });

    try {
      const refreshedOverview =
        await fetchAdminOverview();

      setOverview(refreshedOverview);
    } catch (error) {
      console.error(
        "Unable to refresh admin overview:",
        error,
      );
    }
  }

  async function handleUserStatusUpdated(
    userId,
    accountStatus,
  ) {
    setUsers((currentUsers) =>
      currentUsers.map((adminUser) =>
        adminUser.id === userId
          ? {
              ...adminUser,
              accountStatus,
            }
          : adminUser,
      ),
    );

    setSelectedUser((currentUser) => {
      if (
        !currentUser ||
        currentUser.id !== userId
      ) {
        return currentUser;
      }

      return {
        ...currentUser,
        accountStatus,
      };
    });
  }



  return (
    <div className="page-content">
      <div className="page-heading admin-page-heading">
        <div>
          <p className="page-eyebrow">
            ClearBudget administration
          </p>

          <h1>Admin Control Center</h1>

          <p className="page-description">
            Review users, beta activity, and feedback
            from one secure workspace.
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

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      <section className="admin-welcome-card">
        <div className="admin-welcome-icon">
          <FiShield />
        </div>

        <div>
          <p>Administrator workspace</p>

          <h2>
            {profile?.fullName ||
              user?.user_metadata?.full_name ||
              user?.email}
          </h2>

          <span>{user?.email}</span>
        </div>
      </section>

      <nav className="admin-tab-navigation">
        <button
          type="button"
          className={
            activeTab === "overview"
              ? "admin-tab-button admin-tab-button-active"
              : "admin-tab-button"
          }
          onClick={() =>
            setActiveTab("overview")
          }
        >
          <FiActivity />
          Overview
        </button>

        <button
          type="button"
          className={
            activeTab === "users"
              ? "admin-tab-button admin-tab-button-active"
              : "admin-tab-button"
          }
          onClick={() =>
            setActiveTab("users")
          }
        >
          <FiUsers />
          Users
          <span>{users.length}</span>
        </button>

        <button
          type="button"
          className={
            activeTab === "feedback"
              ? "admin-tab-button admin-tab-button-active"
              : "admin-tab-button"
          }
          onClick={() =>
            setActiveTab("feedback")
          }
        >
          <FiMessageSquare />
          Feedback
          <span>{feedback.length}</span>
        </button>
      </nav>

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
          {activeTab === "overview" && (
            <OverviewTab
              overview={overview}
              recentFeedback={recentFeedback}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "users" && (
            <UsersTab
              users={filteredUsers}
              totalUsers={users.length}
              search={userSearch}
              setSearch={setUserSearch}
              sort={userSort}
              setSort={setUserSort}
              onViewUser={setSelectedUser}
            />
          )}

          {activeTab === "feedback" && (
            <FeedbackTab
              feedback={feedback}
              statusUpdatingId={
                statusUpdatingId
              }
              onStatusChange={
                handleStatusChange
              }
            />
          )}
        </>
      )}

      {selectedUser && (
        <UserDetailPanel
          selectedUser={selectedUser}
          currentUserId={user?.id}
          onRoleUpdated={
            handleUserRoleUpdated
          }
          onStatusUpdated={
            handleUserStatusUpdated
          }
          onClose={() =>
            setSelectedUser(null)
          }
        />
      )}
    </div>
  );
}

function OverviewTab({
  overview,
  recentFeedback,
  setActiveTab,
}) {
  return (
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
            <strong>
              {overview.totalFeedback}
            </strong>
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
            <span>
              Submitted by beta testers
            </span>
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

          <button
            className="text-link"
            type="button"
            onClick={() =>
              setActiveTab("feedback")
            }
          >
            View all feedback
          </button>
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
              <FeedbackCard
                key={item.id}
                item={item}
                compact
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function UsersTab({
  users,
  totalUsers,
  search,
  setSearch,
  sort,
  setSort,
  onViewUser,
}) {
  return (
    <section className="admin-section-card">
      <div className="admin-section-heading">
        <div>
          <p className="page-eyebrow">
            User management
          </p>

          <h2>ClearBudget users</h2>
        </div>

        <span>
          Showing {users.length} of {totalUsers}
        </span>
      </div>

      <div className="admin-users-toolbar">
        <div className="admin-user-search">
          <FiSearch />

          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={sort}
          onChange={(event) =>
            setSort(event.target.value)
          }
        >
          <option value="newest">
            Newest first
          </option>

          <option value="oldest">
            Oldest first
          </option>

          <option value="name">
            Name A–Z
          </option>
        </select>
      </div>

      {users.length === 0 ? (
        <div className="admin-empty-state">
          <FiUsers />

          <h3>No users found</h3>

          <p>
            Try changing your search or sort options.
          </p>
        </div>
      ) : (
        <div className="admin-users-list">
          {users.map((adminUser) => {
            const initial =
              adminUser.fullName
                ?.charAt(0)
                .toUpperCase() || "U";

            return (
              <article
                className="admin-user-card"
                key={adminUser.id}
              >
                <div className="admin-user-avatar">
                  {adminUser.avatarUrl ? (
                    <img
                      src={adminUser.avatarUrl}
                      alt=""
                    />
                  ) : (
                    initial
                  )}
                </div>

                <div className="admin-user-primary">
                  <div className="admin-user-name-row">
                    <strong>
                      {adminUser.fullName}
                    </strong>

                    <span
                      className={`admin-role-badge admin-role-${adminUser.role}`}
                    >
                      {adminUser.role === "admin"
                        ? "Administrator"
                        : adminUser.role}
                    </span>

                    <span
                      className={
                        adminUser.emailVerified
                          ? "admin-verification-badge admin-verification-verified"
                          : "admin-verification-badge"
                      }
                    >
                      {adminUser.emailVerified
                        ? "Verified"
                        : "Unverified"}
                    </span>

                    <span
                      className={
                        adminUser.accountStatus ===
                        "suspended"
                          ? "admin-account-status-badge admin-account-status-suspended"
                          : "admin-account-status-badge admin-account-status-active"
                      }
                    >
                      {adminUser.accountStatus ===
                      "suspended"
                        ? "Suspended"
                        : "Active"}
                    </span>
                  </div>

                  <span className="admin-user-email">
                    <FiMail />
                    {adminUser.email ||
                      "Email unavailable"}
                  </span>

                  <div className="admin-user-meta">
                    <span>
                      Joined{" "}
                      {formatDate(
                        adminUser.createdAt,
                        false,
                      )}
                    </span>

                    <span>
                      Last login{" "}
                      {adminUser.lastSignInAt
                        ? formatDate(
                            adminUser.lastSignInAt,
                          )
                        : "Never"}
                    </span>

                    <span>
                      Workspace{" "}
                      {getWorkspaceLabel(
                        adminUser,
                      )}
                    </span>
                  </div>
                </div>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    onViewUser(adminUser)
                  }
                >
                  View profile
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FeedbackTab({
  feedback,
  statusUpdatingId,
  onStatusChange,
}) {
  return (
    <section className="admin-section-card">
      <div className="admin-section-heading">
        <div>
          <p className="page-eyebrow">
            Feedback inbox
          </p>

          <h2>All submissions</h2>
        </div>

        <span>
          {feedback.length} total submissions
        </span>
      </div>

      {feedback.length === 0 ? (
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
          {feedback.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              statusUpdatingId={
                statusUpdatingId
              }
              onStatusChange={
                onStatusChange
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FeedbackCard({
  item,
  compact = false,
  statusUpdatingId,
  onStatusChange,
}) {
  return (
    <article className="admin-feedback-card">
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

      {!compact && (
        <>
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
                  onStatusChange(
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

              {(item.status === "completed" ||
                item.status === "closed") && (
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
        </>
      )}
    </article>
  );
}

function UserDetailPanel({
  selectedUser,
  currentUserId,
  onRoleUpdated,
  onStatusUpdated,
  onClose,
}) {
  const [selectedRole, setSelectedRole] =
    useState(selectedUser.role);

  const [savingRole, setSavingRole] =
    useState(false);

  const [roleMessage, setRoleMessage] =
    useState("");

  const [roleError, setRoleError] =
    useState("");

  const [savingStatus, setSavingStatus] =
    useState(false);

  const [statusMessage, setStatusMessage] =
    useState("");

  const [statusError, setStatusError] =
    useState("");

  useEffect(() => {
    setSelectedRole(selectedUser.role);
    setRoleMessage("");
    setRoleError("");
    setStatusMessage("");
    setStatusError("");
  }, [selectedUser]);

  const resolvedTheme =
    getResolvedWorkspaceTheme(selectedUser);

  const isCurrentUser =
    selectedUser.id === currentUserId;

  const isSuspended =
    selectedUser.accountStatus === "suspended";

  async function handleSaveRole() {
    try {
      setSavingRole(true);
      setRoleMessage("");
      setRoleError("");

      const updatedUser =
        await updateAdminUserRole(
          selectedUser.id,
          selectedRole,
        );

      const savedRole =
        updatedUser?.role || selectedRole;

      await onRoleUpdated(
        selectedUser.id,
        savedRole,
      );

      setSelectedRole(savedRole);
      setRoleMessage(
        "Role updated successfully.",
      );
    } catch (error) {
      console.error(
        "Unable to update user role:",
        error,
      );

      setRoleError(
        error?.message ||
          "The user role could not be updated.",
      );
    } finally {
      setSavingRole(false);
    }
  }

  async function handleStatusToggle() {
    const nextStatus = isSuspended
      ? "active"
      : "suspended";

    if (nextStatus === "suspended") {
      const confirmed = window.confirm(
        `Suspend ${selectedUser.fullName}? They will be blocked from using ClearBudget until reactivated.`,
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setSavingStatus(true);
      setStatusMessage("");
      setStatusError("");

      const updatedUser =
        await updateAdminUserStatus(
          selectedUser.id,
          nextStatus,
        );

      const savedStatus =
        updatedUser?.accountStatus ||
        nextStatus;

      await onStatusUpdated(
        selectedUser.id,
        savedStatus,
      );

      setStatusMessage(
        savedStatus === "suspended"
          ? "Account suspended successfully."
          : "Account reactivated successfully.",
      );
    } catch (error) {
      console.error(
        "Unable to update user status:",
        error,
      );

      setStatusError(
        error?.message ||
          "The account status could not be updated.",
      );
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <div
      className="admin-user-drawer-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <aside
        className="admin-user-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-drawer-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="admin-user-drawer-header">
          <div>
            <p className="page-eyebrow">
              User profile
            </p>

            <h2 id="admin-user-drawer-title">
              {selectedUser.fullName}
            </h2>

            <span>{selectedUser.email}</span>
          </div>

          <button
            className="modal-close-button"
            type="button"
            onClick={onClose}
            aria-label="Close user profile"
          >
            <FiX />
          </button>
        </div>

        <div className="admin-user-drawer-content">
          <div className="admin-user-profile-summary">
            <div className="admin-user-profile-avatar">
              <FiUser />
            </div>

            <div>
              <strong>
                {selectedUser.fullName}
              </strong>

              <span>
                {getWorkspaceLabel(
                  selectedUser,
                )}{" "}
                workspace
              </span>
            </div>
          </div>

          <div className="admin-user-detail-grid">
            <UserDetail
              label="Role"
              value={
                selectedUser.role === "admin"
                  ? "Administrator"
                  : selectedUser.role
              }
            />

            <UserDetail
              label="Account status"
              value={
                isSuspended
                  ? "Suspended"
                  : "Active"
              }
            />

            <UserDetail
              label="Email status"
              value={
                selectedUser.emailVerified
                  ? "Verified"
                  : "Unverified"
              }
            />

            <UserDetail
              label="Joined"
              value={formatDate(
                selectedUser.createdAt,
              )}
            />

            <UserDetail
              label="Last login"
              value={
                selectedUser.lastSignInAt
                  ? formatDate(
                      selectedUser.lastSignInAt,
                    )
                  : "Never"
              }
            />

            <UserDetail
              label="Theme preference"
              value={selectedUser.theme}
            />

            <UserDetail
              label="Active workspace theme"
              value={resolvedTheme}
            />

            <UserDetail
              label="Currency"
              value={selectedUser.currency}
            />

            <UserDetail
              label="Dashboard period"
              value={
                selectedUser.dashboardPeriod
              }
            />

            <UserDetail
              label="Multiple accounts"
              value={
                selectedUser.multipleAccounts
                  ? "Enabled"
                  : "Disabled"
              }
            />
          </div>

          <section className="admin-role-manager">
            <div>
              <p className="page-eyebrow">
                Access control
              </p>

              <h3>Role Management</h3>
            </div>

            <label className="form-field">
              <span>User role</span>

              <select
                value={selectedRole}
                onChange={(event) => {
                  setSelectedRole(
                    event.target.value,
                  );
                  setRoleMessage("");
                  setRoleError("");
                }}
                disabled={
                  savingRole || savingStatus
                }
              >
                <option value="user">
                  User
                </option>

                <option value="admin">
                  Administrator
                </option>

                <option value="beta">
                  Beta Tester
                </option>

                <option value="premium">
                  Premium
                </option>

                <option value="support">
                  Support
                </option>
              </select>
            </label>

            <button
              className="primary-button"
              type="button"
              disabled={
                savingRole ||
                savingStatus ||
                selectedRole ===
                  selectedUser.role ||
                (
                  isCurrentUser &&
                  selectedRole !== "admin"
                )
              }
              onClick={handleSaveRole}
            >
              {savingRole
                ? "Saving..."
                : "Save Role"}
            </button>

            {isCurrentUser && (
              <p className="admin-role-note">
                Your own administrator role cannot
                be removed.
              </p>
            )}

            {roleMessage && (
              <p className="money-positive">
                <FiCheckCircle />
                {roleMessage}
              </p>
            )}

            {roleError && (
              <p className="money-negative">
                <FiAlertCircle />
                {roleError}
              </p>
            )}
          </section>

          <section
            className={`admin-account-status-manager ${
              isSuspended
                ? "admin-account-status-manager-suspended"
                : ""
            }`}
          >
            <div className="admin-account-status-heading">
              <span className="admin-account-status-icon">
                {isSuspended ? (
                  <FiLock />
                ) : (
                  <FiUnlock />
                )}
              </span>

              <div>
                <p className="page-eyebrow">
                  Account access
                </p>

                <h3>
                  {isSuspended
                    ? "Suspended"
                    : "Active"}
                </h3>
              </div>
            </div>

            <p className="admin-account-status-description">
              {isSuspended
                ? "This account is disabled and should not be allowed to use ClearBudget."
                : "This user can sign in and use ClearBudget normally."}
            </p>

            <button
              className={
                isSuspended
                  ? "primary-button"
                  : "secondary-button admin-suspend-button"
              }
              type="button"
              disabled={
                savingStatus ||
                savingRole ||
                isCurrentUser
              }
              onClick={handleStatusToggle}
            >
              {savingStatus
                ? "Saving..."
                : isSuspended
                  ? "Reactivate Account"
                  : "Suspend Account"}
            </button>

            {isCurrentUser && (
              <p className="admin-role-note">
                You cannot suspend your own
                administrator account.
              </p>
            )}

            {statusMessage && (
              <p className="money-positive">
                <FiCheckCircle />
                {statusMessage}
              </p>
            )}

            {statusError && (
              <p className="money-negative">
                <FiAlertCircle />
                {statusError}
              </p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

function UserDetail({ label, value }) {
  return (
    <div className="admin-user-detail-item">
      <span>{label}</span>
      <strong>{value || "Unknown"}</strong>
    </div>
  );
}

export default Admin;