import { useState } from "react";
import { api, setAuthToken } from "../api";
import toast, { Toaster } from "react-hot-toast";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setAuthToken(res.data.token);
      toast.success("Login successful!");
      onLogin();
    } catch (error: any) {
      // Show error message from server or default message
      const errorMessage = "Wrong email or password";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && !isLoading && handleLogin()}
        disabled={isLoading}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && !isLoading && handleLogin()}
        disabled={isLoading}
      />
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? (
          <span className="login-loading">
            <span className="spinner"></span>
            <span>Logging in...</span>
          </span>
        ) : (
          "Login"
        )}
      </button>
    </>
  );
}
