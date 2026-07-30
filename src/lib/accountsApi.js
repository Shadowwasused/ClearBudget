import { supabase } from "./supabase";

const TABLE = "accounts";

function normalizeAccount(account) {
  return {
    id: account.id,
    userId: account.user_id,
    name: account.name,
    accountType: account.account_type,
    balance: Number(account.balance || 0),
    color: account.color || "#2563eb",
    isArchived: account.is_archived ?? false,
    createdAt: account.created_at,
    updatedAt: account.updated_at,
  };
}

function toDatabase(account) {
  return {
    name: account.name.trim(),
    account_type: account.accountType,
    balance: Number(account.balance || 0),
    color: account.color || "#2563eb",
    is_archived: account.isArchived ?? false,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchAccounts({
  includeArchived = false,
} = {}) {
  let query = supabase
    .from(TABLE)
    .select("*")
    .order("created_at", {
      ascending: true,
    });

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data.map(normalizeAccount);
}

export async function createAccount(account) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(toDatabase(account))
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeAccount(data);
}

export async function updateAccount(id, account) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(toDatabase(account))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeAccount(data);
}

export async function updateAccountBalance(
  id,
  balance,
) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      balance: Number(balance || 0),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeAccount(data);
}

export async function archiveAccount(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      is_archived: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeAccount(data);
}

export async function restoreAccount(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      is_archived: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeAccount(data);
}

export async function deleteAccount(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}