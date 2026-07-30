import { supabase } from "./supabase";

const BUDGETS_TABLE = "budgets";

export async function fetchBudgets() {
  const { data, error } = await supabase
    .from(BUDGETS_TABLE)
    .select("*")
    .order("category", { ascending: true });

  if (error) {
    throw new Error(`Unable to load budgets: ${error.message}`);
  }

  return Array.isArray(data)
    ? data.map(normalizeBudget)
    : [];
}

export async function createBudget(budget) {
  const budgetData = {
    category: budget.category,
    amount: Number(budget.amount),
  };

  const { data, error } = await supabase
    .from(BUDGETS_TABLE)
    .insert(budgetData)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to create budget: ${error.message}`);
  }

  return normalizeBudget(data);
}

export async function updateBudget(id, budget) {
  const budgetData = {
    category: budget.category,
    amount: Number(budget.amount),
  };

  const { data, error } = await supabase
    .from(BUDGETS_TABLE)
    .update(budgetData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to update budget: ${error.message}`);
  }

  return normalizeBudget(data);
}

export async function deleteBudget(id) {
  const { error } = await supabase
    .from(BUDGETS_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Unable to delete budget: ${error.message}`);
  }

  return id;
}

function normalizeBudget(budget) {
  return {
    ...budget,
    amount: Number(budget.amount || 0),
  };
}