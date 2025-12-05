import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import "./chat.css";

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

export default function Chat() {
  const [chats, setChats] = useState<LocalChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  // ✅ Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, loading]);

  // ✅ Load PDF-based chat history from backend
  useEffect(() => {
    loadPdfChatList();
  }, []);

  // ✅ Load all chats grouped by PDF (from Mongo)
  const loadPdfChatList = async () => {
    try {
      const pdfRes = await api.get("/chat/history");

      const allChats: LocalChat[] = [];

      for (const pdf of pdfRes.data) {
        const chatRes = await api.get(`/chat/history/${pdf.documentId}`);

        if (chatRes.data.length > 0) {
          chatRes.data.forEach((chat: any) => {
            allChats.push({
              id: chat._id,
              title: pdf.name,
              messages: chat.messages,
              documentId: chat.documentId
            });
          });
        }
      }

      setChats(allChats);
      if (allChats.length > 0) {
        setActiveChatId(allChats[0].id);
      }
    } catch {
      console.error("Failed to load chat history");
    }
  };

  // ✅ Create new chat
  const createNewChat = () => {
    const tempId = "temp_" + Date.now();

    setChats(prev => [
      {
        id: tempId,
        title: "New Chat",
        messages: [],
        documentId: ""
      },
      ...prev
    ]);

    setActiveChatId(tempId);
    setSelectedFile(null);
    setQuestion("");
  };

  // ✅ File select
  const handleFileSelect = (file: File) => {
    if (!activeChat) {
      alert("Create a new chat first");
      return;
    }
    setSelectedFile(file);
  };

  // ✅ Upload OR Ask
  const handleSend = async () => {
    if (!activeChat || loading) return;

    // 🔹 PDF Upload
    if (selectedFile) {
      try {
        setLoading(true);

        const formData = new FormData();
        formData.append("pdf", selectedFile);

        const res = await api.post("/pdf/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        const docId = res.data.documentId;

        setChats(prev =>
          prev.map(chat =>
            chat.id === activeChat.id
              ? {
                  ...chat,
                  documentId: docId,
                  title: selectedFile.name,
                  messages: [
                    ...chat.messages,
                    {
                      role: "system",
                      text: `📄 ${selectedFile.name} uploaded successfully. You can now ask questions.`
                    }
                  ]
                }
              : chat
          )
        );

        setSelectedFile(null);
        setLoading(false);
        return;
      } catch {
        alert("PDF upload failed");
        setLoading(false);
        return;
      }
    }

    // 🔹 Question mode
    if (!question.trim() || !activeChat.documentId) return;

    const userMsg: Message = { role: "user", text: question };

    setChats(prev =>
      prev.map(chat =>
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
        chatId: activeChat.id.startsWith("temp") ? null : activeChat.id
      });

      const botMsg: Message = { role: "bot", text: res.data.answer };

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChat.id
            ? { ...chat, messages: [...chat.messages, botMsg] }
            : chat
        )
      );

      // ✅ replace temp ID after first DB save
      if (activeChat.id.startsWith("temp")) {
        const realId = res.data.chatId;

        setChats(prev =>
          prev.map(chat =>
            chat.id === activeChat.id ? { ...chat, id: realId } : chat
          )
        );

        setActiveChatId(realId);
      }
    } catch {
      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChat.id
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { role: "bot", text: "❌ Server error" }
                ]
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
      {/* ✅ SIDEBAR */}
      <div className="sidebar">
        <button className="new-chat-btn" onClick={createNewChat}>
          + New Chat
        </button>

        <div className="chat-list">
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-list-item ${
                chat.id === activeChatId ? "active" : ""
              }`}
              onClick={() => setActiveChatId(chat.id)}
            >
              {chat.title}
            </div>
          ))}
        </div>
      </div>

      {/* ✅ MAIN CHAT */}
      <div className="chat-root">
        <div className="chat-header">
          {activeChat?.title || "Chat"}
        </div>

        <div className="chat-body">
          {activeChat?.messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-row ${
                msg.role === "user" ? "user-row" : "bot-row"
              }`}
            >
              <div
                className={`chat-bubble ${
                  msg.role === "user" ? "user-bubble" : "bot-bubble"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-row bot-row">
              <div className="chat-bubble bot-bubble">Thinking...</div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ✅ PDF CHIP */}
        {selectedFile && (
          <div className="pdf-chip">
            <span>📄 {selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)}>✖</button>
          </div>
        )}

        {/* ✅ INPUT */}
        <div className="chat-input-area">
          <div className="input-row">
            <label className="file-btn">
              +
              <input
                type="file"
                hidden
                accept="application/pdf"
                onChange={e =>
                  e.target.files && handleFileSelect(e.target.files[0])
                }
              />
            </label>

            <input
              className="chat-input"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={
                activeChat?.documentId
                  ? "Ask from this PDF..."
                  : "Upload a PDF to start"
              }
              disabled={loading || !activeChat?.documentId}
            />

            <button className="send-btn" onClick={handleSend} disabled={loading}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
