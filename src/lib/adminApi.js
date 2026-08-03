import { supabase } from "./supabase";

export async function fetchAdminOverview() {
  const { data, error } = await supabase.rpc(
    "get_admin_overview",
  );

  if (error) {
    console.error(
      "Unable to load admin overview:",
      error,
    );

    throw error;
  }

  return {
    totalUsers: Number(data?.totalUsers || 0),
    newUsersToday: Number(
      data?.newUsersToday || 0,
    ),
    totalFeedback: Number(
      data?.totalFeedback || 0,
    ),
    newFeedback: Number(
      data?.newFeedback || 0,
    ),
    bugs: Number(data?.bugs || 0),
    featureRequests: Number(
      data?.featureRequests || 0,
    ),
  };
}

export async function fetchAdminUsers() {
  const { data, error } = await supabase.rpc(
    "get_admin_users",
  );

  if (error) {
    console.error(
      "Unable to load admin users:",
      error,
    );

    throw error;
  }

  return (data || []).map((user) => ({
    id: user.id,
    fullName: user.full_name || "Unnamed user",
    email: user.email || "",
    avatarUrl: user.avatar_url || "",
    role: user.role || "user",
accountStatus:
  user.account_status || "active",
emailVerified: Boolean(
  user.email_verified,
),
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
    theme: user.theme || "role",
    currency: user.currency || "USD",
    dashboardPeriod:
      user.dashboard_period || "month",
    multipleAccounts: Boolean(
      user.multiple_accounts,
    ),
  }));
}

export async function fetchAdminFeedback() {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load admin feedback:",
      error,
    );

    throw error;
  }

  return (data || []).map((item) => ({
    id: item.id,
    userId: item.user_id,
    email: item.email || "",
    category: item.category,
    title: item.title,
    message: item.message,
    status: item.status,
    pageUrl: item.page_url,
    appVersion: item.app_version,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

export async function updateFeedbackStatus(
  feedbackId,
  status,
) {
  const { data, error } = await supabase
    .from("feedback")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", feedbackId)
    .select()
    .single();

  if (error) {
    console.error(
      "Unable to update feedback status:",
      error,
    );

    throw error;
  }

  return data;
}
export async function updateAdminUserRole(
  userId,
  role,
) {
  if (!userId) {
    throw new Error("A user ID is required.");
  }

  const allowedRoles = [
    "user",
    "admin",
    "beta",
    "premium",
    "support",
  ];

  if (!allowedRoles.includes(role)) {
    throw new Error("Invalid user role.");
  }

  const { data, error } = await supabase.rpc(
    "update_admin_user_role",
    {
      target_user_id: userId,
      new_role: role,
    },
  );

  if (error) {
    console.error(
      "Unable to update user role:",
      error,
    );

    throw error;
  }

  const updatedUser = Array.isArray(data)
    ? data[0]
    : data;

  return {
    id: updatedUser?.id,
    fullName:
      updatedUser?.full_name || "Unnamed user",
    role: updatedUser?.role || role,
    updatedAt: updatedUser?.updated_at,
  };
}
export async function updateAdminUserStatus(
  userId,
  accountStatus,
) {
  if (!userId) {
    throw new Error("A user ID is required.");
  }

  const allowedStatuses = [
    "active",
    "suspended",
  ];

  if (
    !allowedStatuses.includes(accountStatus)
  ) {
    throw new Error(
      "Invalid account status.",
    );
  }

  const { data, error } = await supabase.rpc(
    "update_admin_user_status",
    {
      target_user_id: userId,
      new_status: accountStatus,
    },
  );

  if (error) {
    console.error(
      "Unable to update user status:",
      error,
    );

    throw error;
  }

  const updatedUser = Array.isArray(data)
    ? data[0]
    : data;

  return {
    id: updatedUser?.id,
    accountStatus:
      updatedUser?.account_status ||
      accountStatus,
    updatedAt:
      updatedUser?.updated_at,
  };
}