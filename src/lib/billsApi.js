import { supabase } from "./supabase";

function normalizeBill(bill) {
  return {
    ...bill,
    amount: Number(bill.amount || 0),
    dueDate: bill.due_date,
  };
}

export async function fetchBills() {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load bills:", error);
    throw error;
  }

  return (data || []).map(normalizeBill);
}

export async function createBill(bill) {
  const { data, error } = await supabase
    .from("bills")
    .insert({
      name: bill.name.trim(),
      amount: Number(bill.amount || 0),
      due_date: bill.dueDate,
      category: bill.category,
      frequency: bill.frequency,
      autopay: bill.autopay,
      paid: bill.paid,
      notes: bill.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Unable to create bill:", error);
    throw error;
  }

  return normalizeBill(data);
}

export async function updateBill(id, bill) {
  const { data, error } = await supabase
    .from("bills")
    .update({
      name: bill.name.trim(),
      amount: Number(bill.amount || 0),
      due_date: bill.dueDate,
      category: bill.category,
      frequency: bill.frequency,
      autopay: bill.autopay,
      paid: bill.paid,
      notes: bill.notes || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Unable to update bill:", error);
    throw error;
  }

  return normalizeBill(data);
}

export async function deleteBill(id) {
  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Unable to delete bill:", error);
    throw error;
  }

  return id;
}

export async function toggleBillPaid(id, paid) {
  const { data, error } = await supabase
    .from("bills")
    .update({ paid })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Unable to update paid status:", error);
    throw error;
  }

  return normalizeBill(data);
}