import { useRef, useState } from "react";
import axios from "../helpers/helper_axios";

export default function AgentChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const token = localStorage.getItem("jwtToken");
      const response = await axios({
        method: "POST",
        url: `${process.env.REACT_APP_BE_URL}/chatbot/message`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { message: userMessage, session_id: sessionId },
      });

      const data = response.data;
      if (data.session_id && !sessionId) setSessionId(data.session_id);
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: data.response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div style={styles.chat}>
      <div style={styles.messages}>
        {messages.length === 0 && (
          <p style={styles.placeholder}>
            Ask me about books, or say "Add Dune to my reading list"
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={
                msg.role === "user" ? styles.bubbleUser : styles.bubbleAgent
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={styles.bubbleAgent}>Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about books…"
          disabled={isLoading}
          style={styles.input}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          style={styles.sendBtn}
        >
          ↑
        </button>
      </div>
    </div>
  );
}

const styles = {
  chat: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  },
  messages: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    scrollbarWidth: "thin",
    scrollbarColor: "#2a2a2a transparent",
  },
  placeholder: {
    color: "#555",
    fontSize: "0.85rem",
    textAlign: "center",
    marginTop: "2rem",
    fontStyle: "italic",
  },
  bubbleUser: {
    backgroundColor: "#a78bfa",
    color: "#fff",
    padding: "0.5rem 0.85rem",
    borderRadius: "14px 14px 2px 14px",
    maxWidth: "75%",
    fontSize: "0.88rem",
    lineHeight: 1.5,
  },
  bubbleAgent: {
    backgroundColor: "#1e1e1e",
    color: "#d5d5d5",
    padding: "0.5rem 0.85rem",
    borderRadius: "14px 14px 14px 2px",
    maxWidth: "75%",
    fontSize: "0.88rem",
    lineHeight: 1.5,
    border: "1px solid #2a2a2a",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: "0.75rem",
    borderTop: "1px solid #1e1e1e",
  },
  input: {
    flex: 1,
    backgroundColor: "#161616",
    color: "#e5e5e5",
    border: "1px solid #2e2e2e",
    borderRadius: 8,
    padding: "0.5rem 0.75rem",
    fontSize: "0.88rem",
    outline: "none",
  },
  sendBtn: {
    backgroundColor: "#a78bfa",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    width: 36,
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 700,
    flexShrink: 0,
  },
};
