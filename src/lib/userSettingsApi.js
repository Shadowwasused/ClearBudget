import { supabase } from "./supabase";

const settingsColumns = `
  user_id,
  currency,
  theme,
  budget_rollover_enabled,
  bill_reminders_enabled,
  dashboard_period,
  multiple_accounts,
  ai_coach_enabled
`;

export async function fetchUserSettings(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select(settingsColumns)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to load user settings:",
      error,
    );

    throw error;
  }

  if (data) {
    return data;
  }

  const { data: createdSettings, error: createError } =
    await supabase
      .from("user_settings")
      .insert({
        user_id: userId,
        currency: "USD",
        theme: "role",
        budget_rollover_enabled: false,
        bill_reminders_enabled: false,
        dashboard_period: "month",
        multiple_accounts: false,
        ai_coach_enabled: false,
      })
      .select(settingsColumns)
      .single();

  if (createError) {
    console.error(
      "Unable to create user settings:",
      createError,
    );

    throw createError;
  }

  return createdSettings;
}

export async function updateUserSettings(
  userId,
  updates,
) {
  if (!userId) {
    throw new Error(
      "A user ID is required to update settings.",
    );
  }

  const { data, error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", userId)
    .select(settingsColumns)
    .single();

  if (error) {
    console.error(
      "Unable to update user settings:",
      error,
    );

    throw error;
  }

  return data;
}