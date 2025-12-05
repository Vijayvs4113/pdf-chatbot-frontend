import { useState } from "react";
import { api } from "../api";

export default function Register({
  onSwitchToLogin
}: {
  onSwitchToLogin: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    await api.post("/register", { email, password });
    alert("Registered successfully");
    onSwitchToLogin(); // ✅ auto switch to login
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
      <button onClick={handleRegister}>Sign Up</button>
    </>
  );
}
