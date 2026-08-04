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

    account_id: transaction.accountId || null,

    // Temporary compatibility field for existing UI.
    account: transaction.account || null,

    date: transaction.date,
    notes: transaction.notes || null,
  };
}

/**
 * Calculates the next date after the first recorded
 * transaction so the recurring schedule does not create
 * a duplicate transaction immediately.
 */
function calculateNextRunDate(startDate, frequency) {
  const date = new Date(`${startDate}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "A valid start date is required for recurring transactions.",
    );
  }

  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;

    case "weekly":
      date.setDate(date.getDate() + 7);
      break;

    case "biweekly":
      date.setDate(date.getDate() + 14);
      break;

    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;

    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;

    default:
      throw new Error(
        "Please select a valid recurring frequency.",
      );
  }

  return date.toISOString().slice(0, 10);
}

function toRecurringDatabase(transaction) {
  const startDate = transaction.date;

  return {
    description: transaction.description.trim(),
    amount: Number(transaction.amount || 0),
    type: transaction.type,
    category: transaction.category || null,
    account_id: transaction.accountId || null,
    account: transaction.account || null,
    notes: transaction.notes || null,

    frequency: transaction.frequency,
    start_date: startDate,
    next_run_date: calculateNextRunDate(
      startDate,
      transaction.frequency,
    ),
    end_date: transaction.endDate || null,
    is_active: true,
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

/**
 * Creates the initial transaction and its recurring schedule.
 *
 * The initial transaction is recorded on transaction.date.
 * The recurring schedule begins on the following occurrence.
 */
export async function createTransactionWithRecurring(
  transaction,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to create a recurring transaction.",
    );
  }

  if (!transaction.frequency) {
    throw new Error(
      "Please select a recurring frequency.",
    );
  }

  const initialTransaction =
    await createTransaction(transaction);

  const recurringData = {
    ...toRecurringDatabase(transaction),
    user_id: user.id,
  };

  const { data: recurringTransaction, error } =
    await supabase
      .from("recurring_transactions")
      .insert(recurringData)
      .select()
      .single();

  if (error) {
    console.error(
      "Unable to create recurring schedule:",
      error,
    );

    /*
     * Remove the initial transaction if the recurring
     * schedule fails, preventing a partial save.
     */
    const { error: rollbackError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", initialTransaction.id);

    if (rollbackError) {
      console.error(
        "Unable to roll back initial transaction:",
        rollbackError,
      );
    }

    throw error;
  }

  return {
    transaction: initialTransaction,
    recurringTransaction,
  };
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