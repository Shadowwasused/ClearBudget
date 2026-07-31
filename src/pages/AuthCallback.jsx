import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function finishConfirmation() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (session) {
          navigate("/beta-welcome", {
            replace: true,
          });
        } else {
          navigate("/login", {
            replace: true,
          });
        }
      } catch (error) {
        console.error(
          "Unable to complete email confirmation:",
          error,
        );

        if (active) {
          navigate("/login", {
            replace: true,
          });
        }
      }
    }

    finishConfirmation();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1>Confirming your account...</h1>
        <p>Please wait while ClearBudget signs you in.</p>
      </div>
    </main>
  );
}

export default AuthCallback;