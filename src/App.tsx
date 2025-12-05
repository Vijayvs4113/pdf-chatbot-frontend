import { useEffect, useState } from "react";
import { setAuthToken } from "./api";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Chat from "./chat/Chat";
import AuthPage from "./auth/AuthPage";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      setLoggedIn(true);
    }
  }, []);

  return (
    <Routes>
      {!loggedIn ? (
        <Route path="*" element={<AuthPage onLogin={() => setLoggedIn(true)} />} />
      ) : (
        <>
          <Route path="/chat" element={<Chat onLogout={() => {
            localStorage.removeItem("token");
            setLoggedIn(false);
            navigate("/login");
          }} />} />

          <Route path="*" element={<Navigate to="/chat" />} />
        </>
      )}
    </Routes>
  );
}
