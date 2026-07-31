import { supabase } from "./supabase";

const TABLE = "accounts";

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return user.id;
}

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

    startingBalance,

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

    // Temporary compatibility field.
    balance: startingBalance,

    color: account.color || "#2563eb",
    is_archived: account.isArchived ?? false,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchAccounts({
  includeArchived = false,
} = {}) {
  const userId = await getCurrentUserId();

  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
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
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      ...toDatabase(account),
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeAccount(data);
}

export async function updateAccount(id, account) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from(TABLE)
    .update(toDatabase(account))
    .eq("id", id)
    .eq("user_id", userId)
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
  const userId = await getCurrentUserId();

  const normalizedBalance = Number(
    startingBalance || 0,
  );

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      starting_balance: normalizedBalance,
      balance: normalizedBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeAccount(data);
}

export async function archiveAccount(id) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      is_archived: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeAccount(data);
}

export async function restoreAccount(id) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      is_archived: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeAccount(data);
}

export async function deleteAccount(id) {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}