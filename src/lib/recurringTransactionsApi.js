import { supabase } from "./supabase";

export async function getRecurringTransactions() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("next_run_date", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}

export async function createRecurringTransaction(
  transaction,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  const { data, error } = await supabase
    .from("recurring_transactions")
    .insert([
      {
        ...transaction,
        user_id: user.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateRecurringTransaction(
  id,
  updates,
) {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteRecurringTransaction(
  id,
) {
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function toggleRecurringTransaction(
  id,
  active,
) {
  return updateRecurringTransaction(id, {
    is_active: active,
  });
}