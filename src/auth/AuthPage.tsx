import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import "./auth.css";

export default function AuthPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h2>{mode === "login" ? "Login" : "Sign Up"}</h2>

        {mode === "login" ? (
          <Login onLogin={onLogin} />
        ) : (
          <Register onSwitchToLogin={() => setMode("login")} />
        )}

        <p className="auth-toggle">
          {mode === "login" ? "No account?" : "Already have an account?"}
          <span
            onClick={() =>
              setMode(mode === "login" ? "register" : "login")
            }
          >
            {mode === "login" ? " Sign Up" : " Login"}
          </span>
        </p>
      </div>
    </div>
  );
}
