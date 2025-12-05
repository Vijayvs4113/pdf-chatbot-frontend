import { useState } from "react";
import { api, setAuthToken } from "../api";
import toast, { Toaster } from "react-hot-toast";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setAuthToken(res.data.token);
      onLogin();
    } catch (error: any) {
      // Show error message from server or default message
      const errorMessage = "Wrong email or password";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <input
        placeholder="Email"
        onChange={e => setEmail(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </>
  );
}
