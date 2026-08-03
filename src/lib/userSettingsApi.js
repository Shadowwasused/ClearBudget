import { supabase } from "./supabase";

export async function fetchUserSettings(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  // Create a settings row if this user does not have one yet.
  if (!data) {
    const { data: createdSettings, error: createError } = await supabase
      .from("user_settings")
      .insert({
        user_id: userId,
        multiple_accounts: false,
      })
      .select("*")
      .single();

    if (createError) {
      throw createError;
    }

    return createdSettings;
  }

  return data;
}

export async function updateUserSettings(userId, updates) {
  if (!userId) {
    throw new Error("A user ID is required to update settings.");
  }

  const { data, error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}