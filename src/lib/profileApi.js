import { supabase } from "./supabase";

export async function fetchMyProfile(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name || "",
    role: data.role || "user",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}