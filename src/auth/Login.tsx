import { useState } from "react";
import { api, setAuthToken } from "../api";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await api.post("/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setAuthToken(res.data.token);
    onLogin();
  };

  return (
    <>
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
