import { supabase } from "./supabase";

export const defaultSettings = {
  currency: "USD",
  theme: "system",
  weekStartsOn: "sunday",
  budgetRolloverEnabled: false,
  billRemindersEnabled: true,
  dashboardPeriod: "month",
};

function normalizeSettings(settings) {
  if (!settings) {
    return { ...defaultSettings };
  }

  return {
    currency: settings.currency || "USD",
    theme: settings.theme || "system",
    weekStartsOn:
      settings.week_starts_on || "sunday",
    budgetRolloverEnabled:
      settings.budget_rollover_enabled ?? false,
    billRemindersEnabled:
      settings.bill_reminders_enabled ?? true,
    dashboardPeriod:
      settings.dashboard_period || "month",
  };
}

function toDatabase(settings, userId) {
  return {
    user_id: userId,
    currency: settings.currency,
    theme: settings.theme,
    week_starts_on: settings.weekStartsOn,
    budget_rollover_enabled:
      settings.budgetRolloverEnabled,
    bill_reminders_enabled:
      settings.billRemindersEnabled,
    dashboard_period: settings.dashboardPeriod,
    updated_at: new Date().toISOString(),
  };
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("No signed-in user was found.");
  }

  return user.id;
}

export async function fetchSettings() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return { ...defaultSettings };
  }

  return normalizeSettings(data);
}

export async function saveSettings(settings) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(toDatabase(settings, userId), {
      onConflict: "user_id",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeSettings(data);
}