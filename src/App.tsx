import { useEffect, useState } from "react";
import { setAuthToken } from "./api";

import Chat from "./chat/Chat";
import AuthPage from "./auth/AuthPage";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      setLoggedIn(true);
    }
  }, []);

  if (!loggedIn) {
    return <AuthPage onLogin={() => setLoggedIn(true)} />;
  }

return (
  <div className="app-shell">
    <div className="chat-panel">
      <Chat documentId={null}/>
    </div>
  </div>
);


}
