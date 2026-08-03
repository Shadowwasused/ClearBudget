import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const authorization =
      request.headers.get("Authorization");

    if (!authorization) {
      throw new Error("Authentication required.");
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY");

    const openAiApiKey =
      Deno.env.get("OPENAI_API_KEY");

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !openAiApiKey
    ) {
      throw new Error(
        "Missing server configuration.",
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      },
    );

    const {
      data: {
        user,
      },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Authentication required.");
    }

    const {
      data: settings,
      error: settingsError,
    } = await supabase
      .from("user_settings")
      .select("ai_coach_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError) {
      throw settingsError;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role, account_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const isAdmin =
      profile?.role === "admin";

    if (
      !isAdmin &&
      !settings?.ai_coach_enabled
    ) {
      return new Response(
        JSON.stringify({
          error: "AI Coach is not enabled.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (
      profile?.account_status === "suspended"
    ) {
      return new Response(
        JSON.stringify({
          error: "Account suspended.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const {
      data: summary,
      error: summaryError,
    } = await supabase.rpc(
      "get_my_financial_summary",
    );

    if (summaryError) {
      throw summaryError;
    }

    const prompt = `
You are ClearBudget AI Financial Coach.

Analyze the financial summary below and return a concise, useful monthly review.

Rules:
- Do not claim to be a licensed financial adviser.
- Do not guarantee outcomes.
- Use plain language.
- Do not invent missing data.
- Use exact values from the summary.
- Clearly label estimates.
- Give no more than 3 recommended actions.
- Avoid investment advice.
- Return valid JSON only.

Return this shape:
{
  "score": "A-",
  "headline": "One-sentence financial health summary",
  "summary": "Two to four concise sentences",
  "observations": [
    "Observation 1",
    "Observation 2",
    "Observation 3"
  ],
  "recommendations": [
    "Action 1",
    "Action 2",
    "Action 3"
  ],
  "disclaimer": "Educational information only, not financial advice."
}

Financial summary:
${JSON.stringify(summary)}
`;

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          input: prompt,
        }),
      },
    );

    if (!openAiResponse.ok) {
      const errorText =
        await openAiResponse.text();

      console.error(
        "OpenAI request failed:",
        errorText,
      );

      throw new Error(
        "Unable to generate financial review.",
      );
    }

    const aiData =
      await openAiResponse.json();

    const outputText =
      aiData?.output?.[0]?.content?.[0]?.text;

    if (!outputText) {
      throw new Error(
        "The AI response was empty.",
      );
    }

    let review;

    try {
      review = JSON.parse(outputText);
    } catch {
      throw new Error(
        "The AI response was not valid JSON.",
      );
    }

    return new Response(
      JSON.stringify({
        review,
        generatedAt:
          new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});