import { supabase } from "./supabase";

const TABLE = "feedback";

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("You must be signed in to submit feedback.");
  }

  return user;
}

function normalizeFeedback(feedback) {
  return {
    id: feedback.id,
    userId: feedback.user_id,
    email: feedback.email,
    category: feedback.category,
    title: feedback.title,
    message: feedback.message,
    status: feedback.status,
    pageUrl: feedback.page_url,
    appVersion: feedback.app_version,
    createdAt: feedback.created_at,
    updatedAt: feedback.updated_at,
  };
}

export async function createFeedback(feedback) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: user.id,
      email: user.email || null,
      category: feedback.category,
      title: feedback.title.trim(),
      message: feedback.message.trim(),
      status: "new",
      page_url:
        feedback.pageUrl ||
        window.location.pathname,
      app_version:
        feedback.appVersion || "beta",
    })
    .select()
    .single();

  if (error) {
    console.error("Unable to submit feedback:", error);
    throw error;
  }

  return normalizeFeedback(data);
}

export async function fetchMyFeedback() {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Unable to load feedback:", error);
    throw error;
  }

  return (data || []).map(normalizeFeedback);
}