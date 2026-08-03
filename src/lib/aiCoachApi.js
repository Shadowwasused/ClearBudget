import { supabase } from "./supabase";

export async function generateFinancialReview() {
  const { data, error } =
    await supabase.functions.invoke(
      "ai-financial-review",
    );

  if (error) {
    console.error(
      "Unable to generate AI financial review:",
      error,
    );

    throw new Error(
      error?.message ||
        "Unable to generate your financial review.",
    );
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.review) {
    throw new Error(
      "The AI Coach returned an empty review.",
    );
  }

  return {
    review: data.review,
    generatedAt: data.generatedAt || null,
  };
}