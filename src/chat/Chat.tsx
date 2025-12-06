import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import "./chat.css";
import LogoutConfirmModal from "../components/LogoutConfirmModal";
import toast, { Toaster } from "react-hot-toast";

interface Message {
  role: "user" | "bot" | "system";
  text: string;
}

interface LocalChat {
  id: string;
  title: string;
  messages: Message[];
  documentId: string;
}

export default function Chat({ onLogout }: { onLogout: () => void }) {
  const [pdfList, setPdfList] = useState<any[]>([]);
  const [chats, setChats] = useState<LocalChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [question, setQuestion] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // MOBILE SIDEBAR STATE
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // THEME STATE
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || saved === null; // Default to dark
  });

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const activeChat = chats.find((c) => c.id === activeChatId);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, loading, uploading]);

  // Apply theme to document
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkTheme]);

  // Load only list of PDFs (not chats)
  useEffect(() => {
    loadPdfList();

    createNewChat();
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const loadPdfList = async () => {
    try {
      const res = await api.get("/chat/history");
      setPdfList(res.data);
    } catch {
      console.error("Failed to load PDF list");
    }
  };

  // Load chat messages when clicking a PDF
  const loadChatByPdf = async (pdf: any) => {
    setSidebarLoading(true);
    try {
      const chatRes = await api.get(`/chat/history/${pdf.documentId}`);

      const loadedChats: LocalChat[] = chatRes.data.map((c: any) => ({
        id: c._id,
        title: pdf.name,
        messages: c.messages,
        documentId: c.documentId,
      }));

      setChats(loadedChats);
      if (loadedChats.length > 0) setActiveChatId(loadedChats[0].id);
      setMobileSidebarOpen(false); // auto-close sidebar on mobile
    } catch {
      console.error("Failed to load chat messages");
    }
    setSidebarLoading(false);
  };

  // Create new chat
  const createNewChat = () => {
    const tempId = "temp_" + Date.now();

    setChats([
      { id: tempId, title: "New Chat", messages: [], documentId: "" },
      ...chats,
    ]);

    setActiveChatId(tempId);
    setSelectedFile(null);
    setQuestion("");
    setMobileSidebarOpen(false);
  };

  const handleFileSelect = (file: File) => {
    if (!activeChat) {
      alert("Create a new chat first");
      return;
    }
    setSelectedFile(file);
  };

  // Upload or Ask
  const handleSend = async () => {
    if (!activeChat) return;

    // -------------------------------
    // Prevent uploading a second PDF in same chat
    // -------------------------------
    if (selectedFile && activeChat.documentId) {
      toast.error("PDF already uploaded. Create a new chat to upload another PDF.");
      setSelectedFile(null);
      return;
    }

    // -------------------------------
    // PDF Upload Mode
    // -------------------------------
    if (selectedFile) {
      try {
        setUploading(true);

        const formData = new FormData();
        formData.append("pdf", selectedFile);

        const res = await api.post("/pdf/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const docId = res.data.documentId;

        // Rename New Chat → PDF name
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChat.id
              ? {
                ...chat,
                documentId: docId,
                title: selectedFile.name,
                messages: [
                  ...chat.messages,
                  {
                    role: "system",
                    text: `📄 ${selectedFile.name} uploaded successfully. You may ask questions from this PDF.`,
                  },
                ],
              }
              : chat
          )
        );

        setSelectedFile(null);
      } catch {
        toast.error("PDF upload failed");
      } finally {
        setUploading(false);
      }
      return;
    }

    // -------------------------------
    // Ask Question Mode
    // -------------------------------
    if (!question.trim() || !activeChat.documentId) return;

    const userMsg: Message = { role: "user", text: question };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat.id
          ? { ...chat, messages: [...chat.messages, userMsg] }
          : chat
      )
    );

    setQuestion("");
    setLoading(true);

    try {
      const res = await api.post("/chat/ask", {
        question,
        documentId: activeChat.documentId,
        chatId: activeChat.id.startsWith("temp") ? null : activeChat.id,
      });

      const botMsg: Message = { role: "bot", text: res.data.answer };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat.id
            ? { ...chat, messages: [...chat.messages, botMsg] }
            : chat
        )
      );

      // Replace temp id with DB id
      if (activeChat.id.startsWith("temp")) {
        const realId = res.data.chatId;

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChat.id ? { ...chat, id: realId } : chat
          )
        );

        setActiveChatId(realId);
      }
    } catch {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat.id
            ? {
              ...chat,
              messages: [
                ...chat.messages,
                { role: "bot", text: "❌ Server error" },
              ],
            }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-root">
      <Toaster position="top-right" />

      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div className={`sidebar ${mobileSidebarOpen ? "sidebar-open" : ""}`}>
        <button className="new-chat-btn" onClick={createNewChat}>
          + New Chat
        </button>

        <div className="chat-list">
          {pdfList.map((pdf) => (
            <div
              key={pdf.documentId}
              className={`chat-list-item ${pdf.documentId === chats.find(c => c.id === activeChatId)?.documentId ? "active-chat" : ""}`}
              onClick={() => {
                loadChatByPdf(pdf);
                setActiveChatId(pdf.documentId); // highlight clicked chat
              }}
            >
              {pdf.name}
            </div>

          ))}

          {sidebarLoading && <div className="loading">Loading chats...</div>}
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className="chat-root">
        <div className="chat-header">
          <button
            className="hamburger-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            ☰
          </button>

          <div>{activeChat?.title || "Chat"}</div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent:'end'}}>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={isDarkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkTheme ? "☀️" : "🌙"}
            </button>

            <button
              className="logout-btn"
              onClick={() => setShowLogoutModal(true)}
            >
              Log Out
            </button>
          </div>

        </div>

        {showLogoutModal && (
          <LogoutConfirmModal
            onConfirm={() => {
              setShowLogoutModal(false);
              onLogout();
            }}
            onCancel={() => setShowLogoutModal(false)}
          />
        )}

        <div className="chat-body">
          {activeChat?.messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-row ${msg.role === "user" ? "user-row" : "bot-row"
                }`}
            >
              <div
                className={`chat-bubble ${msg.role === "user" ? "user-bubble" : "bot-bubble"
                  }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {uploading && (
            <div className="chat-row bot-row">
              <div className="chat-bubble bot-bubble">Uploading PDF...</div>
            </div>
          )}

          {loading && (
            <div className="chat-row bot-row">
              <div className="chat-bubble bot-bubble">Thinking...</div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>



        {/* INPUT */}
        <div className="chat-input-area">
          <div className="input-row-1">
          {/* PDF CHIP */}
          {selectedFile && (
            <div className="pdf-chip">
              <span>📄 {selectedFile.name}</span>
              <button className="close-btn" onClick={() => setSelectedFile(null)} disabled={uploading}>✖</button>
            </div>
          )}
          <div className="input-row">
            <label className="file-btn">
              +
              <input
                type="file"
                hidden
                accept="application/pdf"
                onChange={(e) =>
                  e.target.files && handleFileSelect(e.target.files[0])
                }
              />
            </label>

            <input
              className="chat-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                activeChat?.documentId
                  ? "Ask from this PDF..."
                  : "Upload a PDF to start"
              }
              disabled={loading || uploading || !activeChat?.documentId}
            />

            <button
              className="send-btn"
              onClick={handleSend}
              disabled={loading || uploading}
            >
              ➤
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
