// src/lib/financialSummaryApi.js

import { supabase } from "./supabase";

export async function fetchFinancialSummary() {
  const { data, error } = await supabase.rpc(
    "get_my_financial_summary",
  );

  if (error) {
    console.error(
      "Unable to load financial summary:",
      error,
    );

    throw error;
  }

  return {
    period: data?.period || null,

    currentMonth: {
      income: Number(
        data?.currentMonth?.income || 0,
      ),
      expenses: Number(
        data?.currentMonth?.expenses || 0,
      ),
      netCashFlow: Number(
        data?.currentMonth?.netCashFlow || 0,
      ),
      savingsRate: Number(
        data?.currentMonth?.savingsRate || 0,
      ),
    },

    previousMonth: {
      income: Number(
        data?.previousMonth?.income || 0,
      ),
      expenses: Number(
        data?.previousMonth?.expenses || 0,
      ),
      netCashFlow: Number(
        data?.previousMonth?.netCashFlow || 0,
      ),
    },

    changes: {
      incomeChange: Number(
        data?.changes?.incomeChange || 0,
      ),
      expenseChange: Number(
        data?.changes?.expenseChange || 0,
      ),
      netCashFlowChange: Number(
        data?.changes?.netCashFlowChange || 0,
      ),
    },

    spendingByCategory:
      data?.spendingByCategory || [],

    budgets: data?.budgets || [],

    upcomingBills:
      data?.upcomingBills || [],

    goals: data?.goals || [],

    generatedAt:
      data?.generatedAt || null,
  };
}