import { supabase } from "./supabase";

function normalizeTransaction(transaction) {
  return {
    ...transaction,
    amount: Number(transaction.amount || 0),
    accountId: transaction.account_id || null,
    account: transaction.account || null,
  };
}

function toDatabase(transaction) {
  return {
    description: transaction.description.trim(),
    amount: Number(transaction.amount || 0),
    type: transaction.type,
    category: transaction.category || null,

    // Permanent account relationship.
    account_id: transaction.accountId || null,

    // Keep the account name temporarily for existing UI.
    account: transaction.account || null,

    date: transaction.date,
    notes: transaction.notes || null,
  };
}

export async function fetchTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "Unable to load transactions:",
      error,
    );

    throw error;
  }

  return (data || []).map(normalizeTransaction);
}

export async function createTransaction(transaction) {
  const { data, error } = await supabase
    .from("transactions")
    .insert(toDatabase(transaction))
    .select()
    .single();

  if (error) {
    console.error(
      "Unable to create transaction:",
      error,
    );

    throw error;
  }

  return normalizeTransaction(data);
}

export async function updateTransaction(id, changes) {
  const { data, error } = await supabase
    .from("transactions")
    .update(toDatabase(changes))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Unable to update transaction:",
      error,
    );

    throw error;
  }

  return normalizeTransaction(data);
}

export async function deleteTransaction(id) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Unable to delete transaction:",
      error,
    );

    throw error;
  }

  return id;
}