import { supabase } from "./supabase";

const TABLE = "goals";

function normalizeGoal(goal) {
  return {
    ...goal,
    targetAmount: Number(goal.target_amount || 0),
    currentAmount: Number(goal.current_amount || 0),
    monthlyContribution: Number(goal.monthly_contribution || 0),
    targetDate: goal.target_date,
    createdAt: goal.created_at,
  };
}

function toDatabase(goal) {
  return {
    name: goal.name,
    target_amount: Number(goal.targetAmount),
    current_amount: Number(goal.currentAmount),
    monthly_contribution: Number(goal.monthlyContribution),
    target_date: goal.targetDate || null,
    notes: goal.notes ?? "",
  };
}

export async function fetchGoals() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at");

  if (error) throw error;

  return data.map(normalizeGoal);
}

export async function createGoal(goal) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(toDatabase(goal))
    .select()
    .single();

  if (error) throw error;

  return normalizeGoal(data);
}

export async function updateGoal(id, goal) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(toDatabase(goal))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return normalizeGoal(data);
}

export async function deleteGoal(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function addContribution(id, amount, currentAmount) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      current_amount:
        Number(currentAmount) + Number(amount),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return normalizeGoal(data);
}