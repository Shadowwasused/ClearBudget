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