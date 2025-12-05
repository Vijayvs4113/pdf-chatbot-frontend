import { useState } from "react";
import { api } from "../api";
import toast, { Toaster } from "react-hot-toast";

export default function Register({
  onSwitchToLogin
}: {
  onSwitchToLogin: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await api.post("/register", { email, password });
      toast.success("Registered successfully");
      onSwitchToLogin(); // auto switch to login
    } catch (error: any) {
      // Show error message from server or default message
      const errorMessage = "This email is already exists!";
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
      <button onClick={handleRegister}>Sign Up</button>
    </>
  );
}
