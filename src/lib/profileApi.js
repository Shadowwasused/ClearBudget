import { supabase } from "./supabase";

export async function fetchMyProfile(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      role,
      plan,
      subscription_status,
      billing_interval,
      subscription_ends_at,
      stripe_customer_id,
      stripe_subscription_id,
      created_at,
      updated_at
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load profile:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name || "",
    role: data.role || "user",

    plan: data.plan || "free",
    subscriptionStatus:
      data.subscription_status || "beta",
    billingInterval:
      data.billing_interval || null,
    subscriptionEndsAt:
      data.subscription_ends_at || null,
    stripeCustomerId:
      data.stripe_customer_id || null,
    stripeSubscriptionId:
      data.stripe_subscription_id || null,

    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}