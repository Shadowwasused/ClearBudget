import { supabase } from "./supabase";

function normalizeTransaction(transaction) {
  return {
    ...transaction,
    amount: Number(transaction.amount || 0),
  };
}

export async function fetchTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load transactions:", error);
    throw error;
  }

  return (data || []).map(normalizeTransaction);
}

export async function createTransaction(transaction) {
  const newTransaction = {
    description: transaction.description.trim(),
    amount: Number(transaction.amount || 0),
    type: transaction.type,
    category: transaction.category || null,
    account: transaction.account || null,
    date: transaction.date,
    notes: transaction.notes || null,
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(newTransaction)
    .select()
    .single();

  if (error) {
    console.error("Unable to create transaction:", error);
    throw error;
  }

  return normalizeTransaction(data);
}

export async function updateTransaction(id, changes) {
  const updatedTransaction = {
    description: changes.description.trim(),
    amount: Number(changes.amount || 0),
    type: changes.type,
    category: changes.category || null,
    account: changes.account || null,
    date: changes.date,
    notes: changes.notes || null,
  };

  const { data, error } = await supabase
    .from("transactions")
    .update(updatedTransaction)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Unable to update transaction:", error);
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
    console.error("Unable to delete transaction:", error);
    throw error;
  }

  return id;
}