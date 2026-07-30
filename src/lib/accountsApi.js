import { supabase } from "./supabase";

const TABLE = "accounts";

function normalizeAccount(account) {
  const startingBalance = Number(
    account.starting_balance ??
      account.balance ??
      0,
  );

  return {
    id: account.id,
    userId: account.user_id,
    name: account.name,
    accountType: account.account_type,

    // New permanent opening balance.
    startingBalance,

    // Temporary compatibility property.
    balance: Number(
      account.balance ?? startingBalance,
    ),

    color: account.color || "#2563eb",
    isArchived: account.is_archived ?? false,
    createdAt: account.created_at,
    updatedAt: account.updated_at,
  };
}

function toDatabase(account) {
  const startingBalance = Number(
    account.startingBalance ??
      account.balance ??
      0,
  );

  return {
    name: account.name.trim(),
    account_type: account.accountType,
    starting_balance: startingBalance,

    // Keep synchronized temporarily while older screens
    // may still read the balance column.
    balance: startingBalance,

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

  return (data || []).map(normalizeAccount);
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

export async function updateStartingBalance(
  id,
  startingBalance,
) {
  const normalizedBalance = Number(
    startingBalance || 0,
  );

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      starting_balance: normalizedBalance,

      // Temporary compatibility field.
      balance: normalizedBalance,

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